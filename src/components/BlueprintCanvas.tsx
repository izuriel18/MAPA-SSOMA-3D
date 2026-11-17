import React, { useRef, useState } from 'react';
import {
  Check,
  Compass,
  Eye,
  Maximize2,
  MousePointer,
  Plus,
  Route,
  ShieldAlert,
  Square,
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
                  <polyline
                    key={route.id}
                    points={ptsStr}
                    fill="none"
                    stroke={isSelected ? '#0F172A' : '#16A34A'}
                    strokeWidth={isSelected ? 7 : 5}
                    strokeDasharray="12 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    markerEnd="url(#evac-arrow)"
                    className="pointer-events-auto cursor-pointer"
                    onMouseDown={(e) => {
                      if (toolMode !== 'select') return;
                      e.stopPropagation();
                      onSelectElement('route', route.id);
                    }}
                  />
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
                title={`${marker.label} (${marker.zoneName})`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group ${
                  toolMode === 'select' ? 'cursor-move' : 'pointer-events-none'
                }`}
              >
                <div
                  className={`relative p-0.5 rounded-full bg-white/90 shadow-sm transition-transform ${
                    isSelected
                      ? 'ring-2 ring-blue-600 scale-115'
                      : 'hover:scale-110'
                  }`}
                >
                  <IsoSymbolIcon symbolId={marker.symbolId} size={28} />
                  <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[16px] h-4 flex items-center justify-center rounded bg-slate-900 text-white font-mono tabular-nums text-[9px] font-semibold">
                    {idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

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
