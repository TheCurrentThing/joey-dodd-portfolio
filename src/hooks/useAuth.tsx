import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User } from "@supabase/supabase-js";
import { auth, isAllowedAdminEmail, type Profile } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  hasLessonsAccess: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInMember: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasLessonsAccess, setHasLessonsAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      setHasLessonsAccess(false);
      return;
    }

    const { profile: currentProfile } = await auth.getProfile(currentUser.id);
    setProfile(currentProfile);
    setIsAdmin(Boolean(currentProfile?.is_admin) || isAllowedAdminEmail(currentUser.email));
    setHasLessonsAccess(Boolean(currentProfile?.has_lessons_access));
  };

  useEffect(() => {
    auth.getUser().then(async ({ user: currentUser }) => {
      setUser(currentUser);
      await syncProfile(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      await syncProfile(session?.user ?? null);
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

  const signInMember = async (email: string, password: string) => {
    const { error } = await auth.signInMember(email, password);
    return { error };
  };

  const signOut = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        hasLessonsAccess,
        loading,
        signIn,
        signInMember,
        signOut,
      }}
    >
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
