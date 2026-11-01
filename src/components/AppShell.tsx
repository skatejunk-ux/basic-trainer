import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col bg-bg text-fg">
      <main className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
