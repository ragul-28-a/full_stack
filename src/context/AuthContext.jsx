import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabaseClient';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const profileData = await api.get('profiles/me/');
    setProfile(profileData);
    return profileData;
  };

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);
        setLoading(true);
        fetchProfile()
          .catch((err) => {
            console.error('Error fetching profile:', err);
            if (active) setProfile(null);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      }, 0);
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Auth Operations
  const signUp = async (email, password, fullName) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error logging out:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
    return { error: null };
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: new Error('User not authenticated') };
    try {
      const data = await api.patch('profiles/me/', updates);
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const value = {
    user,
    profile,
    loading,
    isLiveSupabase: isLiveSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refetchProfile: () => user && fetchProfile()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
