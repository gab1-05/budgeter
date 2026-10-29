import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionAPI, accountAPI, categoryAPI } from '../services/api'
import { PlusIcon, ArrowLeftIcon, ArrowRightIcon, WalletIcon, CreditCardIcon, BuildingIcon, CoinsIcon } from '../components/Icons'

const typeIcons = { cash: CoinsIcon, bank: BuildingIcon, credit: CreditCardIcon, wallet: WalletIcon }
const typeLabels = { cash: 'Cash', bank: 'Bank', credit: 'Credit Card', wallet: 'Digital Wallet' }

export default function AddTransaction() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: 'expense',
    account: '',
    category: '',
    amount: '',
    currency: 'USD',
    description: '',
    merchant: '',
    paymentMethod: 'other',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        accountAPI.getAll(),
        categoryAPI.getAll()
      ])
      setAccounts(accountsRes.data)
      setCategories(categoriesRes.data)

      // Set default account
      const defaultAcc = accountsRes.data.find(a => a.isDefault) || accountsRes.data[0]
      if (defaultAcc) setForm(prev => ({ ...prev, account: defaultAcc._id }))
    } catch (e) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.account || !form.amount) {
      setError('Account and amount are required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await transactionAPI.create({
        type: form.type,
        account: form.account,
        category: form.category || undefined,
        amount: parseFloat(form.amount),
        currency: form.currency,
        description: form.description,
        merchant: form.merchant,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        date: form.date
      })
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === form.type)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="max-w-2xl mx-auto animate-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="btn-ghost btn-icon p-2" aria-label="Go back">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title">Add Transaction</h1>
          <p className="page-subtitle">Record a new income or expense</p>
        </div>
      </div>

      {error && <div className="card border-expense-DEFAULT/30 bg-expense-light/50 dark:bg-expense-dark/10 p-4 text-expense-dark dark:text-expense-light mb-6">{error}</div>}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Type Selector */}
        <div>
          <label className="label">Type</label>
          <div className="flex gap-3">
            {['income', 'expense', 'transfer'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, type, category: '' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  form.type === type
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <span className={type === 'income' ? 'text-income-dark' : type === 'expense' ? 'text-expense-dark' : 'text-primary-600'}>
                  {type === 'income' ? '+' : type === 'expense' ? '−' : '↔'}
                </span>
                <span className="font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account Selector */}
        <div>
          <label className="label" htmlFor="account">Account *</label>
          <select id="account" className="input" value={form.account} onChange={e => setForm({...form, account: e.target.value})} required>
            <option value="">Select account</option>
            {accounts.map(acc => (
              <option key={acc._id} value={acc._id}>
                {acc.name} ({typeLabels[acc.type]}) - ${(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select id="category" className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
            <option value="">Select category (optional)</option>
            {filteredCategories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Amount & Currency */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="amount">Amount *</label>
            <input id="amount" type="number" step="0.01" min="0" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" required />
          </div>
          <div>
            <label className="label" htmlFor="currency">Currency</label>
            <input id="currency" className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input id="date" type="date" className="input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">Description</label>
          <input id="description" className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g., Grocery shopping" />
        </div>

        {/* Merchant & Payment Method */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="merchant">Merchant</label>
            <input id="merchant" className="input" value={form.merchant} onChange={e => setForm({...form, merchant: e.target.value})} placeholder="e.g., Walmart" />
          </div>
          <div>
            <label className="label" htmlFor="paymentMethod">Payment Method</label>
            <select id="paymentMethod" className="input" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="digital_wallet">Digital Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" className="input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional notes..." />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4 border-t border-warm-200 dark:border-warm-800">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
            <ArrowLeftIcon className="w-4 h-4 mr-2" /> Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Transaction'}
          </button>
        </div>
      </form>
    </div>
  )
}