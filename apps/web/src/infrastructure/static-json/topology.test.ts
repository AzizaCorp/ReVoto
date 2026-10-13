import type { TopologiaDto } from '@revoto/contracts';
import { toLayer } from './topology';

// Two unit squares sharing the arc x = 1 (arc 0), delta-encoded, scale 1.
const topology: TopologiaDto = {
  type: 'Topology',
  transform: { scale: [1, 1], translate: [10, 20] },
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
    const layer = toLayer(topology, (p) => String(p.cve));
    expect(layer.areas.map((a) => a.id)).toEqual(['1', '2']);
    expect(layer.areas[0]!.rings[0]![0]).toEqual([11, 20]);
    expect(layer.areas[1]!.rings[0]![0]).toEqual([11, 21]); // ~0 starts at the end of arc 0
    expect(layer.bounds).toEqual([10, 20, 12, 21]);
  });
});
