// TopoJSON (contract L4, geo/*.topo.json) → projected rings. The only place that knows the format:
// arcs are quantized and delta-encoded; a negative index (~i) walks arc i backwards.
import type { MapArea, MapLayer } from '@/application';
import type { TopologiaDto } from '@revoto/contracts';

type Point = [number, number];

function decodeArcs(t: TopologiaDto): Point[][] {
  const [sx, sy] = t.transform.scale;
  const [tx, ty] = t.transform.translate;
  return t.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty] as Point;
    });
  });
}

function ring(indexes: readonly number[], arcs: readonly Point[][]): Point[] {
  const points: Point[] = [];
  indexes.forEach((i, n) => {
    const arc = i >= 0 ? arcs[i]! : [...arcs[~i]!].reverse();
    points.push(...(n === 0 ? arc : arc.slice(1)));
  });
  return points;
}

/** Areas of the topology's single object; `idOf` picks the id from each area's properties. */
export function toLayer(
  t: TopologiaDto,
  idOf: (p: { cvegeo?: string; cve?: number; nombre?: string }) => string,
): MapLayer {
  const arcs = decodeArcs(t);
  const object = Object.values(t.objects)[0];
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  const areas: MapArea[] = [];
  for (const g of object?.geometries ?? []) {
    if (!g.arcs) continue;
    const polygons = (g.type === 'Polygon' ? [g.arcs] : g.arcs) as number[][][];
    const rings = polygons.flatMap((polygon) => polygon.map((r) => ring(r, arcs)));
    for (const r of rings) {
      for (const [x, y] of r) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    areas.push({ id: idOf(g.properties), name: g.properties.nombre ?? '', rings });
  }
  return { areas, bounds: [minX, minY, maxX, maxY] };
}
