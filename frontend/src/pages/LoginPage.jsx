/**
 * Page LoginPage
 * Connexion des utilisateurs
 */
import SimulationBanner from '../components/SimulationBanner'

function LoginPage() {
  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-primary-900 mb-6 text-center">
            Se connecter
          </h1>
          <form className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Mot de passe
              </label>
              <input type="password" className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full">
              Se connecter
            </button>
          </form>
          <p className="text-center text-gray-600 mt-4">
            Vous n'avez pas de compte?{' '}
            <a href="/signup" className="text-primary-600 font-semibold hover:underline">
              S'inscrire
            </a>
          </p>
          <p className="text-center text-gray-600 mt-2">
            <a href="#" className="text-primary-600 font-semibold hover:underline">
              Mot de passe oublié?
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

export default LoginPage
