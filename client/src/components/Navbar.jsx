import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function Navbar({ user, setUser }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const logout = () => { localStorage.removeItem('token'); setUser(null) }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/add', label: 'Add Transaction', icon: PlusIcon },
    { path: '/recurring', label: 'Recurring', icon: CalendarIcon },
    { path: '/budgets', label: 'Budgets', icon: ChartIcon },
    { path: '/insights', label: 'Insights', icon: LightbulbIcon },
    { path: '/safe-to-spend', label: 'Safe to Spend', icon: WalletIcon },
    { path: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
    { path: '/accounts', label: 'Accounts', icon: CreditCardIcon },
    { path: '/categories', label: 'Categories', icon: TagIcon },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/80 dark:bg-warm-950/80 backdrop-blur-md shadow-card border-b border-warm-200 dark:border-warm-800' : 'bg-transparent'}`}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-display font-bold text-warm-900 dark:text-warm-50" aria-label="Expense Tracker Home">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-cobalt-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.49-.22-2.003-.659-1.172-.879-1.172-2.303 0-3.182z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="hidden sm:block">Expense Tracker</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {user && navItems.map(item => (
              <NavLink key={item.path} {...item} isActive={location.pathname === item.path} />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-xl text-warm-600 hover:bg-warm-100 dark:text-warm-400 dark:hover:bg-warm-800"
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/settings" className="btn-icon text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200" aria-label="Settings">
                    <SettingsIcon className="w-5 h-5" />
                  </Link>
                  <button onClick={logout} className="btn-secondary text-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>

        {mobileOpen && user && (
          <div className="md:hidden py-4 border-t border-warm-200 dark:border-warm-800 animate-in">
            <div className="flex flex-col gap-1">
              {navItems.map(item => (
                <NavLink key={item.path} {...item} isActive={location.pathname === item.path} mobile />
              ))}
              <div className="pt-2 border-t border-warm-200 dark:border-warm-800">
                <Link to="/settings" className="btn-secondary w-full justify-start" onClick={() => setMobileOpen(false)}>
                  <SettingsIcon className="w-5 h-5 mr-2" />
                  Settings
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-danger w-full justify-start mt-2">
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

function NavLink({ path, label, icon: Icon, isActive, mobile }) {
  const location = useLocation()
  const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'))

  return (
    <Link
      to={path}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
          : 'text-warm-600 hover:text-warm-900 hover:bg-warm-100 dark:text-warm-400 dark:hover:text-warm-100 dark:hover:bg-warm-800'
      } ${mobile ? 'px-4 py-3' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-primary-600 dark:text-primary-400' : 'text-warm-400'}`} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  )
}

// Icon components
function HomeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function PlusIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
}
function CalendarIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}
function ChartIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
}
function LightbulbIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
}
function WalletIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
}
function CalendarDaysIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}
function CreditCardIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
}
function TagIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
}
function SettingsIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}
function MenuIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
}
function XIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
}