import { useEffect, useMemo } from 'react';
import { mergeByMaterial } from '@/lib/casa3d/geometry';
import type { MaterialKey } from '@/lib/casa3d/plan';
import type { BoxSolid, Solid } from '@/lib/casa3d/shapes';
import { useMaterials } from './MaterialsContext';

/** Los vidrios son transparentes: van en mallas sueltas para que se ordenen por distancia, y no proyectan sombra. */
const GLASS: ReadonlySet<MaterialKey> = new Set(['glass', 'showerGlass']);
const isGlass = (s: Solid): s is BoxSolid => s.kind === 'box' && GLASS.has(s.mat);

/**
 * Pinta una lista estática de sólidos. Las piezas opacas se fusionan en una
 * malla por material. `items` debe ser una referencia estable (constante de módulo).
 */
export function Solids({ items }: { items: readonly Solid[] }) {
  const m = useMaterials();
  const merged = useMemo(() => mergeByMaterial(items.filter(s => !isGlass(s))), [items]);
  const glass = useMemo(() => items.filter(isGlass), [items]);
  useEffect(() => () => { for (const p of merged) p.geometry.dispose(); }, [merged]);

  return (
    <>
      {merged.map(({ mat, geometry }) => (
        <mesh key={mat} geometry={geometry} material={m[mat]} castShadow receiveShadow />
      ))}
      {glass.map((s, i) => (
        <mesh key={i} position={s.position} rotation-y={s.rotationY ?? 0} material={m[s.mat]} receiveShadow>
          <boxGeometry args={s.size} />
        </mesh>
      ))}
    </>
  );
}
