import { useEffect, useMemo, useState } from "react";
import type { DayRecord, PunchType, Settings } from "../types";
import { PUNCH_LABELS } from "../types";
import { computeDay, fmtDuration, fmtSigned, nextActions } from "../utils/time";
import PunchList from "./PunchList";
import AddPunchModal from "./AddPunchModal";

interface Props {
  record: DayRecord;
  settings: Settings;
  todayKey: string;
  onPunch: (type: PunchType) => void;
  onPunchAdd: (day: string, type: PunchType, time: number) => void;
  onUpdate: (day: string, id: string, time: number) => void;
  onDelete: (day: string, id: string) => void;
}

const ACTION_STYLE: Record<PunchType, string> = {
  in: "bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/30",
  lunchOut: "bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-amber-400/30",
  lunchIn: "bg-sky-400 hover:bg-sky-300 text-sky-950 shadow-sky-400/30",
  out: "bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30",
};

const ACTION_VERB: Record<PunchType, string> = {
  in: "Marcar entrada",
  lunchOut: "Salir a almuerzo",
  lunchIn: "Volver de almuerzo",
  out: "Marcar salida del día",
};

export default function TodayView({ record, settings, todayKey, onPunch, onPunchAdd, onUpdate, onDelete }: Props) {
  const [now, setNow] = useState(Date.now());
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => computeDay(record, settings, now), [record, settings, now]);
  const { primary, secondary } = nextActions(record.punches);

  const statusText = stats.complete
    ? "Jornada finalizada ✅"
    : stats.onLunch
      ? "En almuerzo 🍽️"
      : stats.working
        ? "Trabajando 💼"
        : "Fuera de jornada";

  const clock = new Date(now);
  const timeStr = clock.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = clock.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-3">
      {/* Reloj */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-5 text-center">
        <p className="text-sm text-slate-400 capitalize">{dateStr}</p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight text-white">{timeStr}</p>
        <span
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            stats.complete
              ? "bg-emerald-900/60 text-emerald-300"
              : stats.onLunch
                ? "bg-amber-900/60 text-amber-300"
                : stats.working
                  ? "bg-sky-900/60 text-sky-300"
                  : "bg-slate-700/60 text-slate-300"
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* Botones de marcaje */}
      {primary ? (
        <div className="space-y-2">
          <button
            onClick={() => onPunch(primary)}
            className={`w-full rounded-2xl py-4 text-lg font-bold shadow-lg active:scale-[0.98] transition ${ACTION_STYLE[primary]}`}
          >
            {ACTION_VERB[primary]}
          </button>
          {secondary && (
            <button
              onClick={() => {
                const msg =
                  secondary === "out" && !stats.lunchMin
                    ? "Vas a marcar la salida del día sin registrar almuerzo (por ejemplo, si sales temprano). ¿Confirmas?"
                    : `¿Confirmas "${PUNCH_LABELS[secondary]}"?`;
                if (confirm(msg)) onPunch(secondary);
              }}
              className="w-full rounded-xl py-3 text-sm font-semibold bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700 active:scale-[0.98] transition"
            >
              {ACTION_VERB[secondary]} {secondary === "out" ? "(sin más marcas)" : ""}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-emerald-900/30 border border-emerald-700/40 p-4 text-center text-sm text-emerald-300">
          Jornada de hoy cerrada. ¡Buen descanso!
        </div>
      )}

      {/* Atraso y compensación */}
      {stats.delayMin > 0 && (
        <div className="rounded-2xl bg-rose-900/30 border border-rose-700/40 p-3">
          <p className="text-sm font-semibold text-rose-300">
            ⏰ Llegaste {fmtDuration(stats.delayMin)} tarde
          </p>
          <p className="text-xs text-rose-400 mt-1">
            Necesitas trabajar {fmtDuration(stats.compensationNeeded)} extra hoy para compensar.
          </p>
        </div>
      )}

      {/* Resumen del día */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          label="Tiempo trabajado"
          value={fmtDuration(stats.workedMin)}
          sub={stats.working ? "en curso…" : undefined}
          accent="text-sky-300"
        />
        <StatCard
          label="Almuerzo usado"
          value={stats.lunchMin !== null ? fmtDuration(stats.lunchMin) : "—"}
          sub={`permitido: ${fmtDuration(settings.lunchMinutes)}`}
          accent={
            stats.lunchMin !== null && stats.lunchMin > settings.lunchMinutes
              ? "text-rose-300"
              : "text-amber-300"
          }
        />
        <StatCard
          label="Saldo almuerzo"
          value={stats.lunchBalance !== null ? fmtSigned(stats.lunchBalance) : "—"}
          sub={
            stats.lunchBalance === null
              ? stats.onLunch
                ? "almuerzo en curso"
                : "sin almuerzo registrado"
              : stats.lunchBalance >= 0
                ? "a tu favor"
                : "en contra"
          }
          accent={
            stats.lunchBalance === null
              ? "text-slate-300"
              : stats.lunchBalance >= 0
                ? "text-emerald-300"
                : "text-rose-300"
          }
        />
        <StatCard
          label="Saldo del día"
          value={stats.dayBalance !== null ? fmtSigned(stats.dayBalance) : "—"}
          sub={
            stats.dayBalance !== null
              ? stats.compensationNeeded > 0
                ? `vs ${fmtDuration(settings.workMinutes)} + ${fmtDuration(stats.compensationNeeded)} compensación`
                : `vs jornada de ${fmtDuration(settings.workMinutes)}`
              : "al cerrar el día"
          }
          accent={
            stats.dayBalance === null
              ? "text-slate-300"
              : stats.dayBalance >= 0
                ? "text-emerald-300"
                : "text-rose-300"
          }
        />
      </div>

      {/* Marcas de hoy */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Marcas de hoy
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            ➕ Agregar
          </button>
        </div>
        <PunchList record={record} onUpdate={onUpdate} onDelete={onDelete} />
      </div>

      {/* Modal para agregar marcas */}
      <AddPunchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={onPunchAdd}
        todayKey={todayKey}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}
