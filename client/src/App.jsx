import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AddTransaction from './pages/AddTransaction.jsx'
import Categories from './pages/Categories.jsx'
import Accounts from './pages/Accounts.jsx'
import Recurring from './pages/Recurring.jsx'
import Budgets from './pages/Budgets.jsx'
import Insights from './pages/Insights.jsx'
import SafeToSpend from './pages/SafeToSpend.jsx'
import Calendar from './pages/Calendar.jsx'
import Settings from './pages/Settings.jsx'
import { useEffect, useState } from 'react'
import { authAPI } from './services/api'

function App() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Validate token with backend
      authAPI.login('', '').catch(() => {}).then(() => {
        // We'll just check if token exists for now
        // The actual validation happens when pages fetch user data
        setUser({ token })
      })
      setUser({ token })
    }
    setAuthChecked(true)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (!authChecked) {
    return (
      <BrowserRouter>
        <div className="min-h-screen flex items-center justify-center bg-warm-50 dark:bg-warm-950">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        </div>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      <main className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/add" element={user ? <AddTransaction /> : <Navigate to="/login" />} />
          <Route path="/categories" element={user ? <Categories /> : <Navigate to="/login" />} />
          <Route path="/accounts" element={user ? <Accounts /> : <Navigate to="/login" />} />
          <Route path="/recurring" element={user ? <Recurring /> : <Navigate to="/login" />} />
          <Route path="/budgets" element={user ? <Budgets /> : <Navigate to="/login" />} />
          <Route path="/insights" element={user ? <Insights /> : <Navigate to="/login" />} />
          <Route path="/safe-to-spend" element={user ? <SafeToSpend /> : <Navigate to="/login" />} />
          <Route path="/calendar" element={user ? <Calendar /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
export default App