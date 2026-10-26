import { pathOf, SLUGS, viewFromLegacyHash, viewFromLocation } from './routes';
import type { ViewId } from './Navigation';

const at = (pathname: string, hash = '') => viewFromLocation({ pathname, hash });

describe('readable addresses', () => {
  it('gives every view its own address and reads it back', () => {
    const slugs = Object.values(SLUGS);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const view of Object.keys(SLUGS) as ViewId[]) expect(at(pathOf(view))).toBe(view);
    expect(pathOf('W-02')).toBe('/elige-tu-territorio');
    expect(pathOf('W-01')).toBe('/inicio');
  });

  it('the root is the cover; trailing slashes and capitals do not matter', () => {
    expect(at('/')).toBe('W-01');
    expect(at('/Tu-Territorio/')).toBe('W-04');
  });

  it('old hash addresses and view codes still open their view; unknown ones open nothing', () => {
    expect(viewFromLegacyHash('#/W-09b?t=9')).toBe('W-09b');
    expect(at('/inicio', '#/W-16')).toBe('W-16');
    expect(at('/w-04')).toBe('W-04');
    expect(at('/no-existe')).toBeNull();
    expect(viewFromLegacyHash('#t=9-6')).toBeNull();
  });
});
