import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Layers,
  Save,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { BlueprintCanvas } from './components/BlueprintCanvas';
import { DwgPdfGuideView } from './components/DwgPdfGuideView';
import { InspectorPanel, type InspectorTab } from './components/InspectorPanel';
import { IperMatrixView } from './components/IperMatrixView';
import { SidebarCatalog } from './components/SidebarCatalog';
import { getSymbolById } from './data/isoSymbols';
import {
  type AiAnalysisResult,
  type BlueprintSource,
  type CanvasToolMode,
  type DxfLayerInfo,
  type EvacuationRoute,
  type ExportFormat,
  type IpercRow,
  type MapMarker,
  type MapViewMode,
  type PlanMetadata,
  type RiskZone,
  type RoutePoint,
} from './types/riskMap';
import { parseDxfString, renderParsedDxfToDataUrl, type ParsedDxf } from './utils/dxfLoader';
import { exportIpercToExcel, parseIpercExcelFile } from './utils/excelIpercLoader';
import { exportRiskMapPng } from './utils/exportPng';
import { optimizeImageForAi } from './utils/imageOptimizer';
import { renderPdfFilePage } from './utils/pdfLoader';
import { createSampleIndustrialBlueprint } from './utils/sampleBlueprint';

type AppView = 'editor' | 'iper' | 'guide';

const STORAGE_KEY = 'mapariesgo_studio_project_v1';

