import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User } from "@supabase/supabase-js";
import { auth, isAllowedAdminEmail } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getUser().then(({ user: currentUser }) => {
      setUser(currentUser);
      setIsAdmin(isAllowedAdminEmail(currentUser?.email));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(isAllowedAdminEmail(session?.user?.email));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isAllowedAdminEmail(email)) {
      return {
        error: new Error("This email is not authorized for admin access."),
      };
    }

    const { error } = await auth.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
