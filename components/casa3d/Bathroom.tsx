import { memo } from 'react';
import { BATHROOM, BATHROOM_CYLS } from '@/lib/casa3d/plan';
import { cyl, pbox, type Solid } from '@/lib/casa3d/shapes';
import { Solids } from './Solids';

const SOLIDS: Solid[] = [...BATHROOM.map(pbox), ...BATHROOM_CYLS.map(cyl)];

/** Lavabo, espejo, bañera e inodoro. */
export const Bathroom = memo(function Bathroom() {
  return <Solids items={SOLIDS} />;
});
