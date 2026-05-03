import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';

/**
 * AuthContext - Gère l'authentification des utilisateurs
 * Fournit: user, loading, error, login, signup, logout, resetPassword
 */
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  /**
   * Initialiser l'authentification au chargement
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Récupérer la session actuelle
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setError(null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  /**
   * Inscription utilisateur
   */
  const signup = useCallback(async (email, password, metadata = {}) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (err) {
      const message = err.message || 'Erreur lors de l\'inscription';
      setError(message);
      console.error('Signup error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connexion utilisateur
   */
  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser(data.user);
      setSession(data.session);
      return { success: true, user: data.user };
    } catch (err) {
      const message = err.message || 'Erreur de connexion';
      setError(message);
      console.error('Login error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Déconnexion
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur lors de la déconnexion';
      setError(message);
      console.error('Logout error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Demande de réinitialisation de mot de passe
   */
  const resetPassword = useCallback(async (email) => {
    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur lors de la réinitialisation';
      setError(message);
      console.error('Reset password error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mettre à jour le mot de passe
   */
  const updatePassword = useCallback(async (newPassword) => {
    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (err) {
      const message = err.message || 'Erreur lors de mise à jour';
      setError(message);
      console.error('Update password error:', err);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  const isAuthenticated = () => !!user;

  /**
   * Réinitialiser l'erreur
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // État
    user,
    session,
    loading,
    error,
    isAuthenticated,

    // Méthodes
    signup,
    login,
    logout,
    resetPassword,
    updatePassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
