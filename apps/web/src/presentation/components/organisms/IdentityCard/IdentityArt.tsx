import { useId } from 'react';
import type { CardTheme } from './themes';
import styles from './IdentityCard.module.css';

const YEARS = ['09', '12', '15', '18', '21', '24'] as const;
const x = (i: number) => 22 + i * 47;
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });
const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} L${cx + r * 0.28} ${cy - r * 0.28} L${cx + r} ${cy} L${cx + r * 0.28} ${cy + r * 0.28} L${cx} ${cy + r} L${cx - r * 0.28} ${cy + r * 0.28} L${cx - r} ${cy} L${cx - r * 0.28} ${cy - r * 0.28} Z`;

function Years({ color }: { color: string }) {
  return (
    <>
      {YEARS.map((y, i) => (
        <text
          key={y}
          x={x(i) + 16}
          y={226}
          textAnchor="middle"
          fontFamily="Plus Jakarta Sans, sans-serif"
          fontSize={11}
          fontWeight={700}
          fill={color}
        >
          {y}
        </text>
      ))}
    </>
  );
}

function AlwaysPresent({ t }: { t: CardTheme }) {
  return (
    <>
      {(
        [
          [40, 0.5],
          [75, 0.35],
          [110, 0.22],
          [145, 0.12],
        ] as const
      ).map(([r, o]) => (
        <circle
          key={r}
          cx={156}
          cy={120}
          r={r}
          fill="none"
          stroke={t.accent}
          strokeOpacity={o}
          strokeWidth={1.5}
        />
      ))}
      {YEARS.map((y, i) => (
        <rect
          key={y}
          className={styles.grow}
          style={delay(i * 80)}
          x={x(i)}
          y={54}
          width={32}
          height={152}
          rx={16}
          fill={t.accent}
        />
      ))}
      <line
        x1={10}
        x2={302}
        y1={150}
        y2={150}
        stroke={t.ink}
        strokeWidth={2}
        strokeDasharray="6 6"
        opacity={0.7}
      />
      <Years color={t.sub} />
    </>
  );
}

function Rising({ t }: { t: CardTheme }) {
  const heights = [40, 66, 92, 118, 150, 186];
  const rays = [
    [-1, 0],
    [-0.7, -0.7],
    [0, -1],
    [0.7, -0.7],
    [-0.92, 0.38],
  ] as const;
  return (
    <>
      <g className={styles.sun}>
        {rays.map(([c, s]) => (
          <line
            key={`${c}${s}`}
            x1={262}
            y1={44}
            x2={262 + 52 * c}
            y2={44 + 52 * s}
            stroke={t.accent}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}
        <circle cx={262} cy={44} r={26} fill={t.accent} />
      </g>
      {heights.map((h, i) => (
        <rect
          key={h}
          className={styles.grow}
          style={delay(i * 90)}
          x={x(i)}
          y={206 - h}
          width={34}
          height={h}
          rx={6}
          fill={t.ink}
          fillOpacity={0.35 + i * 0.11}
        />
      ))}
      <path
        d="M30 150 L120 104 L190 70 L238 40"
        fill="none"
        stroke={t.accent}
        strokeWidth={5}
        strokeLinecap="round"
        className={styles.draw}
        pathLength={1}
      />
      <path
        d="M226 32 L242 38 L234 54"
        fill="none"
        stroke={t.accent}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Years color={t.sub} />
    </>
  );
}

const COASTER =
  'M8 170 C40 170 46 60 78 60 C108 60 112 196 140 196 C164 196 150 96 186 96 C226 96 222 150 196 150 C170 150 180 40 226 40 C262 40 268 170 304 120';

function RollerCoaster({ t }: { t: CardTheme }) {
  const cars = [
    [20, 166],
    [78, 60],
    [140, 196],
    [190, 96],
    [226, 40],
    [296, 126],
  ] as const;
  const stars = [
    [30, 30, 2],
    [120, 20, 1.5],
    [160, 60, 1.2],
    [290, 70, 2],
    [60, 120, 1.2],
    [250, 200, 1.5],
  ] as const;
  return (
    <>
      {stars.map(([cx, cy, r]) => (
        <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill="#ffffff" opacity={0.8} />
      ))}
      <path
        d={COASTER}
        fill="none"
        stroke={t.accent}
        strokeOpacity={0.25}
        strokeWidth={18}
        strokeLinecap="round"
      />
      <path
        d={COASTER}
        fill="none"
        stroke={t.accent}
        strokeWidth={6}
        strokeLinecap="round"
        className={styles.draw}
        pathLength={1}
      />
      {cars.map(([cx, cy], i) => (
        <circle
          key={cx}
          cx={cx}
          cy={cy}
          r={7}
          fill="#ffe600"
          stroke="#1b0638"
          strokeWidth={3}
          className={styles.pop}
          style={delay(400 + i * 90)}
        />
      ))}
    </>
  );
}

function BigElection({ t }: { t: CardTheme }) {
  const id = useId().replace(/:/g, '');
  const heights = [70, 170, 78, 178, 86, 186];
  return (
    <>
      <defs>
        <linearGradient id={`cone${id}`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset={0} stopColor={t.ink} stopOpacity={0.9} />
          <stop offset={1} stopColor={t.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      {heights.map((h, i) =>
        i % 2 ? (
          <polygon
            key={h}
            points={`${x(i) + 16},-10 ${x(i) - 14},${206 - h} ${x(i) + 46},${206 - h}`}
            fill={`url(#cone${id})`}
            opacity={0.55}
          />
        ) : null,
      )}
      {(
        [
          [40, 40],
          [150, 22],
          [280, 54],
        ] as const
      ).map(([cx, cy]) => (
        <path key={cx} d={sparkle(cx, cy, 7)} fill={t.ink} />
      ))}
      {heights.map((h, i) => (
        <rect
          key={`b${h}`}
          className={styles.grow}
          style={delay(i * 80)}
          x={x(i)}
          y={206 - h}
          width={32}
          height={h}
          rx={4}
          fill={i % 2 ? t.accent : t.sub}
          fillOpacity={i % 2 ? 1 : 0.45}
        />
      ))}
      <Years color={t.sub} />
    </>
  );
}

