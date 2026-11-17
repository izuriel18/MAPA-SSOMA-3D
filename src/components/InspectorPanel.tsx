import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Bot,
  Building2,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Loader2,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { getSymbolById, ISO_SYMBOLS } from '../data/isoSymbols';
import { IsoSymbolIcon } from './IsoSymbolIcon';
import {
  classifyRiskLevel,
  computeRiskScore,
  getRiskColors,
  type AiAnalysisResult,
  type EvacuationRoute,
  type IpercRow,
  type MapMarker,
  type PlanMetadata,
  type RiskCategory,
  type RiskZone,
} from '../types/riskMap';

export type InspectorTab = 'ai' | 'properties' | 'cajetin' | 'iperc';

interface InspectorPanelProps {
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  metadata: PlanMetadata;
  onUpdateMetadata: (next: PlanMetadata) => void;
  selectedType: 'marker' | 'zone' | 'route' | null;
  selectedMarker: MapMarker | null;
  selectedZone: RiskZone | null;
  selectedRoute: EvacuationRoute | null;
  onUpdateMarker: (marker: MapMarker) => void;
  onDeleteMarker: (id: string) => void;
  onUpdateZone: (zone: RiskZone) => void;
  onDeleteZone: (id: string) => void;
  onUpdateRoute: (route: EvacuationRoute) => void;
  onDeleteRoute: (id: string) => void;
  isAnalyzing: boolean;
  aiError: string | null;
  aiResult: AiAnalysisResult | null;
  onRunAiAnalysis: (model?: string) => void;
  onApplyAiSuggestions: (replaceExisting: boolean) => void;
  onAskAiAdvisor: (question: string) => Promise<string>;
  // IPERC Excel Integration
  ipercRows: IpercRow[];
  onUploadIpercExcel: (file: File) => Promise<void>;
  onApplyIpercToMap: () => void;
  onExportIpercExcel?: () => void;
  onToggleCollapse?: () => void;
}

const RISK_CATEGORIES: RiskCategory[] = [
  'Mecánico',
  'Eléctrico',
  'Incendio',
  'Químico',
  'Físico',
  'Ergonómico',
  'Locativo',
  'Biológico',
];

const FACILITY_TYPES = [
  'Planta Industrial / Maestranza',
  'Almacén Logístico / Bodega',
  'Laboratorio Químico / Farmacéutico',
  'Planta de Alimentos y Bebidas',
  'Oficinas Administrativas / Edificio',
  'Obra Civil / Construcción (G.050)',
  'Operaciones Mineras / Planta Concentradora (D.S. 024-2016-EM)',
  'Taller Automotriz / Mantenimiento',
];

