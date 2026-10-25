import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
