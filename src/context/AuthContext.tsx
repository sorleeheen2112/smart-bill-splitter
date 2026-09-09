'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, HostProfile } from '@/lib/supabase';

interface AuthContextType {
  hostUser: HostProfile | null;
  isLoading: boolean;
  isSupabaseActive: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    pass: string,
    firstName: string,
    lastName?: string,
    phone?: string,
    defaultPromptPay?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemoHost: () => void;
}

const LOCAL_HOST_STORAGE_KEY = 'smart_party_host_user_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hostUser, setHostUser] = useState<HostProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadSupabaseUserProfile(session.user.id, session.user.email || '');
          }
        } catch (e) {
          console.error('Supabase session check error', e);
        }
      } else {
        // Load local host from localStorage if available
        try {
          const raw = localStorage.getItem(LOCAL_HOST_STORAGE_KEY);
          if (raw) {
            setHostUser(JSON.parse(raw));
          }
        } catch (e) {}
      }
      setIsLoading(false);
    }

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            await loadSupabaseUserProfile(session.user.id, session.user.email || '');
          } else {
            setHostUser(null);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const loadSupabaseUserProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('hosts')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setHostUser({
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          phoneNumber: data.phone_number,
          defaultPromptPay: data.default_promptpay,
        });
      } else {
        // Fallback profile if row not created yet
        setHostUser({
          id: userId,
          email: email,
          firstName: email.split('@')[0],
        });
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  };

  const signIn = async (email: string, pass: string) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadSupabaseUserProfile(data.user.id, data.user.email || email);
      }
      return { success: true };
    } else {
      // Local Auth simulation
      const mockProfile: HostProfile = {
        id: `local-host-${Date.now()}`,
        email,
        firstName: email.split('@')[0],
        phoneNumber: '0812345678',
        defaultPromptPay: '0812345678',
      };
      setHostUser(mockProfile);
      localStorage.setItem(LOCAL_HOST_STORAGE_KEY, JSON.stringify(mockProfile));
      return { success: true };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    firstName: string,
    lastName?: string,
    phone?: string,
    defaultPromptPay?: string
  ) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName || '',
            phone_number: phone || '',
            default_promptpay: defaultPromptPay || '',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile: HostProfile = {
          id: data.user.id,
          email,
          firstName,
          lastName,
          phoneNumber: phone,
          defaultPromptPay,
        };
        setHostUser(profile);
      }
      return { success: true };
    } else {
      // Local Auth simulation
      const mockProfile: HostProfile = {
        id: `local-host-${Date.now()}`,
        email,
        firstName,
        lastName,
        phoneNumber: phone,
        defaultPromptPay,
      };
      setHostUser(mockProfile);
      localStorage.setItem(LOCAL_HOST_STORAGE_KEY, JSON.stringify(mockProfile));
      return { success: true };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setHostUser(null);
    localStorage.removeItem(LOCAL_HOST_STORAGE_KEY);
  };

  const loginAsDemoHost = () => {
    const demoProfile: HostProfile = {
      id: 'demo-host-sor',
      email: 'host.sor@example.com',
      firstName: 'สอ',
      lastName: 'เหรัญญิกปาร์ตี้',
      phoneNumber: '0891234567',
      defaultPromptPay: '0891234567',
    };
    setHostUser(demoProfile);
    localStorage.setItem(LOCAL_HOST_STORAGE_KEY, JSON.stringify(demoProfile));
  };

  return (
    <AuthContext.Provider
      value={{
        hostUser,
        isLoading,
        isSupabaseActive: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        loginAsDemoHost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
