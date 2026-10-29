import { useEffect, useState } from 'react'
import { format, addDays, addWeeks, addMonths, addQuarters, addYears, isBefore, isAfter } from 'date-fns'
import { recurringAPI } from '../services/api'
import { PlusIcon, EditIcon, TrashIcon, PlayIcon, PauseIcon, CalendarIcon, DollarSignIcon, ArrowRightIcon, AlertTriangleIcon } from '../components/Icons'

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly'
}

const getNextRun = (schedule) => {
  const next = new Date(schedule.nextRunAt)
  const now = new Date()
  const isOverdue = isBefore(next, now) && schedule.isActive
  return { next, isOverdue }
}

export default function Recurring() {
  const [schedules, setSchedules] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', type: 'expense', amount: '', frequency: 'monthly', customInterval: 1,
    startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', maxOccurrences: '',
    account: '', category: '', description: '',
    isVariableAmount: false, variableAmountRange: { min: '', max: '' }
  })
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [schedulesRes, upcomingRes, accountsRes, categoriesRes] = await Promise.all([
        recurringAPI.getAll(),
        recurringAPI.getUpcoming(),
        fetch(`${import.meta.env.VITE_API_URL}/api/accounts`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
        fetch(`${import.meta.env.VITE_API_URL}/api/categories`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json())
      ])
      setSchedules(schedulesRes.data)
      setUpcoming(upcomingRes.data)
      setAccounts(accountsRes)
      setCategories(categoriesRes)
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
      const data = { ...form, amount: parseFloat(form.amount), customInterval: parseInt(form.customInterval) || 1 }
      if (data.maxOccurrences) data.maxOccurrences = parseInt(data.maxOccurrences)
      if (data.variableAmountRange.min) data.variableAmountRange.min = parseFloat(data.variableAmountRange.min)
      if (data.variableAmountRange.max) data.variableAmountRange.max = parseFloat(data.variableAmountRange.max)
      if (!data.variableAmountRange.min && !data.variableAmountRange.max) delete data.variableAmountRange

      if (editing) {
        await recurringAPI.update(editing._id, data)
      } else {
        await recurringAPI.create(data)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save schedule')
    }
  }

  const handleToggle = async (id, currentStatus) => {
    try {
      await recurringAPI.toggle(id)
      loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update schedule')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring schedule? This cannot be undone.')) return
    try {
      await recurringAPI.delete(id)
      loadData()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete schedule')
    }
  }

  const handleEdit = (schedule) => {
    const startDate = format(new Date(schedule.startDate), 'yyyy-MM-dd')
    const endDate = schedule.endDate ? format(new Date(schedule.endDate), 'yyyy-MM-dd') : ''
    setEditing(schedule)
    setForm({
      name: schedule.name,
      type: schedule.type,
      amount: schedule.amount,
      frequency: schedule.frequency,
      customInterval: schedule.customInterval || 1,
      startDate,
      endDate,
      maxOccurrences: schedule.maxOccurrences || '',
      account: schedule.account._id || schedule.account,
      category: schedule.category?._id || schedule.category || '',
      description: schedule.description || '',
      isVariableAmount: schedule.isVariableAmount || false,
      variableAmountRange: schedule.variableAmountRange || { min: '', max: '' }
    })
    setShowModal(true)
  }

  const resetForm = () => setForm({
    name: '', type: 'expense', amount: '', frequency: 'monthly', customInterval: 1,
    startDate: format(new Date(), 'yyyy-MM-dd'), endDate: '', maxOccurrences: '',
    account: '', category: '', description: '',
    isVariableAmount: false, variableAmountRange: { min: '', max: '' }
  })

  const openCreate = () => { resetForm(); setEditing(null); setShowModal(true) }

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')
  const filteredCategories = form.type === 'income' ? incomeCategories : expenseCategories

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Recurring Payments</h1>
          <p className="page-subtitle">Manage automatic payments and income schedules</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" /> Add Schedule
        </button>
      </div>

      {error && <div className="card border-expense-DEFAULT/30 bg-expense-light/50 dark:bg-expense-dark/10 p-4 text-expense-dark dark:text-expense-light">{error}</div>}

      {/* Upcoming Payments */}
      {upcoming.length > 0 && (
        <div className="card">
          <h2 className="section-title mb-4">
            <CalendarIcon className="w-5 h-5" />
            Upcoming (Next 30 Days)
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {upcoming.map(s => {
              const { next, isOverdue } = getNextRun(s)
              return (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50 border border-warm-200 dark:border-warm-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.type === 'income' ? 'bg-income-light dark:bg-income-dark/20' : 'bg-expense-light dark:bg-expense-dark/20'}`}>
                      <CalendarIcon className={`w-5 h-5 ${s.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-warm-900 dark:text-warm-100">{s.name}</p>
                      <p className="text-sm text-warm-500 dark:text-warm-400">{format(next, 'MMM d, yyyy')}{isOverdue && ' (Overdue)'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${s.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`}>
                      {s.type === 'income' ? '+' : '-'}${Number(s.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-warm-500 dark:text-warm-400 capitalize">{frequencyLabels[s.frequency]}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Schedules */}
      <div className="card">
        <h2 className="section-title mb-4">All Schedules</h2>
        {schedules.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon className="w-16 h-16 empty-state-icon" />
            <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">No recurring schedules</h3>
            <p className="mb-4">Create your first recurring payment or income schedule</p>
            <button onClick={openCreate} className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" /> Add Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(schedule => {
              const { next, isOverdue } = getNextRun(schedule)
              const cat = schedule.category
              return (
                <div key={schedule._id} className="card-interactive p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${schedule.type === 'income' ? 'bg-income-light dark:bg-income-dark/20' : 'bg-expense-light dark:bg-expense-dark/20'}`}>
                      <CalendarIcon className={`w-6 h-6 ${schedule.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-warm-900 dark:text-warm-100 truncate">{schedule.name}</h3>
                        {!schedule.isActive && <span className="badge badge-warning text-xs">Paused</span>}
                        {isOverdue && <span className="badge badge-expense text-xs">Overdue</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-warm-500 dark:text-warm-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <DollarSignIcon className="w-4 h-4" />
                          {schedule.type === 'income' ? '+' : '-'}${Number(schedule.amount).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {frequencyLabels[schedule.frequency]}{schedule.customInterval > 1 && ` (every ${schedule.customInterval})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRightIcon className="w-4 h-4" />
                          Next: {format(next, 'MMM d, yyyy')}
                        </span>
                        {cat && (
                          <span className="flex items-center gap-1" style={{ color: cat.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                            {cat.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-nowrap">
                    <button onClick={() => handleToggle(schedule._id, schedule.isActive)} className="btn-ghost btn-icon p-2" aria-label={schedule.isActive ? 'Pause' : 'Resume'}>
                      {schedule.isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleEdit(schedule)} className="btn-ghost btn-icon p-2" aria-label="Edit">
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(schedule._id)} className="btn-ghost btn-icon p-2 text-expense-DEFAULT hover:text-expense-dark" aria-label="Delete">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in">
            <h2 className="text-xl font-display font-bold text-warm-900 dark:text-warm-50 mb-6">
              {editing ? 'Edit Schedule' : 'Create Recurring Schedule'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="name">Name</label>
                  <input id="name" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Netflix Subscription" required />
                </div>
                <div>
                  <label className="label" htmlFor="type">Type</label>
                  <select id="type" className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value, category: ''})}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label" htmlFor="amount">Amount</label>
                  <input id="amount" type="number" step="0.01" min="0" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
                </div>
                <div>
                  <label className="label" htmlFor="frequency">Frequency</label>
                  <select id="frequency" className="input" value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="customInterval">Custom Interval</label>
                  <input id="customInterval" type="number" min="1" className="input" value={form.customInterval} onChange={e => setForm({...form, customInterval: parseInt(e.target.value) || 1})} />
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
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="maxOccurrences">Max Occurrences (optional)</label>
                  <input id="maxOccurrences" type="number" min="1" className="input" value={form.maxOccurrences} onChange={e => setForm({...form, maxOccurrences: e.target.value})} />
                </div>
                <div>
                  <label className="label" htmlFor="account">Account *</label>
                  <select id="account" className="input" value={form.account} onChange={e => setForm({...form, account: e.target.value})} required>
                    <option value="">Select account</option>
                    {accounts.map(a => <option key={a._id} value={a._id}>{a.name} ({a.type})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="category">Category</label>
                <select id="category" className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Select category</option>
                  {filteredCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="description">Description</label>
                <textarea id="description" className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional description" />
              </div>
              <div className="border-t border-warm-200 dark:border-warm-800 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-warm-300 text-primary-500 focus:ring-primary-500" checked={form.isVariableAmount} onChange={e => setForm({...form, isVariableAmount: e.target.checked})} />
                  <span className="text-sm text-warm-700 dark:text-warm-300">Variable amount (random within range)</span>
                </label>
                {form.isVariableAmount && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-3 p-4 bg-warm-50 dark:bg-warm-800/50 rounded-xl">
                    <div>
                      <label className="label" htmlFor="varMin">Min Amount</label>
                      <input id="varMin" type="number" step="0.01" min="0" className="input" value={form.variableAmountRange.min} onChange={e => setForm({...form, variableAmountRange: {...form.variableAmountRange, min: e.target.value}})} />
                    </div>
                    <div>
                      <label className="label" htmlFor="varMax">Max Amount</label>
                      <input id="varMax" type="number" step="0.01" min="0" className="input" value={form.variableAmountRange.max} onChange={e => setForm({...form, variableAmountRange: {...form.variableAmountRange, max: e.target.value}})} />
                    </div>
                  </div>
                )}
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