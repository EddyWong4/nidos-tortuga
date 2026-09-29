import { z } from 'zod';
import { FOLIO_REGEX, CODIGO_DISPOSITIVO_REGEX } from './folio';

// Un solo esquema valida el formulario, la base local, los archivos exportados y la API futura.

const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD)');
const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:mm)');
const texto = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`);

// Los mensajes se muestran debajo de su campo, por eso no repiten el nombre del campo.
const OBLIGATORIO = 'Este dato es obligatorio';
const NO_ES_NUMERO = 'Escribe solo números';

const entero = (min: number, max: number) =>
  z
    .number({ invalid_type_error: NO_ES_NUMERO, required_error: OBLIGATORIO })
    .int('Escribe un número entero, sin decimales')
    .min(min, `Debe ser de ${min} a ${max}`)
    .max(max, `Debe ser de ${min} a ${max}`);

const decimal = (min: number, max: number) =>
  z
    .number({ invalid_type_error: NO_ES_NUMERO, required_error: OBLIGATORIO })
    .min(min, `Debe ser de ${min} a ${max}`)
    .max(max, `Debe ser de ${min} a ${max}`);

const opcion = (campo: string) => z.string({ required_error: `Selecciona ${campo}` }).min(1, `Selecciona ${campo}`);

export const hembraSchema = z.object({
  largoCurvoCm: decimal(0, 250).nullable(),
  anchoCurvoCm: decimal(0, 250).nullable(),
  placa: z
    .string()
    .regex(/^[A-Za-z0-9]{1,12}$/, 'La placa lleva hasta 12 letras o números')
    .nullable(),
  observaciones: texto(200).nullable(),
});

/** Etapa 1: lo que se captura en la playa al momento de la puesta. */
export const etapaPuestaSchema = z.object({
  fechaMuestreo: fechaISO,
  especie: opcion('la especie'),
  municipio: opcion('el municipio'),
  baliza: entero(1, 31),
  lat: decimal(-90, 90),
  lng: decimal(-180, 180),
  precisionGps: z.number().nonnegative().nullable(),
  ubicacionManual: z.boolean(),
  zonaAnidacion: opcion('la zona de anidación'),
  horaPuesta: hora,
  tamanioNidada: entero(1, 250),
  huevosSembrados: entero(0, 250),
  tipoIncubacion: opcion('el tipo de incubación'),
  hembra: hembraSchema,
});

/** Reglas entre campos de la puesta; las comparten el formulario y la base local. */
export function reglasPuesta(p: { huevosSembrados: number; tamanioNidada: number }, ctx: z.RefinementCtx) {
  if (p.huevosSembrados > p.tamanioNidada) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['huevosSembrados'],
      message: 'Los huevos sembrados no pueden ser más que la nidada',
    });
  }
}

/** La puesta tal como la valida el formulario (incluye las reglas entre campos). */
export const puestaSchema = etapaPuestaSchema.superRefine(reglasPuesta);

/** Etapa 2: análisis del nido, se llena días después de la emergencia. */
export const etapaAnalisisSchema = z.object({
  fechaEmergencia: fechaISO.nullable(),
  huevosEclosionados: entero(0, 250).nullable(),
  huevosSinDesarrollo: entero(0, 250).nullable(),
  huevosConDesarrolloAparente: entero(0, 250).nullable(),
  criasVivas: entero(0, 250).nullable(),
  criasMuertas: entero(0, 250).nullable(),
  estatusAnalisis: z.string().nullable(),
  perdidaNidada: z.string().nullable(),
  observacionesNido: texto(200).nullable(),
});

export const SYNC_STATUS = ['pendiente', 'entregado', 'enviado', 'error'] as const;

export const controlSchema = z.object({
  id: z.string().uuid(),
  folio: z.string().regex(FOLIO_REGEX, 'Folio inválido (ej. B07-0012)'),
  temporada: z.number().int().min(2000),
  campamentoId: z.string().min(1),
  deviceId: z.string().regex(CODIGO_DISPOSITIVO_REGEX),
  observador: texto(50).min(1, 'Falta el nombre del observador'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().min(1),
  syncStatus: z.enum(SYNC_STATUS),
  deleted: z.boolean(),
});

export const nidoSchema = controlSchema
  .merge(etapaPuestaSchema)
  .extend({ analisis: etapaAnalisisSchema })
  .superRefine((n, ctx) => {
    reglasPuesta(n, ctx);
    if (n.analisis.fechaEmergencia && n.analisis.fechaEmergencia < n.fechaMuestreo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['analisis', 'fechaEmergencia'],
        message: 'La emergencia no puede ser antes del muestreo',
      });
    }
  });

export const perfilSchema = z.object({
  observador: texto(50).min(1, 'Escribe tu nombre'),
  brigada: texto(30).min(1, 'Escribe tu brigada'),
  codigoDispositivo: z.string().regex(CODIGO_DISPOSITIVO_REGEX, 'Código de una letra y dos números (ej. B07)'),
  campamentoId: z.string().min(1),
  rol: z.enum(['observador', 'coordinador']),
  siguienteConsecutivo: z.number().int().min(1),
});

export type Hembra = z.infer<typeof hembraSchema>;
export type EtapaPuesta = z.infer<typeof etapaPuestaSchema>;
export type EtapaAnalisis = z.infer<typeof etapaAnalisisSchema>;
export type Nido = z.infer<typeof nidoSchema>;
export type SyncStatus = (typeof SYNC_STATUS)[number];
export type Perfil = z.infer<typeof perfilSchema>;

export const analisisVacio = (): EtapaAnalisis => ({
  fechaEmergencia: null,
  huevosEclosionados: null,
  huevosSinDesarrollo: null,
  huevosConDesarrolloAparente: null,
  criasVivas: null,
  criasMuertas: null,
  estatusAnalisis: null,
  perdidaNidada: null,
  observacionesNido: null,
});
