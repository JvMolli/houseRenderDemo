/**
 * Descarga y prepara las texturas PBR del modo videojuego en public/texturas/.
 * Fuentes CC0: Poly Haven (ph) y ambientCG (acg). Uso: node scripts/texturas.mjs
 *
 * Cada carpeta lleva color.webp (sRGB), normal.webp (OpenGL) y arm.webp
 * (R oclusión, G rugosidad, B metal: el orden que usa three). Con `gray` el
 * color pasa a gris con media lineal 0,5: el material lo tiñe con su color ×2.
 * Con nombres como argumentos solo se rehacen esas carpetas.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const TEXTURES = {
  roble: { ph: 'oak_veneer_01' },
  tarima: { ph: 'laminate_floor_02' },
  cesped: { acg: 'Grass005' },
  terraza: { ph: 'granite_tile_04', gray: true },
  adoquin: { ph: 'concrete_pavers_02', gray: true },
  campo: { ph: 'withered_grass', gray: true },
  gresite: { ph: 'rounded_square_tiled_wall', gray: true },
  estuco: { ph: 'white_stucco', gray: true },
  espiga: { ph: 'poly_wool_herringbone', gray: true, size: 512 },
  punto: { ph: 'cotton_jersey', gray: true, size: 512 },
  lino: { ph: 'rough_linen', gray: true, size: 512 },
  manta: { ph: 'knitted_fleece', gray: true, size: 512 },
  alfombra: { acg: 'Carpet016', gray: true, size: 512 },
  acero: { acg: 'Metal009' },
  asfalto: { ph: 'asphalt_02', gray: true },
};

const OUT = path.join(import.meta.dirname, '..', 'public', 'texturas');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'texturas-'));

async function download(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Mapas en bruto: { color, normal, arm } como buffers de imagen. */
async function polyhaven(id) {
  const files = await (await fetch(`https://api.polyhaven.com/files/${id}`)).json();
  const get = key => download(files[key]['1k'].jpg.url);
  return { color: await get('Diffuse'), normal: await get('nor_gl'), arm: await get('arm') };
}

async function ambientcg(id) {
  const zip = path.join(tmp, `${id}.zip`), dir = path.join(tmp, id);
  fs.writeFileSync(zip, await download(`https://ambientcg.com/get?file=${id}_1K-JPG.zip`));
  execFileSync('unzip', ['-o', '-q', zip, '-d', dir]);
  const file = suffix => {
    const f = fs.readdirSync(dir).find(n => n.endsWith(`_${suffix}.jpg`));
    return f && path.join(dir, f);
  };
  const size = (await sharp(file('Color')).metadata()).width;
  const channel = async (f, fill) => f
    ? sharp(f).greyscale().resize(size, size).raw().toBuffer()
    : Buffer.alloc(size * size, fill);
  const [ao, rough, metal] = await Promise.all([channel(file('AmbientOcclusion'), 255), channel(file('Roughness'), 255), channel(file('Metalness'), 0)]);
  const arm = Buffer.alloc(size * size * 3);
  for (let i = 0; i < size * size; i++) { arm[i * 3] = ao[i]; arm[i * 3 + 1] = rough[i]; arm[i * 3 + 2] = metal[i]; }
  return {
    color: fs.readFileSync(file('Color')),
    normal: fs.readFileSync(file('NormalGL')),
    arm: await sharp(arm, { raw: { width: size, height: size, channels: 3 } }).png().toBuffer(),
  };
}

const toLinear = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = c => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

/** Gris con media lineal 0,5 (el material compensa con su color ×2). */
async function grayNormalized(img, size) {
  const { data } = await sharp(img).resize(size, size).greyscale().raw().toBuffer({ resolveWithObject: true });
  const lin = Float32Array.from(data, v => toLinear(v / 255));
  const k = 0.5 / (lin.reduce((a, b) => a + b, 0) / lin.length);
  const out = Buffer.from(lin.map(v => Math.round(255 * toSrgb(Math.min(1, v * k)))));
  return sharp(out, { raw: { width: size, height: size, channels: 1 } });
}

const only = process.argv.slice(2);
for (const [name, t] of Object.entries(TEXTURES)) {
  if (only.length && !only.includes(name)) continue;
  const size = t.size ?? 1024;
  const maps = t.ph ? await polyhaven(t.ph) : await ambientcg(t.acg);
  const dir = path.join(OUT, name);
  fs.mkdirSync(dir, { recursive: true });
  const color = t.gray ? await grayNormalized(maps.color, size) : sharp(maps.color).resize(size, size);
  await color.webp({ quality: 82 }).toFile(path.join(dir, 'color.webp'));
  await sharp(maps.normal).resize(size, size).webp({ quality: 90 }).toFile(path.join(dir, 'normal.webp'));
  await sharp(maps.arm).resize(size, size).webp({ quality: 85 }).toFile(path.join(dir, 'arm.webp'));
  console.log(name, t.ph ?? t.acg);
}
fs.rmSync(tmp, { recursive: true, force: true });
