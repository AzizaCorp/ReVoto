import { eleccion } from '../eleccion';
import { NACIONAL } from '../territorio';
import { calcularParticipacion, cifra, diferenciaEnPuntos, grupoDeEdad, proporcion } from '.';

describe('Participación', () => {
  it('RN-01: excluye los registros sin dato del denominador', () => {
    expect(calcularParticipacion({ listaNominal: 100, votoSi: 45, sinDato: 10 })).toBeCloseTo(0.5);
    expect(calcularParticipacion({ listaNominal: 10, votoSi: 0, sinDato: 10 })).toBeNull();
  });

  it('RN-04 y RN-09: asigna grupo de edad solo entre 18 y 110', () => {
    expect(grupoDeEdad(18)).toBe('18-24');
    expect(grupoDeEdad(60)).toBe('60+');
    expect(grupoDeEdad(17)).toBeNull();
    expect(grupoDeEdad(140)).toBeNull();
  });

  it('calcula la diferencia en puntos porcentuales', () => {
    expect(diferenciaEnPuntos(proporcion(0.612), proporcion(0.597))).toBe(1.5);
  });

  it('RN-10: no permite una cifra sin fuente', () => {
    expect(() => cifra(proporcion(0.597), NACIONAL, eleccion(2024), { nombre: ' ' })).toThrow(
      'RN-10',
    );
  });
});
