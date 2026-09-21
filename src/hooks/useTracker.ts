import { useEffect, useState } from "react";
import type { DayRecord, Punch, PunchType, Settings } from "../types";
import { dateKey, nextActions, fmtClock } from "../utils/time";
import { registerPlugin, Capacitor } from "@capacitor/core";

const WidgetBridge = registerPlugin<any>("WidgetBridge");

const DAYS_KEY = "mijornada.days.v1";
const SETTINGS_KEY = "mijornada.settings.v1";

const DEFAULT_SETTINGS: Settings = {
  weekdayStart: 420, // 07:00
  weekdayEnd: 1020, // 17:00
  lunchMinutes: 60,
  saturdayEnabled: true,
  saturdayStart: 480, // 08:00
  saturdayEnd: 720, // 12:00
};

const STATUS_LABELS: Record<string, string> = {
  in: "Fuera de jornada",
  lunchOut: "Trabajando",
  lunchIn: "En almuerzo",
  out: "Volviste del almuerzo",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function loadDays(): Record<string, DayRecord> {
  try {
    // Intentar cargar versión actual
    let raw = localStorage.getItem(DAYS_KEY);
    
    // Si no existe, intentar cargar de versiones anteriores
    if (!raw) {
      raw = localStorage.getItem("mijornada.days") || localStorage.getItem("dias") || null;
      if (raw) {
        // Migrar a la nueva versión
        const data = JSON.parse(raw);
        localStorage.setItem(DAYS_KEY, JSON.stringify(data));
      }
    }
    
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Error loading days:", e);
    return {};
  }
}

let idCounter = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export function useTracker() {
  const [days, setDays] = useState<Record<string, DayRecord>>(loadDays);
  const [settings, setSettings] = useState<Settings>(() =>
    load(SETTINGS_KEY, DEFAULT_SETTINGS)
  );

  useEffect(() => {
    localStorage.setItem(DAYS_KEY, JSON.stringify(days));
  }, [days]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const todayKey = dateKey();
  const today: DayRecord = days[todayKey] ?? { date: todayKey, punches: [] };

  // Sincronizar el widget nativo cada vez que cambian las marcas de hoy
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const { primary } = nextActions(today.punches);
    const last = [...today.punches].sort((a, b) => b.time - a.time)[0];

    const nextAction = primary ?? "done";
    const statusLabel = primary ? STATUS_LABELS[primary] : "Jornada finalizada";
    const lastTime = last ? fmtClock(last.time) : "";

    WidgetBridge.syncState({ nextAction, lastTime, statusLabel }).catch(() => {});
  }, [today.punches]);

  function punch(type: PunchType, time: number = Date.now(), day: string = todayKey) {
    setDays((prev) => {
      const rec = prev[day] ?? { date: day, punches: [] };
      const p: Punch = { id: uid(), type, time };
      return { ...prev, [day]: { ...rec, punches: [...rec.punches, p].sort((a, b) => a.time - b.time) } };
    });
  }

  function updatePunch(day: string, id: string, time: number) {
    setDays((prev) => {
      const rec = prev[day];
      if (!rec) return prev;
      const punches = rec.punches
        .map((p) => (p.id === id ? { ...p, time } : p))
        .sort((a, b) => a.time - b.time);
      return { ...prev, [day]: { ...rec, punches } };
    });
  }

  function deletePunch(day: string, id: string) {
    setDays((prev) => {
      const rec = prev[day];
      if (!rec) return prev;
      const punches = rec.punches.filter((p) => p.id !== id);
      if (punches.length === 0) {
        const copy = { ...prev };
        delete copy[day];
        return copy;
      }
      return { ...prev, [day]: { ...rec, punches } };
    });
  }

  function deleteDay(day: string) {
    setDays((prev) => {
      const copy = { ...prev };
      delete copy[day];
      return copy;
    });
  }

  return {
    days,
    today,
    todayKey,
    settings,
    setSettings,
    punch,
    updatePunch,
    deletePunch,
    deleteDay,
  };
}
