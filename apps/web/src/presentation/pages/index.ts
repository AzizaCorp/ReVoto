import type { ViewId } from '@/presentation/providers/Navigation';
import { W01Cover } from './W01Cover';
import { W02Territory } from './W02Territory';
import { W02bAboutYou } from './W02bAboutYou';
import { W03MexicoVoted } from './W03MexicoVoted';
import { W04YourTerritory } from './W04YourTerritory';
import { W05FifteenYears } from './W05FifteenYears';
import { W06YourGeneration } from './W06YourGeneration';
import { W07WomenAndMen } from './W07WomenAndMen';
import { W08YourPlace } from './W08YourPlace';
import { W09Archetype } from './W09Archetype';
import { W09bBadge } from './W09bBadge';
import { W09cMyMunicipalityAndMe } from './W09cMyMunicipalityAndMe';
import { W10Summary } from './W10Summary';
import { W15Lite } from './W15Lite';
import { W16OpenData } from './W16OpenData';
import { W17States } from './W17States';

export { SHEETS } from './sheets';

/** One page per view. The story order is decided by `domain/narrative`, not by this map. */
export const PAGES: Record<ViewId, () => React.JSX.Element> = {
  'W-01': W01Cover,
  'W-02': W02Territory,
  'W-02b': W02bAboutYou,
  'W-03': W03MexicoVoted,
  'W-04': W04YourTerritory,
  'W-05': W05FifteenYears,
  'W-06': W06YourGeneration,
  'W-07': W07WomenAndMen,
  'W-08': W08YourPlace,
  'W-09': W09Archetype,
  'W-09b': W09bBadge,
  'W-09c': W09cMyMunicipalityAndMe,
  'W-10': W10Summary,
  'W-15': W15Lite,
  'W-16': W16OpenData,
  'W-17': W17States,
};
