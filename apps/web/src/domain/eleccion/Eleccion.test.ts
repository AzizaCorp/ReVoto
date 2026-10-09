import { eleccion, tipoDeEleccion } from './Eleccion';

describe('Elección (RN-03)', () => {
  it('distingue presidenciales de intermedias', () => {
    expect([2009, 2012, 2015, 2018, 2021, 2024].map((a) => tipoDeEleccion(a as never))).toEqual([
      'intermedia',
      'presidencial',
      'intermedia',
      'presidencial',
      'intermedia',
      'presidencial',
    ]);
  });

  it('rechaza años fuera del MVP', () => {
    expect(() => eleccion(2006)).toThrow(RangeError);
  });
});
