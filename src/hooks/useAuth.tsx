import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User } from "@supabase/supabase-js";
import { auth, isAllowedAdminEmail, type Profile } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  hasLessonsAccess: boolean;
  ownedLessonModuleIds: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInMember: (email: string, password: string) => Promise<{ error: any }>;
  signUpMember: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasLessonsAccess, setHasLessonsAccess] = useState(false);
  const [ownedLessonModuleIds, setOwnedLessonModuleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setIsAdmin(false);
      setHasLessonsAccess(false);
      setOwnedLessonModuleIds([]);
      return;
    }

    try {
      let { profile: currentProfile } = await auth.getProfile(currentUser.id);

      if (!currentProfile) {
        const ensured = await auth.ensureProfile(currentUser.id);
        currentProfile = ensured.profile;
      }

      const { lessonAccess, error: lessonAccessError } = await auth.getUserLessonAccess(currentUser.id);

      if (lessonAccessError) {
        throw lessonAccessError;
      }

      setProfile(currentProfile);
      setIsAdmin(Boolean(currentProfile?.is_admin) || isAllowedAdminEmail(currentUser.email));
      setHasLessonsAccess(Boolean(currentProfile?.has_lessons_access));
      setOwnedLessonModuleIds(lessonAccess.map((entry) => entry.module_id));
    } catch {
      setProfile(null);
      setIsAdmin(isAllowedAdminEmail(currentUser.email));
      setHasLessonsAccess(false);
      setOwnedLessonModuleIds([]);
    }
  };

  useEffect(() => {
    let active = true;

    const applyUser = async (currentUser: User | null) => {
      if (!active) {
        return;
      }

      setUser(currentUser);

      try {
        await syncProfile(currentUser);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    auth
      .getUser()
      .then(({ user: currentUser }) => {
        void applyUser(currentUser);
      });

    const {
      data: { subscription },
    } = auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        void applyUser(session?.user ?? null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
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

  const signUpMember = async (email: string, password: string) => {
    const { data, error } = await auth.signUpMember(email, password);
    return { data, error };
  };

  const refreshProfile = async () => {
    await syncProfile(user);
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
        ownedLessonModuleIds,
        loading,
        signIn,
        signInMember,
        signUpMember,
        refreshProfile,
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
