// PNG export of the identity cards (RF-15, US-14). html-to-image is loaded only when a person
// exports, so it does not count in the initial 500 KB (RNF-01).
import { cardFontFaceCss } from '@/presentation/components';

/** Width of the exported image: 1080 px, the usual size of stories and posts. */
export const EXPORT_WIDTH = 1080;

/** Draws the card element (the <figure>) as a PNG of EXPORT_WIDTH pixels wide. */
export async function cardToPng(card: HTMLElement): Promise<Blob> {
  const { getFontEmbedCSS, toBlob } = await import('html-to-image');
  // Motion off while drawing: every element at its final state (global.css [data-exporting]).
  card.setAttribute('data-exporting', '');
  try {
    await document.fonts?.ready;
    const fontEmbedCSS = `${await getFontEmbedCSS(card)}\n${await cardFontFaceCss()}`;
    const { width, height } = card.getBoundingClientRect();
    // The card is drawn as SVG and rasterised straight at 1080 px wide, so it stays sharp.
    const blob = await toBlob(card, {
      pixelRatio: 1,
      canvasWidth: EXPORT_WIDTH,
      canvasHeight: exportHeight(height / width),
      width,
      height,
      fontEmbedCSS,
    });
    if (!blob) throw new Error('No se pudo dibujar la tarjeta');
    return blob;
  } finally {
    card.removeAttribute('data-exporting');
  }
}

/** 1920 for a 9:16 story, 1080 for a 1:1 post; the exact ratio otherwise. */
export function exportHeight(ratio: number): number {
  if (Math.abs(ratio - 16 / 9) < 0.02) return 1920;
  if (Math.abs(ratio - 1) < 0.02) return 1080;
  return Math.round(EXPORT_WIDTH * ratio);
}

/** Saves a file with the browser's download. */
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Shares the image with the system sheet when the browser can share files (mostly mobile);
 * otherwise downloads it. Returns what happened, for the status message.
 */
export async function shareOrDownload(
  blob: Blob,
  name: string,
  text: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return 'shared';
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  download(blob, name);
  return 'downloaded';
}

/** «Iztacalco, Ciudad de México» → «iztacalco-ciudad-de-mexico». */
export const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
