import { useMemo, useState } from "react";
import type { DayRecord, PunchType, Settings } from "../types";
import { computeDay, fmtClock, fmtDate, fmtDuration, fmtSigned } from "../utils/time";
import PunchList from "./PunchList";
import AddPunchModal from "./AddPunchModal";

interface Props {
  days: Record<string, DayRecord>;
  todayKey: string;
  settings: Settings;
  onAdd: (day: string, type: PunchType, time: number) => void;
  onUpdate: (day: string, id: string, time: number) => void;
  onDelete: (day: string, id: string) => void;
  onDeleteDay: (day: string) => void;
}

export default function HistoryView({
  days,
  todayKey,
  settings,
  onAdd,
  onUpdate,
  onDelete,
  onDeleteDay,
}: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<string | null>(null);

  const sorted = useMemo(
    () => Object.values(days).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [days]
  );

  const totals = useMemo(() => {
    let dayBal = 0;
    let lunchBal = 0;
    let worked = 0;
    let completeDays = 0;
    for (const rec of sorted) {
      const s = computeDay(rec, settings);
      worked += s.workedMin;
      if (s.dayBalance !== null) {
        dayBal += s.dayBalance;
        completeDays++;
      }
      if (s.lunchBalance !== null) lunchBal += s.lunchBalance;
    }
    return { dayBal, lunchBal, worked, completeDays };
  }, [sorted, settings]);

  return (
    <div className="space-y-2.5">
      {/* Acumulados */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Saldo acumulado
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <p
              className={`text-2xl font-bold tabular-nums ${
                totals.dayBal >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {fmtSigned(totals.dayBal)}
            </p>
            <p className="text-xs text-slate-400">horas vs jornada ({totals.completeDays} días cerrados)</p>
          </div>
          <div>
            <p
              className={`text-2xl font-bold tabular-nums ${
                totals.lunchBal >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {fmtSigned(totals.lunchBal)}
            </p>
            <p className="text-xs text-slate-400">saldo de almuerzos</p>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          Total: {fmtDuration(totals.worked)}
        </p>
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-xs text-slate-400 py-4">
          Sin registros. Marca tu entrada en «Hoy».
        </p>
      )}

      {sorted.map((rec) => {
        const s = computeDay(rec, settings);
        const isToday = rec.date === todayKey;
        const expanded = open === rec.date;
        return (
          <div
            key={rec.date}
            className="rounded-lg bg-slate-800/60 border border-slate-700/60 overflow-hidden"
          >
            <button
              onClick={() => setOpen(expanded ? null : rec.date)}
              className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-slate-700/30 transition text-xs"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-100 capitalize">
                  {fmtDate(rec.date)} {isToday && <span className="text-emerald-400 text-[10px]">hoy</span>}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {s.firstIn ? fmtClock(s.firstIn) : "—"} → {s.lastOut ? fmtClock(s.lastOut) : "…"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold tabular-nums text-sky-300">
                  {fmtDuration(s.workedMin)}
                </p>
                {s.dayBalance !== null ? (
                  <p
                    className={`text-[10px] font-semibold tabular-nums ${
                      s.dayBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {fmtSigned(s.dayBalance)}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-500">abierto</p>
                )}
              </div>
              <span className={`text-slate-500 transition text-xs ${expanded ? "rotate-180" : ""}`}>▾</span>
            </button>

            {expanded && (
              <div className="border-t border-slate-700/60 px-3 py-2 space-y-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                  <span className="text-slate-400">Almuerzo</span>
                  <span className="text-right text-slate-200 tabular-nums">
                    {s.lunchMin !== null ? fmtDuration(s.lunchMin) : "—"}
                  </span>
                  <span className="text-slate-400">Saldo</span>
                  <span
                    className={`text-right font-semibold tabular-nums ${
                      s.lunchBalance === null
                        ? "text-slate-500"
                        : s.lunchBalance >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                    }`}
                  >
                    {s.lunchBalance !== null ? fmtSigned(s.lunchBalance) : "—"}
                  </span>
                </div>
                <PunchList record={rec} onUpdate={onUpdate} onDelete={onDelete} />
                <div className="flex gap-1 mt-1.5 pt-1 border-t border-slate-700/40">
                  <button
                    onClick={() => setShowModal(rec.date)}
                    className="flex-1 rounded-lg py-1 text-[10px] font-semibold text-emerald-300 bg-emerald-900/30 hover:bg-emerald-900/60 transition"
                  >
                    ➕ Agregar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar ${fmtDate(rec.date)}?`)) {
                        onDeleteDay(rec.date);
                      }
                    }}
                    className="flex-1 rounded-lg py-1 text-[10px] font-semibold text-rose-300 bg-rose-900/30 hover:bg-rose-900/60 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal para agregar marcas a días anteriores: salta directo a "tipo de marca" */}
      <AddPunchModal
        isOpen={showModal !== null}
        onClose={() => setShowModal(null)}
        onAdd={(day, type, time) => {
          onAdd(day, type, time);
          setShowModal(null);
        }}
        todayKey={showModal || todayKey}
        fixedDate={showModal ?? undefined}
      />
    </div>
  );
}
