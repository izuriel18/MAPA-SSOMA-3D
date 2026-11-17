import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { DwgPdfGuideView } from './components/DwgPdfGuideView';
import { InspectorPanel } from './components/InspectorPanel';
import { IperMatrixView } from './components/IperMatrixView';
import { SidebarCatalog } from './components/SidebarCatalog';
import { getSymbolById } from './data/isoSymbols';
import {
  type AiAnalysisResult,
  type BlueprintSource,
  type CanvasToolMode,
  type DxfLayerInfo,
  type EvacuationRoute,
  type MapMarker,
  type PlanMetadata,
  type RiskZone,
  type RoutePoint,
} from './types/riskMap';
import { parseDxfString, renderParsedDxfToDataUrl, type ParsedDxf } from './utils/dxfLoader';
import { exportRiskMapPng } from './utils/exportPng';
import { renderPdfFilePage } from './utils/pdfLoader';
import { createSampleIndustrialBlueprint } from './utils/sampleBlueprint';

type AppView = 'editor' | 'iper' | 'guide';

const STORAGE_KEY = 'mapariesgo_studio_project_v1';

const DEFAULT_METADATA: PlanMetadata = {
  facilityName: 'Planta Industrial Modelo — Nave A',
  facilityType: 'Planta Industrial / Maestranza',
  standard: 'ISO 7010 / NTP 399.010-1',
  author: 'Área SST / Prevención',
  revision: 'Rev. 01',
  date: new Date().toISOString().slice(0, 10),
  scaleText: '1:100',
};

const INITIAL_SAMPLE_ZONES: RiskZone[] = [
  {
    id: 'z-sample-1',
    name: 'Taller de Soldadura y Maestranza',
    riskCategory: 'Mecánico',
    x: 300,
    y: 100,
    width: 375,
    height: 300,
    probability: 4,
    severity: 4,
    controls: 'Guardas de seguridad en tornos CNC, careta facial, guantes y protección auditiva.',
    source: 'manual',
  },
  {
    id: 'z-sample-2',
    name: 'Subestación Eléctrica',
    riskCategory: 'Eléctrico',
    x: 62,
    y: 620,
    width: 162,
    height: 280,
    probability: 2,
    severity: 5,
    controls: 'Acceso restringido, tapete dieléctrico, extintor CO2 y bloqueo LOTO.',
    source: 'manual',
  },
  {
    id: 'z-sample-3',
    name: 'Almacén Químicos e Inflamables',
    riskCategory: 'Incendio',
    x: 675,
    y: 100,
    width: 263,
    height: 280,
    probability: 3,
    severity: 5,
    controls: 'Bandejas antiderrame, ventilación forzada, hojas HDS y prohibición de llama abierta.',
    source: 'manual',
  },
];

const INITIAL_SAMPLE_MARKERS: MapMarker[] = [
  {
    id: 'm-sample-1',
    symbolId: 'W024',
    label: 'Riesgo de atrapamiento en tornos CNC',
    zoneName: 'Maestranza',
    x: 420,
    y: 210,
    riskCategory: 'Mecánico',
    probability: 4,
    severity: 4,
    notes: 'Verificar paros de emergencia y resguardos fijos.',
    source: 'manual',
  },
  {
    id: 'm-sample-2',
    symbolId: 'M004',
    label: 'Uso obligatorio de lentes de seguridad',
    zoneName: 'Maestranza',
    x: 520,
    y: 365,
    riskCategory: 'Mecánico',
    probability: 3,
    severity: 3,
    notes: 'Proyección de viruta metálica.',
    source: 'manual',
  },
  {
    id: 'm-sample-3',
    symbolId: 'W012',
    label: 'Alta tensión en tableros principales',
    zoneName: 'Subestación',
    x: 135,
    y: 740,
    riskCategory: 'Eléctrico',
    probability: 2,
    severity: 5,
    notes: 'Solo personal electricista autorizado.',
    source: 'manual',
  },
  {
    id: 'm-sample-4',
    symbolId: 'F001',
    label: 'Extintor CO2 (Tableros) / PQS',
    zoneName: 'Pasillo Principal',
    x: 245,
    y: 660,
    riskCategory: 'Incendio',
    probability: 1,
    severity: 3,
    notes: 'Inspección mensual vigente, despejado a 1.20 m.',
    source: 'manual',
  },
  {
    id: 'm-sample-5',
    symbolId: 'W021',
    label: 'Almacenamiento de solventes inflamables',
    zoneName: 'Almacén Químicos',
    x: 800,
    y: 210,
    riskCategory: 'Incendio',
    probability: 3,
    severity: 5,
    notes: 'Mantener extintor PQS en acceso.',
    source: 'manual',
  },
  {
    id: 'm-sample-6',
    symbolId: 'E012',
    label: 'Ducha y lavaojos de emergencia',
    zoneName: 'Almacén Químicos',
    x: 730,
    y: 350,
    riskCategory: 'Químico',
    probability: 1,
    severity: 3,
    notes: 'Prueba semanal de flujo de agua.',
    source: 'manual',
  },
  {
    id: 'm-sample-7',
    symbolId: 'E001',
    label: 'Salida de emergencia Oeste',
    zoneName: 'Pasillo Principal',
    x: 68,
    y: 515,
    riskCategory: 'Locativo',
    probability: 1,
    severity: 2,
    notes: 'Barra antipánico e iluminación de emergencia.',
    source: 'manual',
  },
  {
    id: 'm-sample-8',
    symbolId: 'E001',
    label: 'Salida de emergencia Este',
    zoneName: 'Pasillo Principal',
    x: 932,
    y: 480,
    riskCategory: 'Locativo',
    probability: 1,
    severity: 2,
    notes: 'Puerta abatible hacia el exterior.',
    source: 'manual',
  },
];

