/**
 * Page DashboardPage
 * Tableau de bord principal après authentification
 */
import SimulationBanner from '../components/SimulationBanner'

function DashboardPage() {
  return (
    <>
      <SimulationBanner />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Comptes récréés</p>
              <p className="text-3xl font-bold text-primary-600">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Liens actifs</p>
              <p className="text-3xl font-bold text-secondary-600">0</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Virements simulés</p>
              <p className="text-3xl font-bold text-success">0</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Vos comptes bancaires
            </h2>
            <div className="text-center py-12">
              <p className="text-gray-500">Vous n'avez pas encore créé de compte</p>
              <button className="btn-primary mt-4">Créer un compte bancaire</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DashboardPage
