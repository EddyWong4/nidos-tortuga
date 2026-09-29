import { describe, expect, it } from 'vitest';
import { proximosAEmerger } from './alertas';
import { analisisVacio, type Nido } from './schemas';
import { puestaPrueba } from '@/test/fixtures';

const nido = (folio: string, fechaMuestreo: string, cambios: Partial<Nido> = {}): Nido => ({
  ...puestaPrueba({ fechaMuestreo }),
  id: crypto.randomUUID(),
  folio,
  temporada: 2026,
  campamentoId: 'c',
  deviceId: 'B07',
  observador: 'x',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
  syncStatus: 'pendiente',
  deleted: false,
  analisis: analisisVacio(),
  ...cambios,
});

describe('proximosAEmerger', () => {
  const hoy = '2026-09-28';

  it('incluye los que emergen en 7 días o menos y los atrasados, más urgentes primero', () => {
    const nidos = [
      nido('B07-0001', '2026-08-20'), // probable 2026-10-04 → en 6 días
      nido('B07-0002', '2026-08-10'), // probable 2026-09-24 → hace 4 días
      nido('B07-0003', '2026-09-01'), // probable 2026-10-16 → fuera de la ventana
    ];
    const r = proximosAEmerger(nidos, hoy);
    expect(r.map((a) => [a.nido.folio, a.dias])).toEqual([
      ['B07-0002', -4],
      ['B07-0001', 6],
    ]);
  });

  it('ignora los que ya tienen análisis o están eliminados', () => {
    const conAnalisis = nido('B07-0001', '2026-08-20', {
      analisis: { ...analisisVacio(), fechaEmergencia: '2026-10-01' },
    });
    const eliminado = nido('B07-0002', '2026-08-20', { deleted: true });
    expect(proximosAEmerger([conAnalisis, eliminado], hoy)).toEqual([]);
  });
});
