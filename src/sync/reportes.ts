import type { Row, SheetData } from 'write-excel-file/browser';
import { calcularDerivados } from '@/domain/formulas';
import type { Nido } from '@/domain/schemas';

// Reporte de la temporada: una fila por nido, encabezados en español y campos calculados incluidos.

type Celda = string | number | null;

interface Columna {
  titulo: string;
  ancho: number;
  valor: (n: Nido, d: ReturnType<typeof calcularDerivados>) => Celda;
}

const siNo = (b: boolean) => (b ? 'Sí' : 'No');

export const COLUMNAS: Columna[] = [
  { titulo: 'Folio', ancho: 11, valor: (n) => n.folio },
  { titulo: 'Fecha de muestreo', ancho: 12, valor: (n) => n.fechaMuestreo },
  { titulo: 'Especie', ancho: 10, valor: (n) => n.especie },
  { titulo: 'Municipio', ancho: 16, valor: (n) => n.municipio },
  { titulo: 'Baliza', ancho: 7, valor: (n) => n.baliza },
  { titulo: 'Latitud', ancho: 11, valor: (n) => n.lat },
  { titulo: 'Longitud', ancho: 11, valor: (n) => n.lng },
  { titulo: 'Precisión GPS (m)', ancho: 9, valor: (n) => n.precisionGps },
  { titulo: 'Coordenadas escritas a mano', ancho: 10, valor: (n) => siNo(n.ubicacionManual) },
  { titulo: 'Nombre del observador', ancho: 20, valor: (n) => n.observador },
  { titulo: 'Teléfono', ancho: 8, valor: (n) => n.deviceId },
  { titulo: 'Zona de anidación', ancho: 9, valor: (n) => n.zonaAnidacion },
  { titulo: 'Hora de puesta', ancho: 8, valor: (n) => n.horaPuesta },
  { titulo: 'Tamaño de la nidada', ancho: 9, valor: (n) => n.tamanioNidada },
  { titulo: 'Huevos sembrados', ancho: 9, valor: (n) => n.huevosSembrados },
  { titulo: 'Tipo de incubación', ancho: 16, valor: (n) => n.tipoIncubacion },
  { titulo: 'Fecha de probable emergencia', ancho: 12, valor: (_n, d) => d.fechaProbableEmergencia },
  { titulo: 'Fecha de emergencia', ancho: 12, valor: (n) => n.analisis.fechaEmergencia },
  { titulo: 'Periodo de incubación (días)', ancho: 10, valor: (_n, d) => d.periodoIncubacion },
  { titulo: 'Largo curvo del caparazón (cm)', ancho: 10, valor: (n) => n.hembra.largoCurvoCm },
  { titulo: 'Ancho curvo del caparazón (cm)', ancho: 10, valor: (n) => n.hembra.anchoCurvoCm },
  { titulo: 'Observaciones de la hembra', ancho: 30, valor: (n) => n.hembra.observaciones },
  { titulo: 'Placa', ancho: 12, valor: (n) => n.hembra.placa },
  { titulo: 'Huevos eclosionados', ancho: 9, valor: (n) => n.analisis.huevosEclosionados },
  { titulo: 'Huevos sin desarrollo', ancho: 9, valor: (n) => n.analisis.huevosSinDesarrollo },
  { titulo: 'Huevos con desarrollo aparente', ancho: 9, valor: (n) => n.analisis.huevosConDesarrolloAparente },
  { titulo: 'Huevos no eclosionados', ancho: 9, valor: (_n, d) => d.huevosNoEclosionados },
  { titulo: 'Crías vivas', ancho: 8, valor: (n) => n.analisis.criasVivas },
  { titulo: 'Crías muertas', ancho: 8, valor: (n) => n.analisis.criasMuertas },
  { titulo: 'Total de huevos por nido', ancho: 9, valor: (_n, d) => d.totalHuevos },
  { titulo: 'Éxito de eclosión (%)', ancho: 9, valor: (_n, d) => d.exitoEclosion },
  { titulo: 'Estatus del análisis', ancho: 12, valor: (n) => n.analisis.estatusAnalisis },
  { titulo: 'Pérdida de nidada', ancho: 16, valor: (n) => n.analisis.perdidaNidada },
  { titulo: 'Observaciones del nido', ancho: 30, valor: (n) => n.analisis.observacionesNido },
  { titulo: 'Versión', ancho: 7, valor: (n) => n.version },
  { titulo: 'Creado', ancho: 18, valor: (n) => n.createdAt },
  { titulo: 'Modificado', ancho: 18, valor: (n) => n.updatedAt },
  { titulo: 'ID', ancho: 36, valor: (n) => n.id },
];

/** Filas del reporte, sin los nidos eliminados, ordenadas por folio. */
export function filasReporte(nidos: Nido[]): Celda[][] {
  return nidos
    .filter((n) => !n.deleted)
    .sort((a, b) => a.folio.localeCompare(b.folio))
    .map((n) => {
      const d = calcularDerivados(n.fechaMuestreo, n.analisis);
      return COLUMNAS.map((c) => c.valor(n, d));
    });
}

const celdaCSV = (v: Celda): string => {
  if (v == null) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV que Excel abre bien en español: con BOM (acentos) y fin de línea CRLF. */
export function aCSV(nidos: Nido[]): string {
  const lineas = [COLUMNAS.map((c) => c.titulo), ...filasReporte(nidos)].map((fila) => fila.map(celdaCSV).join(','));
  return `﻿${lineas.join('\r\n')}\r\n`;
}

export async function aExcel(nidos: Nido[]): Promise<Blob> {
  // Carga diferida: la librería de Excel solo se descarga del caché cuando alguien pide el reporte.
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const encabezado: Row = COLUMNAS.map((c) => ({ value: c.titulo, fontWeight: 'bold', wrap: true }));
  const hoja: SheetData = [encabezado, ...filasReporte(nidos)];
  return writeExcelFile(hoja, {
    sheet: 'Nidos',
    columns: COLUMNAS.map((c) => ({ width: c.ancho })),
    stickyRowsCount: 1,
  }).toBlob();
}
