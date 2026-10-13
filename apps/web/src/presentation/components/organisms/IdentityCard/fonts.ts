// Display fonts of the identity cards (latin subset, woff2 only). They are registered with the
// FontFace API: the browser downloads each file only when a card uses that family.
import antonUrl from '@fontsource/anton/files/anton-latin-400-normal.woff2';
import bricolageUrl from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2';
import dmSerifUrl from '@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff2';
import fraunces700iUrl from '@fontsource/fraunces/files/fraunces-latin-700-italic.woff2';
import fraunces900Url from '@fontsource/fraunces/files/fraunces-latin-900-normal.woff2';
import unboundedUrl from '@fontsource/unbounded/files/unbounded-latin-900-normal.woff2';

const FACES: readonly [string, string, FontFaceDescriptors][] = [
  ['Fraunces', fraunces900Url, { weight: '900', style: 'normal' }],
  ['Fraunces', fraunces700iUrl, { weight: '700', style: 'italic' }],
  ['Bricolage Grotesque', bricolageUrl, { weight: '800', style: 'normal' }],
  ['Unbounded', unboundedUrl, { weight: '900', style: 'normal' }],
  ['Anton', antonUrl, { weight: '400', style: 'normal' }],
  ['DM Serif Display', dmSerifUrl, { weight: '400', style: 'italic' }],
];

let registered = false;

/** Registers the faces once (no-op where the FontFace API does not exist, e.g. tests). */
export function registerCardFonts(): void {
  if (registered || typeof FontFace === 'undefined' || !document.fonts) return;
  registered = true;
  for (const [family, url, descriptors] of FACES) {
    document.fonts.add(
      new FontFace(family, `url(${url}) format('woff2')`, { display: 'swap', ...descriptors }),
    );
  }
}
