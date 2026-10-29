import { Link } from 'react-router-dom'
import { WalletIcon, ArrowUpIcon, ArrowDownIcon, ArrowRightIcon, CalendarIcon, LightbulbIcon, ShieldIcon, SparklesIcon, SparklesIcon as SparklesIcon2 } from '../components/Icons'

const features = [
  { icon: WalletIcon, title: 'Complete Transaction Tracking', description: 'Record income, expenses, and transfers with categories, merchants, and payment methods' },
  { icon: CalendarIcon, title: 'Recurring Payments', description: 'Set up automatic bills, subscriptions, and income with flexible scheduling' },
  { icon: LightbulbIcon, title: 'Smart Insights', description: 'AI-powered spending analysis, anomaly detection, and personalized recommendations' },
  { icon: ArrowUpIcon, title: 'Safe-to-Spend Calculator', description: 'Know exactly how much you can spend without compromising your goals' },
  { icon: SparklesIcon, title: 'Budgets & Goals', description: 'Set category budgets with visual progress tracking and alerts' },
  { icon: ShieldIcon, title: 'Secure & Private', description: 'JWT authentication, encrypted passwords, and your data stays yours' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-warm-50 dark:bg-warm-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-cobalt-50 dark:from-primary-900/20 dark:via-warm-950 dark:to-cobalt-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%237c4dff%22 fill-opacity=%220.03%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6 animate-in">
              <SparklesIcon className="w-4 h-4" />
              <span>New: Recurring payments, budgets, insights & safe-to-spend calculator</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-warm-900 dark:text-warm-50 leading-tight mb-6 animate-in">
              Take Control of Your
              <span className="block bg-gradient-to-r from-primary-500 to-cobalt-500 bg-clip-text text-transparent">Finances</span>
            </h1>
            <p className="text-lg sm:text-xl text-warm-600 dark:text-warm-400 mb-8 max-w-2xl mx-auto animate-in">
              A vibrant, powerful expense tracker with recurring payments, AI insights, budgets, and a safe-to-spend calculator. Built for people who want clarity, not complexity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in">
              <Link to="/register" className="btn-primary px-8 py-3 text-lg">
                Get Started Free
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/login" className="btn-secondary px-8 py-3 text-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-white dark:bg-warm-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 dark:text-warm-50 mb-4">Everything You Need</h2>
            <p className="text-warm-600 dark:text-warm-400 text-lg">Powerful features designed for real financial management</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="card card-interactive p-6 group">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-warm-900 dark:text-warm-100 mb-2">{feature.title}</h3>
                <p className="text-warm-600 dark:text-warm-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots/Preview */}
      <section className="py-20 sm:py-28 bg-warm-50 dark:bg-warm-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-warm-900 dark:text-warm-50 mb-4">Designed for You</h2>
            <p className="text-warm-600 dark:text-warm-400 text-lg">A vibrant, intuitive interface that makes financial management enjoyable</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-display font-bold text-warm-900 dark:text-warm-50 mb-4">Vibrant, Human-Centered Design</h3>
              <p className="text-warm-600 dark:text-warm-400 mb-6">Every pixel crafted with care. From the electric purple primary color to the warm neutral backgrounds, our design system creates a financial experience that feels premium, not clinical.</p>
              <ul className="space-y-3">
                {[
                  'Light & dark themes with system preference detection',
                  'Editorial typography with Space Grotesk & DM Sans',
                  'Meaningful color coding: income, expenses, warnings',
                  'Smooth animations and micro-interactions',
                  'Fully responsive: mobile, tablet, desktop',
                  'Accessible: WCAG AA compliant'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-warm-700 dark:text-warm-300">
                    <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon2 className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary-100 to-cobalt-100 dark:from-primary-900/30 dark:to-cobalt-900/30 border border-warm-200 dark:border-warm-800 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%237c4dff%22 fill-opacity=%220.05%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
                <div className="relative z-10 text-center p-8">
                  <WalletIcon className="w-24 h-24 text-primary-300 dark:text-primary-700 mx-auto mb-4" />
                  <p className="text-primary-600 dark:text-primary-400 font-medium">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card p-8 sm:p-12 bg-gradient-to-br from-primary-500 to-cobalt-600 text-white">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Ready to Take Control?</h2>
              <p className="text-primary-100 mb-8 max-w-lg mx-auto">Join thousands of users managing their finances with clarity and confidence. Start free in minutes.</p>
              <Link to="/register" className="btn-primary bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg">
                Create Free Account
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-warm-200 dark:border-warm-800 bg-white dark:bg-warm-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-cobalt-500 flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-warm-900 dark:text-warm-50">Expense Tracker</span>
          </Link>
          <p className="text-warm-500 dark:text-warm-400 text-sm">Built with React, Node.js, MongoDB & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  )
}