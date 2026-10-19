import { memo } from 'react';
import { KITCHEN_SOLIDS } from '@/lib/casa3d/solids';
import { Solids } from './Solids';

/** Barra con taburetes y cocina en U. */
export const Kitchen = memo(function Kitchen() {
  return <Solids items={KITCHEN_SOLIDS} />;
});
