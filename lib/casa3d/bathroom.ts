/**
 * Piezas curvas del baño que no son cajas ni cilindros verticales: lavabos de
 * piedra sobre encimera (torneados), grifos negros altos y espejos redondos
 * con aro LED. Coordenadas en metros dentro del piso; se fusionan por material.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BATH_SINKS, type MaterialKey } from './plan';
import { X, Z } from './units';

type P3 = [number, number, number];

function rod(a: P3, b: P3, r: number) {
  const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), 10);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}

/** Cuenco de piedra: perfil torneado con pared gruesa, abierto por arriba. */
function bowl(r: number) {
  const profile = [
    [0.001, 0], [r * 0.55, 0.004], [r * 0.85, 0.04], [r, 0.11], [r * 0.94, 0.125],
    [r * 0.82, 0.06], [r * 0.52, 0.03], [0.001, 0.026],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(profile, 32);
}

export function buildBathFixtures(): { mat: MaterialKey; geometry: THREE.BufferGeometry }[] {
  const { x: xs, z, faucetZ, top, bowlRadius, mirror } = BATH_SINKS;
  const zb = Z(z), zf = Z(faucetZ), zw = Z(mirror.wallZ);
  const parts: Partial<Record<MaterialKey, THREE.BufferGeometry[]>> = { stoneBowl: [], black: [], mirror: [], led: [] };
  for (const px of xs) {
    const x = X(px);
    parts.stoneBowl!.push(bowl(bowlRadius).translate(x, top, zb));
    parts.black!.push(
      rod([x, top, zf], [x, top + 0.33, zf], 0.014),
      rod([x, top + 0.32, zf], [x, top + 0.3, zf + 0.15], 0.011),
      rod([x + 0.035, top + 0.22, zf], [x + 0.08, top + 0.22, zf], 0.008), // maneta
    );
    parts.mirror!.push(new THREE.CylinderGeometry(mirror.radius, mirror.radius, 0.012, 48).rotateX(Math.PI / 2).translate(x, mirror.y, zw + 0.016));
    parts.led!.push(new THREE.TorusGeometry(mirror.radius + 0.006, 0.01, 8, 64).translate(x, mirror.y, zw + 0.006));
  }
  return (Object.entries(parts) as [MaterialKey, THREE.BufferGeometry[]][]).map(([mat, list]) => {
    const flat = list.map(g => {
      const n = g.index ? g.toNonIndexed() : g;
      n.clearGroups();
      return n;
    });
    const geometry = mergeGeometries(flat);
    for (const g of [...list, ...flat]) if (g !== geometry) g.dispose();
    return { mat, geometry };
  });
}
