import * as XLSX from 'xlsx';
import {
  classifyRiskLevel,
  computeRiskScore,
  type IpercRow,
  type RiskLevel,
} from '../types/riskMap';

function findColumnValue(row: Record<string, unknown>, candidateKeywords: string[]): string {
  const keys = Object.keys(row);
  for (const keyword of candidateKeywords) {
    const match = keys.find((k) =>
      k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(keyword)
    );
    if (match && row[match] !== undefined && row[match] !== null) {
      return String(row[match]).trim();
    }
  }
  return '';
}

function parseNumeric(val: unknown, fallback: number): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
}

export async function parseIpercExcelFile(file: File): Promise<IpercRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Pick the first non-empty sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas de cálculo válidas.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  if (rawRows.length === 0) {
    throw new Error('La hoja seleccionada está vacía.');
  }

  const parsedList: IpercRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    const danger = findColumnValue(row, ['peligro', 'evento', 'fuente', 'agente']);
    const risk = findColumnValue(row, ['riesgo', 'consecuencia', 'dano', 'lesion']);
    const area = findColumnValue(row, ['area', 'ambiente', 'lugar', 'instalacion', 'sede']) || 'Área General';
    const process = findColumnValue(row, ['proceso', 'subproceso', 'fase']) || 'Operaciones';
    const activity = findColumnValue(row, ['actividad', 'tarea', 'puesto', 'labor']) || 'General';

    // Skip empty filler rows without danger or risk
    if (!danger && !risk) continue;

    const probVal = parseNumeric(findColumnValue(row, ['probabilidad', 'indice de probabilidad', 'ip', 'frecuencia']), 2);
    const sevVal = parseNumeric(findColumnValue(row, ['severidad', 'indice de severidad', 'is', 'consecuencia_num', 'impacto']), 3);

    // Normalize scale to 1-5
    const probability = Math.max(1, Math.min(5, Math.round(probVal > 5 ? probVal / 3 : probVal)));
    const severity = Math.max(1, Math.min(5, Math.round(sevVal > 5 ? sevVal / 3 : sevVal)));
    const score = computeRiskScore(probability, severity);

    const rawLevel = findColumnValue(row, ['nivel', 'valoracion', 'clasificacion']).toLowerCase();
    let level: RiskLevel = classifyRiskLevel(score);
    if (rawLevel.includes('critico') || rawLevel.includes('intolerable') || rawLevel.includes('muy alto')) {
      level = 'Crítico';
    } else if (rawLevel.includes('alto') || rawLevel.includes('importante')) {
      level = 'Alto';
    } else if (rawLevel.includes('moderado') || rawLevel.includes('medio')) {
      level = 'Moderado';
    } else if (rawLevel.includes('bajo') || rawLevel.includes('trivial') || rawLevel.includes('tolerable')) {
      level = 'Bajo';
    }

    parsedList.push({
      id: `iperc-${i + 1}-${Date.now().toString(36)}`,
      process,
      activity,
      area,
      danger: danger || 'Peligro no especificado',
      risk: risk || 'Riesgo no especificado',
      probability,
      severity,
      riskScore: score,
      riskLevel: level,
      eliminationControl: findColumnValue(row, ['eliminacion']),
      substitutionControl: findColumnValue(row, ['sustitucion']),
      engineeringControl: findColumnValue(row, ['ingenieria', 'control de ingenieria']),
      administrativeControl: findColumnValue(row, ['administrativo', 'senales', 'procedimiento', 'capacitacion']),
      eppControl: findColumnValue(row, ['epp', 'proteccion personal', 'equipo']),
    });
  }

  if (parsedList.length === 0) {
    throw new Error('No se pudieron extraer filas de IPERC válidas. Verifica que el archivo contenga columnas como Peligro, Riesgo y Área.');
  }

  return parsedList;
}

export function exportIpercToExcel(rows: IpercRow[], filename = 'matriz_iperc_oficial.xlsx'): void {
  const exportData = rows.map((r, idx) => ({
    'N°': idx + 1,
    'Proceso': r.process,
    'Actividad / Tarea': r.activity,
    'Área / Sede': r.area,
    'Peligro Identificado': r.danger,
    'Riesgo / Evento Peligroso': r.risk,
    'Probabilidad (P)': r.probability,
    'Severidad (S)': r.severity,
    'Nivel Riesgo (P x S)': r.riskScore,
    'Clasificación': r.riskLevel,
    'Control: Eliminación': r.eliminationControl || '',
    'Control: Sustitución': r.substitutionControl || '',
    'Control: Ingeniería': r.engineeringControl || '',
    'Control: Administrativo / Señalización': r.administrativeControl || '',
    'Control: EPP': r.eppControl || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriz IPERC R.M. 050');
  XLSX.writeFile(workbook, filename);
}

