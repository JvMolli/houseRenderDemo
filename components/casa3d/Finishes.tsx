import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { FinishConfig } from '@/lib/casa3d/config';
import { applyFinishes, createFinishState, disposeFinishes } from '@/lib/casa3d/finishes';
import { useMaterials } from './MaterialsContext';

/** Aplica a los materiales los acabados elegidos en el configurador. */
export function Finishes({ config }: { config: FinishConfig }) {
  const materials = useMaterials();
  const gl = useThree(s => s.gl);
  const state = useMemo(createFinishState, [materials]);
  useEffect(() => applyFinishes(materials, config, state, gl.capabilities.getMaxAnisotropy()), [materials, config, state, gl]);
  useEffect(() => () => disposeFinishes(state), [state]);
  return null;
}
