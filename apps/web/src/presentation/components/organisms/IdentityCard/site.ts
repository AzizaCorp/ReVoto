/** Domain printed in the card footers: where the card was made (e.g. «revoto.vercel.app»). */
export const SITE = typeof location === 'undefined' ? 'ReVoto' : location.host || 'ReVoto';
