import { memo } from 'react';
import { BEDS, CLOSETS } from '@/lib/casa3d/plan';
import { bed, closet, pbox, type Solid } from '@/lib/casa3d/shapes';
import { Solids } from './Solids';

const SOLIDS: Solid[] = [...CLOSETS.flatMap(closet), ...BEDS.flatMap(bed)].map(pbox);

/** Armarios y camas de los dos dormitorios. */
export const Bedrooms = memo(function Bedrooms() {
  return <Solids items={SOLIDS} />;
});
