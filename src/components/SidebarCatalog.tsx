import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  FileUp,
  Layers,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { ISO_SYMBOLS, SYMBOL_CATEGORY_LABELS } from '../data/isoSymbols';
import { IsoSymbolIcon } from './IsoSymbolIcon';
import type {
  BlueprintSource,
  CanvasToolMode,
  DxfLayerInfo,
  SymbolCategory,
} from '../types/riskMap';

interface SidebarCatalogProps {
  blueprint: BlueprintSource;
  activeSymbolId: string;
  toolMode: CanvasToolMode;
  layerVisibility: {
    zones: boolean;
    markers: boolean;
    routes: boolean;
    grid: boolean;
  };
  onUploadFile: (file: File) => void;
  onChangePdfPage: (page: number) => void;
  onToggleDxfLayer: (layerName: string) => void;
  onLoadSampleBlueprint: () => void;
  onSelectSymbol: (symbolId: string) => void;
  onToggleOverlayLayer: (key: 'zones' | 'markers' | 'routes' | 'grid') => void;
  dwgNotice: string | null;
  isLoadingFile: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const CATEGORIES: Array<SymbolCategory | 'all'> = [
  'all',
  'advertencia',
  'obligacion',
  'prohibicion',
  'incendios',
  'evacuacion',
];

export const SidebarCatalog: React.FC<SidebarCatalogProps> = ({
  blueprint,
  activeSymbolId,
  toolMode,
  layerVisibility,
  onUploadFile,
  onChangePdfPage,
  onToggleDxfLayer,
  onLoadSampleBlueprint,
  onSelectSymbol,
  onToggleOverlayLayer,
  dwgNotice,
  isLoadingFile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SymbolCategory | 'all'>('all');
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);

  const hasBlueprint = Boolean(blueprint.dataUrl && blueprint.fileName);

  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ISO_SYMBOLS.filter((sym) => {
      const matchesCat = categoryFilter === 'all' || sym.category === categoryFilter;
      if (!matchesCat) return false;
      if (!q) return true;

      // Coincidencia directa en nombre, código, descripción o norma
      if (
        sym.name.toLowerCase().includes(q) ||
        sym.code.toLowerCase().includes(q) ||
        sym.description.toLowerCase().includes(q) ||
        (sym.standardRef && sym.standardRef.toLowerCase().includes(q))
      ) {
        return true;
      }

      // Alias inteligentes para terminología SSOMA / SST en Perú
      if (
        q.includes('extint') ||
        q.includes('pqs') ||
        q.includes('co2') ||
        q.includes('fuego') ||
        q.includes('matafuego')
      ) {
        if (sym.category === 'incendios' || sym.id.startsWith('F')) return true;
      }
      if (q.includes('sismo') || q.includes('terremoto') || q === 's') {
        if (sym.id === 'E_SISMO') return true;
      }
      if (
        q.includes('botiquin') ||
        q.includes('primeros auxilios') ||
        q.includes('salud') ||
        q.includes('medico') ||
        q.includes('curacion')
      ) {
        if (sym.id === 'E003' || sym.id === 'E_CAMILLA' || sym.id === 'E012') return true;
      }
      if (
        q.includes('electr') ||
        q.includes('tension') ||
        q.includes('voltaje') ||
        q.includes('tablero')
      ) {
        if (sym.id === 'W012' || sym.id === 'F_CO2') return true;
      }
      if (
        q.includes('salida') ||
        q.includes('escape') ||
        q.includes('puerta') ||
        q.includes('flecha')
      ) {
        if (sym.category === 'evacuacion') return true;
      }
      if (
        q.includes('epp') ||
        q.includes('casco') ||
        q.includes('lentes') ||
        q.includes('guantes') ||
        q.includes('botas') ||
        q.includes('arnes') ||
        q.includes('chaleco')
      ) {
        if (sym.category === 'obligacion') return true;
      }

      return false;
    });
  }, [search, categoryFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      setIsUploadExpanded(false);
      e.target.value = '';
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-10 shrink-0 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-3">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Expandir Catálogo de Señales"
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <div className="[writing-mode:vertical-lr] rotate-180 text-xs font-semibold text-slate-500 tracking-wider flex items-center gap-2">
          <span>CATÁLOGO SST</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[280px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Section 1: Blueprint Upload & Sheet Controls */}
      <div className="p-3 border-b border-slate-200 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900 tracking-wide">
            Plano Base (PDF / DXF)
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onLoadSampleBlueprint}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
            >
              Ejemplo
            </button>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Colapsar catálogo para ampliar plano"
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compact Card when a blueprint is loaded */}
        {hasBlueprint && !isUploadExpanded ? (
          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate" title={blueprint.fileName}>
                  {blueprint.fileName}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {blueprint.width}x{blueprint.height} px
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadExpanded(true)}
              className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Cambiar</span>
            </button>
          </div>
        ) : (
          /* Full Upload Dropzone */
          <div className="space-y-1.5">
            <label className="flex flex-col items-center justify-center gap-1 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400 transition-colors cursor-pointer text-center">
              <FileUp className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-800">
                {isLoadingFile ? 'Procesando plano...' : 'Subir PDF, DXF o PNG/JPG'}
              </span>
              <span className="text-[10px] text-slate-500">
                Para DWG: guarda como DXF o PDF
              </span>
              <input
                type="file"
                accept=".pdf,.dxf,.png,.jpg,.jpeg,.webp,.dwg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {hasBlueprint && (
              <button
                type="button"
                onClick={() => setIsUploadExpanded(false)}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-700 py-0.5"
              >
                Cancelar y mantener plano actual
              </button>
            )}
          </div>
        )}

        {dwgNotice && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-0.5">
            <div className="flex items-center gap-1 font-semibold text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Archivo .DWG detectado</span>
            </div>
            <p className="text-[10px] leading-tight text-amber-800">{dwgNotice}</p>
          </div>
        )}

        {/* PDF Multi-Page Picker */}
        {blueprint.type === 'pdf' && blueprint.pdfPageCount && blueprint.pdfPageCount > 1 && (
          <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
            <span className="text-slate-600 text-[11px]">Lámina PDF:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={(blueprint.pdfCurrentPage || 1) <= 1}
                onClick={() => onChangePdfPage((blueprint.pdfCurrentPage || 1) - 1)}
                className="px-1.5 py-0.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 text-[11px]"
              >
                Ant
              </button>
              <span className="font-mono tabular-nums px-1 text-[11px] text-slate-800">
                {blueprint.pdfCurrentPage}/{blueprint.pdfPageCount}
              </span>
              <button
                type="button"
                disabled={(blueprint.pdfCurrentPage || 1) >= blueprint.pdfPageCount}
                onClick={() => onChangePdfPage((blueprint.pdfCurrentPage || 1) + 1)}
                className="px-1.5 py-0.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 text-[11px]"
              >
                Sig
              </button>
            </div>
          </div>
        )}

        {/* DXF CAD Layer Toggles */}
        {blueprint.type === 'dxf' && blueprint.dxfLayers && blueprint.dxfLayers.length > 0 && (
          <div className="pt-0.5 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
              <FileCode2 className="w-3 h-3 text-slate-500" />
              <span>Capas CAD DXF ({blueprint.dxfLayers.length})</span>
            </div>
            <div className="max-h-24 overflow-y-auto space-y-0.5 pr-1">
              {blueprint.dxfLayers.map((layer: DxfLayerInfo) => (
                <button
                  key={layer.name}
                  type="button"
                  onClick={() => onToggleDxfLayer(layer.name)}
                  className="w-full flex items-center justify-between px-1.5 py-0.5 text-[10px] rounded hover:bg-slate-100 text-left"
                >
                  <span className="flex items-center gap-1 truncate">
                    {layer.visible ? (
                      <Eye className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                    ) : (
                      <EyeOff className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    )}
                    <span className={layer.visible ? 'text-slate-800 truncate' : 'text-slate-400 line-through truncate'}>
                      {layer.name}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-400 ml-1 shrink-0 text-[10px]">
                    {layer.entityCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Map Layer Toggles */}
      <div className="px-3 py-2 border-b border-slate-200 space-y-1.5 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Capas de Mapa</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[11px]">
          {(
            [
              ['zones', 'Zonas IPER'],
              ['markers', 'Pictogramas'],
              ['routes', 'Evacuación'],
              ['grid', 'Cuadrícula'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onToggleOverlayLayer(key)}
              className={`flex items-center gap-1 px-1.5 py-1 rounded border text-left transition-colors ${
                layerVisibility[key]
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {layerVisibility[key] ? (
                <Eye className="w-2.5 h-2.5 shrink-0" />
              ) : (
                <EyeOff className="w-2.5 h-2.5 shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: ISO 7010 & NTP Pictogram Catalog */}
      <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900">
            Señales NTP 399.010-1 / ISO
          </h2>
          <span className="font-mono tabular-nums text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {filteredSymbols.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar extintor, sismo, eléctrico..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as SymbolCategory | 'all')}
          className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Todas las categorías' : SYMBOL_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        {/* Signals list - takes remaining full height with smooth scrolling */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 min-h-[160px]">
          {filteredSymbols.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No se encontraron señales para "{search}".
            </div>
          ) : (
            filteredSymbols.map((sym) => {
              const isActive = toolMode === 'place-marker' && activeSymbolId === sym.id;
              return (
                <button
                  key={sym.id}
                  type="button"
                  onClick={() => onSelectSymbol(sym.id)}
                  className={`w-full flex items-center gap-2 p-1.5 rounded-md border text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <IsoSymbolIcon symbolId={sym.id} size={24} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {sym.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {sym.code} · {sym.defaultRiskCategory}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
