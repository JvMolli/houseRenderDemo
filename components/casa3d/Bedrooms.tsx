import { memo } from 'react';
import { BEDROOM_SOLIDS } from '@/lib/casa3d/solids';
import { Solids } from './Solids';

/** Armarios y camas de los dos dormitorios. */
export const Bedrooms = memo(function Bedrooms() {
  return <Solids items={BEDROOM_SOLIDS} />;
});
