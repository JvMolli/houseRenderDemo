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

/** Mármol oscuro con vetas cobrizas. */
export function marble(rnd: Rng) {
  const N = 1024, c = cv(N, N), x = ctx(c);
  x.fillStyle = '#2b2522'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 300; i++) {
    x.fillStyle = 'rgba(' + (70 + rnd() * 30 | 0) + ',' + (58 + rnd() * 20 | 0) + ',50,0.07)';
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
    x.strokeStyle = 'rgba(' + (195 + rnd() * 40 | 0) + ',' + (135 + rnd() * 30 | 0) + ',75,' + a + ')';
    x.lineWidth = lw; x.stroke();
  };
  for (let i = 0; i < 10; i++) vein(1.5 + rnd() * 2, 0.55);
  for (let i = 0; i < 30; i++) vein(0.7, 0.3);
  return c;
}

/** Gres del baño. */
export function tile(rnd: Rng) {
  const c = noise(rnd, 222, 219, 213, 8, 256), x = ctx(c);
  x.strokeStyle = '#b8b3ab'; x.lineWidth = 4; x.strokeRect(0, 0, 256, 256);
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

/** Puerta seccional del garaje. */
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
 * Porcelánico blanco roto: 4 x 4 baldosas por canvas, con un ligero cambio de
 * tono entre piezas, moteado fino y junta de 2 px. Cada baldosa ocupa T px.
 */
export const PORCELAIN_TILES = 4;
export function porcelain(rnd: Rng) {
  const T = 256, N = T * PORCELAIN_TILES, c = cv(N, N), x = ctx(c);
  for (let i = 0; i < PORCELAIN_TILES; i++) for (let j = 0; j < PORCELAIN_TILES; j++) {
    const v = (rnd() - 0.5) * 6;
    x.fillStyle = 'rgb(' + (238 + v | 0) + ',' + (233 + v | 0) + ',' + (224 + v | 0) + ')';
    x.fillRect(i * T, j * T, T, T);
  }
  for (let k = 0; k < 9000; k++) {
    const g = 200 + rnd() * 40 | 0;
    x.fillStyle = 'rgba(' + g + ',' + (g - 4) + ',' + (g - 12) + ',0.18)';
    x.fillRect(rnd() * N, rnd() * N, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  x.fillStyle = '#cdc6b9';
  for (let k = 0; k < PORCELAIN_TILES; k++) { x.fillRect(k * T, 0, 2, N); x.fillRect(0, k * T, N, 2); }
  return c;
}
