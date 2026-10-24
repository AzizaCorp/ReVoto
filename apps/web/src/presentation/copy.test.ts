// DEF-10: requirement codes (RN-05, RF-23, HU-31…) are for the team, never for people. This test
// reads every presentation file, drops comments and fails if a code is left in strings or JSX.
const files = import.meta.glob(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const CODE = /\b(?:RN|RF|RNF|HU|CA|CE|RI|RIU|OBJ|US)-\d{2}\b/;
const withoutComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '') // block and JSDoc comments
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '') // JSX comments
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1'); // line comments, but not URLs

describe('visible copy', () => {
  it('has files to check', () => {
    expect(Object.keys(files).length).toBeGreaterThan(20);
  });

  it.each(Object.entries(files))('%s shows no requirement codes', (_, src) => {
    const found = withoutComments(src)
      .split('\n')
      .filter((line) => CODE.test(line));
    expect(found).toEqual([]);
  });
});
