import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFirebase } from '../providers/FirebaseProvider';
import {
  DocumentData,
  collection,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { useDesignContext } from '../providers/DesignProvider';

interface DesignRecord {
  id: string;
  title: string;
  thumbnailUrl?: string;
  updatedAt?: string;
}

export const LibraryPage = () => {
  const { firestore, authUser } = useFirebase();
  const { deleteDesign } = useDesignContext();
  const [designs, setDesigns] = useState<DesignRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) return;
    const q = query(
      collection(firestore, 'designs'),
      where('owner', '==', authUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const next = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          title: data.title ?? 'Untitled',
          thumbnailUrl: data.thumbnailUrl,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? undefined
        };
      });
      setDesigns(next);
      setLoading(false);
    });

    return () => unsub();
  }, [authUser, firestore]);

  if (!authUser) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-800/80 bg-slate-900/80 p-12 text-center text-slate-200 shadow-panel">
        <p>Please sign in to view your library.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold text-white">Your neon tables</h1>
        <p className="text-slate-400">Saved designs synced to Firebase.</p>
      </header>
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
        </div>
      ) : designs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700/70 bg-slate-900/80 p-12 text-center text-slate-400">
          No designs yet. Create your first glowing centrepiece!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {designs.map((design) => (
            <article
              key={design.id}
              className="group flex flex-col rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-panel transition hover:border-neon-blue/60"
            >
              <div className="relative aspect-video overflow-hidden rounded-t-3xl bg-slate-800/40">
                {design.thumbnailUrl ? (
                  <img
                    src={design.thumbnailUrl}
                    alt={design.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">No preview</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="text-lg font-semibold text-white">{design.title}</h3>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Updated {design.updatedAt ? new Date(design.updatedAt).toLocaleString() : 'recently'}
                </p>
                <div className="mt-auto flex items-center gap-3">
                  <Link
                    to={`/designer?design=${design.id}`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-neon-blue/80 px-4 py-2 text-sm font-semibold text-white hover:bg-neon-blue"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteDesign(design.id)}
                    className="rounded-full border border-slate-700/70 p-2 text-slate-300 hover:border-rose-500/70 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
