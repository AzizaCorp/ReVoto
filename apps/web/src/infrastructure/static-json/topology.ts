// TopoJSON (contract L4, geo/*.topo.json) → projected rings. The only place that knows the format:
// arcs are quantized and delta-encoded; a negative index (~i) walks arc i backwards.
// The pipeline publishes WGS84 (lon, lat). They are drawn with an equirectangular projection
// whose x is scaled by cos(23.5°), the middle latitude of Mexico, so shapes keep their proportions.
import type { MapArea, MapLayer } from '@/application';
import type { TopologiaDto } from '@revoto/contracts';

type Point = [number, number];

const X_SCALE = Math.cos((23.5 * Math.PI) / 180);

function decodeArcs(t: TopologiaDto): Point[][] {
  const [sx, sy] = t.transform.scale;
  const [tx, ty] = t.transform.translate;
  // Degrees if the origin is a longitude; metres (already projected) otherwise.
  const kx = Math.abs(tx) <= 180 && Math.abs(ty) <= 90 ? X_SCALE : 1;
  return t.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [(x * sx + tx) * kx, y * sy + ty] as Point;
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

type Props = { cvegeo?: string; cve?: number; nombre?: string };

/** Areas of the topology's single object; `areaOf` picks id and name from each area's properties. */
export function toLayer(
  t: TopologiaDto,
  areaOf: (p: Props) => { id: string; name: string },
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
    areas.push({ ...areaOf(g.properties), rings });
  }
  return { areas, bounds: [minX, minY, maxX, maxY] };
}
