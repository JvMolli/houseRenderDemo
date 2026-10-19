import { useEffect, useMemo } from 'react';
import { mergeByMaterial } from '@/lib/casa3d/geometry';
import type { BoxSolid, Solid } from '@/lib/casa3d/shapes';
import { useMaterials } from './MaterialsContext';

/** El vidrio es transparente: va en mallas sueltas para que se ordene por distancia, y no proyecta sombra. */
const isGlass = (s: Solid): s is BoxSolid => s.kind === 'box' && s.mat === 'glass';

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
        <mesh key={i} position={s.position} rotation-y={s.rotationY ?? 0} material={m.glass} receiveShadow>
          <boxGeometry args={s.size} />
        </mesh>
      ))}
    </>
  );
}
