import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { LockIcon, MailIcon, EyeIcon, EyeOffIcon, WalletIcon } from '../components/Icons'

export default function Login({ setUser }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.login(email, password)
      localStorage.setItem('token', data.token)
      setUser({ token: data.token })
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-warm-50 dark:bg-warm-950">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cobalt-500 flex items-center justify-center">
              <WalletIcon className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold text-warm-900 dark:text-warm-50">Welcome Back</h1>
          <p className="text-warm-500 dark:text-warm-400 mt-2">Sign in to your expense tracker account</p>
        </div>

        <div className="card p-8">
          {error && <div className="mb-6 p-4 rounded-xl bg-expense-light/50 dark:bg-expense-dark/10 border border-expense-DEFAULT/20 text-expense-dark dark:text-expense-light text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input id="email" type="email" className="input pl-10" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300">
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-warm-500 dark:text-warm-400 mt-6">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Create one</Link>
          </p>

          <div className="mt-6 pt-6 border-t border-warm-200 dark:border-warm-800">
            <p className="text-center text-xs text-warm-500 dark:text-warm-400 mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-warm-100 dark:bg-warm-800 font-mono">demo@example.com</div>
              <div className="p-2 rounded-lg bg-warm-100 dark:bg-warm-800 font-mono">demo123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}