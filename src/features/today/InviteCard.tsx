// Basic-Fit-uitnodiging (vriendenlink) als QR-code op Vandaag; tik om groot te tonen voor het scannen.
import { useMemo, useState } from 'react';
import { nl } from '../../content/nl';
import { Sheet } from '../../components/Sheet';
import { encodeQr, qrPath } from './qr';

export const INVITE_URL = 'https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG';
const QUIET_ZONE = 4; // stille zone volgens de standaard, voor betrouwbaar scannen

const t = nl.today.invite;

function QrImage({ className }: { className?: string }) {
  const { path, size } = useMemo(() => {
    const qr = encodeQr(INVITE_URL);
    return { path: qrPath(qr, QUIET_ZONE), size: qr.size + QUIET_ZONE * 2 };
  }, []);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={`rounded-xl bg-white ${className ?? ''}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR-code: ${INVITE_URL}`}
    >
      <path d={path} fill="#000" />
    </svg>
  );
}

export function InviteCard() {
  const [big, setBig] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div className="rounded-2xl bg-surface p-4" data-testid="invite-card">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setBig(true)} aria-label={t.enlarge} className="shrink-0">
          <QrImage className="h-28 w-28" />
        </button>
        <div className="min-w-0">
          <p className="font-semibold">🤝 {t.title}</p>
          <p className="mt-1 text-sm text-muted">{t.text}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <a href={INVITE_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 text-sm">
          ↗ {t.open}
        </a>
        {canShare && (
          <button
            type="button"
            className="btn-secondary flex-1 text-sm"
            onClick={() => void navigator.share({ title: t.title, text: t.shareText, url: INVITE_URL }).catch(() => {})}
          >
            📤 {t.share}
          </button>
        )}
      </div>
      <Sheet title={t.big} open={big} onClose={() => setBig(false)}>
        <QrImage className="mx-auto w-full max-w-[360px]" />
      </Sheet>
    </div>
  );
}
