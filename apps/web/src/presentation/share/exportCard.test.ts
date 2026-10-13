import { exportHeight, slug } from './exportCard';

describe('Card export', () => {
  it('exports stories at 1080 × 1920 and posts at 1080 × 1080', () => {
    expect(exportHeight(600.9 / 338)).toBe(1920);
    expect(exportHeight(1)).toBe(1080);
    expect(exportHeight(1.25)).toBe(1350);
  });

  it('names the file without accents or spaces', () => {
    expect(slug('Iztacalco, Ciudad de México')).toBe('iztacalco-ciudad-de-mexico');
  });
});
