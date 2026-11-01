// Terugknop bovenaan een subpagina: naar een vaste route (`to`) of terug in de geschiedenis.
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

const cls = '-ml-2 inline-flex min-h-touch items-center gap-0.5 pr-3 text-sm font-semibold text-accent';

export function BackLink({ to, label }: { to?: string; label: string }) {
  const navigate = useNavigate();
  const content = (
    <>
      <Icon name="chevron-left" className="h-5 w-5" />
      {label}
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={() => navigate(-1)} className={cls}>
      {content}
    </button>
  );
}
