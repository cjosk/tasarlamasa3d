import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import html2canvas from 'html2canvas';
import { useFirebase } from './FirebaseProvider';
import { useDesignStore, selectCurrentDesign } from '../state/designStore';
import { DesignStateData } from '../types/design';
import { exportSceneToGlb } from '../utils/exporters';

interface DesignContextValue {
  saveDesign: (metadata?: { title?: string; public?: boolean }) => Promise<void>;
  loadDesignById: (id: string) => Promise<void>;
  deleteDesign: (id: string) => Promise<void>;
  exporting: boolean;
  exportImage: (element: HTMLElement) => Promise<string>;
  exportGlb: (element: HTMLElement) => Promise<string>;
  canvasRef: React.RefObject<HTMLDivElement>;
}

const DesignContext = createContext<DesignContextValue | undefined>(undefined);

export const DesignProvider = ({ children }: { children: ReactNode }) => {
  const { firestore, storage, authUser } = useFirebase();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const setLoading = useDesignStore((state) => state.setLoading);
  const setError = useDesignStore((state) => state.setError);
  const loadDesign = useDesignStore((state) => state.loadDesign);
  const currentDesign = useDesignStore(selectCurrentDesign);

  const captureThumbnail = useCallback(async () => {
    if (!canvasRef.current) {
      throw new Error('Canvas reference not found');
    }
    const canvas = await html2canvas(canvasRef.current, {
      backgroundColor: '#0f172a',
      scale: 1.5
    });
    return canvas.toDataURL('image/png');
  }, []);

  const uploadThumbnail = useCallback(
    async (designId: string, dataUrl: string) => {
      const blob = await (await fetch(dataUrl)).blob();
      const storageRef = ref(storage, `design-thumbnails/${designId}.png`);
      await uploadBytes(storageRef, blob, {
        cacheControl: 'public,max-age=3600'
      });
      return getDownloadURL(storageRef);
    },
    [storage]
  );

  const exportImage = useCallback(
    async (element: HTMLElement) => {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a',
        scale: 2
      });
      return canvas.toDataURL('image/png');
    },
    []
  );

  const saveDesign = useCallback<DesignContextValue['saveDesign']>(
    async (metadata) => {
      if (!authUser) {
        throw new Error('You need to sign in to save designs');
      }

      try {
        setLoading(true);
        setError(undefined);

        const designDoc = currentDesign.id
          ? doc(firestore, 'designs', currentDesign.id)
          : doc(collection(firestore, 'designs'));

        const designId = designDoc.id;
        const thumbnail = await captureThumbnail();
        const thumbnailUrl = await uploadThumbnail(designId, thumbnail);

        const payload: DesignStateData = {
          ...currentDesign,
          id: designId,
          title: metadata?.title ?? currentDesign.title,
          updatedAt: new Date().toISOString(),
          createdAt: currentDesign.createdAt ?? new Date().toISOString()
        };

        await setDoc(
          designDoc,
          {
            owner: authUser.uid,
            title: payload.title,
            public: metadata?.public ?? false,
            createdAt: currentDesign.createdAt
              ? Timestamp.fromDate(new Date(currentDesign.createdAt))
              : serverTimestamp(),
            updatedAt: serverTimestamp(),
            sceneJSON: payload,
            thumbnailPath: `design-thumbnails/${designId}.png`,
            thumbnailUrl
          },
          { merge: true }
        );

        loadDesign(payload);
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'Failed to save design');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [authUser, captureThumbnail, currentDesign, firestore, loadDesign, setError, setLoading, uploadThumbnail]
  );

  const loadDesignById = useCallback<DesignContextValue['loadDesignById']>(
    async (id) => {
      try {
        setLoading(true);
        const snapshot = await getDoc(doc(firestore, 'designs', id));
        if (!snapshot.exists()) {
          throw new Error('Design not found');
        }
        const data = snapshot.data();
        loadDesign(data.sceneJSON as DesignStateData);
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'Failed to load design');
      } finally {
        setLoading(false);
      }
    },
    [firestore, loadDesign, setError, setLoading]
  );

  const deleteDesign = useCallback<DesignContextValue['deleteDesign']>(
    async (id) => {
      try {
        await deleteDoc(doc(firestore, 'designs', id));
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'Failed to delete design');
      }
    },
    [firestore, setError]
  );

  const exportGlb = useCallback<DesignContextValue['exportGlb']>(
    async (element) => {
      setExporting(true);
      try {
        const glbBlob = await exportSceneToGlb(element);
        const arrayBuffer = await glbBlob.arrayBuffer();
        const binary = String.fromCharCode(...new Uint8Array(arrayBuffer));
        const base64 = btoa(binary);
        return `data:model/gltf-binary;base64,${base64}`;
      } finally {
        setExporting(false);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      saveDesign,
      loadDesignById,
      deleteDesign,
      exporting,
      exportImage,
      exportGlb,
      canvasRef
    }),
    [deleteDesign, exportGlb, exportImage, exporting, loadDesignById, saveDesign]
  );

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
};

export const useDesignContext = () => {
  const ctx = useContext(DesignContext);
  if (!ctx) {
    throw new Error('useDesignContext must be used inside DesignProvider');
  }
  return ctx;
};
