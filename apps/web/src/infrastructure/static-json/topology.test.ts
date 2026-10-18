import type { TopologiaDto } from '@revoto/contracts';
import { toLayer } from './topology';

// Two unit squares sharing the arc x = 1 (arc 0), delta-encoded, scale 1, already projected.
const topology: TopologiaDto = {
  type: 'Topology',
  transform: { scale: [1, 1], translate: [1000, 2000] },
  arcs: [
    [
      [1, 0],
      [0, 1],
    ], // (11,20) → (11,21): shared side
    [
      [1, 1],
      [-1, 0],
      [0, -1],
      [1, 0],
    ], // left square, rest
    [
      [1, 0],
      [1, 0],
      [0, 1],
      [-1, 0],
    ], // right square, rest
  ],
  objects: {
    m: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Polygon', arcs: [[0, 1]], properties: { cve: 1, nombre: 'Izquierda' } },
        { type: 'Polygon', arcs: [[~0, 2]], properties: { cve: 2, nombre: 'Derecha' } },
      ],
    },
  },
};

describe('TopoJSON → layer', () => {
  it('decodes delta-encoded arcs and walks shared arcs backwards', () => {
    const layer = toLayer(topology, (p) => ({ id: String(p.cve), name: p.nombre ?? '' }));
    expect(layer.areas.map((a) => a.id)).toEqual(['1', '2']);
    expect(layer.areas[0]!.rings[0]![0]).toEqual([1001, 2000]);
    expect(layer.areas[1]!.rings[0]![0]).toEqual([1001, 2001]); // ~0 starts at the end of arc 0
    expect(layer.bounds).toEqual([1000, 2000, 1002, 2001]);
  });

  it('projects WGS84 (lon, lat) with x scaled by cos(23.5°)', () => {
    const wgs = {
      ...topology,
      transform: { scale: [1, 1], translate: [-100, 20] },
    } as TopologiaDto;
    const [x, y] = toLayer(wgs, () => ({ id: '', name: '' })).areas[0]!.rings[0]![0]!;
    expect(x).toBeCloseTo(-99 * Math.cos((23.5 * Math.PI) / 180));
    expect(y).toBe(20);
  });
});
