import { useEffect, useState } from "react";
import { useTracker } from "./hooks/useTracker";
import TodayView from "./components/TodayView";
import HistoryView from "./components/HistoryView";
import MonthView from "./components/MonthView";
import DataView from "./components/DataView";
import SettingsView from "./components/SettingsView";
import type { PunchType } from "./types";
import { registerPlugin, Capacitor } from "@capacitor/core";

const WidgetBridge = registerPlugin<any>("WidgetBridge");

type Tab = "today" | "history" | "month" | "data" | "settings";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "today", label: "Hoy", icon: "⏱️" },
  { id: "history", label: "Historial", icon: "📅" },
  { id: "month", label: "Mes", icon: "📊" },
  { id: "data", label: "Datos", icon: "💾" },
  { id: "settings", label: "Ajustes", icon: "⚙️" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  const {
    days,
    today,
    todayKey,
    settings,
    setSettings,
    punch,
    updatePunch,
    deletePunch,
    deleteDay,
  } = useTracker();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action") as PunchType | null;
    if (action && ["in", "lunchOut", "lunchIn", "out"].includes(action)) {
      punch(action);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [punch]);

  function handleWidgetPunch(punchType: PunchType) {
    punch(punchType);
    setTimeout(() => {
      WidgetBridge.finishAfterWidgetPunch().catch(() => {});
    }, 250);
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    WidgetBridge.consumePendingPunch()
      .then((res: { punchType: PunchType | null }) => {
        if (res?.punchType) {
          handleWidgetPunch(res.punchType);
        }
      })
      .catch(() => {});
  }, [punch]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = WidgetBridge.addListener(
      "widgetPunch",
      (data: { punchType: PunchType | null }) => {
        if (data?.punchType) {
          handleWidgetPunch(data.punchType);
        }
      }
    );
    return () => {
      listenerPromise.then((handle: any) => handle.remove()).catch(() => {});
    };
  }, [punch]);

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex justify-center overflow-hidden">
      <div className="w-full max-w-md flex flex-col h-full">
        <header
          className="px-5 flex-shrink-0 border-b border-slate-800"
          style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)", paddingBottom: "1rem" }}
        >
          <div className="flex items-center gap-3 mb-0.5">
            <span className="text-3xl">⏰</span>
            <h1 className="text-xl font-bold tracking-tight text-emerald-400">Mi Jornada</h1>
          </div>
          <p className="text-xs text-slate-500 ml-12">Registro de entradas, salidas y almuerzo</p>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto px-5 py-4 pb-32" style={{ overscrollBehavior: "contain" }}>
          {tab === "today" && (
            <TodayView
              record={today}
              settings={settings}
              todayKey={todayKey}
              onPunch={(t) => punch(t)}
              onPunchAdd={(day, type, time) => punch(type, time, day)}
              onUpdate={updatePunch}
              onDelete={deletePunch}
            />
          )}
          {tab === "history" && (
            <HistoryView
              days={days}
              todayKey={todayKey}
              settings={settings}
              onAdd={(day, type, time) => punch(type, time, day)}
              onUpdate={updatePunch}
              onDelete={deletePunch}
              onDeleteDay={deleteDay}
            />
          )}
          {tab === "month" && <MonthView days={days} settings={settings} />}
          {tab === "data" && <DataView days={days} />}
          {tab === "settings" && <SettingsView settings={settings} onChange={setSettings} />}
        </main>

        <nav className="fixed bottom-0 inset-x-0 flex justify-center pointer-events-none flex-shrink-0">
          <div
            className="w-full max-w-md pointer-events-auto bg-slate-900/98 backdrop-blur-lg border-t border-slate-800 px-4 pt-2 flex justify-around"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  tab === t.id
                    ? "text-emerald-400 bg-emerald-400/10"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span className="leading-tight">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
