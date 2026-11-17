import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  Upload,
} from 'lucide-react';
import { getSymbolById } from '../data/isoSymbols';
import { IsoSymbolIcon } from './IsoSymbolIcon';
import {
  classifyRiskLevel,
  computeRiskScore,
  type IpercRow,
  type MapMarker,
  type RiskLevel,
  type RiskZone,
} from '../types/riskMap';

interface IperMatrixViewProps {
  zones: RiskZone[];
  markers: MapMarker[];
  ipercRows: IpercRow[];
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onJumpToElement: (type: 'zone' | 'marker', id: string) => void;
  onUploadIpercExcel: (file: File) => Promise<void>;
  onExportIpercExcel: () => void;
  onApplyIpercToMap: () => void;
}

export const IperMatrixView: React.FC<IperMatrixViewProps> = ({
  zones,
  markers,
  ipercRows,
  onExportJson,
  onImportJson,
  onJumpToElement,
  onUploadIpercExcel,
  onExportIpercExcel,
  onApplyIpercToMap,
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'map_elements' | 'excel_matrix'>('map_elements');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

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

  const filteredMapRows = useMemo(() => {
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

  const filteredExcelRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ipercRows.filter((row) => {
      const matchesLevel = levelFilter === 'all' || row.riskLevel === levelFilter;
      const matchesSearch =
        !q ||
        row.danger.toLowerCase().includes(q) ||
        row.risk.toLowerCase().includes(q) ||
        row.area.toLowerCase().includes(q) ||
        row.process.toLowerCase().includes(q);
      return matchesLevel && matchesSearch;
    });
  }, [ipercRows, search, levelFilter]);

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
    const sourceRows = activeSubTab === 'excel_matrix' && ipercRows.length > 0
      ? ipercRows.map((r) => ({ probability: r.probability, severity: r.severity }))
      : combinedRows;

    for (const row of sourceRows) {
      const key = `${row.probability}-${row.severity}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [combinedRows, activeSubTab, ipercRows]);

  const countsByLevel = useMemo(() => {
    const stats = { Crítico: 0, Alto: 0, Moderado: 0, Bajo: 0 };
    const sourceRows = activeSubTab === 'excel_matrix' && ipercRows.length > 0
      ? ipercRows.map((r) => ({ level: r.riskLevel }))
      : combinedRows;

    for (const row of sourceRows) {
      stats[row.level]++;
    }
    return stats;
  }, [combinedRows, activeSubTab, ipercRows]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await onUploadIpercExcel(f);
      setUploadStatus(`Archivo "${f.name}" cargado exitosamente.`);
      setActiveSubTab('excel_matrix');
    } catch (err) {
      setUploadStatus(err instanceof Error ? err.message : 'Error al cargar Excel.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header & Main Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Matriz IPERC y Registro Legal de Riesgos (R.M. 050-2013-TR)
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Evaluación y planificación preventiva según la normativa peruana de Seguridad y Salud en el Trabajo (Ley 29783).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Subir IPERC Excel (.xlsx)
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            {ipercRows.length > 0 && (
              <button
                type="button"
                onClick={onExportIpercExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Excel IPERC
              </button>
            )}
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800"
            >
              <Download className="w-3.5 h-3.5" />
              Guardar Proyecto (.json)
            </button>
          </div>
        </div>

        {uploadStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
            <span>{uploadStatus}</span>
            <button
              type="button"
              onClick={() => setUploadStatus(null)}
              className="text-emerald-900 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* View Sub-Tabs: Map Elements vs. Excel Matrix */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('map_elements')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeSubTab === 'map_elements'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Peligros en el Plano ({zones.length + markers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('excel_matrix')}
            className={`pb-2.5 px-3 border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              activeSubTab === 'excel_matrix'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Matriz Importada de Excel ({ipercRows.length})
          </button>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              ['Crítico', countsByLevel.Crítico, 'text-red-700', 'bg-red-50/50 border-red-200'],
              ['Alto', countsByLevel.Alto, 'text-orange-700', 'bg-orange-50/50 border-orange-200'],
              ['Moderado', countsByLevel.Moderado, 'text-amber-700', 'bg-amber-50/50 border-amber-200'],
              ['Bajo', countsByLevel.Bajo, 'text-emerald-700', 'bg-emerald-50/50 border-emerald-200'],
            ] as const
          ).map(([label, count, colorCls, bgCls]) => (
            <div
              key={label}
              className={`border rounded-lg px-4 py-3 flex items-baseline justify-between ${bgCls}`}
            >
              <span className="text-xs font-semibold text-slate-700">
                Riesgo {label}
              </span>
              <span className={`font-mono tabular-nums text-2xl font-bold ${colorCls}`}>
                {count}
              </span>
            </div>
          ))}
        </div>

        {/* 5x5 Matrix + ISO Legend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Matriz de Evaluación 5×5 (Probabilidad × Severidad)
              </h2>
              <span className="text-xs font-mono text-slate-500">
                {activeSubTab === 'excel_matrix' ? 'Fuente: Excel' : 'Fuente: Plano'}
              </span>
            </div>
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
                Señales Presentes en Plano
              </h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {markers.length} totales
              </span>
            </div>
            {uniqueSymbols.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Aún no has colocado señales en el plano.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {uniqueSymbols.map(({ def, count }) => (
                  <div
                    key={def.id}
                    className="py-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IsoSymbolIcon symbolId={def.id} size={24} className="shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">
                          {def.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {def.code} · {def.standardRef || 'NTP 399.010-1'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-slate-700 shrink-0">
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por área, peligro, control..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as RiskLevel | 'all')}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700"
            >
              <option value="all">Todos los niveles</option>
              <option value="Crítico">Crítico (17-25)</option>
              <option value="Alto">Alto (10-16)</option>
              <option value="Moderado">Moderado (5-9)</option>
              <option value="Bajo">Bajo (1-4)</option>
            </select>
          </div>

          {activeSubTab === 'excel_matrix' && ipercRows.length > 0 && (
            <button
              type="button"
              onClick={onApplyIpercToMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sincronizar Peligros al Plano
            </button>
          )}
        </div>

        {/* Tabular View */}
        {activeSubTab === 'map_elements' ? (
          /* Table of elements on canvas */
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="p-3">Tipo / Señal</th>
                    <th className="p-3">Área / Proceso</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3 text-center">P</th>
                    <th className="p-3 text-center">S</th>
                    <th className="p-3 text-center">Nivel (P×S)</th>
                    <th className="p-3">Medidas de Control</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMapRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500">
                        No se encontraron registros que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredMapRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {row.symbolId ? (
                              <IsoSymbolIcon symbolId={row.symbolId} size={22} className="shrink-0" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                            )}
                            <span className="font-semibold text-slate-900">{row.title}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-700">{row.zoneName}</td>
                        <td className="p-3 text-slate-600">{row.category}</td>
                        <td className="p-3 font-mono tabular-nums text-center">{row.probability}</td>
                        <td className="p-3 font-mono tabular-nums text-center">{row.severity}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              row.level === 'Crítico'
                                ? 'bg-red-100 text-red-800'
                                : row.level === 'Alto'
                                ? 'bg-orange-100 text-orange-800'
                                : row.level === 'Moderado'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.score} · {row.level}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={row.controls}>
                          {row.controls || '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onJumpToElement(row.kind, row.id)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-[11px] hover:underline"
                          >
                            Ver en plano
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Table of Excel IPERC imported rows */
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            {ipercRows.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto opacity-80" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Aún no has subido tu matriz IPERC en Excel
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Haz clic en el botón superior "Subir IPERC Excel (.xlsx)" para procesar tu matriz de riesgos y sincronizarla con el plano arquitectónico.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-3">Área / Proceso</th>
                      <th className="p-3">Peligro Identificado</th>
                      <th className="p-3">Riesgo / Daño</th>
                      <th className="p-3 text-center">P</th>
                      <th className="p-3 text-center">S</th>
                      <th className="p-3 text-center">Nivel</th>
                      <th className="p-3">Jerarquía de Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExcelRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{row.area}</div>
                          <div className="text-[10px] font-normal text-slate-500">{row.process}</div>
                        </td>
                        <td className="p-3 text-slate-800 font-medium">{row.danger}</td>
                        <td className="p-3 text-slate-600">{row.risk}</td>
                        <td className="p-3 font-mono tabular-nums text-center">{row.probability}</td>
                        <td className="p-3 font-mono tabular-nums text-center">{row.severity}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                              row.riskLevel === 'Crítico'
                                ? 'bg-red-100 text-red-800'
                                : row.riskLevel === 'Alto'
                                ? 'bg-orange-100 text-orange-800'
                                : row.riskLevel === 'Moderado'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.riskScore} · {row.riskLevel}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px] space-y-0.5 max-w-sm">
                          {row.engineeringControl && <div>⚙️ <strong>Ingeniería:</strong> {row.engineeringControl}</div>}
                          {row.administrativeControl && <div>📋 <strong>Admin:</strong> {row.administrativeControl}</div>}
                          {row.eppControl && <div>🦺 <strong>EPP:</strong> {row.eppControl}</div>}
                          {!row.engineeringControl && !row.administrativeControl && !row.eppControl && '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
