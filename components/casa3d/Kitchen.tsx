import { memo } from 'react';
import { BAR, KITCHEN, KITCHEN_CYLS, STOOLS } from '@/lib/casa3d/plan';
import { cyl, pbox, stool, type Solid } from '@/lib/casa3d/shapes';
import { Solids } from './Solids';

const SOLIDS: Solid[] = [
  ...BAR.map(pbox),
  ...STOOLS.flatMap(stool).map(cyl),
  ...KITCHEN.map(pbox),
  ...KITCHEN_CYLS.map(cyl),
];

/** Barra con taburetes y cocina en U. */
export const Kitchen = memo(function Kitchen() {
  return <Solids items={SOLIDS} />;
});
