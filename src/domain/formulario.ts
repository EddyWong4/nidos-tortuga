import type { ZodIssue } from 'zod';
import { etapaAnalisisSchema, puestaSchema, type EtapaAnalisis, type EtapaPuesta } from './schemas';

// Puente entre lo que el usuario escribe (texto) y los datos tipados que se guardan.
// Los campos numéricos se capturan como texto para aceptar coma decimal ("98,5") y no depender del teclado.

export interface FormPuesta {
  fechaMuestreo: string;
  especie: string;
  municipio: string;
  baliza: string;
  lat: string;
  lng: string;
  precisionGps: number | null;
  ubicacionManual: boolean;
  zonaAnidacion: string;
  horaPuesta: string;
  tamanioNidada: string;
  huevosSembrados: string;
  tipoIncubacion: string;
  largoCurvoCm: string;
  anchoCurvoCm: string;
  placa: string;
  observacionesHembra: string;
}

export interface FormAnalisis {
  fechaEmergencia: string;
  huevosEclosionados: string;
  huevosSinDesarrollo: string;
  huevosConDesarrolloAparente: string;
  criasVivas: string;
  criasMuertas: string;
  estatusAnalisis: string;
  perdidaNidada: string;
  observacionesNido: string;
}

export type Errores = Partial<Record<string, string>>;

/** '' → null; '98,5' → 98.5; texto no numérico → NaN (el esquema lo reporta con un mensaje claro). */
export function aNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') return null;
  return Number(limpio);
}

const opcional = (texto: string): string | null => (texto.trim() === '' ? null : texto.trim());
/** undefined hace que el esquema diga "Falta …" en lugar de "debe ser un número". */
const requerido = (n: number | null): number | undefined => n ?? undefined;
const aTexto = (n: number | null | undefined): string => (n == null ? '' : String(n));

function juntarErrores(issues: ZodIssue[], campo: (ruta: (string | number)[]) => string): Errores {
  const errores: Errores = {};
  for (const issue of issues) {
    const clave = campo(issue.path);
    errores[clave] ??= issue.message;
  }
  return errores;
}

// ---------- Puesta ----------

export function formularioPuestaVacio(valores: Partial<FormPuesta> = {}): FormPuesta {
  return {
    fechaMuestreo: '',
    especie: '',
    municipio: '',
    baliza: '',
    lat: '',
    lng: '',
    precisionGps: null,
    ubicacionManual: false,
    zonaAnidacion: '',
    horaPuesta: '',
    tamanioNidada: '',
    huevosSembrados: '',
    tipoIncubacion: '',
    largoCurvoCm: '',
    anchoCurvoCm: '',
    placa: '',
    observacionesHembra: '',
    ...valores,
  };
}

export function puestaAFormulario(p: EtapaPuesta): FormPuesta {
  return {
    fechaMuestreo: p.fechaMuestreo,
    especie: p.especie,
    municipio: p.municipio,
    baliza: aTexto(p.baliza),
    lat: aTexto(p.lat),
    lng: aTexto(p.lng),
    precisionGps: p.precisionGps,
    ubicacionManual: p.ubicacionManual,
    zonaAnidacion: p.zonaAnidacion,
    horaPuesta: p.horaPuesta,
    tamanioNidada: aTexto(p.tamanioNidada),
    huevosSembrados: aTexto(p.huevosSembrados),
    tipoIncubacion: p.tipoIncubacion,
    largoCurvoCm: aTexto(p.hembra.largoCurvoCm),
    anchoCurvoCm: aTexto(p.hembra.anchoCurvoCm),
    placa: p.hembra.placa ?? '',
    observacionesHembra: p.hembra.observaciones ?? '',
  };
}

function formularioAPuesta(f: FormPuesta) {
  return {
    fechaMuestreo: f.fechaMuestreo,
    especie: f.especie,
    municipio: f.municipio,
    baliza: requerido(aNumero(f.baliza)),
    lat: requerido(aNumero(f.lat)),
    lng: requerido(aNumero(f.lng)),
    precisionGps: f.precisionGps,
    ubicacionManual: f.ubicacionManual,
    zonaAnidacion: f.zonaAnidacion,
    horaPuesta: f.horaPuesta,
    tamanioNidada: requerido(aNumero(f.tamanioNidada)),
    huevosSembrados: requerido(aNumero(f.huevosSembrados)),
    tipoIncubacion: f.tipoIncubacion,
    hembra: {
      largoCurvoCm: aNumero(f.largoCurvoCm),
      anchoCurvoCm: aNumero(f.anchoCurvoCm),
      placa: opcional(f.placa)?.toUpperCase() ?? null,
      observaciones: opcional(f.observacionesHembra),
    },
  };
}

