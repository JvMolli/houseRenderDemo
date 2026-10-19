/**
 * Texturas procedurales en canvas (sin imágenes externas).
 * Solo se llaman en cliente: nada toca `document` a nivel de módulo.
 * El azar sale de un PRNG con semilla para que las texturas sean siempre iguales.
 */

export type Rng = () => number;

/** PRNG mulberry32: misma semilla, misma secuencia. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cv(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function ctx(c: HTMLCanvasElement) {
  const x = c.getContext('2d');
  if (!x) throw new Error('Canvas 2D no disponible');
  return x;
}

export function noise(rnd: Rng, r: number, g: number, b: number, amp: number, N = 128) {
  const c = cv(N, N), x = ctx(c), d = x.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const n = (rnd() - 0.5) * amp;
    d.data[i * 4] = r + n; d.data[i * 4 + 1] = g + n; d.data[i * 4 + 2] = b + n; d.data[i * 4 + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c;
}

export function wood(rnd: Rng) {
  const N = 512, c = cv(N, N), x = ctx(c);
  x.fillStyle = '#d6b283'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 160; i++) {
    const xx = rnd() * N;
    x.strokeStyle = 'rgba(150,100,55,' + (0.05 + rnd() * 0.12) + ')'; x.lineWidth = 0.5 + rnd() * 2.5;
    x.beginPath(); x.moveTo(xx, 0);
    x.bezierCurveTo(xx + rnd() * 16 - 8, N / 3, xx + rnd() * 16 - 8, 2 * N / 3, xx + rnd() * 10 - 5, N);
    x.stroke();
  }
  return c;
}

/** Colores de un mármol: fondo, y manchas y vetas como [r, variación de r, g, variación de g, b]. */
export interface MarbleLook {
  base: string;
  blotch: readonly [number, number, number, number, number];
  vein: readonly [number, number, number, number, number];
}
/** Mármol oscuro con vetas cobrizas (la encimera de la casa). */
export const DARK_MARBLE: MarbleLook = { base: '#2b2522', blotch: [70, 30, 58, 20, 50], vein: [195, 40, 135, 30, 75] };
/** Mármol blanco con vetas grises. */
export const WHITE_MARBLE: MarbleLook = { base: '#ebe7e1', blotch: [200, 25, 196, 25, 192], vein: [118, 40, 116, 38, 114] };

export function marble(rnd: Rng, look: MarbleLook = DARK_MARBLE) {
  const N = 1024, c = cv(N, N), x = ctx(c), [br, bdr, bg, bdg, bb] = look.blotch, [vr, vdr, vg, vdg, vb] = look.vein;
  x.fillStyle = look.base; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 300; i++) {
    x.fillStyle = 'rgba(' + (br + rnd() * bdr | 0) + ',' + (bg + rnd() * bdg | 0) + ',' + bb + ',0.07)';
    x.beginPath(); x.arc(rnd() * N, rnd() * N, 20 + rnd() * 90, 0, 7); x.fill();
  }
  const vein = (lw: number, a: number) => {
    let px = rnd() * N, py = rnd() * N;
    x.beginPath(); x.moveTo(px, py);
    for (let j = 0; j < 8; j++) {
      const nx = px + rnd() * 180 - 40, ny = py + rnd() * 160 - 80;
      x.quadraticCurveTo(px + rnd() * 60 - 30, py + rnd() * 60 - 30, nx, ny);
      px = nx; py = ny;
    }
    x.strokeStyle = 'rgba(' + (vr + rnd() * vdr | 0) + ',' + (vg + rnd() * vdg | 0) + ',' + vb + ',' + a + ')';
    x.lineWidth = lw; x.stroke();
  };
  for (let i = 0; i < 10; i++) vein(1.5 + rnd() * 2, 0.55);
  for (let i = 0; i < 30; i++) vein(0.7, 0.3);
  return c;
}

export function rug(rnd: Rng) {
  const c = noise(rnd, 214, 205, 191, 18, 256), x = ctx(c);
  x.strokeStyle = 'rgba(150,135,115,0.6)'; x.lineWidth = 6; x.strokeRect(14, 14, 228, 228);
  x.lineWidth = 2; x.strokeRect(26, 26, 204, 204);
  return c;
}

