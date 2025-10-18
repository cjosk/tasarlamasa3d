import { FormEvent, useState } from 'react';
import { useDesignContext } from '../../providers/DesignProvider';
import { useDesignStore } from '../../state/designStore';
import { Loader2, Save, Shield } from 'lucide-react';

interface SaveModalProps {
  open: boolean;
  onClose: () => void;
}

export const SaveModal = ({ open, onClose }: SaveModalProps) => {
  const { saveDesign } = useDesignContext();
  const design = useDesignStore((state) => state.history.present);
  const setTitle = useDesignStore((state) => state.setTitle);
  const advanceOnboarding = useDesignStore((state) => state.advanceOnboarding);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = (formData.get('title') as string) || design.title;
    try {
      setSaving(true);
      setError(undefined);
      setTitle(title);
      await saveDesign({ title, public: isPublic });
      advanceOnboarding();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 text-slate-100 shadow-panel">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="font-display text-xl font-semibold">Save neon table</h2>
            <p className="text-sm text-slate-400">
              Store your layout in the cloud and access it from anywhere.
            </p>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Title</span>
            <input
              name="title"
              defaultValue={design.title}
              className="rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-white outline-none focus:border-neon-blue"
              placeholder="My neon table"
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="h-4 w-4 accent-neon-blue"
            />
            <div>
              <p className="font-semibold">Make public</p>
              <p className="text-xs text-slate-400">Allow others to view this design via share link.</p>
            </div>
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 hover:border-neon-pink/80 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-neon-blue/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-neon-blue/30 hover:bg-neon-blue disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save to cloud
            </button>
          </div>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
            <Shield className="h-3 w-3" />
            Synced with Firebase
          </p>
        </form>
      </div>
    </div>
  );
};