const QUICK_AI_PROMPTS = [
  '¿Qué exige la NTP 399.010-1 para la señal "S" de Zona Segura en Sismos?',
  '¿Cada cuántos metros ubicar extintores PQS y CO2 según NTP 350.043-1?',
  '¿Cuáles son los requisitos de exhibición del Mapa de Riesgos ante SUNAFIL (D.S. 005-2012-TR)?',
  '¿Cómo dimensionar puertas y rutas de escape según RNE Norma A.130?',
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  activeTab,
  onTabChange,
  metadata,
  onUpdateMetadata,
  selectedType,
  selectedMarker,
  selectedZone,
  selectedRoute,
  onUpdateMarker,
  onDeleteMarker,
  onUpdateZone,
  onDeleteZone,
  onUpdateRoute,
  onDeleteRoute,
  isAnalyzing,
  aiError,
  aiResult,
  onRunAiAnalysis,
  onApplyAiSuggestions,
  onAskAiAdvisor,
  ipercRows,
  onUploadIpercExcel,
  onApplyIpercToMap,
  onExportIpercExcel,
  onToggleCollapse,
}) => {
  const [aiModel, setAiModel] = useState<string>('gemini-3.8-flash');
  const [question, setQuestion] = useState('');
  const [advisorReply, setAdvisorReply] = useState<string | null>(null);
  const [isAskingAdvisor, setIsAskingAdvisor] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [excelMsg, setExcelMsg] = useState<string | null>(null);

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setIsAskingAdvisor(true);
    setAdvisorError(null);
    try {
      const answer = await onAskAiAdvisor(trimmed);
      setAdvisorReply(answer);
      setQuestion('');
    } catch (err) {
      setAdvisorError(
        err instanceof Error ? err.message : 'Error al consultar al asistente IA.'
      );
    } finally {
      setIsAskingAdvisor(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingExcel(true);
    setExcelMsg(null);
    try {
      await onUploadIpercExcel(file);
      setExcelMsg(`¡Matriz IPERC cargada con éxito!`);
    } catch (err) {
      setExcelMsg(err instanceof Error ? err.message : 'Error al procesar el Excel.');
    } finally {
      setIsUploadingExcel(false);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-[330px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0">
        <div className="flex-1 grid grid-cols-4 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => onTabChange('ai')}
            className={`py-2 px-1 inline-flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
            title="Asistente de IA y Visión en Planos"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>IA SST</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('iperc')}
            className={`py-2 px-1 inline-flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'iperc'
                ? 'border-emerald-600 text-emerald-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
            title="Ingesta de Matriz IPERC en Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>IPERC</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('cajetin')}
            className={`py-2 px-1 inline-flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'cajetin'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
            title="Cajetín Legal Oficial (SGSST Perú)"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cajetín</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('properties')}
            className={`py-2 px-1 inline-flex items-center justify-center gap-1 border-b-2 transition-colors ${
              activeTab === 'properties'
                ? 'border-slate-900 text-slate-900 bg-white'
                : 'border-transparent hover:text-slate-900'
            }`}
            title="Propiedades del elemento seleccionado"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Prop.</span>
          </button>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Ocultar panel derecho para ampliar área de trabajo"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors border-l border-slate-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ========================================================= */}
        {/* TAB 1: ASISTENTE IA & VISIÓN */}
        {/* ========================================================= */}
        {activeTab === 'ai' && (
          <>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900">
                    Análisis Multimodal con IA
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    {aiModel === 'gemini-4-hydrogen'
                      ? 'Hydrogen 4'
                      : aiModel === 'gemini-3.8-flash'
                      ? 'Flash 3.8'
                      : 'Pro 2.5'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Examina el plano cargado, reconoce las áreas y propone Zonas IPER, Señalética NTP 399.010-1 y Rutas de Escape.
                </p>
              </div>

              {/* Selector de Modelo IA (Opción 1) */}
              <div className="space-y-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Motor de IA (Gemini)
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 font-medium text-slate-800"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recomendado / Ultra Rápido 3-5s)</option>
                  <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (Investigación / Razonamiento)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Análisis exhaustivo)</option>
                </select>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {aiModel === 'gemini-4-hydrogen'
                    ? '⚡ Razonamiento avanzado. Si Google reporta alta demanda, conmuta automáticamente a Flash.'
                    : aiModel === 'gemini-3.8-flash'
                    ? '✓ Modelo oficial recomendado: rápido, de alta disponibilidad y excelente visión.'
                    : '🔍 Mayor capacidad analítica multimodal para planos extensos.'}
                </p>
              </div>

              {/* Detección Automática de Instalación */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-blue-900 block mb-0.5">
                    Giro e Instalación: Detección Automática
                  </span>
                  <span className="text-blue-700">
                    Gemini analiza rótulos, membrete y maquinaria para clasificar el tipo de industria y aplicar los riesgos normativos específicos.
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => onRunAiAnalysis(aiModel)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando Plano con {aiModel === 'gemini-4-hydrogen' ? 'Hydrogen' : 'Gemini'}...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Analizar Plano con IA
                  </>
                )}
              </button>

              {aiError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                  {aiError}
                </div>
              )}
            </div>

            {/* AI Results Preview & Apply */}
            {aiResult && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Propuesta generada
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-slate-500">
                    {aiResult.zones.length} zonas · {aiResult.markers.length} señales · {aiResult.evacuationRoutes.length} rutas
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  {aiResult.summary}
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onApplyAiSuggestions(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aplicar al Mapa
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyAiSuggestions(false)}
                    className="inline-flex items-center justify-center px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-md transition-colors"
                  >
                    Sumar al Actual
                  </button>
                </div>

                {aiResult.cadTips.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-slate-700">
                      Observaciones Técnicas y de Campo
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-600 list-disc pl-4">
                      {aiResult.cadTips.map((tip, i) => (
                        <li key={i} className="leading-relaxed">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Contextual SST & CAD Q&A */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-semibold text-slate-900">
                Consultor Legal SST (Perú) y CAD
              </h3>

              <div className="space-y-1.5">
                {QUICK_AI_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAskingAdvisor}
                    onClick={() => handleAsk(q)}
                    className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk(question);
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Pregunta sobre Ley 29783 o NTP..."
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled={isAskingAdvisor || !question.trim()}
                  onClick={() => handleAsk(question)}
                  className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-40"
                >
                  {isAskingAdvisor ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>

              {advisorError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {advisorError}
                </div>
              )}

              {advisorReply && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {advisorReply}
                </div>
              )}
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INGESTA DE MATRIZ IPERC EN EXCEL */}
        {/* ========================================================= */}
        {activeTab === 'iperc' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Matriz IPERC de la Empresa (Excel)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Sube el archivo Excel de tu IPERC (.xlsx, .csv). El sistema identificará las áreas, procesos y peligros para plasmarlos en el Mapa de Riesgos.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-3">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md cursor-pointer transition-colors shadow-xs">
                {isUploadingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Subir Matriz Excel (.xlsx / .csv)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleExcelUpload}
                  disabled={isUploadingExcel}
                />
              </label>

              {excelMsg && (
                <div className="text-[11px] text-emerald-800 font-medium">
                  {excelMsg}
                </div>
              )}

              <div className="text-[11px] text-slate-600 space-y-1">
                <div>
                  <strong>Registros cargados:</strong>{' '}
                  <span className="font-mono font-bold text-slate-900">{ipercRows.length}</span> peligros
                </div>
                {ipercRows.length > 0 && (
                  <div>
                    <strong>Áreas identificadas:</strong>{' '}
                    {Array.from(new Set(ipercRows.map((r) => r.area))).slice(0, 5).join(', ')}
                    {Array.from(new Set(ipercRows.map((r) => r.area))).length > 5 && '...'}
                  </div>
                )}
              </div>

              {ipercRows.length > 0 && (
                <button
                  type="button"
                  onClick={onApplyIpercToMap}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold rounded-md transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Sincronizar Peligros al Mapa
                </button>
              )}
            </div>

            {ipercRows.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span>Peligros del IPERC ({ipercRows.length})</span>
                </div>
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {ipercRows.slice(0, 15).map((row) => (
                    <div
                      key={row.id}
                      className="p-2 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate max-w-[170px]">
                          {row.area}
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                          {row.riskLevel} ({row.riskScore})
                        </span>
                      </div>
                      <div className="text-slate-700 text-[11px] truncate">
                        ⚠️ {row.danger}
                      </div>
                      <div className="text-slate-500 text-[10px] truncate">
                        ⚡ {row.risk}
                      </div>
                    </div>
                  ))}
                  {ipercRows.length > 15 && (
                    <div className="text-center text-[11px] text-slate-500 py-1">
                      y {ipercRows.length - 15} registros más en la pestaña Matriz IPER.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500 leading-relaxed text-center">
                Sube tu matriz IPERC para vincular automáticamente los peligros y controles de tu empresa con el plano arquitectónico.
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CAJETÍN OFICIAL SGSST PERÚ */}
        {/* ========================================================= */}
        {activeTab === 'cajetin' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                Cajetín Técnico Legal (D.S. 005-2012-TR)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Información obligatoria del Sistema de Gestión de SST y del Plan de Evacuación exigida por SUNAFIL e INDECI.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Razón Social de la Empresa
                </label>
                <input
                  type="text"
                  value={metadata.companyName || ''}
                  placeholder="Ej. Industrias del Perú S.A.C."
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, companyName: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    RUC
                  </label>
                  <input
                    type="text"
                    value={metadata.companyRuc || ''}
                    placeholder="20123456789"
                    maxLength={11}
                    onChange={(e) =>
                      onUpdateMetadata({ ...metadata, companyRuc: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Aforo Máximo
                  </label>
                  <input
                    type="text"
                    value={metadata.headcount || ''}
                    placeholder="Ej. 65 pers."
                    onChange={(e) =>
                      onUpdateMetadata({ ...metadata, headcount: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Sede / Planta / Instalación
                </label>
                <input
                  type="text"
                  value={metadata.facilityName}
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, facilityName: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Dirección de la Sede
                </label>
                <input
                  type="text"
                  value={metadata.facilityAddress || ''}
                  placeholder="Av. Principal 123, Lima"
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, facilityAddress: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Aprobación Comité de SST (CSST / Supervisor)
                </label>
                <input
                  type="text"
                  value={metadata.csstRepresentative || ''}
                  placeholder="Comité Paritario de SST"
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, csstRepresentative: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Responsable de Elaboración / SST
                </label>
                <input
                  type="text"
                  value={metadata.author}
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, author: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-600">
                  Central / Teléfono de Emergencias
                </label>
                <input
                  type="text"
                  value={metadata.emergencyContact || ''}
                  placeholder="(01) 619-0000 / Bomberos 116"
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, emergencyContact: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Escala
                  </label>
                  <input
                    type="text"
                    value={metadata.scaleText}
                    onChange={(e) =>
                      onUpdateMetadata({ ...metadata, scaleText: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Revisión
                  </label>
                  <input
                    type="text"
                    value={metadata.revision}
                    onChange={(e) =>
                      onUpdateMetadata({ ...metadata, revision: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={metadata.date}
                    onChange={(e) =>
                      onUpdateMetadata({ ...metadata, date: e.target.value })
                    }
                    className="w-full px-1.5 py-1 text-xs font-mono border border-slate-200 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PROPIEDADES DEL ELEMENTO SELECCIONADO */}
        {/* ========================================================= */}
        {activeTab === 'properties' && (
          <>
            {selectedType === 'marker' && selectedMarker && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <IsoSymbolIcon symbolId={selectedMarker.symbolId} size={32} />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {getSymbolById(selectedMarker.symbolId).code}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {getSymbolById(selectedMarker.symbolId).name}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteMarker(selectedMarker.id)}
                    title="Eliminar pictograma"
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Cambiar Símbolo
                  </label>
                  <select
                    value={selectedMarker.symbolId}
                    onChange={(e) => {
                      const def = getSymbolById(e.target.value);
                      onUpdateMarker({
                        ...selectedMarker,
                        symbolId: def.id,
                        label: def.name,
                        riskCategory: def.defaultRiskCategory,
                        notes: def.description,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {ISO_SYMBOLS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Orientación / Rotación */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Orientación / Giro
                    </label>
                    <span className="font-mono text-xs text-slate-700 font-semibold">
                      {selectedMarker.rotation || 0}°
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {([0, 90, 180, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => onUpdateMarker({ ...selectedMarker, rotation: deg })}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          (selectedMarker.rotation || 0) === deg
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Etiqueta / Descripción
                  </label>
                  <input
                    type="text"
                    value={selectedMarker.label}
                    onChange={(e) =>
                      onUpdateMarker({ ...selectedMarker, label: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Ambiente / Zona de Ubicación
                  </label>
                  <input
                    type="text"
                    value={selectedMarker.zoneName}
                    onChange={(e) =>
                      onUpdateMarker({ ...selectedMarker, zoneName: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Categoría de Riesgo IPER
                  </label>
                  <select
                    value={selectedMarker.riskCategory}
                    onChange={(e) =>
                      onUpdateMarker({
                        ...selectedMarker,
                        riskCategory: e.target.value as RiskCategory,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {RISK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <IperScoreInputs
                  probability={selectedMarker.probability}
                  severity={selectedMarker.severity}
                  onChange={(p, s) =>
                    onUpdateMarker({ ...selectedMarker, probability: p, severity: s })
                  }
                />

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Notas Técnicas / Medidas de Control
                  </label>
                  <textarea
                    rows={3}
                    value={selectedMarker.notes}
                    onChange={(e) =>
                      onUpdateMarker({ ...selectedMarker, notes: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none"
                  />
                </div>
              </div>
            )}

            {selectedType === 'zone' && selectedZone && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Zona IPER Delimitada
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      {selectedZone.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteZone(selectedZone.id)}
                    title="Eliminar zona"
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Nombre del Área / Proceso
                  </label>
                  <input
                    type="text"
                    value={selectedZone.name}
                    onChange={(e) =>
                      onUpdateZone({ ...selectedZone, name: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Peligro Principal (Categoría)
                  </label>
                  <select
                    value={selectedZone.riskCategory}
                    onChange={(e) =>
                      onUpdateZone({
                        ...selectedZone,
                        riskCategory: e.target.value as RiskCategory,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {RISK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <IperScoreInputs
                  probability={selectedZone.probability}
                  severity={selectedZone.severity}
                  onChange={(p, s) =>
                    onUpdateZone({ ...selectedZone, probability: p, severity: s })
                  }
                />

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Medidas de Control (Jerarquía de Controles Ley 29783)
                  </label>
                  <textarea
                    rows={3}
                    value={selectedZone.controls}
                    onChange={(e) =>
                      onUpdateZone({ ...selectedZone, controls: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none"
                  />
                </div>
              </div>
            )}

            {selectedType === 'route' && selectedRoute && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Ruta de Evacuación
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      {selectedRoute.points.length} vértices
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteRoute(selectedRoute.id)}
                    title="Eliminar ruta"
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Nombre de la Ruta
                  </label>
                  <input
                    type="text"
                    value={selectedRoute.name}
                    onChange={(e) =>
                      onUpdateRoute({ ...selectedRoute, name: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Dirección de Evacuación:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateRoute({
                        ...selectedRoute,
                        points: [...selectedRoute.points].reverse(),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                    title="Invertir origen y fin de la ruta"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Invertir Sentido</span>
                  </button>
                </div>

                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-800 leading-relaxed">
                  💡 <strong>Edición directa en plano:</strong> Haz clic y arrastra cualquiera de los círculos numerados de la ruta directamente sobre el plano para esquivar paredes, tabiques o maquinaria.
                </div>
              </div>
            )}

            {!selectedType && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-center leading-relaxed">
                Selecciona cualquier pictograma, zona de riesgo o ruta en el plano para editar sus propiedades técnicas.
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

const IperScoreInputs: React.FC<{
  probability: number;
  severity: number;
  onChange: (p: number, s: number) => void;
}> = ({ probability, severity, onChange }) => {
  const score = computeRiskScore(probability, severity);
  const level = classifyRiskLevel(score);
  const colors = getRiskColors(level);

  return (
    <div className={`p-3 rounded-md border ${colors.bgTint} space-y-2.5`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-800">
          Evaluación IPER (P × S)
        </span>
        <span className={`font-mono tabular-nums text-xs font-bold ${colors.badgeText}`}>
          {score} · {level}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-slate-600 mb-1">
            Probabilidad (1-5)
          </label>
          <select
            value={probability}
            onChange={(e) => onChange(Number(e.target.value), severity)}
            className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded"
          >
            <option value={1}>1 · Rara (Frecuencia mínima)</option>
            <option value={2}>2 · Baja (Ocasional)</option>
            <option value={3}>3 · Media (Moderada)</option>
            <option value={4}>4 · Probable (Frecuente)</option>
            <option value={5}>5 · Casi Segura (Constante)</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-600 mb-1">
            Severidad (1-5)
          </label>
          <select
            value={severity}
            onChange={(e) => onChange(probability, Number(e.target.value))}
            className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded"
          >
            <option value={1}>1 · Leve (Sin descanso médico)</option>
            <option value={2}>2 · Menor (Primeros auxilios)</option>
            <option value={3}>3 · Moderada (Incapacidad temporal)</option>
            <option value={4}>4 · Grave (Incapacidad permanente)</option>
            <option value={5}>5 · Catastrófica (Mortalidad múltiple)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
