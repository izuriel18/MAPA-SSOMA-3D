import React, { useMemo, useState } from 'react';
import { Download, Search, Upload } from 'lucide-react';
import { getSymbolById } from '../data/isoSymbols';
import { IsoSymbolIcon } from './IsoSymbolIcon';
import {
  classifyRiskLevel,
  computeRiskScore,
  getRiskColors,
  type MapMarker,
  type RiskLevel,
  type RiskZone,
} from '../types/riskMap';

interface IperMatrixViewProps {
  zones: RiskZone[];
  markers: MapMarker[];
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onJumpToElement: (type: 'zone' | 'marker', id: string) => void;
}

export const IperMatrixView: React.FC<IperMatrixViewProps> = ({
  zones,
  markers,
  onExportJson,
  onImportJson,
  onJumpToElement,
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');

  const combinedRows = useMemo(() => {
    const zoneRows = zones.map((z) => ({
      id: z.id,
      kind: 'zone' as const,
      kindLabel: 'Zona',
      title: z.name,
      zoneName: z.name,
      category: z.riskCategory,
      probability: z.probability,
      severity: z.severity,
      score: computeRiskScore(z.probability, z.severity),
      level: classifyRiskLevel(computeRiskScore(z.probability, z.severity)),
      controls: z.controls,
      symbolId: null as string | null,
    }));

    const markerRows = markers.map((m) => ({
      id: m.id,
      kind: 'marker' as const,
      kindLabel: getSymbolById(m.symbolId).code,
      title: m.label,
      zoneName: m.zoneName,
      category: m.riskCategory,
      probability: m.probability,
      severity: m.severity,
      score: computeRiskScore(m.probability, m.severity),
      level: classifyRiskLevel(computeRiskScore(m.probability, m.severity)),
      controls: m.notes,
      symbolId: m.symbolId,
    }));

    return [...zoneRows, ...markerRows].sort((a, b) => b.score - a.score);
  }, [zones, markers]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return combinedRows.filter((row) => {
      const matchesLevel = levelFilter === 'all' || row.level === levelFilter;
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.zoneName.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.controls.toLowerCase().includes(q);
      return matchesLevel && matchesSearch;
    });
  }, [combinedRows, search, levelFilter]);

  const uniqueSymbols = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of markers) {
      map.set(m.symbolId, (map.get(m.symbolId) || 0) + 1);
    }
    return Array.from(map.entries()).map(([id, count]) => ({
      def: getSymbolById(id),
      count,
    }));
  }, [markers]);

  // Count items per cell in 5x5 matrix (P: 5 down to 1, S: 1 to 5)
  const matrixCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of combinedRows) {
      const key = `${row.probability}-${row.severity}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [combinedRows]);

  const countsByLevel = useMemo(() => {
    const stats = { Crítico: 0, Alto: 0, Moderado: 0, Bajo: 0 };
    for (const row of combinedRows) {
      stats[row.level]++;
    }
    return stats;
  }, [combinedRows]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header & Project JSON Backup Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Matriz IPER y Registro de Riesgos
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Consolidado automático de zonas evaluadas y pictogramas ISO 7010 ubicados en el plano.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              Importar Proyecto (.json)
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportJson(f);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Guardar Proyecto (.json)
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              ['Crítico', countsByLevel.Crítico, 'text-red-700'],
              ['Alto', countsByLevel.Alto, 'text-orange-700'],
              ['Moderado', countsByLevel.Moderado, 'text-amber-700'],
              ['Bajo', countsByLevel.Bajo, 'text-emerald-700'],
            ] as const
          ).map(([label, count, colorCls]) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-baseline justify-between"
            >
              <span className="text-xs font-medium text-slate-600">
                Nivel {label}
              </span>
              <span className={`font-mono tabular-nums text-2xl font-bold ${colorCls}`}>
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* 5x5 IPER Matrix + ISO Symbol Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Matriz de Evaluación 5×5 (Probabilidad × Severidad)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-slate-500 font-medium border border-slate-200 bg-slate-50">
                      P \ S
                    </th>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <th
                        key={s}
                        className="p-2 text-center font-mono text-slate-700 border border-slate-200 bg-slate-50"
                      >
                        S{s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[5, 4, 3, 2, 1].map((p) => (
                    <tr key={p}>
                      <td className="p-2 font-mono font-semibold text-slate-700 border border-slate-200 bg-slate-50">
                        P{p}
                      </td>
                      {[1, 2, 3, 4, 5].map((s) => {
                        const score = p * s;
                        const level = classifyRiskLevel(score);
                        const count = matrixCounts.get(`${p}-${s}`) || 0;
                        const cellBg =
                          level === 'Crítico'
                            ? 'bg-red-50 text-red-900'
                            : level === 'Alto'
                            ? 'bg-orange-50 text-orange-900'
                            : level === 'Moderado'
                            ? 'bg-amber-50 text-amber-900'
                            : 'bg-emerald-50 text-emerald-900';
                        return (
                          <td
                            key={s}
                            className={`p-2 border border-slate-200 text-center ${cellBg}`}
                          >
                            <div className="font-mono tabular-nums text-[11px] opacity-70">
                              {score}
                            </div>
                            <div className="font-mono tabular-nums text-sm font-bold">
                              {count > 0 ? count : '—'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ISO Legend Summary */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Leyenda de Pictogramas en Plano
              </h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {markers.length} totales
              </span>
            </div>
            {uniqueSymbols.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Aún no has colocado pictogramas en el plano. Usa el catálogo izquierdo o el análisis con IA.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {uniqueSymbols.map(({ def, count }) => (
                  <div
                    key={def.id}
                    className="py-2 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IsoSymbolIcon symbolId={def.id} size={24} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">
                          {def.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {def.code}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 shrink-0">
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk Register Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Registro Detallado de Riesgos y Controles
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar zona, peligro o control..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md w-56 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                {(['all', 'Crítico', 'Alto', 'Moderado', 'Bajo'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                      levelFilter === lvl
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl === 'all' ? 'Todos' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No hay elementos que coincidan con el filtro actual. Agrega zonas o pictogramas en el Editor de Plano.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Elemento</th>
                    <th className="py-2.5 px-4">Zona</th>
                    <th className="py-2.5 px-4">Categoría</th>
                    <th className="py-2.5 px-3 text-right">P</th>
                    <th className="py-2.5 px-3 text-right">S</th>
                    <th className="py-2.5 px-3 text-right">IPER</th>
                    <th className="py-2.5 px-4">Nivel</th>
                    <th className="py-2.5 px-4">Controles / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRows.map((row) => {
                    const colors = getRiskColors(row.level);
                    return (
                      <tr
                        key={`${row.kind}-${row.id}`}
                        onClick={() => onJumpToElement(row.kind, row.id)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            {row.symbolId && (
                              <IsoSymbolIcon symbolId={row.symbolId} size={20} className="shrink-0" />
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{row.title}</div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {row.kindLabel}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{row.zoneName}</td>
                        <td className="py-2.5 px-4 text-slate-700">{row.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {row.probability}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                          {row.severity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                          {row.score}
                        </td>
                        <td className={`py-2.5 px-4 font-semibold ${colors.badgeText}`}>
                          {row.level}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                          {row.controls || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
