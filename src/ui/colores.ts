// Un color por especie para reconocerlas de un vistazo en listas y selectores.
export const COLOR_ESPECIE: Record<string, string> = {
  Laúd: '#334155',
  Verde: '#15803d',
  Caguama: '#b45309',
  Carey: '#9f1239',
  Lora: '#0369a1',
};

export const colorEspecie = (especie: string): string => COLOR_ESPECIE[especie] ?? '#0f766e';
