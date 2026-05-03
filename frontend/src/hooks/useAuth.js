import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth - Hook pour accéder au contexte d'authentification
 * 
 * Utilisation:
 * const { user, login, signup, logout, loading, error } = useAuth();
 * 
 * @returns {Object} - { user, session, loading, error, signup, login, logout, resetPassword, updatePassword, isAuthenticated, clearError }
 * @throws {Error} - Si utilisé en dehors d'AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth() must be used within an <AuthProvider> component'
    );
  }

  return context;
};

/**
 * Composant de protection pour vérifier l'authentification
 */
export const useRequireAuth = () => {
  const { user, loading, isAuthenticated } = useAuth();

  return {
    user,
    loading,
    isAuthenticated,
    requiresAuth: !isAuthenticated,
  };
};

export default useAuth;
