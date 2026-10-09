import { NACIONAL, entidad, etiquetaTerritorio, municipio, territorioSuperior } from './Territorio';

describe('Territorio (RN-02, RN-05)', () => {
  const zapopan = municipio(14, 120, 'Zapopan', 'Jalisco');

  it('arma la etiqueta que acompaña a cada cifra', () => {
    expect(etiquetaTerritorio(zapopan)).toBe('Zapopan, Jalisco');
    expect(etiquetaTerritorio(NACIONAL)).toBe('Nacional');
  });

  it('sube un nivel: municipio → entidad → nacional', () => {
    expect(territorioSuperior(zapopan)).toEqual(entidad(14, 'Jalisco'));
    expect(territorioSuperior(entidad(14, 'Jalisco'))).toBe(NACIONAL);
    expect(territorioSuperior(NACIONAL)).toBeNull();
  });

  it('rechaza claves de entidad inválidas', () => {
    expect(() => entidad(33, 'X')).toThrow(RangeError);
  });
});
