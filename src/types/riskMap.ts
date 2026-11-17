export type SymbolCategory =
  | 'advertencia'
  | 'obligacion'
  | 'prohibicion'
  | 'incendios'
  | 'evacuacion';

export type RiskCategory =
  | 'Mecánico'
  | 'Eléctrico'
  | 'Incendio'
  | 'Químico'
  | 'Físico'
  | 'Ergonómico'
  | 'Locativo'
  | 'Biológico';

export type RiskLevel = 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';

export type MapViewMode = 'all' | 'risks' | 'evacuacion';

export type ExportFormat = 'png' | 'jpg' | 'pdf';

export interface IsoSymbolDef {
  id: string;
  code: string;
  name: string;
  category: SymbolCategory;
  defaultRiskCategory: RiskCategory;
  defaultProbability: number;
  defaultSeverity: number;
  description: string;
  standardRef?: string; // e.g. "NTP 399.010-1", "ISO 7010", "NTP 350.043-1"
}

export interface MapMarker {
  id: string;
  symbolId: string;
  label: string;
  zoneName: string;
  x: number; // Normalized 0-1000
  y: number; // Normalized 0-1000
  riskCategory: RiskCategory;
  probability: number; // 1-5
  severity: number; // 1-5
  notes: string;
  source?: 'manual' | 'ai' | 'iperc';
  rotation?: number; // 0, 90, 180, 270 (grados de orientación)
}

export interface RiskZone {
  id: string;
  name: string;
  riskCategory: RiskCategory;
  x: number; // Normalized 0-1000
  y: number; // Normalized 0-1000
  width: number; // Normalized 0-1000
  height: number; // Normalized 0-1000
  probability: number; // 1-5
  severity: number; // 1-5
  controls: string;
  elimination?: string;
  substitution?: string;
  engineering?: string;
  administrative?: string;
  epp?: string;
  source?: 'manual' | 'ai' | 'iperc';
}

export interface RoutePoint {
  x: number; // Normalized 0-1000
  y: number; // Normalized 0-1000
}

export interface EvacuationRoute {
  id: string;
  name: string;
  points: RoutePoint[];
  source?: 'manual' | 'ai';
}

export interface PlanMetadata {
  facilityName: string;
  facilityType: string;
  standard: string;
  author: string;
  revision: string;
  date: string;
  scaleText: string;
  // Campos reglamentarios D.S. 005-2012-TR y R.M. 050-2013-TR (Perú)
  companyRuc?: string;
  companyName?: string;
  facilityAddress?: string;
  approvalDate?: string;
  csstRepresentative?: string;
  headcount?: string;
  emergencyContact?: string;
}

export interface IpercRow {
  id: string;
  process: string;
  activity: string;
  area: string;
  danger: string; // Peligro
  risk: string; // Riesgo
  consequence?: string;
  probability: number; // 1-5
  severity: number; // 1-5
  riskScore: number;
  riskLevel: RiskLevel;
  eliminationControl?: string;
  substitutionControl?: string;
  engineeringControl?: string;
  administrativeControl?: string;
  eppControl?: string;
}

export interface DxfLayerInfo {
  name: string;
  visible: boolean;
  entityCount: number;
}

export interface BlueprintSource {
  type: 'sample' | 'image' | 'pdf' | 'dxf';
  fileName: string;
  dataUrl: string;
  width: number;
  height: number;
  pdfPageCount?: number;
  pdfCurrentPage?: number;
  dxfLayers?: DxfLayerInfo[];
}

export interface AiAnalysisResult {
  summary: string;
  zones: Array<{
    name: string;
    riskCategory: RiskCategory;
    x: number;
    y: number;
    width: number;
    height: number;
    probability: number;
    severity: number;
    controls: string;
  }>;
  markers: Array<{
    symbolId: string;
    label: string;
    zoneName: string;
    x: number;
    y: number;
    riskCategory: RiskCategory;
    probability: number;
    severity: number;
    notes: string;
  }>;
  evacuationRoutes: Array<{
    name: string;
    points: RoutePoint[];
  }>;
  cadTips: string[];
}

export type CanvasToolMode =
  | 'select'
  | 'place-marker'
  | 'draw-zone'
  | 'draw-route';

export function computeRiskScore(probability: number, severity: number): number {
  const p = Math.max(1, Math.min(5, Math.round(probability)));
  const s = Math.max(1, Math.min(5, Math.round(severity)));
  return p * s;
}

export function classifyRiskLevel(score: number): RiskLevel {
  if (score >= 17) return 'Crítico';
  if (score >= 10) return 'Alto';
  if (score >= 5) return 'Moderado';
  return 'Bajo';
}

export function getRiskColors(level: RiskLevel): {
  fill: string;
  stroke: string;
  badgeText: string;
  bgTint: string;
} {
  switch (level) {
    case 'Crítico':
      return {
        fill: 'rgba(220, 38, 38, 0.22)',
        stroke: '#DC2626',
        badgeText: 'text-red-700',
        bgTint: 'bg-red-50 border-red-200',
      };
    case 'Alto':
      return {
        fill: 'rgba(234, 88, 12, 0.20)',
        stroke: '#EA580C',
        badgeText: 'text-orange-700',
        bgTint: 'bg-orange-50 border-orange-200',
      };
    case 'Moderado':
      return {
        fill: 'rgba(217, 119, 6, 0.18)',
        stroke: '#D97706',
        badgeText: 'text-amber-700',
        bgTint: 'bg-amber-50 border-amber-200',
      };
    default:
      return {
        fill: 'rgba(22, 163, 74, 0.16)',
        stroke: '#16A34A',
        badgeText: 'text-emerald-700',
        bgTint: 'bg-emerald-50 border-emerald-200',
      };
  }
}
