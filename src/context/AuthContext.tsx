"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

export interface UserData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: UserData & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UserData) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredAuthState {
  user: User | null;
  hasToken: boolean;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

function createFallbackUser(authUser: User, fallbackEmail?: string): UserData {
  return {
    id: authUser.id,
    firstName: "",
    lastName: "",
    email: authUser.email ?? fallbackEmail ?? "",
    phone: "",
  };
}

function getAuthStorageKey(): string | null {
  if (typeof window === "undefined") return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return null;
  }
}

function getStoredAuthState(): StoredAuthState {
  if (typeof window === "undefined") return { user: null, hasToken: false };

  const storageKey = getAuthStorageKey();
  if (!storageKey) return { user: null, hasToken: false };

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return { user: null, hasToken: false };

  try {
    const parsed = JSON.parse(raw);
    const sessionCandidate = parsed?.currentSession ?? parsed?.session ?? parsed;
    const expiresAt = Number(sessionCandidate?.expires_at ?? 0);

    if (expiresAt && expiresAt < Date.now() / 1000) {
      window.localStorage.removeItem(storageKey);
      return { user: null, hasToken: false };
    }

    const authUser = sessionCandidate?.user;
    if (!authUser?.id) {
      return { user: null, hasToken: true };
    }

    return { user: authUser as User, hasToken: true };
  } catch {
    return { user: null, hasToken: true };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const loadProfile = useCallback(
    async (userId: string, email: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading profile:", error);
        }

        if (data) {
          setUser({
            id: userId,
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || email,
            phone: data.phone || "",
          });
          return;
        }

        // Profile not found but auth session is valid, so keep the user signed in.
        setUser({
          id: userId,
          firstName: "",
          lastName: "",
          email,
          phone: "",
        });
      } catch (error) {
        console.error("Unexpected profile load error:", error);
        setUser({
          id: userId,
          firstName: "",
          lastName: "",
          email,
          phone: "",
        });
      }
    },
    [supabase]
  );

  useEffect(() => {
    let isMounted = true;

    const applySession = (session: Session | null) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser((previousUser) => {
          if (previousUser?.id === session.user.id) {
            return previousUser;
          }
          return createFallbackUser(session.user);
        });
        void loadProfile(session.user.id, session.user.email ?? "");
      } else {
        setUser(null);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    const storedAuth = getStoredAuthState();
    if (storedAuth.user) {
      const storedUser = storedAuth.user;
      queueMicrotask(() => {
        if (!isMounted) return;

        setUser((previousUser) => {
          if (previousUser?.id === storedUser.id) {
            return previousUser;
          }
          return createFallbackUser(storedUser);
        });
        setIsLoading(false);
        void loadProfile(storedUser.id, storedUser.email ?? "");
      });
    } else if (!storedAuth.hasToken) {
      queueMicrotask(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
      // Ignore transient null-session events while a token still exists.
      if (!session && event !== "SIGNED_OUT") {
        const freshStoredState = getStoredAuthState();
        if (freshStoredState.hasToken) {
          return;
        }
      }

      void applySession(session);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(createFallbackUser(data.user, email));
        void loadProfile(data.user.id, data.user.email ?? email);
      }
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const register = async (data: UserData & { password: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (data: UserData) => {
    if (!user?.id) return { success: false, error: "Not logged in" };
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          email: data.email,
        });

      if (error) return { success: false, error: error.message };
      
      setUser((prev) => prev ? { ...prev, ...data } : data);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
