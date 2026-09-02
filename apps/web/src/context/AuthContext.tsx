import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { app } from '@/application/ApplicationService';
import type { User, Workspace } from '@/domain/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const session = await app.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);

      if (session?.user) {
        const ws = await app.workspaces.getWorkspacesForUser(session.user.id);
        if (!mounted) return;
        setWorkspaces(ws);
        if (ws.length > 0 && !activeWorkspace) {
          setActiveWorkspace(ws[0]);
        }
      }
      setLoading(false);
    })();

    const unsubscribe = app.auth.onAuthStateChange((session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (!session) {
        setWorkspaces([]);
        setActiveWorkspace(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const refreshWorkspaces = async () => {
    if (!user) return;
    const ws = await app.workspaces.getWorkspacesForUser(user.id);
    setWorkspaces(ws);
    if (ws.length > 0 && !activeWorkspace) {
      setActiveWorkspace(ws[0]);
    }
  };

  const signOut = async () => {
    await app.auth.signOut();
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspace(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        workspaces,
        activeWorkspace,
        setActiveWorkspace,
        refreshWorkspaces,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
