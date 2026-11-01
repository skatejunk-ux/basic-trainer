// Basic-Fit-uitnodiging (vriendenlink) bovenaan Vandaag: openen of delen.
import { nl } from '../../content/nl';

export const INVITE_URL = 'https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG';

const t = nl.today.invite;

export function InviteCard() {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface p-2" data-testid="invite-card">
      <a
        href={INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-touch flex-1 items-center gap-2 rounded-xl px-2 font-semibold active:bg-surface-2"
      >
        🤝 <span className="flex-1">{t.title}</span>
        <span className="text-accent">↗</span>
      </a>
      {canShare && (
        <button
          type="button"
          aria-label={t.share}
          className="btn-secondary"
          onClick={() => void navigator.share({ title: t.title, text: t.shareText, url: INVITE_URL }).catch(() => {})}
        >
          📤
        </button>
      )}
    </div>
  );
}
