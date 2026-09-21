import { useMemo, useState } from "react";
import type { DayRecord, Settings } from "../types";
import { computeDay, fmtDate, fmtDuration, fmtSigned } from "../utils/time";

interface Props {
  days: Record<string, DayRecord>;
  settings: Settings;
}

export default function MonthView({ days, settings }: Props) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const monthStats = useMemo(() => {
    const { year, month } = selectedMonth;
    const records = Object.values(days).filter((rec) => {
      const [y, m] = rec.date.split("-").map(Number);
      return y === year && m === month + 1;
    });

    let totalDays = 0;
    let completedDays = 0;
    let workedMin = 0;
    let lunchBalanceMin = 0;
    let targetMin = 0;
    const dayBalances: number[] = [];

    for (const rec of records) {
      const s = computeDay(rec, settings);
      totalDays++;
      workedMin += s.workedMin;

      if (s.lunchBalance !== null) {
        lunchBalanceMin += s.lunchBalance;
      }

      if (s.dayBalance !== null) {
        completedDays++;
        dayBalances.push(s.dayBalance);
        targetMin += s.requiredMin ?? 0;
      }
    }

    const balanceMin = dayBalances.reduce((a, b) => a + b, 0);
    const averageWorkMin = completedDays > 0 ? workedMin / completedDays : 0;

    return {
      year,
      month,
      totalDays,
      completedDays,
      workedMin,
      targetMin,
      balanceMin,
      lunchBalanceMin,
      averageWorkMin,
    };
  }, [days, settings, selectedMonth]);

  const monthName = new Date(selectedMonth.year, selectedMonth.month, 1).toLocaleString(
    "es-ES",
    { month: "long", year: "numeric" }
  );

  const prevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const isCurrentMonth =
    selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth();

  const records = Object.values(days)
    .filter((rec) => {
      const [y, m] = rec.date.split("-").map(Number);
      return y === selectedMonth.year && m === selectedMonth.month + 1;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={prevMonth}
          className="rounded-lg px-3 py-2 text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          ◀
        </button>
        <h2 className="flex-1 text-center text-lg font-bold text-slate-100 capitalize">
          {monthName}
          {isCurrentMonth && <span className="text-xs text-emerald-400 ml-2">hoy</span>}
        </h2>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          ▶
        </button>
      </div>

      {/* Resumen del mes */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="Días registrados"
            value={String(monthStats.totalDays)}
            sub={`${monthStats.completedDays} cerrados`}
            accent="text-blue-300"
          />
          <StatBox
            label="Horas trabajadas"
            value={fmtDuration(monthStats.workedMin)}
            sub={`promedio: ${fmtDuration(monthStats.averageWorkMin)}`}
            accent="text-sky-300"
          />
          <StatBox
            label="Total vs. objetivo"
            value={fmtSigned(monthStats.balanceMin)}
            sub={`objetivo: ${fmtDuration(monthStats.targetMin)}`}
            accent={monthStats.balanceMin >= 0 ? "text-emerald-300" : "text-rose-300"}
          />
          <StatBox
            label="Saldo de almuerzos"
            value={fmtSigned(monthStats.lunchBalanceMin)}
            sub={monthStats.lunchBalanceMin >= 0 ? "a tu favor" : "en contra"}
            accent={monthStats.lunchBalanceMin >= 0 ? "text-emerald-300" : "text-rose-300"}
          />
        </div>

        {monthStats.totalDays === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">
            Sin datos registrados en este mes.
          </p>
        )}
      </div>

      {/* Desglose diario */}
      {records.length > 0 && (
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Días registrados
          </h3>
          <div className="space-y-2">
            {records.map((rec) => {
              const s = computeDay(rec, settings);
              return (
                <div
                  key={rec.date}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-700/30 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 capitalize">{fmtDate(rec.date)}</p>
                    <p className="text-xs text-slate-500">
                      {rec.punches.length} {rec.punches.length === 1 ? "marca" : "marcas"}
                      {s.lunchMin === null && rec.punches.length >= 2 ? " · sin almuerzo" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-sky-300 tabular-nums">
                      {fmtDuration(s.workedMin)}
                    </p>
                    {s.dayBalance !== null ? (
                      <p
                        className={`text-xs font-semibold tabular-nums ${
                          s.dayBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {fmtSigned(s.dayBalance)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">abierto</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info de cálculo */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-4 text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">ℹ️ Cálculo mensual</p>
        <p>
          • <b>Días registrados</b>: todos los días con al menos una marca.
        </p>
        <p>
          • <b>Horas trabajadas</b>: suma de todo el tiempo de trabajo efectivo registrado.
        </p>
        <p>
          • <b>Total vs. objetivo</b>: suma de todos los saldos diarios de los días cerrados,
          comparando cada uno contra su horario correspondiente (lun-vie o sábado).
        </p>
        <p>
          • <b>Saldo de almuerzos</b>: suma de todos los minutos a favor/en contra este mes.
        </p>
      </div>
    </div>
  );
}

function StatBox({
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
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}
