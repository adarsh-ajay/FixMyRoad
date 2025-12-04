import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './components/Dashboard'
import Login from './components/Login'
import Register from './components/Register'
import Landing from './components/Landing'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 