function SlowingDown({ t }: { t: CardTheme }) {
  const heights = [186, 160, 132, 110, 86, 66];
  return (
    <>
      <g className={styles.moon}>
        <circle cx={262} cy={46} r={24} fill={t.ink} />
        <circle cx={272} cy={38} r={22} fill="#3b5873" />
      </g>
      {heights.map((h, i) => (
        <rect
          key={h}
          className={styles.grow}
          style={delay(i * 90)}
          x={x(i)}
          y={206 - h}
          width={34}
          height={h}
          rx={17}
          fill={t.ink}
          fillOpacity={0.85 - i * 0.1}
        />
      ))}
      <path
        d="M0 214 C60 196 110 222 160 208 C210 194 260 216 312 204"
        fill="none"
        stroke={t.accent}
        strokeWidth={5}
        strokeLinecap="round"
        className={styles.draw}
        pathLength={1}
      />
      <Years color={t.sub} />
    </>
  );
}

const CONFETTI = [
  [30, 40, '#ff2d94', 18],
  [70, 20, '#ffc93c', -24],
  [250, 30, '#7b45d6', 30],
  [280, 120, '#00b4d8', -12],
  [40, 160, '#00b4d8', 40],
  [110, 200, '#ffc93c', 10],
  [220, 196, '#ff2d94', -30],
  [180, 26, '#00a37a', 22],
  [20, 100, '#7b45d6', -8],
  [296, 70, '#ff2d94', 12],
] as const;

function Debut() {
  return (
    <>
      {CONFETTI.map(([cx, cy, color, r], i) => (
        <rect
          key={`${cx}${cy}`}
          className={styles.pop}
          style={delay(300 + i * 50)}
          x={cx}
          y={cy}
          width={12}
          height={6}
          rx={2}
          fill={color}
          transform={`rotate(${r} ${cx + 6} ${cy + 3})`}
        />
      ))}
      <g className={styles.pop} style={delay(120)}>
        <g transform="rotate(-8 156 120)">
          <rect
            x={76}
            y={66}
            width={160}
            height={104}
            rx={12}
            fill="#ffffff"
            stroke="#171824"
            strokeWidth={4}
          />
          <rect
            x={92}
            y={84}
            width={44}
            height={54}
            rx={8}
            fill="#ffd9ec"
            stroke="#171824"
            strokeWidth={3}
          />
          <circle cx={114} cy={104} r={10} fill="#ff2d94" />
          <rect x={148} y={88} width={72} height={9} rx={4} fill="#171824" />
          <rect x={148} y={106} width={56} height={7} rx={3} fill="#c9c1c7" />
          <rect x={148} y={121} width={64} height={7} rx={3} fill="#c9c1c7" />
          <rect x={92} y={148} width={128} height={8} rx={4} fill="#ffd9ec" />
        </g>
      </g>
      <g className={styles.pop} style={delay(700)}>
        <circle cx={240} cy={64} r={26} fill="#ff2d94" stroke="#171824" strokeWidth={3} />
        <text
          x={240}
          y={72}
          textAnchor="middle"
          fontFamily="Bricolage Grotesque, sans-serif"
          fontWeight={800}
          fontSize={22}
          fill="#ffffff"
        >
          1ª
        </text>
      </g>
    </>
  );
}

