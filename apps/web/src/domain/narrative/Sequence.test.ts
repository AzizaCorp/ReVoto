import {
  MAX_STEPS,
  createSequence,
  next,
  previous,
  progress,
  screenFromText,
  screenName,
} from './Sequence';

describe('Narrative sequence', () => {
  it('has 10 steps and announces progress by step', () => {
    const s = createSequence();
    expect(progress(s, 'W-10').total).toBe(MAX_STEPS);
    expect(progress(s, 'W-03').text).toBe('Pantalla 3 de 10');
  });

  it('sub-screens share the number of their step', () => {
    const s = createSequence();
    expect(progress(s, 'W-02b').position).toBe(2);
    expect(progress(s, 'W-09b').position).toBe(9);
    expect(progress(s, 'W-09c').position).toBe(9);
    expect(next(s, 'W-09')).toBe('W-09b');
    expect(next(s, 'W-09c')).toBe('W-10');
  });

  it('shrinks when Should/Could screens are removed and recomputes the progress', () => {
    const s = createSequence(['W-07', 'W-08', 'W-09', 'W-09b', 'W-09c']);
    expect(progress(s, 'W-10').text).toBe('Pantalla 7 de 7');
    expect(next(s, 'W-06')).toBe('W-10');
  });

  it('removing a sub-screen does not change the number of steps', () => {
    const s = createSequence(['W-02b']);
    expect(next(s, 'W-02')).toBe('W-03');
    expect(progress(s, 'W-10').total).toBe(10);
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
