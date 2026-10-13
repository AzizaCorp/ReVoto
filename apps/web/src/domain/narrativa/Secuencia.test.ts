import {
  MAX_PASOS,
  anterior,
  crearSecuencia,
  nombrePantalla,
  pantallaDesdeTexto,
  progreso,
  siguiente,
} from './Secuencia';

describe('Secuencia narrativa', () => {
  it('tiene 10 pasos y anuncia el progreso por paso', () => {
    const s = crearSecuencia();
    expect(progreso(s, 'W-10').total).toBe(MAX_PASOS);
    expect(progreso(s, 'W-03').texto).toBe('Pantalla 3 de 10');
  });

  it('las subpantallas comparten el número de su paso', () => {
    const s = crearSecuencia();
    expect(progreso(s, 'W-02b').posicion).toBe(2);
    expect(progreso(s, 'W-09b').posicion).toBe(9);
    expect(progreso(s, 'W-09c').posicion).toBe(9);
    expect(siguiente(s, 'W-09')).toBe('W-09b');
    expect(siguiente(s, 'W-09c')).toBe('W-10');
  });

  it('se acorta al retirar pantallas Should/Could y recalcula el progreso', () => {
    const s = crearSecuencia(['W-07', 'W-08', 'W-09', 'W-09b', 'W-09c']);
    expect(progreso(s, 'W-10').texto).toBe('Pantalla 7 de 7');
    expect(siguiente(s, 'W-06')).toBe('W-10');
  });

  it('retirar una subpantalla no cambia el total de pasos', () => {
    const s = crearSecuencia(['W-02b']);
    expect(siguiente(s, 'W-02')).toBe('W-03');
    expect(progreso(s, 'W-10').total).toBe(10);
  });

  it('no permite retirar pantallas Must', () => {
    expect(() => crearSecuencia(['W-04'])).toThrow('Must');
  });

  it('no avanza más allá de los extremos', () => {
    const s = crearSecuencia();
    expect(anterior(s, 'W-01')).toBeNull();
    expect(siguiente(s, 'W-10')).toBeNull();
  });

  it('reconoce identificadores escritos en la URL', () => {
    expect(pantallaDesdeTexto('w-09c')).toBe('W-09c');
    expect(pantallaDesdeTexto('W-03')).toBe('W-03');
    expect(pantallaDesdeTexto('W-99')).toBeNull();
    expect(nombrePantalla('W-09c')).toBe('Mi municipio y yo');
  });
});
