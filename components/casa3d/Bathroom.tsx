import { memo } from 'react';
import { BATHROOM_SOLIDS } from '@/lib/casa3d/solids';
import { Solids } from './Solids';

/** Lavabo, espejo, bañera e inodoro. */
export const Bathroom = memo(function Bathroom() {
  return <Solids items={BATHROOM_SOLIDS} />;
});
