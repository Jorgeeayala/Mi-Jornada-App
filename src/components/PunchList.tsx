import { useRef, useState } from "react";
import type { DayRecord } from "../types";
import { PUNCH_ICONS, PUNCH_LABELS } from "../types";
import { fmtClock, sanitizeTimeInput, normalizeTimeInput } from "../utils/time";

interface Props {
  record: DayRecord;
  onUpdate: (day: string, id: string, time: number) => void;
  onDelete: (day: string, id: string) => void;
}

function toTimeInput(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fromTimeInput(dayKey: string, value: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  const [h, min] = value.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0).getTime();
}

export default function PunchList({ record, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditValue(sanitizeTimeInput(e.target.value));
    requestAnimationFrame(() => {
      const el = editInputRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function handleEditFocus(e: React.FocusEvent<HTMLInputElement>) {
    const el = e.target;
    requestAnimationFrame(() => {
      el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  if (record.punches.length === 0) {
    return (
      <p className="text-center text-xs text-slate-400 py-2">
        Sin marcas
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-700/40 text-xs">
      {record.punches.map((p) => (
        <li key={p.id} className="flex items-center gap-2 py-1.5">
          <span className="text-sm">{PUNCH_ICONS[p.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-100">{PUNCH_LABELS[p.type]}</p>
            {editing === p.id ? (
              <input
                ref={editInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9:]*"
                maxLength={5}
                autoFocus
                value={editValue}
                onChange={handleEditChange}
                onFocus={handleEditFocus}
                onBlur={(e) => {
                  const normalized = normalizeTimeInput(e.target.value);
                  if (normalized) {
                    onUpdate(record.date, p.id, fromTimeInput(record.date, normalized));
                  }
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                placeholder="HH:MM"
                className="mt-0.5 rounded-lg bg-slate-700 px-2 py-1 text-xs text-white outline-none ring-1 ring-emerald-400 w-16 text-center"
              />
            ) : (
              <p className="text-[11px] text-slate-400">{fmtClock(p.time)}</p>
            )}
          </div>
          <button
            onClick={() => {
              setEditValue(toTimeInput(p.time));
              setEditing(editing === p.id ? null : p.id);
            }}
            className="rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-600 active:scale-95 transition"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(record.date, p.id)}
            className="rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-rose-300 bg-rose-900/40 hover:bg-rose-900/70 active:scale-95 transition"
          >
            🗑️
          </button>
        </li>
      ))}
    </ul>
  );
}
