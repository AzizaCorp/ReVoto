import { anterior, crearSecuencia, progreso, siguiente } from './Secuencia';

describe('Secuencia narrativa', () => {
  it('tiene 10 pantallas y anuncia el progreso', () => {
    const s = crearSecuencia();
    expect(s.pantallas).toHaveLength(10);
    expect(progreso(s, 'W-03').texto).toBe('Pantalla 3 de 10');
  });

  it('se acorta al retirar pantallas Should/Could y recalcula el progreso', () => {
    const s = crearSecuencia(['W-07', 'W-08', 'W-09']);
    expect(progreso(s, 'W-10').texto).toBe('Pantalla 7 de 7');
    expect(siguiente(s, 'W-06')).toBe('W-10');
  });

  it('no permite retirar pantallas Must', () => {
    expect(() => crearSecuencia(['W-04'])).toThrow('Must');
  });

  it('no avanza más allá de los extremos', () => {
    const s = crearSecuencia();
    expect(anterior(s, 'W-01')).toBeNull();
    expect(siguiente(s, 'W-10')).toBeNull();
  });
});
