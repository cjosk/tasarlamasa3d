import { FormEvent, useState } from 'react';
import { XCircle, Mail, Lock, UserCircle2, Loader2, Sparkles } from 'lucide-react';
import { useFirebase } from '../../providers/FirebaseProvider';
import clsx from 'clsx';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const { signInWithGoogle, signInWithEmail, registerWithEmail } = useFirebase();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!open) return null;

  const handleEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    try {
      setLoading(true);
      setError(undefined);
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, displayName);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/70 bg-slate-900/90 p-8 shadow-panel">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full p-1 text-slate-400 transition hover:bg-slate-800/80 hover:text-white"
          aria-label="Close"
        >
          <XCircle className="h-5 w-5" />
        </button>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-neon-pink/20 p-3 text-neon-pink">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Sign in to design</h2>
              <p className="text-sm text-slate-400">
                {mode === 'signin'
                  ? 'Continue your neon creations or start fresh.'
                  : 'Create an account to save and share tables.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2 rounded-full bg-slate-800/60 p-1 text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => setMode('signin')}
              className={clsx(
                'flex-1 rounded-full px-4 py-2 transition',
                mode === 'signin' ? 'bg-slate-900 text-white' : 'text-slate-400'
              )}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={clsx(
                'flex-1 rounded-full px-4 py-2 transition',
                mode === 'signup' ? 'bg-slate-900 text-white' : 'text-slate-400'
              )}
            >
              Create account
            </button>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleEmail}>
            {mode === 'signup' && (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm focus-within:border-neon-pink/80">
                <UserCircle2 className="h-5 w-5 text-slate-500" />
                <input
                  name="displayName"
                  required
                  placeholder="Display name"
                  className="w-full bg-transparent text-white outline-none"
                />
              </label>
            )}
            <label className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm focus-within:border-neon-pink/80">
              <Mail className="h-5 w-5 text-slate-500" />
              <input
                name="email"
                required
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent text-white outline-none"
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm focus-within:border-neon-pink/80">
              <Lock className="h-5 w-5 text-slate-500" />
              <input
                name="password"
                required
                minLength={6}
                type="password"
                placeholder="Password"
                className="w-full bg-transparent text-white outline-none"
              />
            </label>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-full bg-neon-blue/80 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-neon-blue/30 transition hover:bg-neon-blue disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-slate-700/80" />
            <span className="text-xs uppercase tracking-[0.4em] text-slate-500">Or</span>
            <span className="h-px flex-1 bg-slate-700/80" />
          </div>
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="flex items-center justify-center gap-3 rounded-full border border-slate-700/80 bg-slate-900/80 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-neon-pink/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};
