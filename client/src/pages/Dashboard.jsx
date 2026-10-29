import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { transactionAPI, accountAPI, recurringAPI, insightsAPI } from '../services/api'
import { WalletIcon, ArrowUpIcon, ArrowDownIcon, CalendarIcon, PlusIcon, CreditCardIcon, TrendingUpIcon, LightbulbIcon } from '../components/Icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 })
  const [accounts, setAccounts] = useState([])
  const [upcomingRecurring, setUpcomingRecurring] = useState([])
  const [recommendations, setRecommendations] = useState({ insights: [] })
  const [trend, setTrend] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [month])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const start = startOfMonth(new Date(month))
      const end = endOfMonth(new Date(month))

      const [summaryRes, accountsRes, recurringRes, insightsRes, trendRes, txRes] = await Promise.all([
        transactionAPI.getSummary({ startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') }),
        accountAPI.getAll(),
        recurringAPI.getUpcoming(),
        insightsAPI.getRecommendations(),
        insightsAPI.getMonthlyTrend(),
        transactionAPI.getAll({ limit: 5, startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') })
      ])

      setSummary(summaryRes.data)
      setAccounts(accountsRes.data)
      setUpcomingRecurring(recurringRes.data.slice(0, 5))
      setRecommendations(insightsRes.data)
      setTrend(trendRes.data)
      setRecentTransactions(txRes.data.transactions)
    } catch (e) {
      console.error('Failed to load dashboard', e)
    } finally {
      setLoading(false)
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your financial overview</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={e => setMonth(e.target.value)} className="input w-auto">
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date()
              d.setMonth(d.getMonth() - i)
              const val = format(d, 'yyyy-MM')
              return <option key={val} value={val}>{format(d, 'MMMM yyyy')}</option>
            })}
          </select>
          <Link to="/add" className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" /> Add Transaction
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Balance"
          value={totalBalance}
          icon={<WalletIcon className="w-6 h-6" />}
          color="primary"
          trend={summary.net >= 0 ? 'positive' : 'negative'}
          trendValue={Math.abs(summary.net)}
        />
        <MetricCard
          title="Income"
          value={summary.income}
          icon={<ArrowUpIcon className="w-6 h-6" />}
          color="income"
          positive
        />
        <MetricCard
          title="Expenses"
          value={summary.expense}
          icon={<ArrowDownIcon className="w-6 h-6" />}
          color="expense"
        />
        <MetricCard
          title="Net Savings"
          value={summary.net}
          icon={<TrendingUpIcon className="w-6 h-6" />}
          color={summary.net >= 0 ? 'income' : 'expense'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income vs Expense Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Monthly Trend</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="label" stroke="#78716c" fontSize={11} tick={{ fill: '#78716c' }} />
                <YAxis stroke="#78716c" fontSize={11} tick={{ fill: '#78716c' }} tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} formatter={v => [`$${v.toLocaleString()}`, 'Amount']} />
                <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#ef4444' }} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/add" className="card-interactive p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <PlusIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="font-medium text-warm-900 dark:text-warm-100">Add Transaction</p>
                <p className="text-sm text-warm-500 dark:text-warm-400">Record income or expense</p>
              </div>
            </Link>
            <Link to="/recurring" className="card-interactive p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cobalt-100 dark:bg-cobalt-900/30 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-cobalt-600 dark:text-cobalt-400" />
              </div>
              <div>
                <p className="font-medium text-warm-900 dark:text-warm-100">Recurring Payments</p>
                <p className="text-sm text-warm-500 dark:text-warm-400">Manage automatic payments</p>
              </div>
            </Link>
            <Link to="/budgets" className="card-interactive p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center">
                <LightbulbIcon className="w-6 h-6 text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <p className="font-medium text-warm-900 dark:text-warm-100">Budgets</p>
                <p className="text-sm text-warm-500 dark:text-warm-400">Set spending limits</p>
              </div>
            </Link>
            <Link to="/safe-to-spend" className="card-interactive p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CreditCardIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-warm-900 dark:text-warm-100">Safe to Spend</p>
                <p className="text-sm text-warm-500 dark:text-warm-400">Calculate spending limit</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Accounts & Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Accounts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Accounts</h2>
            <Link to="/accounts" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {accounts.length === 0 ? (
            <div className="empty-state py-8">
              <CreditCardIcon className="w-12 h-12 empty-state-icon" />
              <p>No accounts yet. Add your first account to track balances.</p>
              <Link to="/accounts" className="btn-primary mt-3">
                <PlusIcon className="w-4 h-4 mr-2" /> Add Account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.slice(0, 4).map(account => (
                <div key={account._id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <CreditCardIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-warm-900 dark:text-warm-100">{account.name}</p>
                      <p className="text-xs text-warm-500 dark:text-warm-400 capitalize">{account.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-warm-900 dark:text-warm-100">${(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    {account.isDefault && <span className="badge badge-warning text-xs">Default</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Recurring */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Upcoming Payments</h2>
            <Link to="/recurring" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {upcomingRecurring.length === 0 ? (
            <div className="empty-state py-8">
              <CalendarIcon className="w-12 h-12 empty-state-icon" />
              <p>No upcoming recurring payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingRecurring.map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.type === 'income' ? 'bg-income-light dark:bg-income-dark/20' : 'bg-expense-light dark:bg-expense-dark/20'}`}>
                      <CalendarIcon className={`w-5 h-5 ${r.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-warm-900 dark:text-warm-100">{r.name}</p>
                      <p className="text-xs text-warm-500 dark:text-warm-400">{format(new Date(r.nextRunAt), 'MMM d')}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${r.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`}>
                    {r.type === 'income' ? '+' : '-'}${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Insight */}
        {recommendations.insights.length > 0 && (
          <div className="lg:col-span-2 card">
            <h2 className="section-title mb-4 flex items-center gap-2">
              <LightbulbIcon className="w-5 h-5 text-primary-600" />
              Top Insight
            </h2>
            <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <h3 className="font-semibold text-warm-900 dark:text-warm-100">{recommendations.insights[0].title}</h3>
              <p className="text-warm-600 dark:text-warm-400 mt-1">{recommendations.insights[0].description}</p>
              <span className={`inline-block mt-2 badge ${recommendations.insights[0].severity === 'error' ? 'badge-expense' : recommendations.insights[0].severity === 'warning' ? 'badge-warning' : 'badge-income'}`}>
                {recommendations.insights[0].severity}
              </span>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Transactions</h2>
            <Link to="/add" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="empty-state py-8">
              <p>No transactions this month</p>
              <Link to="/add" className="btn-primary mt-3">
                <PlusIcon className="w-4 h-4 mr-2" /> Add Transaction
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(tx => (
                <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-income-light dark:bg-income-dark/20' : 'bg-expense-light dark:bg-expense-dark/20'}`}>
                      <span className={`text-sm ${tx.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`}>
                        {tx.type === 'income' ? '+' : '−'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-warm-900 dark:text-warm-100 truncate">{tx.description || tx.category?.name || 'Transaction'}</p>
                      <p className="text-xs text-warm-500 dark:text-warm-400">{tx.category?.name || 'Uncategorized'}</p>
                    </div>
                  </div>
                  <p className={`font-semibold ${tx.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`}>
                    {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, color, positive = false, trend, trendValue }) {
  const colors = {
    primary: { bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400' },
    income: { bg: 'bg-income-light dark:bg-income-dark/20', text: 'text-income-dark' },
    expense: { bg: 'bg-expense-light dark:bg-expense-dark/20', text: 'text-expense-dark' },
    warning: { bg: 'bg-warning-light dark:bg-warning-dark/20', text: 'text-warning-dark' },
  }
  const c = colors[color] || colors.primary

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value mt-1">${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className={trend === 'positive' ? 'text-income-dark' : 'text-expense-dark'}>
                {trend === 'positive' ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingUpIcon className="w-3 h-3 rotate-180" />}
              </span>
              <span className={trend === 'positive' ? 'text-income-dark' : 'text-expense-dark'}>
                ${trendValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}