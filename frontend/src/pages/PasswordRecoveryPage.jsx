/**
 * Page PasswordRecoveryPage
 * Réinitialisation du mot de passe
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SimulationBanner from '../components/SimulationBanner';

function PasswordRecoveryPage() {
  const navigate = useNavigate();
  const { resetPassword, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('email'); // 'email' ou 'confirm'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    clearError();

    if (!email) {
      setValidationError('Veuillez entrer votre email');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Email invalide');
      return;
    }

    const result = await resetPassword(email);

    if (result.success) {
      setSuccess(true);
      setStep('confirm');
      
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Vérifiez votre email pour réinitialiser votre mot de passe'
          }
        });
      }, 3000);
    }
  };

  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary-900 mb-2 text-center">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {step === 'email' 
              ? 'Entrez votre email pour recevoir un lien de réinitialisation'
              : 'Un email de réinitialisation a été envoyé'
            }
          </p>

          {success && (
            <div className="bg-success-50 border border-success-300 text-success-800 px-4 py-3 rounded-lg mb-4">
              ✓ Email envoyé avec succès! Redirection en cours...
            </div>
          )}

          {(error || validationError) && (
            <div className="bg-danger-50 border border-danger-300 text-danger-800 px-4 py-3 rounded-lg mb-4">
              ✗ {error || validationError}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Adresse email *
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

              <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Vous vous souvenez de votre mot de passe?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary-600 font-semibold hover:underline focus:outline-none"
              >
                Se connecter
              </button>
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💡 <strong>Conseil:</strong> Vérifiez aussi votre dossier spam ou courrier indésirable
          </div>
        </div>
      </div>
    </>
  );
}

export default PasswordRecoveryPage;
