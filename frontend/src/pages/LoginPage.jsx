/**
 * Page LoginPage
 * Connexion des utilisateurs
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SimulationBanner from '../components/SimulationBanner';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.message || ''
  );

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!email || !password) {
      setValidationError('Tous les champs sont obligatoires');
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    }
  };

  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary-900 mb-2 text-center">
            Se connecter
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Accès au simulateur
          </p>

          {successMessage && (
            <div className="bg-success-50 border border-success-300 text-success-800 px-4 py-3 rounded-lg mb-4">
              ✓ {successMessage}
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError('');
                }}
                className="input-field"
                placeholder="votre@email.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Mot de passe *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError('');
                }}
                className="input-field"
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-4">
            Vous n'avez pas de compte?{' '}
            <a href="/signup" className="text-primary-600 font-semibold hover:underline">
              S'inscrire
            </a>
          </p>

          <p className="text-center text-gray-600 mt-2">
            <a href="/password-recovery" className="text-primary-600 font-semibold hover:underline">
              Mot de passe oublié?
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default LoginPage;

