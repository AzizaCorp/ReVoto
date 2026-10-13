import type { SheetId } from '@/presentation/providers/Navigation';
import { W11Source } from './W11Source';
import { W12Share } from './W12Share';
import { W13Settings } from './W13Settings';
import { W20Quality } from './W20Quality';

/** Bottom sheets that open on top of any screen (manual §7.2). */
export const SHEETS: Record<SheetId, () => React.JSX.Element> = {
  'W-11': W11Source,
  'W-12': W12Share,
  'W-13': W13Settings,
  'W-20': W20Quality,
};