const INITIAL_SAMPLE_ROUTES: EvacuationRoute[] = [
  {
    id: 'r-sample-1',
    name: 'Ruta Evacuación Oeste',
    points: [
      { x: 480, y: 400 },
      { x: 480, y: 465 },
      { x: 75, y: 465 },
    ],
    source: 'manual',
  },
  {
    id: 'r-sample-2',
    name: 'Ruta Evacuación Este',
    points: [
      { x: 775, y: 385 },
      { x: 775, y: 465 },
      { x: 925, y: 465 },
    ],
    source: 'manual',
  },
];

function createUid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function App() {
  const sampleBlueprint = useMemo(() => createSampleIndustrialBlueprint(), []);

  const [view, setView] = useState<AppView>('editor');
  const [blueprint, setBlueprint] = useState<BlueprintSource>({
    type: 'sample',
    fileName: 'planta_industrial_modelo.png',
    dataUrl: sampleBlueprint.dataUrl,
    width: sampleBlueprint.width,
    height: sampleBlueprint.height,
  });

  const [zones, setZones] = useState<RiskZone[]>(INITIAL_SAMPLE_ZONES);
  const [markers, setMarkers] = useState<MapMarker[]>(INITIAL_SAMPLE_MARKERS);
  const [routes, setRoutes] = useState<EvacuationRoute[]>(INITIAL_SAMPLE_ROUTES);
  const [metadata, setMetadata] = useState<PlanMetadata>(DEFAULT_METADATA);

  // Active file refs for multi-page PDF or CAD DXF layer toggling
  const activePdfFileRef = useRef<File | null>(null);
  const activeDxfRef = useRef<ParsedDxf | null>(null);

  const [toolMode, setToolMode] = useState<CanvasToolMode>('select');
  const [activeSymbolId, setActiveSymbolId] = useState<string>('W012');
  const [selectedType, setSelectedType] = useState<'marker' | 'zone' | 'route' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'ai' | 'properties'>('ai');

  const [layerVisibility, setLayerVisibility] = useState({
    zones: true,
    markers: true,
    routes: true,
    grid: false,
  });

  const [dwgNotice, setDwgNotice] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);

  // Hydrate saved elements from localStorage once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        zones?: RiskZone[];
        markers?: MapMarker[];
        routes?: EvacuationRoute[];
        metadata?: PlanMetadata;
      };
      if (Array.isArray(parsed.zones)) setZones(parsed.zones);
      if (Array.isArray(parsed.markers)) setMarkers(parsed.markers);
      if (Array.isArray(parsed.routes)) setRoutes(parsed.routes);
      if (parsed.metadata) setMetadata(parsed.metadata);
    } catch {
      // Ignore corrupt localStorage
    }
  }, []);

  // Auto-save elements to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ zones, markers, routes, metadata })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [zones, markers, routes, metadata]);

  const selectedMarker = useMemo(
    () => (selectedType === 'marker' ? markers.find((m) => m.id === selectedId) ?? null : null),
    [selectedType, selectedId, markers]
  );
  const selectedZone = useMemo(
    () => (selectedType === 'zone' ? zones.find((z) => z.id === selectedId) ?? null : null),
    [selectedType, selectedId, zones]
  );
  const selectedRoute = useMemo(
    () => (selectedType === 'route' ? routes.find((r) => r.id === selectedId) ?? null : null),
    [selectedType, selectedId, routes]
  );

  const handleSelectElement = (type: 'marker' | 'zone' | 'route' | null, id: string | null) => {
    setSelectedType(type);
    setSelectedId(id);
    if (type && id) {
      setInspectorTab('properties');
    }
  };

  const handleUploadFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    setDwgNotice(null);
    setAiError(null);

    if (ext === 'dwg') {
      setDwgNotice(
        'Los archivos .DWG son binarios propietarios de AutoCAD. En AutoCAD/BricsCAD/Autodesk Viewer usa "Exportar a PDF" (recomendado) o "Guardar como DXF" y súbelo aquí para editar capas y analizarlo con IA.'
      );
      return;
    }

    setIsLoadingFile(true);
    try {
      if (ext === 'pdf') {
        activePdfFileRef.current = file;
        activeDxfRef.current = null;
        const rendered = await renderPdfFilePage(file, 1);
        setBlueprint({
          type: 'pdf',
          fileName: file.name,
          dataUrl: rendered.dataUrl,
          width: rendered.width,
          height: rendered.height,
          pdfPageCount: rendered.pageCount,
          pdfCurrentPage: rendered.currentPage,
        });
        setZones([]);
        setMarkers([]);
        setRoutes([]);
        setAiResult(null);
      } else if (ext === 'dxf') {
        const text = await file.text();
        const parsed = parseDxfString(text);
        if (parsed.entities.length === 0) {
          throw new Error(
            'El archivo DXF no contiene entidades vectoriales legibles (LINE, LWPOLYLINE, CIRCLE, ARC). Si es DXF binario, guárdalo como DXF ASCII o PDF.'
          );
        }
        activeDxfRef.current = parsed;
        activePdfFileRef.current = null;
        const rendered = renderParsedDxfToDataUrl(parsed, parsed.layers);
        setBlueprint({
          type: 'dxf',
          fileName: file.name,
          dataUrl: rendered.dataUrl,
          width: rendered.width,
          height: rendered.height,
          dxfLayers: parsed.layers,
        });
        setZones([]);
        setMarkers([]);
        setRoutes([]);
        setAiResult(null);
      } else {
        // Raster image (PNG, JPG, WEBP)
        activePdfFileRef.current = null;
        activeDxfRef.current = null;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
          reader.readAsDataURL(file);
        });
        const dims = await new Promise<{ width: number; height: number }>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => reject(new Error('Imagen inválida.'));
          img.src = dataUrl;
        });
        setBlueprint({
          type: 'image',
          fileName: file.name,
          dataUrl,
          width: dims.width,
          height: dims.height,
        });
        setZones([]);
        setMarkers([]);
        setRoutes([]);
        setAiResult(null);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al cargar el archivo.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleChangePdfPage = async (page: number) => {
    const file = activePdfFileRef.current;
    if (!file) return;
    setIsLoadingFile(true);
    try {
      const rendered = await renderPdfFilePage(file, page);
      setBlueprint((prev) => ({
        ...prev,
        dataUrl: rendered.dataUrl,
        width: rendered.width,
        height: rendered.height,
        pdfCurrentPage: rendered.currentPage,
        pdfPageCount: rendered.pageCount,
      }));
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleToggleDxfLayer = (layerName: string) => {
    const parsed = activeDxfRef.current;
    if (!parsed || !blueprint.dxfLayers) return;
    const updatedLayers: DxfLayerInfo[] = blueprint.dxfLayers.map((l) =>
      l.name === layerName ? { ...l, visible: !l.visible } : l
    );
    const rendered = renderParsedDxfToDataUrl(parsed, updatedLayers);
    setBlueprint((prev) => ({
      ...prev,
      dataUrl: rendered.dataUrl,
      width: rendered.width,
      height: rendered.height,
      dxfLayers: updatedLayers,
    }));
  };

  const handleLoadSampleBlueprint = () => {
    activePdfFileRef.current = null;
    activeDxfRef.current = null;
    setDwgNotice(null);
    setAiError(null);
    setAiResult(null);
    setBlueprint({
      type: 'sample',
      fileName: 'planta_industrial_modelo.png',
      dataUrl: sampleBlueprint.dataUrl,
      width: sampleBlueprint.width,
      height: sampleBlueprint.height,
    });
    setZones(INITIAL_SAMPLE_ZONES);
    setMarkers(INITIAL_SAMPLE_MARKERS);
    setRoutes(INITIAL_SAMPLE_ROUTES);
    setMetadata(DEFAULT_METADATA);
    setSelectedType(null);
    setSelectedId(null);
  };

  const handleAddMarker = (x: number, y: number) => {
    const def = getSymbolById(activeSymbolId);
    const next: MapMarker = {
      id: createUid('m'),
      symbolId: def.id,
      label: def.name,
      zoneName: 'Área General',
      x,
      y,
      riskCategory: def.defaultRiskCategory,
      probability: def.defaultProbability,
      severity: def.defaultSeverity,
      notes: def.description,
      source: 'manual',
    };
    setMarkers((prev) => [...prev, next]);
    handleSelectElement('marker', next.id);
  };

  const handleMoveMarker = (id: string, x: number, y: number) => {
    setMarkers((prev) => prev.map((m) => (m.id === id ? { ...m, x, y } : m)));
  };

  const handleAddZone = (draft: Omit<RiskZone, 'id'>) => {
    const next: RiskZone = { ...draft, id: createUid('z') };
    setZones((prev) => [...prev, next]);
    handleSelectElement('zone', next.id);
    setToolMode('select');
  };

  const handleAddRoute = (points: RoutePoint[]) => {
    const next: EvacuationRoute = {
      id: createUid('r'),
      name: `Ruta Evacuación ${routes.length + 1}`,
      points,
      source: 'manual',
    };
    setRoutes((prev) => [...prev, next]);
    handleSelectElement('route', next.id);
    setToolMode('select');
  };

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/analyze-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: blueprint.dataUrl,
          mimeType: 'image/png',
          facilityType: metadata.facilityType,
          facilityName: metadata.facilityName,
          standard: metadata.standard,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error en el servidor al analizar el plano.');
      }
      setAiResult(data as AiAnalysisResult);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'No se pudo completar el análisis con IA.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAiSuggestions = (replaceExisting: boolean) => {
    if (!aiResult) return;

    const newZones: RiskZone[] = (aiResult.zones || []).map((z) => ({
      id: createUid('z'),
      name: z.name,
      riskCategory: z.riskCategory,
      x: Math.max(0, Math.min(950, Math.round(z.x))),
      y: Math.max(0, Math.min(950, Math.round(z.y))),
      width: Math.max(40, Math.min(1000, Math.round(z.width))),
      height: Math.max(40, Math.min(1000, Math.round(z.height))),
      probability: Math.max(1, Math.min(5, Math.round(z.probability))),
      severity: Math.max(1, Math.min(5, Math.round(z.severity))),
      controls: z.controls,
      source: 'ai',
    }));

    const newMarkers: MapMarker[] = (aiResult.markers || []).map((m) => ({
      id: createUid('m'),
      symbolId: m.symbolId,
      label: m.label,
      zoneName: m.zoneName,
      x: Math.max(10, Math.min(990, Math.round(m.x))),
      y: Math.max(10, Math.min(990, Math.round(m.y))),
      riskCategory: m.riskCategory,
      probability: Math.max(1, Math.min(5, Math.round(m.probability))),
      severity: Math.max(1, Math.min(5, Math.round(m.severity))),
      notes: m.notes,
      source: 'ai',
    }));

    const newRoutes: EvacuationRoute[] = (aiResult.evacuationRoutes || []).map((r) => ({
      id: createUid('r'),
      name: r.name,
      points: (r.points || []).map((pt) => ({
        x: Math.max(0, Math.min(1000, Math.round(pt.x))),
        y: Math.max(0, Math.min(1000, Math.round(pt.y))),
      })),
      source: 'ai',
    }));

    if (replaceExisting) {
      setZones(newZones);
      setMarkers(newMarkers);
      setRoutes(newRoutes);
    } else {
      setZones((prev) => [...prev, ...newZones]);
      setMarkers((prev) => [...prev, ...newMarkers]);
      setRoutes((prev) => [...prev, ...newRoutes]);
    }
    setSelectedType(null);
    setSelectedId(null);
  };

  const handleAskAiAdvisor = async (question: string): Promise<string> => {
    const currentSummary = `${zones.length} zonas IPER (${zones.map((z) => z.name).join(', ')}), ${markers.length} pictogramas ISO 7010 colocados, ${routes.length} rutas de evacuación.`;
    const res = await fetch('/api/ai/advise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        facilityContext: `${metadata.facilityName} (${metadata.facilityType}), Norma: ${metadata.standard}`,
        currentSummary,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error consultando al asistente IA.');
    }
    return data.answer as string;
  };

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      await exportRiskMapPng({
        blueprint,
        zones,
        markers,
        routes,
        metadata,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    const payload = {
      version: 1,
      metadata,
      zones,
      markers,
      routes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.facilityName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_proyecto.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        metadata?: PlanMetadata;
        zones?: RiskZone[];
        markers?: MapMarker[];
        routes?: EvacuationRoute[];
      };
      if (parsed.metadata) setMetadata(parsed.metadata);
      if (Array.isArray(parsed.zones)) setZones(parsed.zones);
      if (Array.isArray(parsed.markers)) setMarkers(parsed.markers);
      if (Array.isArray(parsed.routes)) setRoutes(parsed.routes);
      setView('editor');
    } catch {
      setAiError('El archivo JSON del proyecto no tiene un formato válido.');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Bar: 3-zone contract */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-8 z-20">
        {/* Zone 1: Single-line Brand Title */}
        <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          MapaRiesgo Studio
        </span>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setView('editor')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              view === 'editor'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Editor de Plano
          </button>
          <button
            type="button"
            onClick={() => setView('iper')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              view === 'iper'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Matriz IPER ({zones.length + markers.length})
          </button>
          <button
            type="button"
            onClick={() => setView('guide')}
            className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
              view === 'guide'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Guía DWG y PDF
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportPng}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exportando...' : 'Exportar Mapa PNG'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {view === 'editor' && (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <SidebarCatalog
            blueprint={blueprint}
            activeSymbolId={activeSymbolId}
            toolMode={toolMode}
            layerVisibility={layerVisibility}
            onUploadFile={handleUploadFile}
            onChangePdfPage={handleChangePdfPage}
            onToggleDxfLayer={handleToggleDxfLayer}
            onLoadSampleBlueprint={handleLoadSampleBlueprint}
            onSelectSymbol={(symId) => {
              setActiveSymbolId(symId);
              setToolMode('place-marker');
            }}
            onToggleOverlayLayer={(key) =>
              setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
            }
            dwgNotice={dwgNotice}
            isLoadingFile={isLoadingFile}
          />

          <main className="flex-1 min-w-0 h-full">
            <BlueprintCanvas
              blueprint={blueprint}
              zones={zones}
              markers={markers}
              routes={routes}
              toolMode={toolMode}
              activeSymbolId={activeSymbolId}
              selectedId={selectedId}
              selectedType={selectedType}
              layerVisibility={layerVisibility}
              onSetToolMode={setToolMode}
              onSelectElement={handleSelectElement}
              onAddMarker={handleAddMarker}
              onMoveMarker={handleMoveMarker}
              onAddZone={handleAddZone}
              onAddRoute={handleAddRoute}
            />
          </main>

          <InspectorPanel
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            metadata={metadata}
            onUpdateMetadata={setMetadata}
            selectedType={selectedType}
            selectedMarker={selectedMarker}
            selectedZone={selectedZone}
            selectedRoute={selectedRoute}
            onUpdateMarker={(updated) =>
              setMarkers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
            }
            onDeleteMarker={(id) => {
              setMarkers((prev) => prev.filter((m) => m.id !== id));
              setSelectedType(null);
              setSelectedId(null);
            }}
            onUpdateZone={(updated) =>
              setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)))
            }
            onDeleteZone={(id) => {
              setZones((prev) => prev.filter((z) => z.id !== id));
              setSelectedType(null);
              setSelectedId(null);
            }}
            onUpdateRoute={(updated) =>
              setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
            }
            onDeleteRoute={(id) => {
              setRoutes((prev) => prev.filter((r) => r.id !== id));
              setSelectedType(null);
              setSelectedId(null);
            }}
            isAnalyzing={isAnalyzing}
            aiError={aiError}
            aiResult={aiResult}
            onRunAiAnalysis={handleRunAiAnalysis}
            onApplyAiSuggestions={handleApplyAiSuggestions}
            onAskAiAdvisor={handleAskAiAdvisor}
          />
        </div>
      )}

      {view === 'iper' && (
        <IperMatrixView
          zones={zones}
          markers={markers}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onJumpToElement={(type, id) => {
            setView('editor');
            handleSelectElement(type, id);
          }}
        />
      )}

      {view === 'guide' && <DwgPdfGuideView onGoToEditor={() => setView('editor')} />}
    </div>
  );
}
