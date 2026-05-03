import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/index.css'

// Pages
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

// Components
import PrivateRoute from './components/PrivateRoute'

function App() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Initialize app - fetch current user from supabase
    const initApp = async () => {
      try {
        // TODO: Initialize supabase session check
        setIsInitialized(true)
      } catch (error) {
        console.error('App initialization error:', error)
        setIsInitialized(true)
      }
    }

    initApp()
  }, [])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {/* <SimulationBanner /> */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  )
}

// Temporary home page for testing - removed, using actual HomePage component
export default App
