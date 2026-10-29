import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { LockIcon, MailIcon, UserIcon, EyeIcon, EyeOffIcon, WalletIcon, SparklesIcon } from '../components/Icons'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.register(form.name, form.email, form.password)
      localStorage.setItem('token', data.token)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed')
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
          <h1 className="text-3xl font-display font-bold text-warm-900 dark:text-warm-50">Create Account</h1>
          <p className="text-warm-500 dark:text-warm-400 mt-2">Start tracking your finances today</p>
        </div>

        <div className="card p-8">
          {error && <div className="mb-6 p-4 rounded-xl bg-expense-light/50 dark:bg-expense-dark/10 border border-expense-DEFAULT/20 text-expense-dark dark:text-expense-light text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label" htmlFor="name">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input id="name" className="input pl-10" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Doe" required autoComplete="name" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input id="email" type="email" className="input pl-10" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required autoComplete="new-password" minLength={8} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 dark:hover:text-warm-300">
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-warm-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label className="label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input id="confirmPassword" type={showPassword ? 'text' : 'password'} className="input pl-10" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" required autoComplete="new-password" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-warm-500 dark:text-warm-400 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}