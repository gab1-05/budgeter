import { useEffect, useState } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'
import { insightsAPI } from '../services/api'
import { LightbulbIcon, ArrowUpIcon, ArrowDownIcon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon, TrendingUpIcon, TrendingDownIcon, InfoIcon } from '../components/Icons'

const COLORS = ['#7c4dff', '#3b82f6', '#f97316', '#84cc16', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7']

export default function Insights() {
  const [comparison, setComparison] = useState([])
  const [trend, setTrend] = useState([])
  const [breakdown, setBreakdown] = useState({ total: 0, breakdown: [] })
  const [anomalies, setAnomalies] = useState([])
  const [recurringImpact, setRecurringImpact] = useState(null)
  const [recommendations, setRecommendations] = useState({ insights: [] })
  const [incomeExpense, setIncomeExpense] = useState({ income: 0, expense: 0, net: 0 })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [dismissed, setDismissed] = useState(new Set())

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    try {
      setLoading(true)
      const [comp, tr, bd, an, ri, rec, ie] = await Promise.all([
        insightsAPI.getSpendingComparison(period),
        insightsAPI.getMonthlyTrend(),
        insightsAPI.getCategoryBreakdown(period),
        insightsAPI.getAnomalies({ period }),
        insightsAPI.getRecurringImpact(),
        insightsAPI.getRecommendations(),
        insightsAPI.getIncomeExpense(period)
      ])
      setComparison(comp.data)
      setTrend(tr.data)
      setBreakdown(bd.data)
      setAnomalies(an.data.anomalies || [])
      setRecurringImpact(ri.data)
      setRecommendations(rec.data)
      setIncomeExpense(ie.data)
    } catch (e) {
      console.error('Failed to load insights', e)
    } finally {
      setLoading(false)
    }
  }

  const dismissInsight = (id) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-expense-DEFAULT'
    if (change < 0) return 'text-income-DEFAULT'
    return 'text-warm-500'
  }

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUpIcon className="w-4 h-4" />
    if (change < 0) return <TrendingDownIcon className="w-4 h-4" />
    return <span className="w-4 h-4" />
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Financial Insights</h1>
          <p className="page-subtitle">AI-powered analysis of your spending patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input w-auto">
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Income vs Expense Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Income</p>
              <p className="stat-value text-income-DEFAULT">${incomeExpense.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-income-light dark:bg-income-dark/20 flex items-center justify-center">
              <ArrowUpIcon className="w-6 h-6 text-income-DEFAULT" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Total Expenses</p>
              <p className="stat-value text-expense-DEFAULT">${incomeExpense.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-expense-light dark:bg-expense-dark/20 flex items-center justify-center">
              <ArrowDownIcon className="w-6 h-6 text-expense-DEFAULT" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label">Net Savings</p>
              <p className={`stat-value ${incomeExpense.net >= 0 ? 'text-income-DEFAULT' : 'text-expense-DEFAULT'}`}>
                ${incomeExpense.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${incomeExpense.net >= 0 ? 'bg-income-light dark:bg-income-dark/20' : 'bg-expense-light dark:bg-expense-dark/20'}`}>
              {incomeExpense.net >= 0 ? <CheckCircleIcon className="w-6 h-6 text-income-DEFAULT" /> : <AlertTriangleIcon className="w-6 h-6 text-expense-DEFAULT" />}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <div className="card">
          <h2 className="section-title mb-4">Spending Trend (12 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="label" stroke="#78716c" fontSize={12} tick={{ fill: '#78716c' }} />
                <YAxis stroke="#78716c" fontSize={12} tick={{ fill: '#78716c' }} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }} formatter={v => [`$${v.toLocaleString()}`, 'Expenses']} />
                <Line type="monotone" dataKey="total" stroke="#7c4dff" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#7c4dff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h2 className="section-title mb-4">Spending by Category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown.breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="amount"
                  nameKey="category.name"
                  label={({ category, percentage }) => `${category.name} ${(percentage * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {breakdown.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Amount']} contentStyle={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
            {breakdown.breakdown.map((entry, index) => (
              <div key={entry.category._id} className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="flex-1 truncate">{entry.category.name}</span>
                <span className="font-medium">${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-warm-500 dark:text-warm-400">{entry.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending Comparison */}
      <div className="card">
        <h2 className="section-title mb-4">
          <SparklesIcon className="w-5 h-5" />
          Spending Comparison vs Previous Period
        </h2>
        {comparison.length === 0 ? (
          <div className="empty-state"><p>Not enough data for comparison</p></div>
        ) : (
          <div className="space-y-3">
            {comparison.slice(0, 10).map((item, index) => (
              <div key={item.category._id || index} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (item.category.color || COLORS[index % COLORS.length]) + '20' }}>
                    <span className="text-lg">{item.category.icon || '💰'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-warm-900 dark:text-warm-100">{item.category.name}</p>
                    <p className="text-sm text-warm-500 dark:text-warm-400">
                      Current: ${item.current.toLocaleString()} vs Previous: ${item.previous.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`font-semibold ${getChangeColor(item.change)}`}>
                    {getChangeIcon(item.change)}
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Impact */}
      {recurringImpact && (
        <div className="card">
          <h2 className="section-title mb-4">Recurring Expenses Impact</h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="card p-4">
              <p className="stat-label">Monthly Recurring</p>
              <p className="stat-value text-expense-DEFAULT">${recurringImpact.monthlyRecurringTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="card p-4">
              <p className="stat-label">Monthly Income</p>
              <p className="stat-value text-income-DEFAULT">${recurringImpact.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className={`card p-4 ${recurringImpact.ratio > 50 ? 'border-warning-DEFAULT/30' : ''}`}>
              <p className="stat-label">Income Ratio</p>
              <p className={`stat-value ${recurringImpact.ratio > 50 ? 'text-warning-dark' : 'text-income-DEFAULT'}`}>{recurringImpact.ratio.toFixed(1)}%</p>
            </div>
          </div>
          {recurringImpact.breakdown.length > 0 && (
            <div className="space-y-2">
              {recurringImpact.breakdown.map(item => (
                <div key={item.schedule._id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <LightbulbIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-warm-900 dark:text-warm-100">{item.schedule.name}</p>
                      <p className="text-sm text-warm-500 dark:text-warm-400">{item.monthlyOccurrences}x/month</p>
                    </div>
                  </div>
                  <p className="font-semibold text-expense-DEFAULT">${item.projectedMonthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-warning-dark" />
            Unusual Transactions Detected
          </h2>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((item, index) => {
              const tx = item.transaction
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-warning-light/50 dark:bg-warning-dark/10 border border-warning-DEFAULT/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning-light dark:bg-warning-dark/20 flex items-center justify-center">
                      <AlertTriangleIcon className="w-5 h-5 text-warning-dark" />
                    </div>
                    <div>
                      <p className="font-medium text-warm-900 dark:text-warm-100">{tx.description || tx.category?.name || 'Transaction'}</p>
                      <p className="text-sm text-warm-500 dark:text-warm-400">
                        ${tx.amount.toLocaleString()} • {tx.category?.name || 'Uncategorized'} • {format(new Date(tx.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-warning text-sm">
                    {item.deviation.toFixed(1)}σ above average
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.insights.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <LightbulbIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.insights
              .filter(i => !dismissed.has(i.type + JSON.stringify(i.data)))
              .map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-warm-900 dark:text-warm-100">{insight.title}</h4>
                    <p className="text-sm text-warm-600 dark:text-warm-400 mt-1">{insight.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge ${insight.severity === 'error' ? 'badge-expense' : insight.severity === 'warning' ? 'badge-warning' : 'badge-income'}`}>
                        {insight.severity}
                      </span>
                      <button onClick={() => dismissInsight(insight.type + JSON.stringify(insight.data))} className="text-sm text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200">
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}