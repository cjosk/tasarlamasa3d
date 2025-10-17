import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, MoonStar, Sun, TableProperties } from 'lucide-react';
import { useDesignStore } from '../../state/designStore';
import { useFirebase } from '../../providers/FirebaseProvider';
import clsx from 'clsx';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  const { authUser, logout } = useFirebase();
  const performance = useDesignStore((state) => state.performance);
  const setPerformance = useDesignStore((state) => state.setPerformance);
  const [menuOpen, setMenuOpen] = useState(false);

  const togglePerformance = () => {
    setPerformance(performance === 'high' ? 'eco' : 'high');
  };

  const navigation = [
    { path: '/', label: 'Home' },
    { path: '/designer', label: 'Designer' },
    { path: '/library', label: 'Library' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-midnight/95 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-md border border-slate-800/70 p-2 text-slate-200 lg:hidden"
              aria-label="Toggle navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
              <TableProperties className="h-5 w-5 text-neon-blue" />
              Neon Table Designer
            </Link>
          </div>
          <nav className="hidden items-center gap-2 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ease-micro',
                  location.pathname === item.path
                    ? 'bg-slate-800/80 text-white shadow-panel'
                    : 'text-slate-300 hover:bg-slate-800/40'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={togglePerformance}
              className="hidden rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-neon-blue/80 hover:text-white md:inline-flex"
            >
              <span className="flex items-center gap-1">
                {performance === 'high' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <MoonStar className="h-4 w-4" />
                )}
                {performance === 'high' ? 'High Fidelity' : 'Eco Mode'}
              </span>
            </button>
            {authUser ? (
              <button
                onClick={() => logout()}
                className="rounded-full bg-neon-blue/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-neon-blue/20 transition hover:bg-neon-blue"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/designer"
                className="rounded-full bg-neon-pink/80 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-neon-pink/20 transition hover:bg-neon-pink"
              >
                Launch App
              </Link>
            )}
          </div>
        </div>
        <div
          className={clsx(
            'border-t border-slate-800/80 bg-slate-900/90 transition-all duration-150 ease-micro lg:hidden',
            menuOpen ? 'max-h-48 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
          )}
        >
          <nav className="flex flex-col px-6 py-2">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  location.pathname === item.path
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800/40'
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={togglePerformance}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            >
              {performance === 'high' ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              Performance: {performance === 'high' ? 'High' : 'Eco'}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
};
