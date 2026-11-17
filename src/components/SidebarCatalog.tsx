import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Eye,
  EyeOff,
  FileCode2,
  FileUp,
  Layers,
  Search,
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
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SymbolCategory | 'all'>('all');

  const filteredSymbols = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ISO_SYMBOLS.filter((sym) => {
      const matchesCat = categoryFilter === 'all' || sym.category === categoryFilter;
      const matchesQuery =
        !q ||
        sym.name.toLowerCase().includes(q) ||
        sym.code.toLowerCase().includes(q) ||
        sym.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [search, categoryFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  return (
    <aside className="w-[280px] shrink-0 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Section 1: Blueprint Upload & Sheet Controls */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900 tracking-wide">
            Plano Base (PDF / DXF / Imagen)
          </h2>
          <button
            type="button"
            onClick={onLoadSampleBlueprint}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
          >
            Usar Ejemplo
          </button>
        </div>

        <label className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 border border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400 transition-colors cursor-pointer text-center">
          <FileUp className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-medium text-slate-800">
            {isLoadingFile ? 'Procesando plano...' : 'Cargar PDF, DXF o PNG/JPG'}
          </span>
          <span className="text-[11px] text-slate-500">
            Para DWG: guarda primero como DXF o PDF
          </span>
          <input
            type="file"
            accept=".pdf,.dxf,.png,.jpg,.jpeg,.webp,.dwg"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {dwgNotice && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Archivo .DWG detectado</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">{dwgNotice}</p>
          </div>
        )}

        {/* PDF Multi-Page Picker */}
        {blueprint.type === 'pdf' && blueprint.pdfPageCount && blueprint.pdfPageCount > 1 && (
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-slate-600">Lámina PDF:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={(blueprint.pdfCurrentPage || 1) <= 1}
                onClick={() => onChangePdfPage((blueprint.pdfCurrentPage || 1) - 1)}
                className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Ant
              </button>
              <span className="font-mono tabular-nums px-1.5 text-slate-800">
                {blueprint.pdfCurrentPage}/{blueprint.pdfPageCount}
              </span>
              <button
                type="button"
                disabled={(blueprint.pdfCurrentPage || 1) >= blueprint.pdfPageCount}
                onClick={() => onChangePdfPage((blueprint.pdfCurrentPage || 1) + 1)}
                className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Sig
              </button>
            </div>
          </div>
        )}

        {/* DXF CAD Layer Toggles */}
        {blueprint.type === 'dxf' && blueprint.dxfLayers && blueprint.dxfLayers.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Capas CAD del DXF ({blueprint.dxfLayers.length})</span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
              {blueprint.dxfLayers.map((layer: DxfLayerInfo) => (
                <button
                  key={layer.name}
                  type="button"
                  onClick={() => onToggleDxfLayer(layer.name)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] rounded hover:bg-slate-100 text-left"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {layer.visible ? (
                      <Eye className="w-3 h-3 text-blue-600 shrink-0" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                    )}
                    <span className={layer.visible ? 'text-slate-800 truncate' : 'text-slate-400 line-through truncate'}>
                      {layer.name}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-400 ml-2 shrink-0">
                    {layer.entityCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Map Layer Toggles */}
      <div className="px-4 py-3 border-b border-slate-200 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Capas de Mapa</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
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
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-left transition-colors ${
                layerVisibility[key]
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {layerVisibility[key] ? (
                <Eye className="w-3 h-3 shrink-0" />
              ) : (
                <EyeOff className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: ISO 7010 Pictogram Catalog */}
      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900">
            Pictogramas ISO 7010
          </h2>
          <span className="font-mono tabular-nums text-[11px] text-slate-500">
            {filteredSymbols.length}
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar extintor, eléctrico..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as SymbolCategory | 'all')}
          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'Todas las categorías' : SYMBOL_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredSymbols.map((sym) => {
            const isActive = toolMode === 'place-marker' && activeSymbolId === sym.id;
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => onSelectSymbol(sym.id)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-md border text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <IsoSymbolIcon symbolId={sym.id} size={26} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-900 truncate">
                    {sym.name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {sym.code} · {sym.defaultRiskCategory}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
