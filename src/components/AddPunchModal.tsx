import { useEffect, useRef, useState } from "react";
import type { PunchType } from "../types";
import { PUNCH_LABELS } from "../types";
import { dateKey, fmtDate, sanitizeTimeInput, normalizeTimeInput } from "../utils/time";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (day: string, type: PunchType, time: number) => void;
  todayKey: string;
  fixedDate?: string; // si viene, se salta el paso de elegir día
}

const PUNCH_OPTIONS: { type: PunchType; label: string; icon: string }[] = [
  { type: "in", label: "Entrada", icon: "🟢" },
  { type: "lunchOut", label: "Salida a almuerzo", icon: "🍽️" },
  { type: "lunchIn", label: "Regreso de almuerzo", icon: "🔵" },
  { type: "out", label: "Salida del día", icon: "🔴" },
];

export default function AddPunchModal({ isOpen, onClose, onAdd, todayKey, fixedDate }: Props) {
  const [step, setStep] = useState<"date" | "type" | "time">("date");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedType, setSelectedType] = useState<PunchType>("in");
  const [time, setTime] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.showModal();
      const initialDate = fixedDate ?? todayKey;
      setSelectedDate(initialDate);
      setStep(fixedDate ? "type" : "date");
      setSelectedType("in");
      setTime("");
    } else {
      dialogRef.current?.close();
    }
  }, [isOpen, todayKey, fixedDate]);

  function handleDateSelect(d: string) {
    setSelectedDate(d);
    setStep("type");
  }

  function handleTypeSelect(t: PunchType) {
    setSelectedType(t);
    setStep("time");
  }

  function handleTimeSubmit() {
    const normalized = normalizeTimeInput(time);
    const [h, m] = normalized.split(":").map(Number);
    const [y, month, day] = selectedDate.split("-").map(Number);
    const timestamp = new Date(y, month - 1, day, h, m, 0, 0).getTime();
    onAdd(selectedDate, selectedType, timestamp);
    onClose();
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTime(sanitizeTimeInput(e.target.value));
    // Forzar el cursor al final después de que React actualice el valor
    requestAnimationFrame(() => {
      const el = timeInputRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function handleTimeFocus(e: React.FocusEvent<HTMLInputElement>) {
    const el = e.target;
    requestAnimationFrame(() => {
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  if (!isOpen) return null;

  const canGoBack = step !== "date" && !(fixedDate && step === "type");

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 w-full max-w-md mx-auto backdrop:bg-black/60 rounded-none md:rounded-2xl"
      onClose={onClose}
    >
      <div className="fixed inset-0 md:hidden" onClick={onClose} />
      <div className="relative bg-slate-900 md:rounded-2xl md:border md:border-slate-700/60 flex flex-col h-full md:h-auto">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 border-b border-slate-700/60 flex-shrink-0"
          style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)", paddingBottom: "1rem" }}
        >
          <h2 className="text-lg font-semibold text-slate-100">
            {step === "date"
              ? "Selecciona el día"
              : step === "type"
                ? "Tipo de marca"
                : `Hora de ${PUNCH_LABELS[selectedType].toLowerCase()}`}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1 min-h-0">
          {step === "date" && (
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                  Elegí la fecha
                </p>
                <input
                  type="date"
                  value={selectedDate}
                  max={dateKey()}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(e.target.value);
                  }}
                  className="w-full rounded-lg bg-slate-700 px-3 py-2.5 text-base text-white outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <p className="text-xs text-slate-400 px-1 capitalize">
                {fmtDate(selectedDate)}
              </p>

              <div className="space-y-1.5">
                <p className="text-[11px] text-slate-500 px-1">Accesos rápidos</p>
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  const key = dateKey(d);
                  return (
                    <button
                      key={key}
                      onClick={() => handleDateSelect(key)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-xs transition ${
                        selectedDate === key
                          ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                          : "bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:bg-slate-700/40"
                      }`}
                    >
                      <span className="capitalize">{fmtDate(key)}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleDateSelect(selectedDate)}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition"
              >
                Usar esta fecha
              </button>
            </div>
          )}

          {step === "type" && (
            <div className="space-y-2">
              {fixedDate && (
                <p className="text-xs text-slate-400 mb-1 capitalize">
                  📅 {fmtDate(fixedDate)}
                </p>
              )}
              {PUNCH_OPTIONS.map((p) => (
                <button
                  key={p.type}
                  onClick={() => handleTypeSelect(p.type)}
                  className={`w-full rounded-xl px-4 py-3 text-left flex items-center gap-3 transition ${
                    selectedType === p.type
                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                      : "bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:bg-slate-700/60"
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="font-semibold">{p.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === "time" && (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase text-slate-400 mb-2">
                  Hora (24hs)
                </p>
                <input
                  ref={timeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9:]*"
                  maxLength={5}
                  value={time}
                  onChange={handleTimeChange}
                  onFocus={handleTimeFocus}
                  onBlur={(e) => setTime(normalizeTimeInput(e.target.value))}
                  autoFocus
                  placeholder="HH:MM"
                  className="w-full text-center text-4xl font-bold tabular-nums bg-transparent text-emerald-400 outline-none"
                />
              </div>
              <div className="text-sm text-slate-400 text-center">
                <p>
                  {PUNCH_LABELS[selectedType]} el {fmtDate(selectedDate)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div
          className="flex gap-2 border-t border-slate-700/60 px-5 pt-3 flex-shrink-0"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
        >
          {canGoBack && (
            <button
              onClick={() => {
                if (step === "type") setStep("date");
                else setStep("type");
              }}
              className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Atrás
            </button>
          )}
          <button
            onClick={() => {
              if (step === "time") {
                handleTimeSubmit();
              } else if (step === "type") {
                setStep("time");
              } else {
                setStep("type");
              }
            }}
            className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold bg-emerald-500 text-emerald-950 hover:bg-emerald-400 transition"
          >
            {step === "time" ? "Guardar marca" : "Siguiente"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
