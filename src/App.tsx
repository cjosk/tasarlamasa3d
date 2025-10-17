import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DesignerPage } from './pages/DesignerPage';
import { useFirebase } from './providers/FirebaseProvider';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { AuthGate } from './components/auth/AuthGate';
import { LandingPage } from './pages/LandingPage';
import { LibraryPage } from './pages/LibraryPage';

const App = () => {
  const { initializing } = useFirebase();

  if (initializing) {
    return <LoadingScreen message="Initializing workspace" />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/designer"
          element={
            <AuthGate>
              <DesignerPage />
            </AuthGate>
          }
        />
        <Route
          path="/library"
          element={
            <AuthGate>
              <LibraryPage />
            </AuthGate>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;
