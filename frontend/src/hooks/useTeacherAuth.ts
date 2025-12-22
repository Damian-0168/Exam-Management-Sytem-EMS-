import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface TeacherProfile {
  id: string;
  name?: string;
  role?: string;
  subjects?: string[];
}

export const useTeacherAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Teacher signup with Supabase Auth
  const signUp = async (
    email: string,
    password: string,
    name: string,
    subjectIds: string[],
    schoolId: string
  ) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name,
            role: "teacher",
            subjects: subjectIds,
            school_id: schoolId,
          }, // stored in user_metadata
        },
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Teacher login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Teacher logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    // Clear all localStorage to remove any cached data
    localStorage.clear();
    // Force a page reload to reset all state
    window.location.reload();
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
