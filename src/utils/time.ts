import type { DayRecord, Punch, Settings } from "../types";

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function fmtDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function fmtDuration(min: number): string {
  const abs = Math.abs(Math.round(min));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

export function fmtSigned(min: number): string {
  const r = Math.round(min);
  if (r === 0) return "±0 min";
  return `${r > 0 ? "+" : "−"}${fmtDuration(Math.abs(r))}`;
}

export function sanitizeTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    if (digits.length === 2) {
      let h = parseInt(digits, 10);
      if (h > 23) h = 23;
      return String(h).padStart(2, "0");
    }
    return digits;
  }
  let h = parseInt(digits.slice(0, 2), 10);
  if (h > 23) h = 23;
  let m = digits.slice(2);
  if (m.length === 2) {
    let mNum = parseInt(m, 10);
    if (mNum > 59) mNum = 59;
    m = String(mNum).padStart(2, "0");
  }
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function normalizeTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").padEnd(4, "0").slice(0, 4);
  let h = parseInt(digits.slice(0, 2), 10);
  let m = parseInt(digits.slice(2, 4), 10);
  if (isNaN(h) || h > 23) h = 0;
  if (isNaN(m) || m > 59) m = 0;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Día de la semana de una clave "YYYY-MM-DD": 0 = domingo, 6 = sábado
function weekdayOf(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export interface DaySchedule {
  isWorkDay: boolean;
  start: number;
  end: number;
  lunchAllowed: number;
}

// Determina el horario esperado según el día de la semana (lun-vie / sábado / domingo)
export function getSchedule(dayKey: string, settings: Settings): DaySchedule {
  const dow = weekdayOf(dayKey);

  if (dow === 0) {
    return { isWorkDay: false, start: 0, end: 0, lunchAllowed: 0 };
  }

  if (dow === 6) {
    return {
      isWorkDay: settings.saturdayEnabled,
      start: settings.saturdayStart,
      end: settings.saturdayEnd,
      lunchAllowed: 0,
    };
  }

  return {
    isWorkDay: true,
    start: settings.weekdayStart,
    end: settings.weekdayEnd,
    lunchAllowed: settings.lunchMinutes,
  };
}

export interface DayStats {
  workedMin: number;
  lunchMin: number | null;
  onLunch: boolean;
  working: boolean;
  complete: boolean;
  lunchBalance: number | null;
  dayBalance: number | null;
  delayMin: number;
  compensationNeeded: number;
  firstIn: number | null;
  lastOut: number | null;
  isWorkDay: boolean;
  requiredMin: number | null; // objetivo real de ese día (null si no aplica)
}

export function computeDay(
  record: DayRecord | undefined,
  settings: Settings,
  now?: number
): DayStats {
  const dayKey = record?.date ?? dateKey();
  const schedule = getSchedule(dayKey, settings);

  const punches = [...(record?.punches ?? [])].sort((a, b) => a.time - b.time);
  let workedMs = 0;
  let open: number | null = null;
  let lunchOutAt: number | null = null;
  let lunchMs: number | null = null;
  let firstIn: number | null = null;
  let lastOut: number | null = null;

  for (const p of punches) {
    if (p.type === "in" || p.type === "lunchIn") {
      if (p.type === "in" && firstIn === null) firstIn = p.time;
      if (p.type === "lunchIn" && lunchOutAt !== null) {
        lunchMs = (lunchMs ?? 0) + (p.time - lunchOutAt);
        lunchOutAt = null;
      }
      if (open === null) open = p.time;
    } else {
      if (open !== null) {
        workedMs += p.time - open;
        open = null;
      }
      if (p.type === "lunchOut") lunchOutAt = p.time;
      if (p.type === "out") lastOut = p.time;
    }
  }

  const working = open !== null;
  const onLunch = lunchOutAt !== null;
  if (working && now) workedMs += now - open!;

  let liveLunch = lunchMs;
  if (onLunch && now) liveLunch = (lunchMs ?? 0) + (now - lunchOutAt!);

  const last = punches[punches.length - 1];
  const complete = punches.length >= 2 && last?.type === "out";

  const lunchMin = liveLunch !== null ? liveLunch / 60000 : null;
  const workedMin = workedMs / 60000;

  let delayMin = 0;
  if (firstIn !== null && schedule.isWorkDay) {
    const dateObj = new Date(firstIn);
    const dayStartMs = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    ).getTime();
    const scheduledStartMs = dayStartMs + schedule.start * 60000;
    if (firstIn > scheduledStartMs) {
      delayMin = (firstIn - scheduledStartMs) / 60000;
    }
  }

  const compensationNeeded = delayMin;

  const lunchBalance =
    schedule.lunchAllowed > 0 && lunchMs !== null && !onLunch
      ? schedule.lunchAllowed - lunchMs / 60000
      : null;

  const targetWorkMin = schedule.isWorkDay
    ? schedule.end - schedule.start - schedule.lunchAllowed
    : 0;

  // OJO: workedMin ya refleja el atraso de forma natural (entrada tardía = menos tiempo trabajado).
  // No hay que sumar compensationNeeded aquí, o se descuenta el mismo atraso dos veces.
  const requiredMin = targetWorkMin;

  const dayBalance = complete
    ? workedMin - requiredMin
    : !schedule.isWorkDay && workedMin > 0
      ? workedMin
      : null;

  return {
    workedMin,
    lunchMin,
    onLunch,
    working,
    complete,
    lunchBalance,
    dayBalance,
    delayMin,
    compensationNeeded,
    firstIn,
    lastOut,
    isWorkDay: schedule.isWorkDay,
    requiredMin: complete ? requiredMin : null,
  };
}

export function nextActions(punches: Punch[]): { primary: Punch["type"] | null; secondary: Punch["type"] | null } {
  const sorted = [...punches].sort((a, b) => a.time - b.time);
  const last = sorted[sorted.length - 1];
  if (!last) return { primary: "in", secondary: null };
  switch (last.type) {
    case "in":
      return { primary: "lunchOut", secondary: "out" };
    case "lunchOut":
      return { primary: "lunchIn", secondary: "out" };
    case "lunchIn":
      return { primary: "out", secondary: null };
    case "out":
      return { primary: null, secondary: null };
  }
}
