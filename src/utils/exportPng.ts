import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IsoSymbolIcon } from '../components/IsoSymbolIcon';
import { getSymbolById } from '../data/isoSymbols';
import {
  classifyRiskLevel,
  computeRiskScore,
  getRiskColors,
  type BlueprintSource,
  type EvacuationRoute,
  type MapMarker,
  type PlanMetadata,
  type RiskZone,
} from '../types/riskMap';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

async function renderIsoToImage(symbolId: string, size = 64): Promise<HTMLImageElement> {
  const svgMarkup = renderToStaticMarkup(
    React.createElement(IsoSymbolIcon, { symbolId, size })
  );
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${svgMarkup.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>`;
  const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportRiskMapPng(params: {
  blueprint: BlueprintSource;
  zones: RiskZone[];
  markers: MapMarker[];
  routes: EvacuationRoute[];
  metadata: PlanMetadata;
}): Promise<void> {
  const { blueprint, zones, markers, routes, metadata } = params;
  const baseImg = await loadImage(blueprint.dataUrl);

  const mapW = Math.max(1200, Math.min(2200, blueprint.width || 1600));
  const mapH = Math.round(mapW * ((blueprint.height || 1000) / (blueprint.width || 1600)));

  const uniqueSymbolIds = Array.from(new Set(markers.map((m) => m.symbolId)));
  const legendCols = 4;
  const legendRows = Math.max(1, Math.ceil(uniqueSymbolIds.length / legendCols));
  const footerHeight = 140 + (uniqueSymbolIds.length > 0 ? legendRows * 38 + 44 : 40);
  const margin = 32;

  const totalW = mapW + margin * 2;
  const totalH = mapH + margin * 2 + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Sheet background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalW, totalH);

  // Outer sheet border
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 16, totalW - 32, totalH - 32);

  // Draw base blueprint
  ctx.drawImage(baseImg, margin, margin, mapW, mapH);

  // Blueprint frame
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.strokeRect(margin, margin, mapW, mapH);

  const toX = (nx: number) => margin + (nx / 1000) * mapW;
  const toY = (ny: number) => margin + (ny / 1000) * mapH;

  // 1. Risk Zones
  for (const zone of zones) {
    const score = computeRiskScore(zone.probability, zone.severity);
    const level = classifyRiskLevel(score);
    const colors = getRiskColors(level);
    const zx = toX(zone.x);
    const zy = toY(zone.y);
    const zw = (zone.width / 1000) * mapW;
    const zh = (zone.height / 1000) * mapH;

    ctx.fillStyle = colors.fill;
    ctx.fillRect(zx, zy, zw, zh);

    ctx.save();
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(zx, zy, zw, zh);
    ctx.restore();

    // Zone label tag
    ctx.save();
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    const text = `${zone.name} (${level} · ${score})`;
    const textW = ctx.measureText(text).width;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(zx + 6, zy + 6, textW + 14, 24);
    ctx.strokeStyle = colors.stroke;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(zx + 6, zy + 6, textW + 14, 24);
    ctx.fillStyle = '#0F172A';
    ctx.fillText(text, zx + 13, zy + 22);
    ctx.restore();
  }

  // 2. Evacuation Routes
  for (const route of routes) {
    if (route.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = '#16A34A';
    ctx.lineWidth = 5;
    ctx.setLineDash([14, 8]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toX(route.points[0].x), toY(route.points[0].y));
    for (let i = 1; i < route.points.length; i++) {
      ctx.lineTo(toX(route.points[i].x), toY(route.points[i].y));
    }
    ctx.stroke();

    // Arrowhead at final segment
    const last = route.points[route.points.length - 1];
    const prev = route.points[route.points.length - 2];
    const angle = Math.atan2(toY(last.y) - toY(prev.y), toX(last.x) - toX(prev.x));
    const headLen = 16;
    ctx.setLineDash([]);
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.moveTo(toX(last.x), toY(last.y));
    ctx.lineTo(
      toX(last.x) - headLen * Math.cos(angle - Math.PI / 6),
      toY(last.y) - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX(last.x) - headLen * Math.cos(angle + Math.PI / 6),
      toY(last.y) - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. ISO 7010 Markers
  const symbolImageCache = new Map<string, HTMLImageElement>();
  for (const symId of uniqueSymbolIds) {
    symbolImageCache.set(symId, await renderIsoToImage(symId, 72));
  }

  const markerSize = Math.max(30, Math.round(mapW * 0.024));
  for (let idx = 0; idx < markers.length; idx++) {
    const marker = markers[idx];
    const img = symbolImageCache.get(marker.symbolId);
    const mx = toX(marker.x);
    const my = toY(marker.y);

    // Subtle white halo behind symbol
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(mx, my, markerSize * 0.62, 0, Math.PI * 2);
    ctx.fill();

    if (img) {
      ctx.drawImage(img, mx - markerSize / 2, my - markerSize / 2, markerSize, markerSize);
    }

    // Index number badge
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    const tag = `${idx + 1}`;
    const tagW = Math.max(18, ctx.measureText(tag).width + 8);
    ctx.fillRect(mx + markerSize * 0.32, my - markerSize * 0.56, tagW, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(tag, mx + markerSize * 0.32 + 4, my - markerSize * 0.56 + 12);
  }

  // 4. Legend & Title Block (Cajetín Técnico)
  const footerTop = margin + mapH + 16;
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(margin, footerTop, mapW, footerHeight - 28);
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, footerTop, mapW, footerHeight - 28);

  // Title Block header row
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`MAPA DE RIESGOS — ${metadata.facilityName.toUpperCase()}`, margin + 16, footerTop + 28);

  ctx.fillStyle = '#475569';
  ctx.font = '500 12px "IBM Plex Mono", monospace';
  ctx.fillText(
    `NORMA: ${metadata.standard}  |  TIPO: ${metadata.facilityType}  |  RESPONSABLE: ${metadata.author}  |  REV: ${metadata.revision}  |  FECHA: ${metadata.date}  |  ESCALA: ${metadata.scaleText}`,
    margin + 16,
    footerTop + 50
  );

  // Risk color scale key
  const riskLegendY = footerTop + 74;
  const riskItems: Array<{ label: string; color: string }> = [
    { label: 'Riesgo Bajo (1-4)', color: '#16A34A' },
    { label: 'Riesgo Moderado (5-9)', color: '#D97706' },
    { label: 'Riesgo Alto (10-16)', color: '#EA580C' },
    { label: 'Riesgo Crítico (17-25)', color: '#DC2626' },
    { label: 'Ruta de Evacuación', color: '#16A34A' },
  ];
  let rx = margin + 16;
  ctx.font = '600 12px "DM Sans", sans-serif';
  for (const item of riskItems) {
    ctx.fillStyle = item.color;
    ctx.fillRect(rx, riskLegendY - 10, 14, 14);
    ctx.fillStyle = '#0F172A';
    ctx.fillText(item.label, rx + 20, riskLegendY + 1);
    rx += ctx.measureText(item.label).width + 44;
  }

  // ISO Symbols Legend grid
  if (uniqueSymbolIds.length > 0) {
    const symStartY = footerTop + 104;
    const colW = (mapW - 32) / legendCols;
    uniqueSymbolIds.forEach((symId, i) => {
      const def = getSymbolById(symId);
      const col = i % legendCols;
      const row = Math.floor(i / legendCols);
      const sx = margin + 16 + col * colW;
      const sy = symStartY + row * 38;
      const img = symbolImageCache.get(symId);
      if (img) {
        ctx.drawImage(img, sx, sy - 4, 26, 26);
      }
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 12px "DM Sans", sans-serif';
      ctx.fillText(`${def.code} · ${def.name}`.slice(0, 38), sx + 34, sy + 13);
    });
  }

  const link = document.createElement('a');
  const safeName = (metadata.facilityName || 'mapa_riesgos').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  link.download = `${safeName}_mapa_riesgos.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
