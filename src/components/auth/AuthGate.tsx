import { ReactNode } from 'react';
import { useFirebase } from '../../providers/FirebaseProvider';
import { AuthModal } from './AuthModal';
import { LoadingScreen } from '../ui/LoadingScreen';
import { useNavigate } from 'react-router-dom';

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { authUser, authLoading } = useFirebase();
  const navigate = useNavigate();

  if (authLoading) {
    return <LoadingScreen message="Connecting to Firebase" />;
  }

  if (!authUser) {
    return <AuthModal open onClose={() => navigate('/')} />;
  }

  return <>{children}</>;
};
