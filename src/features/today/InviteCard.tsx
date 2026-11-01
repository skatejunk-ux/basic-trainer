// Basic-Fit-uitnodiging (vriendenlink) bovenaan Vandaag: openen of delen.
import { nl } from '../../content/nl';
import { Icon } from '../../components/Icon';

export const INVITE_URL = 'https://member.basic-fit.com/friends/nl-NL/join/4HF7N9RG';

const t = nl.today.invite;

export function InviteCard() {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div className="card flex items-center gap-1 p-1.5" data-testid="invite-card">
      <a
        href={INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-touch flex-1 items-center gap-3 rounded-xl px-2 font-semibold active:bg-surface-2"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Icon name="user-plus" className="h-[18px] w-[18px]" />
        </span>
        <span className="flex-1">{t.title}</span>
        <Icon name="external" className="h-4 w-4 text-muted" />
      </a>
      {canShare && (
        <button
          type="button"
          aria-label={t.share}
          className="icon-btn"
          onClick={() => void navigator.share({ title: t.title, text: t.shareText, url: INVITE_URL }).catch(() => {})}
        >
          <Icon name="share" className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  );
}
