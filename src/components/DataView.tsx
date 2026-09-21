import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

interface Props {
  days: Record<string, unknown>;
}

export default function DataView({ days }: Props) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const totalRecords = Object.keys(days).length;
  const dataSize = new Blob([JSON.stringify(days)]).size;

  async function downloadBackup() {
    const data = localStorage.getItem("mijornada.days.v1") || "{}";
    const settings = localStorage.getItem("mijornada.settings.v1") || "{}";

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: JSON.parse(data),
      settings: JSON.parse(settings),
    };

    const fileName = `mijornada-backup-${new Date().toISOString().split("T")[0]}.json`;
    const content = JSON.stringify(backup, null, 2);

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: `MiJornada/${fileName}`,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });

        setStatus("✅ Guardado en Archivos → Documentos → MiJornada");
      } catch (e) {
        console.error("Error generando backup nativo", e);
        setStatus("❌ No se pudo generar el backup");
      }
      setTimeout(() => setStatus(null), 4000);
      return;
    }

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function shareBackup() {
    const data = localStorage.getItem("mijornada.days.v1") || "{}";
    const settings = localStorage.getItem("mijornada.settings.v1") || "{}";

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: JSON.parse(data),
      settings: JSON.parse(settings),
    };

    const fileName = `mijornada-backup-${new Date().toISOString().split("T")[0]}.json`;
    const content = JSON.stringify(backup, null, 2);

    if (!Capacitor.isNativePlatform()) {
      downloadBackup();
      return;
    }

    try {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: "Backup de Mi Jornada",
        text: "Backup de tus horarios registrados",
        url: result.uri,
        dialogTitle: "Compartir backup",
      });
    } catch (e) {
      console.error("Error compartiendo backup", e);
      setStatus("❌ No se pudo compartir el backup");
      setTimeout(() => setStatus(null), 3000);
    }
  }

  function restoreBackup() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target?.result as string);
          if (!backup.data || !backup.settings) {
            alert("Archivo de backup inválido.");
            return;
          }
          localStorage.setItem("mijornada.days.v1", JSON.stringify(backup.data));
          localStorage.setItem("mijornada.settings.v1", JSON.stringify(backup.settings));
          alert("✅ Datos restaurados correctamente. Recarga la página.");
          window.location.reload();
        } catch {
          alert("❌ Error al leer el archivo de backup.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function copyToClipboard() {
    const data = localStorage.getItem("mijornada.days.v1") || "{}";
    navigator.clipboard.writeText(data).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function clearAllData() {
    const confirmed = confirm(
      "⚠️ ADVERTENCIA: Esto eliminará TODOS tus datos registrados.\n\nNo se puede deshacer. ¿Estás seguro?"
    );
    if (confirmed) {
      const confirm2 = prompt(
        "Escribe SI (mayúsculas) para confirmar la eliminación de todos tus datos:"
      );
      if (confirm2 === "SI") {
        localStorage.removeItem("mijornada.days.v1");
        alert("✅ Todos los datos han sido eliminados.");
        window.location.reload();
      }
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-3.5 space-y-2">
        <h2 className="text-sm font-bold text-slate-100">💾 Tu información</h2>
        <div className="grid grid-cols-2 gap-2">
          <InfoBox label="Días registrados" value={String(totalRecords)} accent="text-blue-300" />
          <InfoBox label="Tamaño de datos" value={`${(dataSize / 1024).toFixed(2)} KB`} accent="text-sky-300" />
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 space-y-1.5">
        <h3 className="text-xs font-semibold text-slate-100">📍 ¿Dónde se guardan mis datos?</h3>
        <p className="text-xs text-slate-300">
          <span className="font-semibold">✅ Se guardan en tu teléfono</span>, dentro de la app.
        </p>
        <p className="text-slate-400 text-[11px]">
          Solo vos tenés acceso. No se envían a internet ni a servidores externos.
        </p>
      </div>

      <div className="space-y-1.5">
        {status && (
          <p className="text-center text-xs font-semibold text-emerald-300">{status}</p>
        )}

        <button
          onClick={downloadBackup}
          className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition flex items-center justify-center gap-2"
        >
          💾 Guardar backup (Documentos/MiJornada)
        </button>

        <button
          onClick={shareBackup}
          className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 transition flex items-center justify-center gap-2"
        >
          📤 Compartir backup (Drive, WhatsApp, etc.)
        </button>

        <button
          onClick={restoreBackup}
          className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold bg-sky-500/20 border border-sky-500/40 text-sky-300 hover:bg-sky-500/30 transition flex items-center justify-center gap-2"
        >
          📂 Restaurar desde backup
        </button>

        <button
          onClick={copyToClipboard}
          className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold bg-slate-700/60 border border-slate-600/60 text-slate-300 hover:bg-slate-700 transition flex items-center justify-center gap-2"
        >
          {copied ? "✅ Copiado al portapapeles" : "📋 Copiar datos al portapapeles"}
        </button>

        <button
          onClick={clearAllData}
          className="w-full rounded-xl px-3 py-2.5 text-xs font-semibold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition"
        >
          🗑️ Eliminar TODOS los datos
        </button>
      </div>

      <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-3 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">ℹ️ Recomendaciones</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>Descargá un backup cada semana</li>
          <li>Si cambiás de teléfono, restaurá el backup</li>
          <li>La app funciona sin conexión a internet</li>
        </ul>
      </div>
    </div>
  );
}

function InfoBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-bold tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
