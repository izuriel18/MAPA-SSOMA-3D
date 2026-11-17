import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sliders,
  Trash2,
} from 'lucide-react';
import { getSymbolById, ISO_SYMBOLS } from '../data/isoSymbols';
import { IsoSymbolIcon } from './IsoSymbolIcon';
import {
  classifyRiskLevel,
  computeRiskScore,
  getRiskColors,
  type AiAnalysisResult,
  type EvacuationRoute,
  type MapMarker,
  type PlanMetadata,
  type RiskCategory,
  type RiskZone,
} from '../types/riskMap';

interface InspectorPanelProps {
  activeTab: 'ai' | 'properties';
  onTabChange: (tab: 'ai' | 'properties') => void;
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
  onRunAiAnalysis: () => void;
  onApplyAiSuggestions: (replaceExisting: boolean) => void;
  onAskAiAdvisor: (question: string) => Promise<string>;
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
  'Planta de Alimentos',
  'Oficinas Administrativas / Edificio',
  'Obra Civil / Construcción',
  'Taller Automotriz / Mantenimiento',
];

const QUICK_AI_PROMPTS = [
  '¿Cómo limpio mi archivo DWG antes de exportarlo a PDF o DXF?',
  '¿Cada cuántos metros debo ubicar extintores y salidas?',
  '¿Qué controles prioritarios recomienda la norma ISO 7010 aquí?',
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
}) => {
  const [question, setQuestion] = useState('');
  const [advisorReply, setAdvisorReply] = useState<string | null>(null);
  const [isAskingAdvisor, setIsAskingAdvisor] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);

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
      setAdvisorError(err instanceof Error ? err.message : 'Error consultando al asistente.');
    } finally {
      setIsAskingAdvisor(false);
    }
  };

  return (
    <aside className="w-[340px] shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Segmented Inspector Tabs */}
      <div className="p-3 border-b border-slate-200">
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onTabChange('ai')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Asistente IA
          </button>
          <button
            type="button"
            onClick={() => onTabChange('properties')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'properties'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {selectedType ? 'Elemento' : 'Cajetín'}
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'ai' ? (
          <>
            {/* Context Config for AI */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Análisis Automático del Plano
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  La IA inspecciona la geometría del plano para proponer zonas IPER, pictogramas ISO 7010 y rutas de evacuación.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-slate-600">
                  Tipo de instalación
                </label>
                <select
                  value={metadata.facilityType}
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, facilityType: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                >
                  {FACILITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-medium text-slate-600">
                  Normativa de señalización
                </label>
                <select
                  value={metadata.standard}
                  onChange={(e) =>
                    onUpdateMetadata({ ...metadata, standard: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="ISO 7010 / NTP 399.010-1">ISO 7010 / NTP 399.010-1</option>
                  <option value="NOM-026-STPS / ISO 7010">NOM-026-STPS (México)</option>
                  <option value="OSHA / ANSI Z535 / NFPA">OSHA / ANSI Z535 / NFPA</option>
                  <option value="UNE-EN ISO 7010">UNE-EN ISO 7010 (Europa)</option>
                </select>
              </div>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={onRunAiAnalysis}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analizando plano...
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
                    {aiResult.zones.length} zonas · {aiResult.markers.length} símbolos · {aiResult.evacuationRoutes.length} rutas
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
                      Observaciones técnicas de plano y campo
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
                Consultor SST y Preparación DWG/PDF
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
                  placeholder="Pregunta sobre normativa o CAD..."
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
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {advisorReply}
                </div>
              )}
            </div>
          </>
        ) : (
          /* PROPERTIES TAB */
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
                      <div className="text-[11px] font-mono tabular-nums text-slate-500">
                        X:{selectedMarker.x} · Y:{selectedMarker.y}
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
                    Tipo de Pictograma ISO 7010
                  </label>
                  <select
                    value={selectedMarker.symbolId}
                    onChange={(e) =>
                      onUpdateMarker({ ...selectedMarker, symbolId: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                  >
                    {ISO_SYMBOLS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Etiqueta / Riesgo Identificado
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

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Área / Zona
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
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-600">
                      Categoría
                    </label>
                    <select
                      value={selectedMarker.riskCategory}
                      onChange={(e) =>
                        onUpdateMarker({
                          ...selectedMarker,
                          riskCategory: e.target.value as RiskCategory,
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md"
                    >
                      {RISK_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Probability & Severity Sliders */}
                <IperScoreInputs
                  probability={selectedMarker.probability}
                  severity={selectedMarker.severity}
                  onChange={(p, s) =>
                    onUpdateMarker({ ...selectedMarker, probability: p, severity: s })
                  }
                />

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Controles / Notas de campo
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
                      Zona de Riesgo IPER
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500">
                      {selectedZone.width}×{selectedZone.height} u.
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
                    Nombre de la Zona
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
                    Categoría de Riesgo Principal
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
                    Medidas de Control (Jerarquía IPER)
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
              </div>
            )}

            {!selectedType && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">
                    Cajetín Técnico del Plano
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estos datos aparecen en el rótulo inferior al exportar el Mapa de Riesgos en PNG.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Empresa / Planta / Sede
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

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Responsable SST / Prevencionista
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

                <div className="grid grid-cols-2 gap-2">
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
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
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
                      className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={metadata.date}
                    onChange={(e) =>
                      onUpdateMetadata({ ...metadata, date: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md"
                  />
                </div>
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
            <option value={1}>1 · Rara</option>
            <option value={2}>2 · Baja</option>
            <option value={3}>3 · Media</option>
            <option value={4}>4 · Probable</option>
            <option value={5}>5 · Frecuente</option>
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
            <option value={1}>1 · Leve</option>
            <option value={2}>2 · Menor</option>
            <option value={3}>3 · Moderada</option>
            <option value={4}>4 · Grave</option>
            <option value={5}>5 · Catastrófica</option>
          </select>
        </div>
      </div>
    </div>
  );
};