const DEFAULT_METADATA: PlanMetadata = {
  facilityName: 'Planta Industrial Modelo — Nave A',
  facilityType: 'Planta Industrial / Maestranza',
  standard: 'NTP 399.010-1 / Ley 29783 / RNE A.130',
  author: 'Área SST / Prevención',
  revision: 'Rev. 01',
  date: new Date().toISOString().slice(0, 10),
  scaleText: '1:100',
  companyRuc: '20100012345',
  companyName: 'INDUSTRIAS DEL PERÚ S.A.C.',
  facilityAddress: 'Av. Industrial 450, Lima - Perú',
  approvalDate: new Date().toISOString().slice(0, 10),
  csstRepresentative: 'Comité Paritario de SST',
  headcount: '45',
  emergencyContact: '(01) 619-0000 / Bomberos: 116',
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
  // Advertencias & EPP
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
    id: 'm-sample-5',
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

  // Evacuación y Señales NTP Perú
  {
    id: 'm-sample-6',
    symbolId: 'E_SISMO',
    label: 'Zona Segura en Caso de Sismos (S)',
    zoneName: 'Nave Central',
    x: 320,
    y: 440,
    riskCategory: 'Locativo',
    probability: 1,
    severity: 1,
    notes: 'Columna estructural principal identificada según INDECI.',
    source: 'manual',
  },
  {
    id: 'm-sample-7',
    symbolId: 'F001',
    label: 'Extintor PQS 6kg (ABC)',
    zoneName: 'Pasillo Principal',
    x: 245,
    y: 660,
    riskCategory: 'Incendio',
    probability: 1,
    severity: 3,
    notes: 'Inspección mensual vigente, libre de obstáculos a 1.20 m.',
    source: 'manual',
  },
  {
    id: 'm-sample-8',
    symbolId: 'F_CO2',
    label: 'Extintor CO2 5kg (BC)',
    zoneName: 'Subestación Eléctrica',
    x: 190,
    y: 730,
    riskCategory: 'Incendio',
    probability: 1,
    severity: 3,
    notes: 'Gas limpio no conductor para tableros eléctricos.',
    source: 'manual',
  },
  {
    id: 'm-sample-9',
    symbolId: 'E_LUZ',
    label: 'Luz de emergencia autónoma',
    zoneName: 'Salida Oeste',
    x: 95,
    y: 505,
    riskCategory: 'Locativo',
    probability: 1,
    severity: 2,
    notes: 'Autonomía de 90 minutos según RNE Norma A.130.',
    source: 'manual',
  },
  {
    id: 'm-sample-10',
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
    id: 'm-sample-11',
    symbolId: 'E001',
    label: 'Salida de emergencia Este',
    zoneName: 'Pasillo Principal',
    x: 932,
    y: 480,
    riskCategory: 'Locativo',
    probability: 1,
    severity: 2,
    notes: 'Puerta abatible hacia el exterior con rampa.',
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
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
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
  const [ipercRows, setIpercRows] = useState<IpercRow[]>([]);

  // Active file refs for multi-page PDF or CAD DXF layer toggling
  const activePdfFileRef = useRef<File | null>(null);
  const activeDxfRef = useRef<ParsedDxf | null>(null);

  const [toolMode, setToolMode] = useState<CanvasToolMode>('select');
  const [activeSymbolId, setActiveSymbolId] = useState<string>('E_SISMO');
  const [selectedType, setSelectedType] = useState<'marker' | 'zone' | 'route' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('ai');

  const [layerVisibility, setLayerVisibility] = useState({
    zones: true,
    markers: true,
    routes: true,
    grid: false,
  });

  const [dwgNotice, setDwgNotice] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

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
        ipercRows?: IpercRow[];
      };
      if (Array.isArray(parsed.zones)) setZones(parsed.zones);
      if (Array.isArray(parsed.markers)) setMarkers(parsed.markers);
      if (Array.isArray(parsed.routes)) setRoutes(parsed.routes);
      if (parsed.metadata) setMetadata(parsed.metadata);
      if (Array.isArray(parsed.ipercRows)) setIpercRows(parsed.ipercRows);
    } catch {
      // Ignore corrupt localStorage
    }
  }, []);

  // Auto-save elements to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ zones, markers, routes, metadata, ipercRows })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [zones, markers, routes, metadata, ipercRows]);

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
        'Los archivos .DWG son binarios de AutoCAD. En AutoCAD/BricsCAD usa "Exportar a PDF" o "Guardar como DXF" y súbelo aquí para editar capas y analizarlo con IA.'
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
            'El archivo DXF no contiene entidades vectoriales legibles (LINE, LWPOLYLINE, CIRCLE, ARC). Si es binario, guárdalo como DXF ASCII.'
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

  const handleRunAiAnalysis = async (model: string = 'gemini-4-hydrogen') => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      // Optimizar imagen para el análisis con IA (reduce payload de ~15MB a ~200KB evitando límite de Vercel)
      const optimized = await optimizeImageForAi(blueprint.dataUrl, 1200, 0.82);

      // Include summary of loaded IPERC rows if available for smart matching
      const ipercNotes =
        ipercRows.length > 0
          ? `Datos de la Matriz IPERC de la empresa (${ipercRows.length} registros cargados): ` +
            ipercRows
              .slice(0, 8)
              .map(
                (r) =>
                  `[Área: "${r.area}", Peligro: "${r.danger}", Riesgo: "${r.risk}", Nivel: ${r.riskLevel}]`
              )
              .join('; ')
          : '';

      const res = await fetch('/api/ai/analyze-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: optimized.dataUrl,
          mimeType: optimized.mimeType,
          facilityType: metadata.facilityType,
          facilityName: metadata.facilityName,
          standard: metadata.standard,
          notes: ipercNotes,
          model,
        }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Respuesta del servidor (${res.status}): ${responseText.slice(0, 160)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Error en el servidor (${res.status}) al analizar el plano.`);
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
    const currentSummary = `${zones.length} zonas IPER (${zones.map((z) => z.name).join(', ')}), ${markers.length} señales NTP/ISO ubicadas, ${routes.length} rutas de evacuación. ${ipercRows.length} peligros en matriz IPERC.`;
    const res = await fetch('/api/ai/advise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        facilityContext: `${metadata.facilityName} (${metadata.facilityType}), Empresa: ${metadata.companyName || 'No esp.'}, Norma: ${metadata.standard}`,
        currentSummary,
      }),
    });
    const responseText = await res.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Respuesta del servidor (${res.status}): ${responseText.slice(0, 160)}`);
    }
    if (!res.ok) {
      throw new Error(data.error || `Error consultando al asistente IA (${res.status}).`);
    }
    return data.answer as string;
  };

  const handleUploadIpercExcel = async (file: File) => {
    const rows = await parseIpercExcelFile(file);
    setIpercRows(rows);
  };

  const handleExportIpercExcel = () => {
    const filename = `${(metadata.companyName || metadata.facilityName).toLowerCase().replace(/[^a-z0-9]+/g, '_')}_matriz_iperc.xlsx`;
    exportIpercToExcel(ipercRows, filename);
  };

  const handleApplyIpercToMap = () => {
    if (ipercRows.length === 0) return;

    // Group IPERC items by area
    const areaMap = new Map<string, IpercRow[]>();
    for (const r of ipercRows) {
      const list = areaMap.get(r.area) || [];
      list.push(r);
      areaMap.set(r.area, list);
    }

    const newZones: RiskZone[] = [];
    let idx = 0;
    const areas = Array.from(areaMap.keys());

    for (const area of areas) {
      const items = areaMap.get(area) || [];
      const worst = items.reduce((prev, curr) => (curr.riskScore > prev.riskScore ? curr : prev), items[0]);
      const x = 70 + (idx % 3) * 300;
      const y = 100 + Math.floor(idx / 3) * 270;
      idx++;

      newZones.push({
        id: createUid('z-iperc'),
        name: area,
        riskCategory: worst.danger.toLowerCase().includes('electr')
          ? 'Eléctrico'
          : worst.danger.toLowerCase().includes('quim') || worst.danger.toLowerCase().includes('inflam')
          ? 'Químico'
          : worst.danger.toLowerCase().includes('ruido')
          ? 'Físico'
          : worst.danger.toLowerCase().includes('mecan') || worst.danger.toLowerCase().includes('atrap')
          ? 'Mecánico'
          : 'Locativo',
        x: Math.min(x, 700),
        y: Math.min(y, 700),
        width: 260,
        height: 220,
        probability: worst.probability,
        severity: worst.severity,
        controls: [worst.engineeringControl, worst.administrativeControl, worst.eppControl]
          .filter(Boolean)
          .join(' | ') || worst.risk,
        source: 'iperc',
      });
    }

    setZones((prev) => [...prev, ...newZones]);
    setView('editor');
    setInspectorTab('properties');
  };

  const handleExportPng = async (exportMode?: MapViewMode, fmt?: ExportFormat) => {
    setIsExporting(true);
    try {
      await exportRiskMapPng({
        blueprint,
        zones,
        markers,
        routes,
        metadata,
        mode: exportMode || mapViewMode,
        format: fmt || exportFormat,
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
      ipercRows,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${metadata.facilityName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_proyecto_ssoma.json`;
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
        ipercRows?: IpercRow[];
      };
      if (parsed.metadata) setMetadata(parsed.metadata);
      if (Array.isArray(parsed.zones)) setZones(parsed.zones);
      if (Array.isArray(parsed.markers)) setMarkers(parsed.markers);
      if (Array.isArray(parsed.routes)) setRoutes(parsed.routes);
      if (Array.isArray(parsed.ipercRows)) setIpercRows(parsed.ipercRows);
      setView('editor');
    } catch {
      setAiError('El archivo JSON del proyecto no tiene un formato válido.');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 z-20">
        {/* Brand & Peru SSOMA badge */}
        <div className="flex items-center gap-3">
          <span className="font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            MapaRiesgo Studio
          </span>
          <span className="hidden xl:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            NTP 399.010-1 · Ley 29783 (Perú)
          </span>
        </div>

        {/* View Navigation Tabs */}
        <nav className="flex items-center gap-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => setView('editor')}
            className={`py-1 whitespace-nowrap transition-colors border-b-2 ${
              view === 'editor'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Editor de Planos
          </button>
          <button
            type="button"
            onClick={() => setView('iper')}
            className={`py-1 whitespace-nowrap transition-colors border-b-2 inline-flex items-center gap-1.5 ${
              view === 'iper'
                ? 'border-emerald-600 text-emerald-800 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Matriz IPERC</span>
            <span className="font-mono text-xs px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {ipercRows.length > 0 ? `${ipercRows.length}` : `${zones.length + markers.length}`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setView('guide')}
            className={`py-1 whitespace-nowrap transition-colors border-b-2 ${
              view === 'guide'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Guía DWG y PDF
          </button>
        </nav>

        {/* Export and Save Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Format Selector: PNG | PDF | JPG */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            {(['png', 'pdf', 'jpg'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`px-2 py-1 text-[11px] font-mono font-bold uppercase rounded transition-colors ${
                  exportFormat === fmt
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title={`Descargar en formato ${fmt.toUpperCase()}`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {/* Export Risk Map */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleExportPng('risks', exportFormat)}
            title={`Descargar lámina de Mapa de Riesgos en ${exportFormat.toUpperCase()}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Descargar Riesgos ({exportFormat.toUpperCase()})</span>
          </button>

          {/* Export Evacuation Map */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleExportPng('evacuacion', exportFormat)}
            title={`Descargar lámina de Evacuación e INDECI en ${exportFormat.toUpperCase()}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Descargar Evacuación ({exportFormat.toUpperCase()})</span>
          </button>

          {/* Backup project JSON */}
          <button
            type="button"
            onClick={handleExportJson}
            title="Guardar archivo de respaldo del proyecto (.json)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 whitespace-nowrap shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Guardar Avance (.json)</span>
          </button>

          {/* Load project JSON */}
          <label
            title="Cargar archivo de proyecto previo (.json)"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 whitespace-nowrap shadow-xs cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Cargar (.json)</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJson(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </header>

      {/* Main Content Area */}
      {view === 'editor' && (
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
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
            isCollapsed={!isLeftPanelOpen}
            onToggleCollapse={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          />

          <main className="flex-1 min-w-0 h-full relative">
            <BlueprintCanvas
              blueprint={blueprint}
              zones={zones}
              markers={markers}
              routes={routes}
              viewMode={mapViewMode}
              onSetViewMode={setMapViewMode}
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

            {/* Botón flotante para reabrir el panel derecho si está oculto */}
            {!isRightPanelOpen && (
              <button
                type="button"
                onClick={() => setIsRightPanelOpen(true)}
                title="Mostrar Panel de Inspección, IA e IPERC"
                className="absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-md backdrop-blur-xs transition-all hover:scale-105"
              >
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>Abrir Panel / IA</span>
                <ChevronLeft className="w-3.5 h-3.5 ml-0.5" />
              </button>
            )}
          </main>

          {isRightPanelOpen && (
            <InspectorPanel
              activeTab={inspectorTab}
              onTabChange={setInspectorTab}
              metadata={metadata}
              onUpdateMetadata={setMetadata}
              selectedType={selectedType}
              selectedMarker={selectedMarker}
              selectedZone={selectedZone}
              selectedRoute={selectedRoute}
              onUpdateMarker={(m) =>
                setMarkers((prev) => prev.map((item) => (item.id === m.id ? m : item)))
              }
              onDeleteMarker={(id) => {
                setMarkers((prev) => prev.filter((m) => m.id !== id));
                setSelectedType(null);
                setSelectedId(null);
              }}
              onUpdateZone={(z) =>
                setZones((prev) => prev.map((item) => (item.id === z.id ? z : item)))
              }
              onDeleteZone={(id) => {
                setZones((prev) => prev.filter((z) => z.id !== id));
                setSelectedType(null);
                setSelectedId(null);
              }}
              onUpdateRoute={(r) =>
                setRoutes((prev) => prev.map((item) => (item.id === r.id ? r : item)))
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
              ipercRows={ipercRows}
              onUploadIpercExcel={handleUploadIpercExcel}
              onApplyIpercToMap={handleApplyIpercToMap}
              onExportIpercExcel={handleExportIpercExcel}
              onToggleCollapse={() => setIsRightPanelOpen(false)}
            />
          )}
        </div>
      )}

      {view === 'iper' && (
        <IperMatrixView
          zones={zones}
          markers={markers}
          ipercRows={ipercRows}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onJumpToElement={(kind, id) => {
            setView('editor');
            handleSelectElement(kind, id);
          }}
          onUploadIpercExcel={handleUploadIpercExcel}
          onExportIpercExcel={handleExportIpercExcel}
          onApplyIpercToMap={handleApplyIpercToMap}
        />
      )}

      {view === 'guide' && <DwgPdfGuideView onGoToEditor={() => setView('editor')} />}
    </div>
  );
}
