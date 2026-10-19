import { useThree } from '@react-three/fiber';
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createMaterials, disposeMaterials, type Materials } from '@/lib/casa3d/materials';

const MaterialsCtx = createContext<Materials | null>(null);
/** Modo videojuego activo: cambia algunas geometrías (cantos redondeados, calle hasta el horizonte). */
const GameCtx = createContext(false);

/** Crea los materiales (y sus texturas) una vez por montaje del Canvas y los libera al desmontar. */
export function MaterialsProvider({ game, children }: { game: boolean; children: ReactNode }) {
  const gl = useThree(s => s.gl);
  const materials = useMemo(() => createMaterials(gl.capabilities.getMaxAnisotropy()), [gl]);
  useEffect(() => () => disposeMaterials(materials), [materials]);
  return (
    <MaterialsCtx value={materials}>
      <GameCtx value={game}>{children}</GameCtx>
    </MaterialsCtx>
  );
}

export function useMaterials(): Materials {
  const materials = useContext(MaterialsCtx);
  if (!materials) throw new Error('useMaterials() fuera de <MaterialsProvider>');
  return materials;
}

export const useGame = () => useContext(GameCtx);
