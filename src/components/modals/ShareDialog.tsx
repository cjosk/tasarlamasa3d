import { useDesignStore } from '../../state/designStore';
import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ShareDialog = ({ open, onClose }: ShareDialogProps) => {
  const design = useDesignStore((state) => state.history.present);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/designer?design=${design.id ?? 'draft'}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 text-slate-100 shadow-panel">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-neon-pink/20 p-2 text-neon-pink">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Share design</h2>
            <p className="text-sm text-slate-400">Copy the link and send it to your collaborators.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/80 px-4 py-3 text-sm">
          <span className="truncate text-slate-300">{shareUrl}</span>
          <button
            onClick={copy}
            className="flex items-center gap-2 rounded-full border border-slate-700/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-200 hover:border-neon-blue/70 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 hover:border-neon-blue/70 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
