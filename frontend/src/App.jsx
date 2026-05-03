import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './styles/index.css'
import { validateEnvironment, logEnvironmentConfig } from './utils/envConfig'

// Pages
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import PasswordRecoveryPage from './pages/PasswordRecoveryPage'
import PaymentPage from './pages/PaymentPage'
import DashboardPage from './pages/DashboardPage'
import BankAccountPage from './pages/BankAccountPage'
import TransferStepPage from './pages/TransferStepPage'

// Components
import PrivateRoute from './components/PrivateRoute'

// Auth & Payment Providers
import { AuthProvider } from './context/AuthContext'
import { PaymentProvider } from './context/PaymentContext'
import { BankAccountProvider } from './context/BankAccountContext'
import { TransferStepProvider } from './context/TransferStepContext'

// Validate environment on app start
try {
  validateEnvironment();
  logEnvironmentConfig();
} catch (envError) {
  console.error('❌ Environment validation failed:', envError.message);
  // Setup error display component
}

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
    <AuthProvider>
      <PaymentProvider>
        <BankAccountProvider>
          <TransferStepProvider>
            <Router>
              {/* <SimulationBanner /> */}
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/payment"
                  element={
                    <PrivateRoute>
                      <PaymentPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/bank-accounts"
                  element={
                    <PrivateRoute>
                      <BankAccountPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/transfer-steps"
                  element={
                    <PrivateRoute>
                      <TransferStepPage />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Router>
          </TransferStepProvider>
        </BankAccountProvider>
      </PaymentProvider>
    </AuthProvider>
  )
}

// Temporary home page for testing - removed, using actual HomePage component
export default App