/** Imagen de la pantalla de la TV. */
export function screen() {
  const c = cv(512, 256), x = ctx(c);
  let g = x.createLinearGradient(0, 0, 0, 150);
  g.addColorStop(0, '#3b6db3'); g.addColorStop(0.6, '#e7a46a'); g.addColorStop(1, '#f6c27a');
  x.fillStyle = g; x.fillRect(0, 0, 512, 150);
  x.fillStyle = '#f8d27e'; x.beginPath(); x.arc(370, 140, 16, 0, 7); x.fill();
  g = x.createLinearGradient(0, 150, 0, 256); g.addColorStop(0, '#3d78a8'); g.addColorStop(1, '#1d3d5c');
  x.fillStyle = g; x.fillRect(0, 150, 512, 106);
  x.fillStyle = '#2c3a3a'; x.beginPath(); x.moveTo(0, 256); x.lineTo(0, 120); x.lineTo(80, 110); x.lineTo(170, 160); x.lineTo(230, 256); x.fill();
  x.fillStyle = '#4a4f63'; x.beginPath(); x.moveTo(400, 150); x.lineTo(460, 128); x.lineTo(512, 140); x.lineTo(512, 160); x.fill();
  return c;
}

/** Halo del ambilight. */
export function ambilight() {
  const c = cv(512, 256), x = ctx(c);
  const d = (col: string, a: number, b: number, w: number, h: number) => {
    x.shadowColor = col; x.shadowBlur = 60; x.fillStyle = col; x.fillRect(a, b, w, h);
  };
  for (let r = 0; r < 2; r++) {
    d('rgba(70,160,255,0.85)', 132, 72, 128, 112);
    d('rgba(255,150,70,0.85)', 252, 72, 128, 112);
    d('rgba(200,120,255,0.6)', 200, 70, 112, 40);
  }
  return c;
}

export function compass() {
  const c = cv(256, 256), x = ctx(c);
  x.strokeStyle = 'rgba(60,60,60,0.7)'; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 96, 0, 7); x.stroke();
  x.fillStyle = '#c0392b'; x.beginPath(); x.moveTo(128, 44); x.lineTo(112, 128); x.lineTo(144, 128); x.fill();
  x.fillStyle = '#666'; x.beginPath(); x.moveTo(128, 212); x.lineTo(112, 128); x.lineTo(144, 128); x.fill();
  x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#c0392b'; x.fillText('N', 128, 16);
  x.fillStyle = '#333'; x.fillText('S', 128, 242); x.fillText('E', 240, 128); x.fillText('O', 16, 128);
  return c;
}

/** Puerta seccional de la planta baja. */
export function garageDoor(rnd: Rng) {
  const c = cv(256, 256), x = ctx(c);
  x.fillStyle = '#3a3c3f'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5; i++) {
    const y = i * 51;
    x.fillStyle = '#24262a'; x.fillRect(0, y, 256, 4);
    x.fillStyle = '#4c4f53'; x.fillRect(0, y + 4, 256, 2);
  }
  for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(90,94,98,0.15)'; x.fillRect(0, rnd() * 256, 256, 1); }
  return c;
}

/**
 * Porcelánico beige claro (como en la foto del salón): 4 x 4 baldosas por
 * canvas, con un ligero cambio de tono entre piezas, moteado fino y junta de
 * 2 px. Cada baldosa ocupa T px.
 */
export const PORCELAIN_TILES = 4;
export function porcelain(rnd: Rng) {
  const T = 256, N = T * PORCELAIN_TILES, c = cv(N, N), x = ctx(c);
  for (let i = 0; i < PORCELAIN_TILES; i++) for (let j = 0; j < PORCELAIN_TILES; j++) {
    const v = (rnd() - 0.5) * 6;
    x.fillStyle = 'rgb(' + (230 + v | 0) + ',' + (213 + v | 0) + ',' + (189 + v | 0) + ')';
    x.fillRect(i * T, j * T, T, T);
  }
  for (let k = 0; k < 9000; k++) {
    const g = 200 + rnd() * 40 | 0;
    x.fillStyle = 'rgba(' + g + ',' + (g - 12) + ',' + (g - 30) + ',0.18)';
    x.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  x.fillStyle = '#c6b59c';
  for (let k = 0; k < PORCELAIN_TILES; k++) { x.fillRect(k * T, 0, 2, N); x.fillRect(0, k * T, N, 2); }
  return c;
}

/**
 * Césped artificial: verde vivo y uniforme, fibras finas y dos franjas de
 * rollo por canvas con un tono apenas distinto.
 */
export function grass(rnd: Rng) {
  const N = 256, c = noise(rnd, 88, 148, 60, 12, N), x = ctx(c);
  x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(0, 0, N / 2, N);
  x.lineWidth = 1;
  for (let i = 0; i < 2600; i++) {
    const g = rnd(), px = rnd() * N, py = rnd() * N;
    x.strokeStyle = 'rgba(' + (70 + g * 40 | 0) + ',' + (130 + g * 50 | 0) + ',' + (45 + g * 25 | 0) + ',0.3)';
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 1.5, py - 1.5 - rnd() * 2.5); x.stroke();
  }
  return c;
}

