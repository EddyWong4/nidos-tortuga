/** Dirección pública de la app: la de GitHub Pages en producción, la actual en desarrollo. */
export const URL_APP =
  typeof location !== 'undefined' && !['localhost', '127.0.0.1'].includes(location.hostname)
    ? new URL(import.meta.env.BASE_URL, location.origin).href
    : 'https://eddywong4.github.io/nidos-tortuga/';
