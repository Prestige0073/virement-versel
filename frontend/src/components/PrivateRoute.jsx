import { Navigate } from 'react-router-dom'
import { useContext } from 'react'
// import { AuthContext } from '../context/AuthContext'

/**
 * Composant PrivateRoute
 * Protège les routes qui nécessitent une authentification
 */
function PrivateRoute({ children }) {
  // const { user, isLoading } = useContext(AuthContext)
  const user = null // TODO: Get from auth context
  const isLoading = false // TODO: Get from auth context

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
