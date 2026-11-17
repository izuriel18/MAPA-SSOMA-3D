import type { DxfLayerInfo } from '../types/riskMap';

export interface DxfEntity {
  type: 'LINE' | 'LWPOLYLINE' | 'CIRCLE' | 'ARC' | 'TEXT';
  layer: string;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
  points?: Array<{ x: number; y: number }>;
  closed?: boolean;
  text?: string;
}

export interface ParsedDxf {
  entities: DxfEntity[];
  layers: DxfLayerInfo[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export function parseDxfString(content: string): ParsedDxf {
  const lines = content.split(/\r?\n/);
  const entities: DxfEntity[] = [];
  const layerCounts = new Map<string, number>();

  let inEntities = false;
  let i = 0;

  const nextPair = (): { code: number; val: string } | null => {
    if (i + 1 >= lines.length) return null;
    const code = parseInt(lines[i].trim(), 10);
    const val = lines[i + 1].trim();
    i += 2;
    return { code: Number.isNaN(code) ? -1 : code, val };
  };

  let currentEntity: Partial<DxfEntity> | null = null;
  let currentPolyPoints: Array<{ x: number; y: number }> = [];
  let pendingX: number | null = null;

  const commitEntity = () => {
    if (!currentEntity || !currentEntity.type) return;
    if (currentEntity.type === 'LWPOLYLINE') {
      if (currentPolyPoints.length >= 2) {
        currentEntity.points = currentPolyPoints;
        entities.push(currentEntity as DxfEntity);
      }
    } else if (
      currentEntity.type === 'LINE' &&
      currentEntity.x1 !== undefined &&
      currentEntity.y1 !== undefined &&
      currentEntity.x2 !== undefined &&
      currentEntity.y2 !== undefined
    ) {
      entities.push(currentEntity as DxfEntity);
    } else if (
      (currentEntity.type === 'CIRCLE' || currentEntity.type === 'ARC') &&
      currentEntity.cx !== undefined &&
      currentEntity.cy !== undefined &&
      currentEntity.r !== undefined
    ) {
      entities.push(currentEntity as DxfEntity);
    } else if (
      currentEntity.type === 'TEXT' &&
      currentEntity.cx !== undefined &&
      currentEntity.cy !== undefined &&
      currentEntity.text
    ) {
      entities.push(currentEntity as DxfEntity);
    }
    if (currentEntity.layer) {
      layerCounts.set(currentEntity.layer, (layerCounts.get(currentEntity.layer) || 0) + 1);
    }
    currentEntity = null;
    currentPolyPoints = [];
    pendingX = null;
  };

  while (true) {
    const pair = nextPair();
    if (!pair) break;
    const { code, val } = pair;

    if (code === 0 && val === 'SECTION') {
      const sec = nextPair();
      if (sec && sec.code === 2 && sec.val === 'ENTITIES') {
        inEntities = true;
      }
      continue;
    }

    if (code === 0 && val === 'ENDSEC' && inEntities) {
      commitEntity();
      inEntities = false;
      continue;
    }

    if (!inEntities) continue;

    if (code === 0) {
      commitEntity();
      if (val === 'LINE' || val === 'LWPOLYLINE' || val === 'CIRCLE' || val === 'ARC' || val === 'TEXT' || val === 'MTEXT') {
        currentEntity = {
          type: val === 'MTEXT' ? 'TEXT' : (val as DxfEntity['type']),
          layer: '0',
        };
      }
      continue;
    }

    if (!currentEntity) continue;

    if (code === 8) {
      currentEntity.layer = val || '0';
    } else if (currentEntity.type === 'LINE') {
      if (code === 10) currentEntity.x1 = parseFloat(val);
      if (code === 20) currentEntity.y1 = parseFloat(val);
      if (code === 11) currentEntity.x2 = parseFloat(val);
      if (code === 21) currentEntity.y2 = parseFloat(val);
    } else if (currentEntity.type === 'LWPOLYLINE') {
      if (code === 70) currentEntity.closed = (parseInt(val, 10) & 1) === 1;
      if (code === 10) pendingX = parseFloat(val);
      if (code === 20 && pendingX !== null) {
        currentPolyPoints.push({ x: pendingX, y: parseFloat(val) });
        pendingX = null;
      }
    } else if (currentEntity.type === 'CIRCLE' || currentEntity.type === 'ARC') {
      if (code === 10) currentEntity.cx = parseFloat(val);
      if (code === 20) currentEntity.cy = parseFloat(val);
      if (code === 40) currentEntity.r = parseFloat(val);
      if (code === 50) currentEntity.startAngle = parseFloat(val);
      if (code === 51) currentEntity.endAngle = parseFloat(val);
    } else if (currentEntity.type === 'TEXT') {
      if (code === 10) currentEntity.cx = parseFloat(val);
      if (code === 20) currentEntity.cy = parseFloat(val);
      if (code === 1) currentEntity.text = val.replace(/\\[A-Za-z][^;]*;/g, '').replace(/[{}]/g, '');
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const expand = (x?: number, y?: number) => {
    if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  for (const e of entities) {
    if (e.type === 'LINE') {
      expand(e.x1, e.y1);
      expand(e.x2, e.y2);
    } else if (e.type === 'LWPOLYLINE' && e.points) {
      for (const pt of e.points) expand(pt.x, pt.y);
    } else if ((e.type === 'CIRCLE' || e.type === 'ARC') && e.cx !== undefined && e.cy !== undefined && e.r !== undefined) {
      expand(e.cx - e.r, e.cy - e.r);
      expand(e.cx + e.r, e.cy + e.r);
    } else if (e.type === 'TEXT') {
      expand(e.cx, e.cy);
    }
  }

  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 100;
    maxY = 100;
  }

  const layers: DxfLayerInfo[] = Array.from(layerCounts.entries())
    .map(([name, entityCount]) => ({ name, visible: true, entityCount }))
    .sort((a, b) => b.entityCount - a.entityCount);

  return {
    entities,
    layers,
    bounds: { minX, minY, maxX, maxY },
  };
}

export function renderParsedDxfToDataUrl(
  parsed: ParsedDxf,
  layers: DxfLayerInfo[],
  targetWidth = 1800
): { dataUrl: string; width: number; height: number } {
  const visibleLayers = new Set(layers.filter((l) => l.visible).map((l) => l.name));
  const { minX, minY, maxX, maxY } = parsed.bounds;
  const spanX = Math.max(1e-3, maxX - minX);
  const spanY = Math.max(1e-3, maxY - minY);
  const aspect = spanY / spanX;

  const width = targetWidth;
  const height = Math.max(700, Math.min(2000, Math.round(width * aspect)));
  const pad = 48;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY);

  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const tx = (x: number) => offsetX + (x - minX) * scale;
  const ty = (y: number) => height - (offsetY + (y - minY) * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.4;
  ctx.fillStyle = '#334155';
  ctx.font = '12px "DM Sans", sans-serif';

  for (const e of parsed.entities) {
    if (!visibleLayers.has(e.layer)) continue;

    if (e.type === 'LINE' && e.x1 !== undefined && e.y1 !== undefined && e.x2 !== undefined && e.y2 !== undefined) {
      ctx.beginPath();
      ctx.moveTo(tx(e.x1), ty(e.y1));
      ctx.lineTo(tx(e.x2), ty(e.y2));
      ctx.stroke();
    } else if (e.type === 'LWPOLYLINE' && e.points && e.points.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(tx(e.points[0].x), ty(e.points[0].y));
      for (let k = 1; k < e.points.length; k++) {
        ctx.lineTo(tx(e.points[k].x), ty(e.points[k].y));
      }
      if (e.closed) ctx.closePath();
      ctx.stroke();
    } else if (e.type === 'CIRCLE' && e.cx !== undefined && e.cy !== undefined && e.r !== undefined) {
      ctx.beginPath();
      ctx.arc(tx(e.cx), ty(e.cy), Math.max(1, e.r * scale), 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.type === 'ARC' && e.cx !== undefined && e.cy !== undefined && e.r !== undefined) {
      const start = -((e.endAngle ?? 360) * Math.PI) / 180;
      const end = -((e.startAngle ?? 0) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(tx(e.cx), ty(e.cy), Math.max(1, e.r * scale), start, end);
      ctx.stroke();
    } else if (e.type === 'TEXT' && e.cx !== undefined && e.cy !== undefined && e.text) {
      ctx.fillText(e.text.slice(0, 48), tx(e.cx), ty(e.cy));
    }
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}
