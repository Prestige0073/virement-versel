/**
 * Composant SimulationBanner
 * Affiche une bannière indiquant que c'est un mode simulation
 */
function SimulationBanner() {
  return (
    <div className="bg-yellow-100 border-b-2 border-yellow-500 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <p className="text-yellow-800 font-semibold">
          <strong>MODE SIMULATION</strong> — Ce service est un simulateur à but pédagogique
          uniquement. Aucune transaction bancaire réelle n'est effectuée. Aucun fonds réel
          n'est manipulé.
        </p>
      </div>
    </div>
  )
}

export default SimulationBanner