/** Pavimento de n x n piezas por canvas, con ligera variación de tono, moteado y junta de 2 px. */
export function pavers(rnd: Rng, [r, g, b]: readonly [number, number, number], grout: string, n: number, N = 512) {
  const T = N / n, c = cv(N, N), x = ctx(c);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = (rnd() - 0.5) * 10;
    x.fillStyle = 'rgb(' + (r + v | 0) + ',' + (g + v | 0) + ',' + (b + v | 0) + ')';
    x.fillRect(i * T, j * T, T, T);
  }
  for (let k = 0; k < 3000; k++) {
    x.fillStyle = 'rgba(0,0,0,' + (0.03 + rnd() * 0.05) + ')';
    x.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  x.fillStyle = grout;
  for (let k = 0; k < n; k++) { x.fillRect(k * T, 0, 2, N); x.fillRect(0, k * T, N, 2); }
  return c;
}

/** Granito gris: moteado fino negro, blanco y gris sobre gris medio. */
export function granite(rnd: Rng) {
  const N = 1024, c = noise(rnd, 138, 136, 132, 16, N), x = ctx(c);
  for (let k = 0; k < 60000; k++) {
    const t = rnd(), g = (t < 0.4 ? 45 + rnd() * 30 : t < 0.75 ? 205 + rnd() * 40 : 105 + rnd() * 40) | 0;
    x.fillStyle = 'rgba(' + g + ',' + g + ',' + (g * 0.97 | 0) + ',0.8)';
    x.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
  }
  return c;
}

/** Asfalto de calle: gris con árido claro y oscuro y manchas de desgaste que encajan al repetirse. */
export function asphalt(rnd: Rng) {
  const N = 512, c = noise(rnd, 96, 96, 94, 16, N), x = ctx(c);
  for (let i = 0; i < 14; i++) {
    const px = rnd() * N, py = rnd() * N, r = 30 + rnd() * 90;
    x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) { x.beginPath(); x.arc(px + ox, py + oy, r, 0, 7); x.fill(); }
  }
  for (let k = 0; k < 7000; k++) {
    const g = rnd() < 0.5 ? 150 + rnd() * 60 | 0 : 40 + rnd() * 30 | 0;
    x.fillStyle = 'rgba(' + g + ',' + g + ',' + g + ',0.5)';
    x.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
  }
  return c;
}

/** Rayado a 45° que encaja al repetirse (barra rayada del boceto), sobre fondo transparente. */
export function hatch() {
  const N = 64, c = cv(N, N), x = ctx(c);
  x.strokeStyle = '#2b2a28'; x.lineWidth = 6;
  for (const o of [-N, 0, N]) { x.beginPath(); x.moveTo(o, N); x.lineTo(o + N, 0); x.stroke(); }
  return c;
}

/**
 * Mapa de normales a partir de un canvas: la luminancia hace de altura (lo
 * oscuro queda hundido: juntas, vetas). Repite en los bordes, como las texturas.
 */
export function normalMap(src: HTMLCanvasElement, strength = 2) {
  const w = src.width, h = src.height, s = ctx(src).getImageData(0, 0, w, h).data;
  const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (0.299 * s[i * 4] + 0.587 * s[i * 4 + 1] + 0.114 * s[i * 4 + 2]) / 255;
  const c = cv(w, h), x = ctx(c), d = x.createImageData(w, h);
  const at = (px: number, py: number) => L[((py + h) % h) * w + ((px + w) % w)];
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const dx = (at(px + 1, py) - at(px - 1, py)) * strength, dy = (at(px, py + 1) - at(px, py - 1)) * strength;
    const len = Math.hypot(dx, dy, 1), i = (py * w + px) * 4;
    d.data[i] = (-dx / len * 0.5 + 0.5) * 255;
    d.data[i + 1] = (dy / len * 0.5 + 0.5) * 255; // el canvas crece hacia abajo; la textura, hacia arriba
    d.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c;
}

/** Ruido suave que encaja al repetirse (suma de senos), base de las ondas del agua. */
export function ripples(rnd: Rng, N = 256) {
  const c = cv(N, N), x = ctx(c), d = x.createImageData(N, N);
  const waves = Array.from({ length: 9 }, () => ({
    kx: (1 + Math.floor(rnd() * 5)) * (rnd() < 0.5 ? -1 : 1), ky: 1 + Math.floor(rnd() * 5), p: rnd() * 6.283, a: 0.5 + rnd(),
  }));
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    let v = 0;
    for (const w of waves) v += w.a * Math.sin(6.283 * (w.kx * px + w.ky * py) / N + w.p);
    const g = 128 + v * 14, i = (py * N + px) * 4;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = g; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c;
}

