// Comic-knalster ("BAM!") in pop-art-stijl: draaiende zonnestralen, rode ster met inktrand en een geel hart.

const SPIKES = [1, 0.82, 0.96, 0.78, 1.04, 0.86, 0.98, 0.8, 1.02, 0.84, 0.95, 0.79];

function star(r: number, inner: number) {
  const n = SPIKES.length;
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const k = i % 2 === 0 ? SPIKES[i / 2] : inner;
    return `${(Math.cos(a) * r * k).toFixed(1)},${(Math.sin(a) * r * k).toFixed(1)}`;
  }).join(' ');
}

const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a0 = (i / 12) * Math.PI * 2;
  const a1 = a0 + Math.PI / 12;
  const p = (a: number) => `${(Math.cos(a) * 58).toFixed(1)},${(Math.sin(a) * 58).toFixed(1)}`;
  return `M0,0 L${p(a0)} L${p(a1)} Z`;
}).join(' ');

export function PopBurst({ text, className = 'h-36 w-36' }: { text: string; className?: string }) {
  const fs = Math.min(30, 96 / (text.length * 0.5));
  return (
    <svg viewBox="-60 -60 120 120" className={`pop-burst animate-pop ${className}`} aria-hidden>
      <g className="animate-pop-spin">
        <path d={RAYS} className="pop-burst-ray" />
      </g>
      <g transform="rotate(-8)">
        <polygon points={star(46, 0.74)} transform="translate(4,4)" className="pop-burst-shadow" />
        <polygon points={star(46, 0.74)} className="pop-burst-star" />
        <polygon points={star(30, 0.84)} className="pop-burst-core" />
        <text y={fs * 0.36} textAnchor="middle" style={{ fontSize: fs }} className="animate-wiggle">
          {text}
        </text>
      </g>
    </svg>
  );
}
