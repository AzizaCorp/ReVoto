import { municipality, NATIONAL, state, type Territory } from '@/domain';
import {
  buildShareUrl,
  decodeAnswers,
  encodeAnswers,
  findTerritory,
  parseSharedLocation,
} from './sharedLink';

const IZTACALCO = municipality(9, 6, 'Iztacalco', 'Ciudad de México') as Territory;
const ORIGIN = 'https://revoto.mx';
const ANSWERS = { age: '25–34', voted2018: 'Sí', voted2021: 'No', voted2024: 'Sí' };

describe('US-24 · shared links', () => {
  it('encodes each answer as the index of its option, «_» when unanswered', () => {
    expect(encodeAnswers(ANSWERS)).toBe('1010');
    expect(encodeAnswers({ ...ANSWERS, voted2021: null })).toBe('10_0');
    expect(
      encodeAnswers({ age: null, voted2018: null, voted2021: null, voted2024: null }),
    ).toBeNull();
    expect(decodeAnswers('1010')).toEqual(ANSWERS);
    expect(decodeAnswers('10_0')).toEqual({ age: '25–34', voted2018: 'Sí', voted2024: 'Sí' });
    expect(decodeAnswers('99')).toBeNull();
  });

  it('carries the territory always and the answers only when asked, in the fragment', () => {
    expect(buildShareUrl(ORIGIN, 'W-03', NATIONAL)).toBe('https://revoto.mx/mexico-voto');
    expect(buildShareUrl(ORIGIN, 'W-04', IZTACALCO)).toBe('https://revoto.mx/tu-territorio#t=9-6');
    expect(buildShareUrl(ORIGIN, 'W-09b', state(9, 'Ciudad de México'), ANSWERS)).toBe(
      'https://revoto.mx/tu-insignia#t=9&r=1010',
    );
  });

  it('reads the view, the territory and the answers back, ignoring what is not valid', () => {
    expect(parseSharedLocation({ pathname: '/tu-territorio', hash: '#t=9-6&r=1010' })).toEqual({
      view: 'W-04',
      territory: { stateCode: 9, municipalityCode: 6 },
      answers: ANSWERS,
    });
    expect(parseSharedLocation({ pathname: '/', hash: '#/W-04?t=9-6&r=1010' })).toEqual({
      view: 'W-04',
      territory: { stateCode: 9, municipalityCode: 6 },
      answers: ANSWERS,
    });
    expect(parseSharedLocation({ pathname: '/tu-territorio', hash: '' })).toEqual({
      view: 'W-04',
      territory: null,
      answers: null,
    });
    expect(
      parseSharedLocation({ pathname: '/tu-territorio', hash: '#t=<script>&r=abc' }),
    ).toMatchObject({ territory: null, answers: null });
  });

  it('finds the territory by its codes, as the repository names it', () => {
    const states = [state(9, 'Ciudad de México'), state(14, 'Jalisco')];
    expect(findTerritory({ stateCode: 9, municipalityCode: 6 }, states, [IZTACALCO])).toBe(
      IZTACALCO,
    );
    expect(findTerritory({ stateCode: 14 }, states, [])).toBe(states[1]);
    expect(findTerritory({ stateCode: 40 }, states, [])).toBeNull();
    expect(findTerritory({ stateCode: 9, municipalityCode: 99 }, states, [IZTACALCO])).toBeNull();
  });
});
