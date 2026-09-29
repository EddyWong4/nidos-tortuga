export type ResultadoCompartir = 'compartido' | 'descargado' | 'cancelado';

/**
 * Abre el menú de compartir del teléfono (WhatsApp, correo, Drive, Bluetooth…).
 * Si el navegador no puede compartir ese archivo, lo descarga.
 */
export async function compartirArchivo(
  nombre: string,
  contenido: string | Blob,
  tipo: string,
  titulo = nombre,
): Promise<ResultadoCompartir> {
  const blob = typeof contenido === 'string' ? new Blob([contenido], { type: tipo }) : contenido;
  const archivo = new File([blob], nombre, { type: tipo });

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
      return 'compartido';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelado';
      // Algunos navegadores anuncian que pueden compartir y luego fallan: se descarga.
    }
  }
  descargar(nombre, blob);
  return 'descargado';
}

export function descargar(nombre: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Lee archivos elegidos por el usuario como texto. */
export async function leerArchivos(archivos: FileList | File[]): Promise<{ nombre: string; texto: string }[]> {
  return Promise.all([...archivos].map(async (f) => ({ nombre: f.name, texto: await f.text() })));
}
