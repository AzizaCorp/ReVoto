import { useEffect, useMemo, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { classOf, quantileBreaks } from '@/domain';
import { Icon } from '../../atoms';
import styles from './ChoroplethMap.module.css';

export interface MapShape {
  readonly id: string;
  readonly name: string;
  readonly rings: readonly (readonly (readonly [number, number])[])[];
}

export interface ChoroplethMapProps {
  /** Areas already projected (metres, y to the north) and their bounds. */
  layer: {
    readonly areas: readonly MapShape[];
    readonly bounds: readonly [number, number, number, number];
  };
  /** Value from 0 to 1, or null when there is no data (drawn in grey). */
  valueOf: (id: string) => number | null;
  /** Accessible name of the map: what it shows, e.g. «Participación por municipio, 2024». */
  label: string;
  /** Title over the legend. */
  legendTitle: string;
  format: (value: number) => string;
  /** Card with name and figure of the area under the pointer (or the highlighted one). */
  tooltip?: (id: string) => { title: string; detail: string } | null;
  /** Area of the person (thick outline). */
  highlight?: string | null;
  /** Areas to outline with a dashed line (the neighbours, W-04). */
  outlined?: readonly string[];
  /**
   * Makes the areas buttons (W-02: choose a state on the map). Without values to show, the map is
   * a picker: one flat tone, the chosen area in brand color and no legend.
   */
  onSelect?: (id: string) => void;
  picker?: boolean;
  /** Zoom and pan controls (board W-03). */
  zoomable?: boolean;
  /** Small note at the foot, e.g. «Geometría: INEGI». */
  credit?: string;
  /** `compact` leaves room for other panels in the same column (W-04). */
  size?: 'fill' | 'compact';
}

const CLASSES = 7;
const WIDTH = 1000;

/**
 * Choropleth map (boards W-03 and W-04): areas colored in 7 sequential steps by quantiles, with
 * legend, highlight, tooltip and zoom. Draws plain SVG from projected rings, no map library.
 */
export function ChoroplethMap({
  layer,
  valueOf,
  label,
  legendTitle,
  format,
  tooltip,
  highlight = null,
  outlined = [],
  onSelect,
  picker = false,
  zoomable = false,
  credit,
  size = 'fill',
}: ChoroplethMapProps) {
  const [minX, minY, maxX, maxY] = layer.bounds;
  const scale = WIDTH / (maxX - minX || 1);
  const height = (maxY - minY) * scale;
  const home = { x: 0, y: 0, w: WIDTH, h: height };
  const [view, setView] = useState(home);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(
    null,
  );
  const svg = useRef<SVGSVGElement>(null);
  // Active pointers and the pinch in progress (DEF-31: two-finger zoom on mobile).
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; view: typeof view; cx: number; cy: number } | null>(null);
  const pinched = useRef(false);

  const drawn = useMemo(
    () =>
      layer.areas.map((a) => ({
        id: a.id,
        name: a.name,
        d: a.rings
          .map(
            (r) =>
              'M' +
              r
                .map(
                  ([x, y]) =>
                    `${((x - minX) * scale).toFixed(1)} ${((maxY - y) * scale).toFixed(1)}`,
                )
                .join('L') +
              'Z',
          )
          .join(''),
      })),
    [layer, minX, maxY, scale],
  );
  // Drawing order: the outlined neighbours and then the highlighted area go last, on top, so
  // their outlines are not covered by the areas around them.
  const rank = (id: string) => (id === highlight ? 2 : outlined.includes(id) ? 1 : 0);
  const paths = [...drawn].sort((a, b) => rank(a.id) - rank(b.id));

  const values = layer.areas.map((a) => valueOf(a.id));
  const valueById = new Map(layer.areas.map((a, i) => [a.id, values[i] ?? null]));
  const known = values.filter((v): v is number => v !== null);
  const breaks = quantileBreaks(known, CLASSES);
  const lo = known.length ? Math.min(...known) : null;
  const hi = known.length ? Math.max(...known) : null;
  const fill = (v: number | null, id?: string) =>
    picker
      ? id === highlight
        ? 'var(--rv-color-brand)'
        : 'var(--rv-map-2)'
      : v === null
        ? 'var(--rv-map-empty)'
        : `var(--rv-map-${classOf(v, breaks) + 1})`;

  const shown = hover ?? highlight;
  const tip = shown && tooltip ? tooltip(shown) : null;

  /** Zooms by `factor` keeping the point (ax, ay) of the map in place (the centre by default). */
  const zoomAround = (v: typeof view, factor: number, ax = v.x + v.w / 2, ay = v.y + v.h / 2) => {
    const w = Math.min(WIDTH, Math.max(WIDTH / 16, v.w / factor));
    if (w === WIDTH) return home;
    const k = w / v.w;
    const h = (w / WIDTH) * height;
    return { x: ax - (ax - v.x) * k, y: ay - (ay - v.y) * k, w, h };
  };
  const zoom = (factor: number) => setView((v) => zoomAround(v, factor));
  /** Map coordinates (viewBox) of a point on the screen. */
  const toMap = (clientX: number, clientY: number, v: typeof view) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return { x: v.x + v.w / 2, y: v.y + v.h / 2 };
    // preserveAspectRatio="xMidYMid meet": one scale for both axes, content centred.
    const s = Math.min(r.width / v.w, r.height / v.h);
    const ox = (r.width - v.w * s) / 2;
    const oy = (r.height - v.h * s) / 2;
    return { x: v.x + (clientX - r.left - ox) / s, y: v.y + (clientY - r.top - oy) / s };
  };
  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  // Trackpad pinch and Ctrl + wheel on desktop. Native listener: React's wheel is passive.
  useEffect(() => {
    const el = svg.current;
    if (!el || !zoomable) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setView((v) => {
        const p = toMap(e.clientX, e.clientY, v);
        return zoomAround(v, Math.exp(-e.deltaY / 200), p.x, p.y);
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomable, height]);

  const idAt = (target: EventTarget | null) =>
    target instanceof Element ? (target.getAttribute('data-id') ?? null) : null;

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!zoomable) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [
        { x: number; y: number },
        { x: number; y: number },
      ];
      const c = toMap((a.x + b.x) / 2, (a.y + b.y) / 2, view);
      pinch.current = { dist: distance(), view, cx: c.x, cy: c.y };
      pinched.current = true;
      drag.current = null;
      return;
    }
    pinched.current = false;
    if (view.w === WIDTH) return;
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    const p = pinch.current;
    if (p && pointers.current.size === 2) {
      const d = distance();
      if (d > 0 && p.dist > 0) setView(zoomAround(p.view, d / p.dist, p.cx, p.cy));
      return;
    }
    const d = drag.current;
    if (d && svg.current) {
      const k = view.w / svg.current.getBoundingClientRect().width;
      const dx = (e.clientX - d.x) * k;
      const dy = (e.clientY - d.y) * k;
      if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
      setView((v) => ({ ...v, x: d.vx - dx, y: d.vy - dy }));
      return;
    }
    setHover(idAt(e.target));
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    drag.current = null;
    // A pinch is not a tap: lifting the fingers never selects an area.
    if (pinched.current) {
      if (pointers.current.size === 0) pinched.current = false;
      return;
    }
    if (d?.moved) return;
    const id = idAt(e.target);
    if (id && onSelect) onSelect(id);
    else setHover(id); // tap on mobile shows the card
  };
  const onKey = (e: KeyboardEvent<SVGPathElement>, id: string) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <figure className={styles.choroplethMap}>
      <div className={styles.stage}>
        <svg
          ref={svg}
          className={[styles.svg, styles[size], view.w < WIDTH ? styles.grab : ''].join(' ')}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          preserveAspectRatio="xMidYMid meet"
          role={onSelect ? 'group' : 'img'}
          // Its pan and pinch are not story swipes (useNavigationShortcuts).
          data-gesture={zoomable ? 'map' : undefined}
          aria-label={label}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => {
            pointers.current.delete(e.pointerId);
            pinch.current = null;
            drag.current = null;
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') {
              drag.current = null;
              setHover(null);
            }
          }}
        >
          {paths.map((p) => {
            const selectable = Boolean(onSelect);
            return (
              <path
                key={p.id}
                data-id={p.id}
                d={p.d}
                fill={fill(valueById.get(p.id) ?? null, p.id)}
                className={[
                  styles.area,
                  p.id === highlight ? styles.highlight : '',
                  outlined.includes(p.id) ? styles.outlined : '',
                  p.id === hover ? styles.hover : '',
                ].join(' ')}
                {...(selectable
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-label': p.name,
                      'aria-pressed': p.id === highlight,
                      onKeyDown: (e: KeyboardEvent<SVGPathElement>) => onKey(e, p.id),
                      onFocus: () => setHover(p.id),
                    }
                  : { 'aria-hidden': true })}
              />
            );
          })}
        </svg>
        {zoomable && (
          <div className={styles.zoom}>
            <button type="button" aria-label="Acercar" onClick={() => zoom(1.6)}>
              <Icon name="plus" />
            </button>
            <button type="button" aria-label="Alejar" onClick={() => zoom(1 / 1.6)}>
              <Icon name="minus" />
            </button>
            <button type="button" aria-label="Ver todo" onClick={() => setView(home)}>
              <Icon name="home" />
            </button>
          </div>
        )}
        {credit && <span className={styles.credit}>{credit}</span>}
      </div>
      {/* DEF-31: the card of the area lives under the map, so it never covers small states. The
          same figures are in the page text and in the lite version. */}
      {tooltip && (
        <div className={styles.tip} aria-hidden="true">
          {tip ? (
            <>
              <b>{tip.title}</b>
              <span>
                <i
                  style={{
                    background: fill(
                      shown ? (valueById.get(shown) ?? null) : null,
                      shown ?? undefined,
                    ),
                  }}
                />
                {tip.detail}
              </span>
            </>
          ) : (
            <span>
              {picker
                ? 'Toca una entidad para elegirla.'
                : onSelect
                  ? 'Toca una entidad para ver sus municipios.'
                  : 'Toca un municipio para ver su cifra.'}
              {zoomable && ' Usa dos dedos o + para acercar.'}
            </span>
          )}
        </div>
      )}
      {!picker && (
        <figcaption className={styles.legend}>
          <span className={styles.legendTitle}>{legendTitle}</span>
          <span className={styles.ramp} aria-hidden="true">
            {Array.from({ length: CLASSES }, (_, i) => (
              <i key={i} style={{ background: `var(--rv-map-${i + 1})` }} />
            ))}
          </span>
          <span className={styles.ends}>
            <span>Menor{lo !== null ? ` · ${format(lo)}` : ''}</span>
            <span>{hi !== null ? `${format(hi)} · ` : ''}Mayor</span>
          </span>
          {values.some((v) => v === null) && (
            <span className={styles.empty}>
              <i /> Sin dato o con menos de 50 personas en la lista nominal
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
