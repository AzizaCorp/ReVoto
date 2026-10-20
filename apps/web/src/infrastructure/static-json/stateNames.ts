// Display names of the 32 states. The pipeline publishes them in capitals without accents
// («QUERETARO»), which is fine as a key but not as text for people (RN-10 labels every figure).
const NAMES: Record<number, string> = {
  1: 'Aguascalientes',
  2: 'Baja California',
  3: 'Baja California Sur',
  4: 'Campeche',
  5: 'Coahuila',
  6: 'Colima',
  7: 'Chiapas',
  8: 'Chihuahua',
  9: 'Ciudad de México',
  10: 'Durango',
  11: 'Guanajuato',
  12: 'Guerrero',
  13: 'Hidalgo',
  14: 'Jalisco',
  15: 'México',
  16: 'Michoacán',
  17: 'Morelos',
  18: 'Nayarit',
  19: 'Nuevo León',
  20: 'Oaxaca',
  21: 'Puebla',
  22: 'Querétaro',
  23: 'Quintana Roo',
  24: 'San Luis Potosí',
  25: 'Sinaloa',
  26: 'Sonora',
  27: 'Tabasco',
  28: 'Tamaulipas',
  29: 'Tlaxcala',
  30: 'Veracruz',
  31: 'Yucatán',
  32: 'Zacatecas',
};

/** Name to show for a state; keeps the published one if it is already in mixed case. */
export const stateName = (code: number, published: string): string =>
  published === published.toUpperCase() ? (NAMES[code] ?? published) : published;
