import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  DocumentData,
  Firestore,
  Query,
  collection,
  doc,
  getFirestore,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';

interface FirebaseContextValue {
  app: FirebaseApp;
  authUser: User | null | undefined;
  authLoading: boolean;
  initializing: boolean;
  auth: ReturnType<typeof getAuth>;
  firestore: Firestore;
  storage: FirebaseStorage;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  ensureUserDocument: (user: User) => Promise<void>;
  userDesignsQuery: () => Query<DocumentData>;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

const firebaseConfig: FirebaseOptions = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyDrs5LpAXlWl4Pz0r_6HMM3omv1zhznXB4',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'neon3dmasa.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'neon3dmasa',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'neon3dmasa.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '864857581603',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ?? '1:864857581603:web:fb0e5054ce10a2d1ee2996',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-Q02N904T4L'
};

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [app] = useState(() => initializeApp(firebaseConfig));
  const [initializing, setInitializing] = useState(true);

  const auth = useMemo(() => getAuth(app), [app]);
  const firestore = useMemo(() => getFirestore(app), [app]);
  const storage = useMemo(() => getStorage(app), [app]);

  const [authUser, authLoading] = useAuthState(auth);

  useEffect(() => {
    const persist = async () => {
      await setPersistence(auth, browserLocalPersistence);
    };
    persist();
  }, [auth]);

  const ensureUserDocument = useCallback(
    async (user: User) => {
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(
        userRef,
        {
          email: user.email,
          displayName: user.displayName ?? 'Designer',
          photoURL: user.photoURL ?? null
        },
        { merge: true }
      );
    },
    [firestore]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await ensureUserDocument(user);
      }
      setInitializing(false);
    });

    return () => unsubscribe();
  }, [auth, ensureUserDocument]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      await ensureUserDocument(credential.user);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value: FirebaseContextValue = {
    app,
    authUser,
    authLoading,
    initializing,
    auth,
    firestore,
    storage,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    logout,
    ensureUserDocument,
    userDesignsQuery: () =>
      query(collection(firestore, 'designs'), orderBy('updatedAt', 'desc'))
  };

  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return ctx;
};
