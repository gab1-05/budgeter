import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns'
import { budgetAPI, categoryAPI, transactionAPI } from '../services/api'
import { PlusIcon, EditIcon, TrashIcon, AlertTriangleIcon, CheckCircleIcon, BarChartIcon, ArrowUpIcon, ArrowDownIcon } from '../components/Icons'

const periodLabels = { monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' }

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', category: '', amount: '', period: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', alertThreshold: 80
  })
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [budgetsRes, summaryRes, categoriesRes] = await Promise.all([
        budgetAPI.getAll(),
        budgetAPI.getSummary(),
        categoryAPI.getAll()
      ])
      setBudgets(budgetsRes.data)
      setSummary(summaryRes.data)
      setCategories(categoriesRes.data.filter(c => c.type === 'expense'))
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = { ...form, amount: parseFloat(form.amount), alertThreshold: parseInt(form.alertThreshold) || 80 }
      if (editing) {
        await budgetAPI.update(editing._id, data)
      } else {
        await budgetAPI.create(data)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save budget')
    }
  }

  const handleEdit = (budget) => {
    setEditing(budget)
    setForm({
      name: budget.name,
      category: budget.category?._id || '',
      amount: budget.amount,
      period: budget.period,
      startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
      endDate: budget.endDate ? format(new Date(budget.endDate), 'yyyy-MM-dd') : '',
      alertThreshold: budget.alertThreshold || 80
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return
    try {
      await budgetAPI.delete(id)
      loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete budget')
    }
  }

  const resetForm = () => setForm({
    name: '', category: '', amount: '', period: 'monthly',
    startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', alertThreshold: 80
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowModal(true) }

  const getPeriodRange = (period) => {
    const now = new Date()
    if (period === 'monthly') return { start: startOfMonth(now), end: endOfMonth(now) }
    if (period === 'quarterly') return { start: startOfQuarter(now), end: endOfQuarter(now) }
    return { start: startOfYear(now), end: endOfYear(now) }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'text-expense-DEFAULT'
    if (percentage >= 80) return 'text-warning-dark'
    return 'text-income-dark'
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Budgets</h1>
          <p className="page-subtitle">Set spending limits and track your progress</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" /> Add Budget
        </button>
      </div>

      {error && <div className="card border-expense-DEFAULT/30 bg-expense-light/50 dark:bg-expense-dark/10 p-4 text-expense-dark dark:text-expense-light">{error}</div>}

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-warm-200 dark:border-warm-800">
          {['overview', 'details'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 'All Budgets'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="p-6">
            {summary.length === 0 ? (
              <div className="empty-state">
                <BarChartIcon className="w-16 h-16 empty-state-icon" />
                <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">No budgets set</h3>
                <p className="mb-4">Create budgets to track your spending against limits</p>
                <button onClick={openCreate} className="btn-primary">
                  <PlusIcon className="w-5 h-5 mr-2" /> Create Budget
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {summary.filter(item => item.budget).map(item => {
                  const b = item.budget
                  const percentage = item.percentage
                  const isOver = item.isOver
                  const isNear = item.isNear && !isOver
                  const cat = b.category

                  return (
                    <div key={b._id} className="card p-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {cat && (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                              <span className="text-xl">{cat.icon || '💰'}</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-warm-900 dark:text-warm-100 truncate">{cat?.name || b.name}</h3>
                            <p className="text-sm text-warm-500 dark:text-warm-400 capitalize">{periodLabels[b.period]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-display font-bold ${getProgressColor(percentage)}`}>
                            ${item.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-sm text-warm-500 dark:text-warm-400">{percentage.toFixed(1)}% used</p>
                        </div>
                      </div>
                      <div className="h-2 bg-warm-200 dark:bg-warm-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-expense-DEFAULT' : isNear ? 'bg-warning-DEFAULT' : 'bg-income-DEFAULT'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-warm-500 dark:text-warm-400">
                        <span>Remaining: ${item.remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        {isOver && <span className="flex items-center gap-1 text-expense-DEFAULT"><AlertTriangleIcon className="w-3 h-3" /> Over budget</span>}
                        {isNear && !isOver && <span className="flex items-center gap-1 text-warning-dark"><AlertTriangleIcon className="w-3 h-3" /> Near limit</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className="p-6">
            {budgets.length === 0 ? (
              <div className="empty-state">
                <BarChartIcon className="w-16 h-16 empty-state-icon" />
                <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">No budgets yet</h3>
                <button onClick={openCreate} className="btn-primary">
                  <PlusIcon className="w-5 h-5 mr-2" /> Create Budget
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.map(budget => (
                  <div key={budget._id} className="card-interactive p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {budget.category && (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: budget.category.color + '20' }}>
                          <span className="text-xl">{budget.category.icon || '💰'}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-warm-900 dark:text-warm-100 truncate">{budget.category?.name || budget.name}</h3>
                        <p className="text-sm text-warm-500 dark:text-warm-400">
                          {periodLabels[budget.period]} • ${budget.amount.toLocaleString()} limit
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(budget)} className="btn-ghost btn-icon p-2" aria-label="Edit">
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(budget._id)} className="btn-ghost btn-icon p-2 text-expense-DEFAULT hover:text-expense-dark" aria-label="Delete">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-elevated w-full max-w-md p-6 animate-in">
            <h2 className="text-xl font-display font-bold text-warm-900 dark:text-warm-50 mb-6">
              {editing ? 'Edit Budget' : 'Create Budget'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Monthly Groceries" required />
              </div>
              <div>
                <label className="label" htmlFor="category">Category</label>
                <select id="category" className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Select category (optional)</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="amount">Amount</label>
                  <input id="amount" type="number" step="0.01" min="0" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="label" htmlFor="period">Period</label>
                  <select id="period" className="input" value={form.period} onChange={e => setForm({...form, period: e.target.value})}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="startDate">Start Date</label>
                  <input id="startDate" type="date" className="input" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required />
                </div>
                <div>
                  <label className="label" htmlFor="endDate">End Date (optional)</label>
                  <input id="endDate" type="date" className="input" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="alertThreshold">Alert Threshold (%)</label>
                <input id="alertThreshold" type="number" min="1" max="100" className="input" value={form.alertThreshold} onChange={e => setForm({...form, alertThreshold: parseInt(e.target.value) || 80})} />
                <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">Get notified when spending reaches this percentage</p>
              </div>
              {error && <p className="text-sm text-expense-DEFAULT">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); resetForm() }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}