function FirstTime() {
  return (
    <>
      <g className={styles.pop} style={delay(100)}>
        <path
          d="M86 30 H206 L236 60 V214 H86 Z"
          fill="#ffffff"
          stroke="#0d3b2e"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <path
          d="M206 30 V60 H236"
          fill="#e9fff4"
          stroke="#0d3b2e"
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <rect x={104} y={80} width={80} height={8} rx={4} fill="#c8f5df" />
        <rect x={104} y={98} width={110} height={8} rx={4} fill="#c8f5df" />
      </g>
      <rect
        x={128}
        y={126}
        width={64}
        height={64}
        rx={10}
        fill="none"
        stroke="#00a37a"
        strokeWidth={5}
        strokeDasharray="10 8"
      />
      <g className={styles.pop} style={delay(600)}>
        <g transform="translate(-26 0) rotate(35 250 150)">
          <rect
            x={236}
            y={96}
            width={22}
            height={96}
            rx={4}
            fill="#ffc93c"
            stroke="#0d3b2e"
            strokeWidth={3}
          />
          <path
            d="M236 192 L247 214 L258 192 Z"
            fill="#f4d9b0"
            stroke="#0d3b2e"
            strokeWidth={3}
            strokeLinejoin="round"
          />
        </g>
      </g>
      {(
        [
          [52, 70],
          [270, 44],
          [48, 180],
        ] as const
      ).map(([cx, cy], i) => (
        <path
          key={cx}
          className={styles.pop}
          style={delay(800 + i * 120)}
          d={sparkle(cx, cy, 9)}
          fill="#00a37a"
        />
      ))}
    </>
  );
}

function Mystery({ t }: { t: CardTheme }) {
  return (
    <>
      <g className={styles.pop} style={delay(120)}>
        <g transform="rotate(-6 156 120)">
          <rect
            x={76}
            y={62}
            width={160}
            height={108}
            rx={14}
            fill="#ffffff"
            stroke={t.ink}
            strokeWidth={3}
            strokeDasharray="10 8"
          />
          <rect x={92} y={82} width={44} height={56} rx={8} fill="#ffe3f1" />
          <rect x={148} y={88} width={72} height={9} rx={4} fill="#eee7ec" />
          <rect x={148} y={106} width={56} height={7} rx={3} fill="#eee7ec" />
          <rect x={148} y={121} width={64} height={7} rx={3} fill="#eee7ec" />
        </g>
      </g>
      <g className={styles.pop} style={delay(520)}>
        <circle cx={240} cy={60} r={28} fill={t.accent} stroke={t.ink} strokeWidth={3} />
        <text
          x={240}
          y={70}
          textAnchor="middle"
          fontFamily="Bricolage Grotesque, sans-serif"
          fontWeight={800}
          fontSize={30}
          fill="#ffffff"
        >
          ?
        </text>
      </g>
      {(
        [
          [48, 60],
          [62, 186],
          [272, 176],
        ] as const
      ).map(([cx, cy], i) => (
        <path
          key={cx}
          className={styles.pop}
          style={delay(760 + i * 120)}
          d={sparkle(cx, cy, 8)}
          fill={t.accent}
        />
      ))}
    </>
  );
}

const ART = {
  A1: AlwaysPresent,
  A2: Rising,
  A3: RollerCoaster,
  A4: BigElection,
  A5: SlowingDown,
  I1: Debut,
  I6: FirstTime,
  mystery: Mystery,
} as const;

/** Card illustration (viewBox 312 × 230). Decorative: the card text says the same. */
export function IdentityArt({ theme, className }: { theme: CardTheme; className?: string }) {
  const Art = ART[theme.art];
  return (
    <svg className={className} viewBox="0 0 312 230" aria-hidden="true" focusable="false">
      <Art t={theme} />
    </svg>
  );
}
