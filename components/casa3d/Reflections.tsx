import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Box3, Frustum, Matrix4, MeshStandardMaterial, Vector3, type PerspectiveCamera } from 'three';
import { LEVELS, POOL } from '@/lib/casa3d/parcel';
import { sketchRectCenter } from '@/lib/casa3d/parcelShapes';
import { FP_BOUNDS } from '@/lib/casa3d/plan';
import { createReflection, patchReflection, unpatchReflection, updateReflection, type ReflectionOptions } from '@/lib/casa3d/reflection';
import { FH, X, Z } from '@/lib/casa3d/units';
import { useMaterials } from './MaterialsContext';

/** Resolución del reflejo respecto a la del lienzo. */
const SCALE = 0.5;

const [fx1, fz1, fx2, fz2] = FP_BOUNDS;
const WATER = sketchRectCenter(POOL.inner, LEVELS.garden - POOL.waterBelow);

/**
 * Porcelánico pulido del piso (reflejo satinado, algo reforzado para que se
 * aprecie desde las vistas altas) y agua de la piscina (espejo movido por las ondas).
 */
const PLANES: { key: 'floor' | 'water'; options: ReflectionOptions; box: Box3 }[] = [
  {
    key: 'floor',
    options: { y: FH, f0: 0.04, strength: 1.6, blur: 2, distortion: 0 },
    box: new Box3(new Vector3(X(fx1), FH, Z(fz1)), new Vector3(X(fx2), FH, Z(fz2))),
  },
  {
    key: 'water',
    options: { y: WATER.position[1], f0: 0.02, strength: 1, blur: 0.5, distortion: 0.25, fresnelAlpha: true },
    box: new Box3().setFromCenterAndSize(new Vector3(...WATER.position), new Vector3(WATER.size[0], 0, WATER.size[1])),
  },
];

const frustum = new Frustum(), viewProjection = new Matrix4();

/**
 * Reflejos planos del modo videojuego. Cada uno se pinta a media resolución
 * antes del frame, solo si su plano está en pantalla y la cámara por encima;
 * mientras, los planos que reflejan se ocultan para no leerse a sí mismos.
 */
export function Reflections() {
  const m = useMaterials();
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const camera = useThree(s => s.camera) as PerspectiveCamera;
  const size = useThree(s => s.size);
  const dpr = useThree(s => s.viewport.dpr);
  const reflectors = useMemo(() => PLANES.flatMap(p => {
    const material = m[p.key];
    return material instanceof MeshStandardMaterial ? [{ ...p, material, reflection: createReflection(p.options) }] : [];
  }), [m]);

  useEffect(() => {
    for (const r of reflectors) patchReflection(r.material, r.reflection);
    return () => {
      for (const r of reflectors) {
        unpatchReflection(r.material);
        r.reflection.target.dispose();
      }
    };
  }, [reflectors]);

  useEffect(() => {
    const w = Math.max(1, Math.round(size.width * dpr * SCALE)), h = Math.max(1, Math.round(size.height * dpr * SCALE));
    for (const r of reflectors) r.reflection.target.setSize(w, h);
  }, [reflectors, size, dpr]);

  useFrame(() => {
    camera.updateMatrixWorld();
    frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    const prevTarget = gl.getRenderTarget(), prevShadows = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    for (const r of reflectors) {
      const visible = frustum.intersectsBox(r.box) && updateReflection(r.reflection, camera);
      r.reflection.uniforms.reflectStrength.value = visible ? r.options.strength : 0;
      if (!visible) continue;
      for (const o of reflectors) o.material.visible = false;
      gl.setRenderTarget(r.reflection.target);
      gl.clear();
      gl.render(scene, r.reflection.camera);
      for (const o of reflectors) o.material.visible = true;
    }
    gl.setRenderTarget(prevTarget);
    gl.shadowMap.autoUpdate = prevShadows;
  });

  return null;
}
