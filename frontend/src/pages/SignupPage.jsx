import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * SignupPage - Inscription utilisateur
 * Formulaire d'inscription avec validation et gestion d'erreur
 */
function SignupPage() {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setValidationError('');
    clearError();
  };

  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Email invalide');
      return false;
    }

    // Password validation
    if (formData.password.length < 8) {
      setValidationError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Le mot de passe doit contenir au moins une majuscule');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setValidationError('Le mot de passe doit contenir au moins un chiffre');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await signup(formData.email, formData.password);
    
    if (result.success) {
      setSuccess(true);
      setFormData({ email: '', password: '', confirmPassword: '' });
      
      // Vérifier l'email avant redirection
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Inscription réussie! Veuillez vérifier votre email.' 
          } 
        });
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary-900 mb-2 text-center">
          Créer un compte
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Inscription au simulateur de virement
        </p>

        {success && (
          <div className="bg-success-50 border border-success-300 text-success-800 px-4 py-3 rounded-lg mb-4">
            ✓ Inscription réussie! Redirection en cours...
          </div>
        )}

        {(error || validationError) && (
          <div className="bg-danger-50 border border-danger-300 text-danger-800 px-4 py-3 rounded-lg mb-4">
            ✗ {error || validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email *
            </label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field" 
              placeholder="votre@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Mot de passe *
            </label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field" 
              placeholder="••••••••"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 caractères, 1 majuscule, 1 chiffre
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Confirmer le mot de passe *
            </label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field" 
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Inscription en cours...' : 'S\'inscrire'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Vous avez déjà un compte?{' '}
          <a href="/login" className="text-primary-600 font-semibold hover:underline">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;

