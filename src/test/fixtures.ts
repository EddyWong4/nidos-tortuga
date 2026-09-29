import type { EtapaPuesta, Perfil } from '@/domain/schemas';

export const perfilPrueba = (cambios: Partial<Perfil> = {}): Perfil => ({
  observador: 'Observador de prueba',
  brigada: 'Brigada 1',
  codigoDispositivo: 'B07',
  campamentoId: 'campamento-prueba',
  rol: 'observador',
  siguienteConsecutivo: 1,
  ...cambios,
});

export const puestaPrueba = (cambios: Partial<EtapaPuesta> = {}): EtapaPuesta => ({
  fechaMuestreo: '2026-06-01',
  especie: 'Verde',
  municipio: 'Nautla',
  baliza: 12,
  lat: 20.2167512,
  lng: -96.7765431,
  precisionGps: 5,
  ubicacionManual: false,
  zonaAnidacion: 'B',
  horaPuesta: '23:40',
  tamanioNidada: 110,
  huevosSembrados: 108,
  tipoIncubacion: 'In situ',
  hembra: { largoCurvoCm: 98.5, anchoCurvoCm: 90, placa: 'MX1234', observaciones: null },
  ...cambios,
});
