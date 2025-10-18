import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-midnight/95 text-slate-100">
      <main className="min-h-screen">{children}</main>
    </div>
  );
};
