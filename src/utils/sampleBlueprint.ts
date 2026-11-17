export function createSampleIndustrialBlueprint(): {
  dataUrl: string;
  width: number;
  height: number;
} {
  const width = 1600;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // White engineering sheet
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Subtle CAD reference grid
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1;
  for (let x = 80; x < width - 80; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x, height - 80);
    ctx.stroke();
  }
  for (let y = 80; y < height - 80; y += 40) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(width - 80, y);
    ctx.stroke();
  }

  // Outer perimeter walls
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 6;
  ctx.strokeRect(100, 100, 1400, 800);

  // Interior walls
  ctx.lineWidth = 4;

  // Oficinas Administrativas (Top Left)
  ctx.strokeRect(100, 100, 380, 260);
  // Sala Tableros Eléctricos (Bottom Left)
  ctx.strokeRect(100, 620, 260, 280);
  // Almacén de Químicos e Inflamables (Top Right)
  ctx.strokeRect(1080, 100, 420, 280);
  // Zona de Soldadura y Maestranza (Top Center)
  ctx.strokeRect(480, 100, 600, 300);
  // Zona de Racks Logísticos (Bottom Right)
  ctx.strokeRect(980, 520, 520, 380);

  // Door openings (white breaks + swing arcs)
  const drawDoor = (x: number, y: number, w: number, vertical = false) => {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    if (vertical) {
      ctx.fillRect(x - 5, y, 10, w);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.arc(x, y, w, 0, Math.PI / 2);
      ctx.stroke();
    } else {
      ctx.fillRect(x, y - 5, w, 10);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + w);
      ctx.arc(x, y, w, 0, Math.PI / 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  drawDoor(260, 360, 60, false); // Oficina door
  drawDoor(360, 740, 55, true);  // Sala eléctrica door
  drawDoor(750, 400, 80, false); // Maestranza door
  drawDoor(1240, 380, 70, false); // Químicos door
  drawDoor(980, 680, 90, true);  // Almacén racks
  drawDoor(100, 470, 90, true);  // Salida de emergencia izquierda
  drawDoor(1500, 440, 80, true); // Salida de emergencia derecha

  // Machinery outlines inside Maestranza
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';
  for (let i = 0; i < 3; i++) {
    const mx = 540 + i * 170;
    ctx.fillRect(mx, 160, 120, 85);
    ctx.strokeRect(mx, 160, 120, 85);
    ctx.fillStyle = '#475569';
    ctx.font = '600 12px "IBM Plex Mono", monospace';
    ctx.fillText(`TORNO CNC-0${i + 1}`, mx + 12, 208);
    ctx.fillStyle = '#F8FAFC';
  }

  // Electrical panels inside Subestación
  ctx.fillStyle = '#F1F5F9';
  ctx.fillRect(130, 660, 65, 190);
  ctx.strokeRect(130, 660, 65, 190);

  // Warehouse racks
  for (let r = 0; r < 3; r++) {
    ctx.fillRect(1050, 570 + r * 100, 380, 55);
    ctx.strokeRect(1050, 570 + r * 100, 380, 55);
  }

  // Office desks
  ctx.fillRect(140, 150, 120, 55);
  ctx.strokeRect(140, 150, 120, 55);
  ctx.fillRect(300, 150, 120, 55);
  ctx.strokeRect(300, 150, 120, 55);

  // Corridor centerlines (dashed)
  ctx.save();
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 460);
  ctx.lineTo(1480, 460);
  ctx.stroke();
  ctx.restore();

  // Architectural Room Labels
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('OFICINAS ADMINISTRATIVAS', 140, 290);
  ctx.fillText('TALLER DE SOLDADURA Y MAESTRANZA', 580, 330);
  ctx.fillText('ALMACÉN QUÍMICOS E INFLAMABLES', 1120, 230);
  ctx.fillText('SUBESTACIÓN ELÉCTRICA', 120, 880);
  ctx.fillText('PASILLO PRINCIPAL DE CIRCULACIÓN (MONTACARGAS)', 450, 495);
  ctx.fillText('ALMACÉN DE RACKS LOGÍSTICOS', 1100, 885);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 13px "IBM Plex Mono", monospace';
  ctx.fillText('SALIDA EMERGENCIA OESTE', 120, 435);
  ctx.fillText('SALIDA EMERGENCIA ESTE', 1270, 435);
  ctx.fillText('PLANTA MODELO - NAVE A | ESCALA 1:100', 100, 82);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width,
    height,
  };
}
