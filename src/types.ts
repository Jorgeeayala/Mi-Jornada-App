export type PunchType = "in" | "lunchOut" | "lunchIn" | "out";

export interface Punch {
  id: string;
  type: PunchType;
  time: number; // timestamp ms
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  punches: Punch[];
}

export interface Settings {
  // Lunes a viernes
  weekdayStart: number; // min desde medianoche, ej 420 = 07:00
  weekdayEnd: number; // ej 1020 = 17:00
  lunchMinutes: number; // almuerzo permitido lun-vie (min)

  // Sábado
  saturdayEnabled: boolean; // si trabajás los sábados
  saturdayStart: number; // ej 480 = 08:00
  saturdayEnd: number; // ej 720 = 12:00
}

export const PUNCH_LABELS: Record<PunchType, string> = {
  in: "Entrada",
  lunchOut: "Salida a almuerzo",
  lunchIn: "Regreso de almuerzo",
  out: "Salida del día",
};

export const PUNCH_ICONS: Record<PunchType, string> = {
  in: "🟢",
  lunchOut: "🍽️",
  lunchIn: "🔵",
  out: "🔴",
};
