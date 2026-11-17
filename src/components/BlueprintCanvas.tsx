import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  Compass,
  Eye,
  Maximize2,
  MousePointer,
  Plus,
  RotateCw,
  Route,
  ShieldAlert,
  Square,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getSymbolById } from '../data/isoSymbols';
import { IsoSymbolIcon } from './IsoSymbolIcon';
import {
  classifyRiskLevel,
  computeRiskScore,
  getRiskColors,
  type BlueprintSource,
  type CanvasToolMode,
  type EvacuationRoute,
  type MapMarker,
  type MapViewMode,
  type RiskZone,
  type RoutePoint,
} from '../types/riskMap';

interface BlueprintCanvasProps {
  blueprint: BlueprintSource;
  zones: RiskZone[];
  markers: MapMarker[];
  routes: EvacuationRoute[];
  viewMode: MapViewMode;
  onSetViewMode: (mode: MapViewMode) => void;
  toolMode: CanvasToolMode;
  activeSymbolId: string;
  selectedId: string | null;
  selectedType: 'marker' | 'zone' | 'route' | null;
  layerVisibility: {
    zones: boolean;
    markers: boolean;
    routes: boolean;
    grid: boolean;
  };
  onSetToolMode: (mode: CanvasToolMode) => void;
  onSelectElement: (type: 'marker' | 'zone' | 'route' | null, id: string | null) => void;
  onAddMarker: (x: number, y: number) => void;
  onMoveMarker: (id: string, x: number, y: number) => void;
  onAddZone: (zone: Omit<RiskZone, 'id'>) => void;
  onAddRoute: (points: RoutePoint[]) => void;
  onDeleteMarker?: (id: string) => void;
  onUpdateMarker?: (marker: MapMarker) => void;
  onDeleteZone?: (id: string) => void;
  onDeleteRoute?: (id: string) => void;
  onUpdateRoute?: (route: EvacuationRoute) => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  blueprint,
  zones,
  markers,
  routes,
  viewMode,
  onSetViewMode,
  toolMode,
  activeSymbolId,
  selectedId,
  selectedType,
  layerVisibility,
  onSetToolMode,
  onSelectElement,
  onAddMarker,
  onMoveMarker,
  onAddZone,
  onAddRoute,
  onDeleteMarker,
  onUpdateMarker,
  onDeleteZone,
  onDeleteRoute,
  onUpdateRoute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number } | null>(null);

  // Drawing Zone drag state
  const [zoneDraftStart, setZoneDraftStart] = useState<{ x: number; y: number } | null>(null);
  const [zoneDraftEnd, setZoneDraftEnd] = useState<{ x: number; y: number } | null>(null);

  // Drawing Route points state
  const [routeDraftPoints, setRouteDraftPoints] = useState<RoutePoint[]>([]);

  // Dragging existing marker
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);

  // Dragging existing route waypoint
  const [draggingRoutePoint, setDraggingRoutePoint] = useState<{
    routeId: string;
    pointIndex: number;
  } | null>(null);

  // Marker size & badge controls
  const [markerSizeChoice, setMarkerSizeChoice] = useState<'S' | 'M' | 'L'>('M');
  const [showBadges, setShowBadges] = useState(false);

  const handleRotateMarker = (m: MapMarker) => {
    if (!onUpdateMarker) return;
    const nextRot = ((m.rotation || 0) + 90) % 360;
    onUpdateMarker({ ...m, rotation: nextRot });
  };

  const isArrowSymbol = (id: string) =>
    id === 'E_RUTA_IZQ' || id === 'E_RUTA_DER' || id === 'E_RUTA_RECTA';

  const handleInvertArrow = (m: MapMarker) => {
    if (!onUpdateMarker) return;
    let nextId = m.symbolId;
    let nextLabel = m.label;
    if (m.symbolId === 'E_RUTA_IZQ') {
      nextId = 'E_RUTA_DER';
      nextLabel = 'Ruta de Evacuación (Derecha)';
    } else if (m.symbolId === 'E_RUTA_DER') {
      nextId = 'E_RUTA_IZQ';
      nextLabel = 'Ruta de Evacuación (Izquierda)';
    }
    const nextRot = ((m.rotation || 0) + 180) % 360;
    onUpdateMarker({ ...m, symbolId: nextId, label: nextLabel, rotation: nextRot });
  };

  const handleInvertRoute = (r: EvacuationRoute) => {
    if (!onUpdateRoute) return;
    onUpdateRoute({
      ...r,
      points: [...r.points].reverse(),
    });
  };

  // Keyboard Shortcuts (Delete, R to rotate, Arrow keys to nudge, Escape to deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (!selectedId || !selectedType) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedType === 'marker' && onDeleteMarker) {
          onDeleteMarker(selectedId);
        } else if (selectedType === 'zone' && onDeleteZone) {
          onDeleteZone(selectedId);
        } else if (selectedType === 'route' && onDeleteRoute) {
          onDeleteRoute(selectedId);
        }
        onSelectElement(null, null);
      } else if (e.key === 'Escape') {
        onSelectElement(null, null);
      } else if ((e.key === 'r' || e.key === 'R') && selectedType === 'marker' && onUpdateMarker) {
        e.preventDefault();
        const m = markers.find((item) => item.id === selectedId);
        if (m) {
          handleRotateMarker(m);
        }
      } else if (selectedType === 'marker' && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const m = markers.find((item) => item.id === selectedId);
        if (m) {
          const step = e.shiftKey ? 10 : 2;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          onMoveMarker(
            m.id,
            Math.max(0, Math.min(1000, m.x + dx)),
            Math.max(0, Math.min(1000, m.y + dy))
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedId,
    selectedType,
    markers,
    onDeleteMarker,
    onDeleteZone,
    onDeleteRoute,
    onUpdateMarker,
    onMoveMarker,
    onSelectElement,
  ]);

  const aspect = (blueprint.height || 1000) / (blueprint.width || 1600);
  const baseRenderWidth = 960;
  const baseRenderHeight = Math.round(baseRenderWidth * aspect);

  const isMarkerVisible = (symbolId: string) => {
    if (!layerVisibility.markers) return false;
    if (viewMode === 'all') return true;
    const def = getSymbolById(symbolId);
    if (viewMode === 'risks') {
      return def.category === 'advertencia' || def.category === 'obligacion' || def.category === 'prohibicion';
    }
    if (viewMode === 'evacuacion') {
      return def.category === 'evacuacion' || def.category === 'incendios';
    }
    return true;
  };

  const isZoneLayerVisible = layerVisibility.zones && viewMode !== 'evacuacion';
  const isRouteLayerVisible = layerVisibility.routes && viewMode !== 'risks';

  const clientToNormalized = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const el = sheetRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const x = Math.max(0, Math.min(1000, Math.round(((clientX - rect.left) / rect.width) * 1000)));
    const y = Math.max(0, Math.min(1000, Math.round(((clientY - rect.top) / rect.height) * 1000)));
    return { x, y };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || Math.abs(e.deltaY) > 0) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.12 : -0.12;
      setZoom((z) => Math.max(0.45, Math.min(3.5, Number((z + delta).toFixed(2)))));
    }
  };

  const handleViewportMouseDown = (e: React.MouseEvent) => {
    // Middle click or Alt+click or Select mode on empty space -> pan
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const pt = clientToNormalized(e.clientX, e.clientY);
    if (!pt) return;

    if (toolMode === 'place-marker' && e.button === 0) {
      onAddMarker(pt.x, pt.y);
      return;
    }

    if (toolMode === 'draw-zone' && e.button === 0) {
      setZoneDraftStart(pt);
      setZoneDraftEnd(pt);
      return;
    }

    if (toolMode === 'draw-route' && e.button === 0) {
      setRouteDraftPoints((prev) => [...prev, pt]);
      return;
    }

    if (toolMode === 'select' && e.button === 0) {
      onSelectElement(null, null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleViewportMouseMove = (e: React.MouseEvent) => {
    const pt = clientToNormalized(e.clientX, e.clientY);
    if (pt) setCursorCoords(pt);

    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (draggingRoutePoint && pt && onUpdateRoute) {
      const targetRoute = routes.find((r) => r.id === draggingRoutePoint.routeId);
      if (targetRoute) {
        const nextPoints = targetRoute.points.map((p, idx) =>
          idx === draggingRoutePoint.pointIndex ? { x: pt.x, y: pt.y } : p
        );
        onUpdateRoute({ ...targetRoute, points: nextPoints });
      }
      return;
    }

    if (draggingMarkerId && pt) {
      onMoveMarker(draggingMarkerId, pt.x, pt.y);
      return;
    }

    if (zoneDraftStart && pt) {
      setZoneDraftEnd(pt);
    }
  };

  const handleViewportMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (draggingRoutePoint) {
      setDraggingRoutePoint(null);
    }
    if (draggingMarkerId) {
      setDraggingMarkerId(null);
    }
    if (zoneDraftStart && zoneDraftEnd) {
      const x = Math.min(zoneDraftStart.x, zoneDraftEnd.x);
      const y = Math.min(zoneDraftStart.y, zoneDraftEnd.y);
      const width = Math.abs(zoneDraftEnd.x - zoneDraftStart.x);
      const height = Math.abs(zoneDraftEnd.y - zoneDraftStart.y);
      if (width >= 20 && height >= 20) {
        onAddZone({
          name: `Zona de Riesgo ${zones.length + 1}`,
          riskCategory: 'Locativo',
          x,
          y,
          width,
          height,
          probability: 3,
          severity: 3,
          controls: 'Señalización preventiva y delimitación de área.',
          source: 'manual',
        });
      }
      setZoneDraftStart(null);
      setZoneDraftEnd(null);
    }
  };

  const finishRouteDraft = () => {
    if (routeDraftPoints.length >= 2) {
      onAddRoute(routeDraftPoints);
    }
    setRouteDraftPoints([]);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-100 select-none overflow-hidden">
      {/* Canvas Floating Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-white border-b border-slate-200 z-10">
        {/* View Mode Selector (Perú Oficial: Riesgos vs. Evacuación) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onSetViewMode('risks')}
            title="Mostrar solo Peligros, Zonas IPER y EPP (Ley 29783 / R.M. 050)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'risks'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Mapa de Riesgos (SST)
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('evacuacion')}
            title="Mostrar Rutas de Evacuación, Salidas, Sismos S y Extintores (INDECI / RNE A.130)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              viewMode === 'evacuacion'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Mapa de Evacuación (INDECI)
          </button>
          <button
            type="button"
            onClick={() => onSetViewMode('all')}
            title="Mostrar todos los elementos"
            className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Completo
          </button>
        </div>

        {/* Drafting Tool Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setRouteDraftPoints([]);
              onSetToolMode('select');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              toolMode === 'select'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            Seleccionar
          </button>
          <button
            type="button"
            onClick={() => {
              setRouteDraftPoints([]);
              onSetToolMode('place-marker');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              toolMode === 'place-marker'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Pictograma
          </button>
          <button
            type="button"
            onClick={() => {
              setRouteDraftPoints([]);
              onSetToolMode('draw-zone');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              toolMode === 'draw-zone'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            Zona IPER
          </button>
          <button
            type="button"
            onClick={() => onSetToolMode('draw-route')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              toolMode === 'draw-route'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            Ruta Evacuación
          </button>
        </div>

        {/* Route Draft Controls or Active Mode Guidance */}
        <div className="flex items-center gap-3">
          {toolMode === 'draw-route' && (
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span>Puntos: {routeDraftPoints.length}</span>
              <button
                type="button"
                disabled={routeDraftPoints.length < 2}
                onClick={finishRouteDraft}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded font-medium disabled:opacity-40 whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                Finalizar Ruta
              </button>
              {routeDraftPoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRouteDraftPoints([])}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded font-medium whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              )}
            </div>
          )}

          {toolMode === 'place-marker' && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Activo:</span>
              <IsoSymbolIcon symbolId={activeSymbolId} size={20} />
              <span className="font-mono font-medium text-slate-900">{activeSymbolId}</span>
            </div>
          )}

          {/* Marker Size & Badge Controls */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-white px-1.5 py-1 text-xs">
            <span className="text-[10px] text-slate-500 font-semibold px-0.5">Señales:</span>
            {(['S', 'M', 'L'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMarkerSizeChoice(s)}
                className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors ${
                  markerSizeChoice === s
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={`Tamaño de señales: ${s === 'S' ? 'Compacto (18px)' : s === 'M' ? 'Normal (24px)' : 'Grande (32px)'}`}
              >
                {s}
              </button>
            ))}
            <span className="w-px h-3.5 bg-slate-200 mx-0.5" />
            <button
              type="button"
              onClick={() => setShowBadges(!showBadges)}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors ${
                showBadges
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={showBadges ? 'Ocultar números identificadores' : 'Mostrar números identificadores'}
            >
              # Núm
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-white px-1.5 py-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.15).toFixed(2))))}
              title="Alejar"
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums text-xs text-slate-700 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.15).toFixed(2))))}
              title="Acercar"
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Ajustar vista"
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Drafting Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleViewportMouseDown}
        onMouseMove={handleViewportMouseMove}
        onMouseUp={handleViewportMouseUp}
        onMouseLeave={handleViewportMouseUp}
        className={`relative flex-1 overflow-hidden drafting-grid flex items-center justify-center ${
          toolMode === 'place-marker' || toolMode === 'draw-zone' || toolMode === 'draw-route'
            ? 'cursor-crosshair'
            : isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
      >
        <div
          ref={sheetRef}
          style={{
            width: `${baseRenderWidth}px`,
            height: `${baseRenderHeight}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          className="relative bg-white shadow-md border border-slate-300 shrink-0 transition-transform duration-75"
        >
          {/* Base Blueprint Image */}
          <img
            src={blueprint.dataUrl}
            alt={blueprint.fileName}
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Optional Fine Technical Grid Overlay */}
          {layerVisibility.grid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(37, 99, 235, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(37, 99, 235, 0.08) 1px, transparent 1px)',
                backgroundSize: '5% 5%',
              }}
            />
          )}

          {/* SVG Vector Overlay for Risk Zones & Evacuation Routes */}
          <svg
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <defs>
              <marker
                id="evac-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#16A34A" />
              </marker>
            </defs>

            {/* Zones */}
            {isZoneLayerVisible &&
              zones.map((zone) => {
                const score = computeRiskScore(zone.probability, zone.severity);
                const level = classifyRiskLevel(score);
                const colors = getRiskColors(level);
                const isSelected = selectedType === 'zone' && selectedId === zone.id;
                return (
                  <g
                    key={zone.id}
                    className="pointer-events-auto cursor-pointer"
                    onMouseDown={(e) => {
                      if (toolMode !== 'select') return;
                      e.stopPropagation();
                      onSelectElement('zone', zone.id);
                    }}
                  >
                    <rect
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      fill={colors.fill}
                      stroke={isSelected ? '#0F172A' : colors.stroke}
                      strokeWidth={isSelected ? 4 : 2.2}
                      strokeDasharray={isSelected ? 'none' : '8 5'}
                    />
                  </g>
                );
              })}

            {/* Draft Zone while dragging */}
            {zoneDraftStart && zoneDraftEnd && (
              <rect
                x={Math.min(zoneDraftStart.x, zoneDraftEnd.x)}
                y={Math.min(zoneDraftStart.y, zoneDraftEnd.y)}
                width={Math.abs(zoneDraftEnd.x - zoneDraftStart.x)}
                height={Math.abs(zoneDraftEnd.y - zoneDraftStart.y)}
                fill="rgba(217, 119, 6, 0.18)"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
            )}

            {/* Evacuation Routes */}
            {isRouteLayerVisible &&
              routes.map((route) => {
                if (route.points.length < 2) return null;
                const ptsStr = route.points.map((p) => `${p.x},${p.y}`).join(' ');
                const isSelected = selectedType === 'route' && selectedId === route.id;
                return (
                  <g key={route.id}>
                    {/* Trazo invisible grueso para facilitar el clic o selección */}
                    <polyline
                      points={ptsStr}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={20}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-auto cursor-pointer"
                      onMouseDown={(e) => {
                        if (toolMode !== 'select') return;
                        e.stopPropagation();
                        onSelectElement('route', route.id);
                      }}
                    />
                    <polyline
                      points={ptsStr}
                      fill="none"
                      stroke={isSelected ? '#0F172A' : '#16A34A'}
                      strokeWidth={isSelected ? 6.5 : 4.5}
                      strokeDasharray={isSelected ? 'none' : '12 7'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      markerEnd="url(#evac-arrow)"
                      className="pointer-events-none"
                    />
                    {/* Vértices / Waypoints interactivos cuando está seleccionada */}
                    {isSelected &&
                      route.points.map((pt, ptIdx) => (
                        <g
                          key={`handle-${route.id}-${ptIdx}`}
                          className="pointer-events-auto cursor-grab active:cursor-grabbing"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setDraggingRoutePoint({ routeId: route.id, pointIndex: ptIdx });
                          }}
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="9"
                            fill="#FFFFFF"
                            stroke="#16A34A"
                            strokeWidth="2.5"
                            className="transition-transform hover:scale-125"
                          />
                          <text
                            x={pt.x}
                            y={pt.y + 3}
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="bold"
                            fill="#15803D"
                            className="select-none pointer-events-none"
                          >
                            {ptIdx + 1}
                          </text>
                        </g>
                      ))}
                  </g>
                );
              })}

            {/* Route Draft */}
            {routeDraftPoints.length >= 1 && (
              <>
                {routeDraftPoints.length >= 2 && (
                  <polyline
                    points={routeDraftPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="4.5"
                    strokeDasharray="8 6"
                  />
                )}
                {routeDraftPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    fill="#16A34A"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                ))}
              </>
            )}
          </svg>

          {/* Zone Labels Overlay */}
          {isZoneLayerVisible &&
            zones.map((zone) => {
              const score = computeRiskScore(zone.probability, zone.severity);
              const level = classifyRiskLevel(score);
              const colors = getRiskColors(level);
              const isSelected = selectedType === 'zone' && selectedId === zone.id;
              return (
                <button
                  key={`lbl-${zone.id}`}
                  type="button"
                  onMouseDown={(e) => {
                    if (toolMode !== 'select') return;
                    e.stopPropagation();
                    onSelectElement('zone', zone.id);
                  }}
                  style={{
                    left: `${zone.x / 10}%`,
                    top: `${zone.y / 10}%`,
                  }}
                  className={`absolute translate-x-1.5 translate-y-1.5 px-2 py-0.5 text-[11px] font-medium bg-white/95 border rounded shadow-xs whitespace-nowrap max-w-[210px] truncate transition-colors ${
                    isSelected ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-300'
                  }`}
                >
                  <span className="text-slate-900">{zone.name}</span>
                  <span className="mx-1 text-slate-400">·</span>
                  <span className={`font-mono tabular-nums ${colors.badgeText}`}>
                    {level} ({score})
                  </span>
                </button>
              );
            })}

          {/* Interactive ISO / NTP Markers */}
          {markers.filter((m) => isMarkerVisible(m.symbolId)).map((marker, idx) => {
            const isSelected = selectedType === 'marker' && selectedId === marker.id;
            const markerPx = markerSizeChoice === 'S' ? 18 : markerSizeChoice === 'M' ? 24 : 32;

            return (
              <div
                key={marker.id}
                style={{
                  left: `${marker.x / 10}%`,
                  top: `${marker.y / 10}%`,
                }}
                onMouseDown={(e) => {
                  if (toolMode !== 'select') return;
                  e.stopPropagation();
                  onSelectElement('marker', marker.id);
                  setDraggingMarkerId(marker.id);
                }}
                title={`${marker.label} (${marker.zoneName}) — [R] Girar · [Supr] Eliminar`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group ${
                  toolMode === 'select' ? 'cursor-move' : 'pointer-events-none'
                }`}
              >
                {/* Floating Quick Action Toolbar above selected marker */}
                {isSelected && (
                  <div
                    className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-1.5 py-0.5 bg-slate-900/95 backdrop-blur-xs text-white rounded-md shadow-xl border border-slate-700 pointer-events-auto whitespace-nowrap animate-in fade-in duration-100"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRotateMarker(marker);
                      }}
                      title="Girar 90° (Tecla R)"
                      className="p-1 hover:bg-slate-700 rounded transition-colors text-blue-300 hover:text-white"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    {isArrowSymbol(marker.symbolId) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInvertArrow(marker);
                        }}
                        title="Invertir dirección de la flecha"
                        className="p-1 hover:bg-slate-700 rounded transition-colors text-emerald-300 hover:text-white"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDeleteMarker && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMarker(marker.id);
                          onSelectElement(null, null);
                        }}
                        title="Eliminar señal (Tecla Supr / Delete)"
                        className="p-1 hover:bg-red-600 rounded transition-colors text-red-300 hover:text-white"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div
                  className={`relative p-0.5 rounded-full bg-white/90 shadow-xs transition-transform ${
                    isSelected
                      ? 'ring-2 ring-blue-600 scale-110 shadow-md'
                      : 'hover:scale-105'
                  }`}
                >
                  <div
                    style={{
                      transform: `rotate(${marker.rotation || 0}deg)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <IsoSymbolIcon symbolId={marker.symbolId} size={markerPx} />
                  </div>
                  {showBadges && (
                    <span className="absolute -top-1 -right-1 px-1 min-w-[14px] h-3.5 flex items-center justify-center rounded bg-slate-900 text-white font-mono tabular-nums text-[8px] font-semibold">
                      {idx + 1}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Quick Action Toolbar for Selected Route */}
        {selectedType === 'route' && selectedId && routes.some((r) => r.id === selectedId) && (() => {
          const selRoute = routes.find((r) => r.id === selectedId)!;
          if (!selRoute.points || selRoute.points.length === 0) return null;
          const midIndex = Math.floor(selRoute.points.length / 2);
          const anchorPt = selRoute.points[midIndex] || selRoute.points[0];
          return (
            <div
              style={{
                left: `${anchorPt.x / 10}%`,
                top: `${anchorPt.y / 10}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-12 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/95 text-white rounded-lg shadow-xl backdrop-blur-xs pointer-events-auto border border-slate-700"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 pr-1.5 border-r border-slate-700">
                <Route className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-300">
                  {selRoute.name || 'Ruta'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({selRoute.points.length} pts)
                </span>
              </div>

              {onUpdateRoute && (
                <button
                  type="button"
                  onClick={() => handleInvertRoute(selRoute)}
                  title="Invertir dirección de la ruta (cambiar inicio y final)"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-slate-700 rounded text-[11px] font-medium text-emerald-300 hover:text-white transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Invertir</span>
                </button>
              )}

              {onDeleteRoute && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteRoute(selRoute.id);
                    onSelectElement(null, null);
                  }}
                  title="Eliminar ruta de evacuación (Supr / Delete)"
                  className="p-1 hover:bg-red-600 rounded text-red-300 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })()}

        {/* Bottom-left Coordinate & File Info Readout */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 px-3 py-1.5 bg-white/95 border border-slate-200 rounded-md text-xs text-slate-600 shadow-xs pointer-events-none">
          <span className="font-medium text-slate-900 truncate max-w-[220px]">
            {blueprint.fileName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {blueprint.width}×{blueprint.height}px
          </span>
          {cursorCoords && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-700">
                X:{cursorCoords.x} Y:{cursorCoords.y}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