/** Campo seco de los alrededores: tierra y hierba agostada con manchas. */
export function field(rnd: Rng) {
  const N = 512, c = noise(rnd, 158, 150, 126, 18, N), x = ctx(c);
  for (let i = 0; i < 260; i++) {
    const g = rnd(), r = 8 + rnd() * 46;
    x.fillStyle = g < 0.45
      ? 'rgba(' + (122 + rnd() * 24 | 0) + ',' + (126 + rnd() * 20 | 0) + ',' + (96 + rnd() * 16 | 0) + ',0.14)'
      : 'rgba(' + (176 + rnd() * 24 | 0) + ',' + (164 + rnd() * 20 | 0) + ',' + (138 + rnd() * 16 | 0) + ',0.14)';
    x.beginPath(); x.arc(rnd() * N, rnd() * N, r, 0, 7); x.fill();
  }
  x.lineWidth = 1;
  for (let i = 0; i < 2600; i++) {
    const px = rnd() * N, py = rnd() * N, g = rnd();
    x.strokeStyle = 'rgba(' + (160 + g * 40 | 0) + ',' + (150 + g * 34 | 0) + ',' + (112 + g * 20 | 0) + ',0.3)';
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 3, py - 2 - rnd() * 4); x.stroke();
  }
  return c;
}

/**
 * Pizarra oscura texturizada (baño): baldosas de 0,6 x 1,2 m con juntas
 * finas, moteado en relieve y alguna veta clara. El canvas cubre 1,2 x 1,2 m.
 */
export function slate(rnd: Rng) {
  const N = 512, c = noise(rnd, 72, 73, 75, 14, N), x = ctx(c);
  for (let i = 0; i < 900; i++) {
    const g = rnd() < 0.5 ? 40 : 110;
    x.fillStyle = 'rgba(' + g + ',' + (g - 2) + ',' + (g - 6) + ',' + (0.05 + rnd() * 0.07) + ')';
    x.beginPath(); x.ellipse(rnd() * N, rnd() * N, 3 + rnd() * 16, 2 + rnd() * 8, rnd() * 3.14, 0, 7); x.fill();
  }
  for (let i = 0; i < 7; i++) {
    let px = rnd() * N, py = rnd() * N;
    x.beginPath(); x.moveTo(px, py);
    for (let j = 0; j < 6; j++) { px += rnd() * 90 - 45; py += rnd() * 60 + 10; x.lineTo(px, py); }
    x.strokeStyle = 'rgba(190,176,152,' + (0.08 + rnd() * 0.1) + ')'; x.lineWidth = 0.6 + rnd(); x.stroke();
  }
  x.fillStyle = 'rgba(30,29,27,0.9)';
  x.fillRect(0, 0, 2, N); x.fillRect(N / 2, 0, 2, N); x.fillRect(0, 0, N, 2);
  return c;
}

/** Tarima de roble (baño): tablas de 0,2 m a lo largo de u, con veta y nudos. El canvas cubre 1,2 x 1,2 m. */
export function oakPlanks(rnd: Rng) {
  const N = 512, rows = 6, H = N / rows, c = cv(N, N), x = ctx(c);
  for (let r = 0; r < rows; r++) {
    const joint = rnd() * N, y = r * H;
    for (const [x0, x1] of [[0, joint], [joint, N]]) {
      const v = (rnd() - 0.5) * 18;
      x.fillStyle = 'rgb(' + (160 + v | 0) + ',' + (116 + v | 0) + ',' + (76 + v | 0) + ')';
      x.fillRect(x0, y, x1 - x0, H);
      for (let k = 0; k < 14; k++) {
        const gy = y + rnd() * H;
        x.strokeStyle = 'rgba(96,62,34,' + (0.08 + rnd() * 0.12) + ')'; x.lineWidth = 0.6 + rnd() * 1.4;
        x.beginPath(); x.moveTo(x0, gy);
        x.bezierCurveTo(x0 + (x1 - x0) * 0.3, gy + rnd() * 6 - 3, x0 + (x1 - x0) * 0.7, gy + rnd() * 6 - 3, x1, gy + rnd() * 4 - 2);
        x.stroke();
      }
      if (rnd() < 0.4) {
        x.fillStyle = 'rgba(90,58,32,0.45)';
        x.beginPath(); x.ellipse(x0 + rnd() * (x1 - x0), y + H / 2, 6 + rnd() * 5, 3 + rnd() * 2, 0, 0, 7); x.fill();
      }
    }
    x.fillStyle = 'rgba(60,40,24,0.7)';
    x.fillRect(0, y, N, 1.5); x.fillRect(joint, y, 1.5, H);
  }
  return c;
}

/** Piedra gris de los lavabos sobre encimera. */
export function greyStone(rnd: Rng) {
  const c = noise(rnd, 128, 126, 120, 34, 256), x = ctx(c);
  for (let i = 0; i < 160; i++) {
    x.fillStyle = 'rgba(' + (rnd() < 0.5 ? '70,68,64' : '190,186,178') + ',0.12)';
    x.beginPath(); x.arc(rnd() * 256, rnd() * 256, 2 + rnd() * 10, 0, 7); x.fill();
  }
  return c;
}
