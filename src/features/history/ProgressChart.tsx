// Lijngrafiek van de voortgang (dataviz-skill: 2px lijnen, markers met surface-ring, één as,
// recessief raster, tik/hover-tooltip met crosshair, legenda + directe labels bij 2 reeksen).
import { useState } from 'react';
import { formatKg } from '../../coach';
import { nl } from '../../content/nl';
import { niceScale, type ProgressSeries } from './progress';

const W = 340;
const H = 190;
const PAD = { l: 40, r: 44, t: 12, b: 26 };
const COLORS: Record<ProgressSeries['key'], string> = {
  all: 'var(--series-1)',
  L: 'var(--series-1)',
  R: 'var(--series-2)',
};
const dateFmt = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });

interface Props {
  series: ProgressSeries[];
  unit: 'kg' | 'min';
  title: string;
}

export function ProgressChart({ series, unit, title }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const all = series.flatMap((s) => s.points);
  const times = [...new Set(all.map((p) => p.sessionId))]
    .map((id) => ({ id, at: Math.min(...all.filter((p) => p.sessionId === id).map((p) => p.at)) }))
    .sort((a, b) => a.at - b.at);
  if (times.length < 2) return null;

  const { lo, hi, step } = niceScale(Math.min(...all.map((p) => p.value)), Math.max(...all.map((p) => p.value)));
  const x = (i: number) => PAD.l + (i / (times.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const idx = Object.fromEntries(times.map((t, i) => [t.id, i]));
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10);
  const labelEvery = Math.ceil(times.length / 4);
  const fmt = (v: number) => (unit === 'kg' ? `${formatKg(v)} kg` : `${v} min`);
  const sideName = (k: ProgressSeries['key']) => (k === 'all' ? '' : nl.workout.side[k]);
  const multi = series.length > 1;

  return (
    <figure className="rounded-2xl bg-surface p-3">
      <figcaption className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{title}</span>
        {multi && (
          <span className="flex gap-3 text-muted">
            {series.map((s) => (
              <span key={s.key} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[s.key] }} />
                {sideName(s.key)}
              </span>
            ))}
          </span>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none select-none" role="img" aria-label={title}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} stroke="rgb(var(--color-border))" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--color-muted))">
              {formatKg(v)}
            </text>
          </g>
        ))}
        {times.map((t, i) =>
          i % labelEvery === 0 || i === times.length - 1 ? (
            <text key={t.id} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="rgb(var(--color-muted))">
              {dateFmt.format(t.at)}
            </text>
          ) : null,
        )}
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="rgb(var(--color-muted))"
            strokeDasharray="3 3"
          />
        )}
        {series.map((s) => {
          const pts = s.points.map((p) => [x(idx[p.sessionId]), y(p.value)] as const);
          const last = s.points[s.points.length - 1];
          return (
            <g key={s.key}>
              <polyline
                points={pts.map((p) => p.join(',')).join(' ')}
                fill="none"
                stroke={COLORS[s.key]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {pts.map(([px, py], i) => (
                <circle
                  key={s.points[i].sessionId}
                  cx={px}
                  cy={py}
                  r={hover === idx[s.points[i].sessionId] ? 5.5 : 4}
                  fill={COLORS[s.key]}
                  stroke="rgb(var(--color-surface))"
                  strokeWidth={2}
                />
              ))}
              {last && (
                <text
                  x={x(idx[last.sessionId]) + 8}
                  y={y(last.value) + 4}
                  fontSize="11"
                  fontWeight="600"
                  fill="rgb(var(--color-fg))"
                >
                  {multi ? sideName(s.key) : formatKg(last.value)}
                </text>
              )}
            </g>
          );
        })}
        {/* Raakvlakken groter dan de markers */}
        {times.map((t, i) => {
          const half = times.length > 1 ? (W - PAD.l - PAD.r) / (times.length - 1) / 2 : 20;
          return (
            <rect
              key={t.id}
              x={x(i) - half}
              y={0}
              width={half * 2}
              height={H}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            />
          );
        })}
      </svg>
      {hover !== null && (
        <div className="mt-1 rounded-lg bg-surface-2 px-3 py-2 text-sm" role="status">
          <span className="font-semibold">{dateFmt.format(times[hover].at)}</span>
          {series.map((s) => {
            const p = s.points.find((pt) => pt.sessionId === times[hover].id);
            if (!p) return null;
            return (
              <span key={s.key} className="ml-3">
                {multi && <span className="text-muted">{sideName(s.key)} </span>}
                {fmt(p.value)}
                {p.reps !== undefined && ` × ${p.reps}`}
                {p.e1rm !== undefined && <span className="text-muted"> · 1RM ≈ {formatKg(p.e1rm)}</span>}
              </span>
            );
          })}
        </div>
      )}
    </figure>
  );
}
