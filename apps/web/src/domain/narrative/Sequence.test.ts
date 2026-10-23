import {
  createSequence,
  next,
  previous,
  progress,
  screenFromText,
  screenName,
  storyLength,
} from './Sequence';

describe('Narrative sequence', () => {
  it('counts every screen after the cover', () => {
    const s = createSequence();
    expect(storyLength(s)).toBe(12);
    expect(progress(s, 'W-01')).toEqual({ position: 0, total: 12, text: 'Portada' });
    expect(progress(s, 'W-02').text).toBe('Pantalla 1 de 12');
    expect(progress(s, 'W-10').text).toBe('Pantalla 12 de 12');
  });

  it('advances on every screen, sub-screens included (DEF-27)', () => {
    const s = createSequence();
    const positions = s.screens.map((id) => progress(s, id).position);
    expect(positions).toEqual(s.screens.map((_, i) => i));
    expect(progress(s, 'W-09b').position).toBe(progress(s, 'W-09').position + 1);
    expect(next(s, 'W-09')).toBe('W-09b');
    expect(next(s, 'W-09c')).toBe('W-10');
  });

  it('shrinks when Should/Could screens are removed and recomputes the total', () => {
    const s = createSequence(['W-07', 'W-08', 'W-09', 'W-09b', 'W-09c']);
    expect(progress(s, 'W-10').text).toBe('Pantalla 7 de 7');
    expect(next(s, 'W-06')).toBe('W-10');
  });

  it('removing a sub-screen also lowers the total', () => {
    const s = createSequence(['W-02b']);
    expect(next(s, 'W-02')).toBe('W-03');
    expect(storyLength(s)).toBe(11);
    expect(progress(s, 'W-10').total).toBe(11);
  });

  it('does not allow removing Must screens', () => {
    expect(() => createSequence(['W-04'])).toThrow('Must');
  });

  it('does not move past the ends', () => {
    const s = createSequence();
    expect(previous(s, 'W-01')).toBeNull();
    expect(next(s, 'W-10')).toBeNull();
  });

  it('recognizes ids written in the URL', () => {
    expect(screenFromText('w-09c')).toBe('W-09c');
    expect(screenFromText('W-03')).toBe('W-03');
    expect(screenFromText('W-99')).toBeNull();
    expect(screenName('W-09c')).toBe('Mi municipio y yo');
  });
});