const campoPuesta = (ruta: (string | number)[]): keyof FormPuesta => {
  if (ruta[0] === 'hembra') {
    const campoHembra: Record<string, keyof FormPuesta> = {
      largoCurvoCm: 'largoCurvoCm',
      anchoCurvoCm: 'anchoCurvoCm',
      placa: 'placa',
      observaciones: 'observacionesHembra',
    };
    return campoHembra[String(ruta[1])];
  }
  return String(ruta[0]) as keyof FormPuesta;
};

export function validarPuesta(f: FormPuesta): { datos: EtapaPuesta | null; errores: Errores } {
  const r = puestaSchema.safeParse(formularioAPuesta(f));
  if (r.success) return { datos: r.data, errores: {} };
  return { datos: null, errores: juntarErrores(r.error.issues, campoPuesta) };
}

// ---------- Análisis ----------

export function analisisAFormulario(a: EtapaAnalisis): FormAnalisis {
  return {
    fechaEmergencia: a.fechaEmergencia ?? '',
    huevosEclosionados: aTexto(a.huevosEclosionados),
    huevosSinDesarrollo: aTexto(a.huevosSinDesarrollo),
    huevosConDesarrolloAparente: aTexto(a.huevosConDesarrolloAparente),
    criasVivas: aTexto(a.criasVivas),
    criasMuertas: aTexto(a.criasMuertas),
    estatusAnalisis: a.estatusAnalisis ?? '',
    perdidaNidada: a.perdidaNidada ?? '',
    observacionesNido: a.observacionesNido ?? '',
  };
}

function formularioAAnalisis(f: FormAnalisis) {
  return {
    fechaEmergencia: opcional(f.fechaEmergencia),
    huevosEclosionados: aNumero(f.huevosEclosionados),
    huevosSinDesarrollo: aNumero(f.huevosSinDesarrollo),
    huevosConDesarrolloAparente: aNumero(f.huevosConDesarrolloAparente),
    criasVivas: aNumero(f.criasVivas),
    criasMuertas: aNumero(f.criasMuertas),
    estatusAnalisis: opcional(f.estatusAnalisis),
    perdidaNidada: opcional(f.perdidaNidada),
    observacionesNido: opcional(f.observacionesNido),
  };
}

export function validarAnalisis(
  f: FormAnalisis,
  fechaMuestreo: string,
): { datos: EtapaAnalisis | null; errores: Errores } {
  const r = etapaAnalisisSchema.safeParse(formularioAAnalisis(f));
  const errores = r.success ? {} : juntarErrores(r.error.issues, (ruta) => String(ruta[0]));
  if (r.success && r.data.fechaEmergencia && r.data.fechaEmergencia < fechaMuestreo) {
    errores.fechaEmergencia = 'La emergencia no puede ser antes del muestreo';
  }
  if (Object.keys(errores).length || !r.success) return { datos: null, errores };
  return { datos: r.data, errores };
}

/** Vista previa de los números del análisis mientras se escribe (null si el campo está vacío o es inválido). */
export function numerosAnalisis(f: FormAnalisis): EtapaAnalisis {
  const n = (t: string) => {
    const v = aNumero(t);
    return v == null || Number.isNaN(v) ? null : v;
  };
  return {
    fechaEmergencia: opcional(f.fechaEmergencia),
    huevosEclosionados: n(f.huevosEclosionados),
    huevosSinDesarrollo: n(f.huevosSinDesarrollo),
    huevosConDesarrolloAparente: n(f.huevosConDesarrolloAparente),
    criasVivas: n(f.criasVivas),
    criasMuertas: n(f.criasMuertas),
    estatusAnalisis: null,
    perdidaNidada: null,
    observacionesNido: null,
  };
}
