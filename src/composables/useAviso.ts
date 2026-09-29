import { alertController, toastController } from '@ionic/vue';

/**
 * Muestra un aviso breve. No espera a la animación: lo que sigue (navegar, sincronizar) nunca depende
 * de que el aviso termine de aparecer (con la pantalla apagada la animación puede no completarse).
 */
export async function avisar(mensaje: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'success') {
  const toast = await toastController.create({ message: mensaje, duration: 2500, position: 'top', color });
  void toast.present();
}

/** Pide confirmación antes de una acción que no se puede deshacer desde la app. */
export async function confirmar(opciones: { titulo: string; mensaje: string; accion: string }): Promise<boolean> {
  const alerta = await alertController.create({
    header: opciones.titulo,
    message: opciones.mensaje,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: opciones.accion, role: 'confirm' },
    ],
  });
  await alerta.present();
  const { role } = await alerta.onDidDismiss();
  return role === 'confirm';
}
