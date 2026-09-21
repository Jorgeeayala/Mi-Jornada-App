import type { PunchType } from "../types";

const SHORTCUTS: { id: PunchType; label: string; icon: string; color: string; desc: string }[] = [
  {
    id: "in",
    label: "Entrada",
    icon: "🟢",
    color: "from-emerald-500 to-emerald-600",
    desc: "Marca tu entrada al trabajo",
  },
  {
    id: "lunchOut",
    label: "Almuerzo",
    icon: "🍽️",
    color: "from-amber-500 to-amber-600",
    desc: "Salir a almorzar",
  },
  {
    id: "lunchIn",
    label: "Volver",
    icon: "🔵",
    color: "from-sky-500 to-sky-600",
    desc: "Regresar de almuerzo",
  },
  {
    id: "out",
    label: "Salida",
    icon: "🔴",
    color: "from-rose-500 to-rose-600",
    desc: "Fin de la jornada",
  },
];

export default function ShortcutsView() {

  return (
    <div className="space-y-4">
      {/* Instrucciones de instalación */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 border border-emerald-700/40 p-4 space-y-3">
        <h2 className="text-sm font-bold text-emerald-300">📱 Accesos rápidos en pantalla de inicio</h2>
        <p className="text-xs text-emerald-200">
          Los accesos rápidos te permiten marcar directamente desde tu pantalla de inicio o lock screen.
        </p>

        <div className="bg-emerald-950/60 rounded-lg p-3 space-y-2 text-xs text-emerald-100">
          <p className="font-semibold">Cómo instalar (Android):</p>
          <ol className="list-decimal list-inside space-y-1 text-emerald-200">
            <li>Mantén presionado el ícono de "Mi Jornada" en tu pantalla de inicio</li>
            <li>Selecciona "Ver información de la app" o "App shortcuts"</li>
            <li>Verás los atajos disponibles para marcar
            </li>
            <li>Arrastra el atajo que desees a tu pantalla</li>
          </ol>
        </div>

        <div className="bg-emerald-950/60 rounded-lg p-3 space-y-2 text-xs text-emerald-100">
          <p className="font-semibold">Cómo instalar (iPhone):</p>
          <ol className="list-decimal list-inside space-y-1 text-emerald-200">
            <li>Abre "Accesos rápidos" (Shortcuts app)</li>
            <li>Toca el botón + para crear un atajo</li>
            <li>Busca "Mi Jornada" y selecciona la acción</li>
            <li>Guarda en pantalla de inicio</li>
          </ol>
        </div>
      </div>

      {/* Atajos disponibles */}
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-100">⚡ Atajos disponibles</h3>
        <p className="text-xs text-slate-400 mb-3">
          Estos son los accesos rápidos que puedes añadir a tu pantalla:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.map((s) => (
            <div
              key={s.id}
              className={`rounded-lg bg-gradient-to-br ${s.color} p-4 text-white flex flex-col items-center justify-center gap-2 min-h-[120px]`}
            >
              <span className="text-4xl">{s.icon}</span>
              <span className="text-sm font-bold text-center">{s.label}</span>
              <span className="text-xs opacity-90 text-center">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* URLs de atajo */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-4 space-y-2">
        <h3 className="text-sm font-bold text-slate-100">🔗 URLs de atajo (avanzado)</h3>
        <p className="text-xs text-slate-400 mb-3">
          Si quieres crear accesos rápidos personalizados, usa estas URLs:
        </p>

        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.id} className="bg-slate-900/60 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-slate-300 mb-1">{s.label}</p>
              <code className="text-[11px] text-emerald-400 break-all block bg-slate-950 p-2 rounded">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/?action=${s.id}`
                  : `/?action=${s.id}`}
              </code>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/?action=${s.id}`;
                  navigator.clipboard.writeText(url);
                  alert("URL copiada al portapapeles");
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 mt-1"
              >
                📋 Copiar URL
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info PWA */}
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-4 text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">ℹ️ ¿Qué son los accesos rápidos?</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Son atajos directos disponibles en tu pantalla de inicio</li>
          <li>Te permiten marcar sin entrar a la app completa</li>
          <li>Funcionan como PWA en Android e iPhone</li>
          <li>Se activan al mantener presionado el ícono de la app</li>
        </ul>
      </div>
    </div>
  );
}
