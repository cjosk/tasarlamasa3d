interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = 'Loading' }: LoadingScreenProps) => (
  <div className="flex h-screen items-center justify-center bg-midnight">
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/80 px-8 py-10 shadow-panel">
      <span className="h-16 w-16 animate-spin rounded-full border-4 border-neon-blue/40 border-t-neon-blue"></span>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">{message}</p>
    </div>
  </div>
);
