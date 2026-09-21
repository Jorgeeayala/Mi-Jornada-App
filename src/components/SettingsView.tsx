import { useEffect, useState } from "react";
import type { Settings } from "../types";
import { fmtDuration } from "../utils/time";

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMin(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function SettingsView({ settings, onChange }: Props) {
  const weekdayTarget = settings.weekdayEnd - settings.weekdayStart - settings.lunchMinutes;
  const saturdayTarget = settings.saturdayEnd - settings.saturdayStart;

  // Input de almuerzo como texto libre: permite borrar todo sin que reaparezca un 0 forzado
  const [lunchInput, setLunchInput] = useState(String(settings.lunchMinutes));

  useEffect(() => {
    setLunchInput(String(settings.lunchMinutes));
  }, [settings.lunchMinutes]);

  function handleLunchChange(raw: string) {
    // Solo dígitos, permite vacío mientras se escribe
    const digitsOnly = raw.replace(/\D/g, "");
    setLunchInput(digitsOnly);
  }

  function handleLunchBlur() {
    const parsed = Math.max(0, Math.min(180, parseInt(lunchInput, 10) || 0));
    setLunchInput(String(parsed));
    onChange({ ...settings, lunchMinutes: parsed });
  }

  return (
    <div className="space-y-2.5">
      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3.5 space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-100">🗓️ Lunes a viernes</label>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="time"
              value={minToTime(settings.weekdayStart)}
              onChange={(e) => onChange({ ...settings, weekdayStart: timeToMin(e.target.value) })}
              className="rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-xs text-slate-400">a</span>
            <input
              type="time"
              value={minToTime(settings.weekdayEnd)}
              onChange={(e) => onChange({ ...settings, weekdayEnd: timeToMin(e.target.value) })}
              className="rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div className="border-t border-slate-700/60 pt-3">
          <label className="text-xs font-semibold text-slate-100">🍽️ Almuerzo (lun-vie)</label>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={lunchInput}
              onChange={(e) => handleLunchChange(e.target.value)}
              onBlur={handleLunchBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              placeholder="0"
              className="w-20 rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white tabular-nums outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <span className="text-xs text-slate-400">minutos</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 border-t border-slate-700/60 pt-2">
          Jornada objetivo lun-vie: <b className="text-slate-300">{fmtDuration(weekdayTarget)}</b>
        </p>
      </div>

      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-100">📅 Sábado</label>
          <button
            onClick={() => onChange({ ...settings, saturdayEnabled: !settings.saturdayEnabled })}
            className={`relative w-10 h-5.5 rounded-full transition ${
              settings.saturdayEnabled ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                settings.saturdayEnabled ? "translate-x-4.5" : ""
              }`}
            />
          </button>
        </div>

        {settings.saturdayEnabled && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={minToTime(settings.saturdayStart)}
                onChange={(e) => onChange({ ...settings, saturdayStart: timeToMin(e.target.value) })}
                className="rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-xs text-slate-400">a</span>
              <input
                type="time"
                value={minToTime(settings.saturdayEnd)}
                onChange={(e) => onChange({ ...settings, saturdayEnd: timeToMin(e.target.value) })}
                className="rounded-lg bg-slate-700 px-2 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <p className="text-[11px] text-slate-500 border-t border-slate-700/60 pt-2">
              Jornada objetivo sábado: <b className="text-slate-300">{fmtDuration(saturdayTarget)}</b>
            </p>
          </>
        )}
      </div>

      <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">ℹ️ Cómo funciona</p>
        <p>• Cada día usa el horario correspondiente: lun-vie, sábado o ninguno los domingos.</p>
        <p>• Si llegás tarde, hay que compensar esos minutos trabajando de más.</p>
        <p>• Los sábados no tienen almuerzo asignado.</p>
      </div>
    </div>
  );
}
