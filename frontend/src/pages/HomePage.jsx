/**
 * Page HomePage
 * Page d'accueil du site
 */
import SimulationBanner from '../components/SimulationBanner'

function HomePage() {
  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-primary-900 mb-6">
            🏦 Simulateur de Virement Bancaire
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Bienvenue 👋
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Cette plateforme permet de créer un compte bancaire fictif et de simuler
              des virements bancaires avec validation multi-étapes. C'est un outil
              pédagogique pour démonstration uniquement.
            </p>
            <div className="flex gap-4 mb-8">
              <a href="/signup" className="btn-primary">
                Créer un account
              </a>
              <a href="/login" className="btn-secondary">
                Se connecter
              </a>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ✨ Fonctionnalités
            </h3>
            <ul className="text-gray-700 space-y-2 ml-6">
              <li>✅ Configuration de comptes bancaires fictifs</li>
              <li>✅ Définition de scénarios de virement multi-étapes</li>
              <li>✅ Simulation en temps réel avec codes de validation</li>
              <li>✅ Génération de reçus PDF</li>
              <li>✅ Support multilingue (FR/EN)</li>
              <li>✅ Tableaude bord en temps réel</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomePage
