import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { exportarDatos, importarDatos } from "./database";

function fechaArchivo(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export type BackupResult = { ok: boolean; cancelled?: boolean; message: string; count?: number };

export async function exportarBackup(): Promise<BackupResult> {
  const data = await exportarDatos();

  const path = await save({
    title: "Guardar copia de seguridad",
    defaultPath: `parafarmacia-backup-${fechaArchivo()}.json`,
    filters: [{ name: "Copia de seguridad", extensions: ["json"] }],
  });

  if (!path) {
    return { ok: false, cancelled: true, message: "Exportación cancelada." };
  }

  await invoke("export_text_file", {
    path,
    contents: JSON.stringify(data, null, 2),
  });

  return {
    ok: true,
    count: data.productos.length,
    message: `Copia guardada: ${data.productos.length.toLocaleString("es-ES")} productos exportados.`,
  };
}

export async function importarBackup(): Promise<BackupResult> {
  const selected = await open({
    title: "Restaurar copia de seguridad",
    multiple: false,
    directory: false,
    filters: [{ name: "Copia de seguridad", extensions: ["json"] }],
  });

  const path = Array.isArray(selected) ? selected[0] : selected;
  if (!path) {
    return { ok: false, cancelled: true, message: "Restauración cancelada." };
  }

  const contents = await invoke<string>("read_text_file", { path });
  const data = JSON.parse(contents);
  const count = await importarDatos(data);

  return {
    ok: true,
    count,
    message: `Datos restaurados: ${count.toLocaleString("es-ES")} productos cargados.`,
  };
}
