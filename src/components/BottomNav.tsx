import { NavLink } from 'react-router-dom';
import { nl } from '../content/nl';
import { Icon, type IconName } from './Icon';

const tabs: { to: string; label: string; end: boolean; icon: IconName }[] = [
  { to: '/', label: nl.nav.today, end: true, icon: 'home' },
  { to: '/historie', label: nl.nav.history, end: false, icon: 'history' },
  { to: '/schema', label: nl.nav.schema, end: false, icon: 'clipboard' },
  { to: '/meer', label: nl.nav.more, end: false, icon: 'sliders' },
];

export function BottomNav() {
  return (
    <nav
      aria-label={nl.nav.label}
      className="border-t-2 border-ink bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="flex">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `group flex min-h-[60px] min-w-touch flex-col items-center justify-center gap-1 font-pop text-[13px] tracking-[0.06em] ${
                  isActive ? 'text-fg' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-14 items-center justify-center rounded-full border-2 transition-all ${
                      isActive ? '-rotate-3 border-ink bg-pop text-pop-fg shadow-comic-sm' : 'border-transparent'
                    }`}
                  >
                    <Icon name={t.icon} className="h-[22px] w-[22px]" />
                  </span>
                  <span>{t.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
