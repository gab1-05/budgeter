import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountAPI, categoryAPI } from '../services/api'
import { CreditCardIcon, WalletIcon, BuildingIcon, CoinsIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon } from '../components/Icons'

const typeIcons = { cash: CoinsIcon, bank: BuildingIcon, credit: CreditCardIcon, wallet: WalletIcon }
const typeLabels = { cash: 'Cash', bank: 'Bank', credit: 'Credit Card', wallet: 'Digital Wallet' }

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'bank', balance: 0, currency: 'USD', isDefault: false })
  const [error, setError] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const { data } = await accountAPI.getAll()
      setAccounts(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await accountAPI.update(editing._id, form)
      } else {
        await accountAPI.create(form)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadAccounts()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save account')
    }
  }

  const handleEdit = (account) => {
    setEditing(account)
    setForm({ name: account.name, type: account.type, balance: account.balance, currency: account.currency, isDefault: account.isDefault })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account? This cannot be undone.')) return
    try {
      await accountAPI.delete(id)
      loadAccounts()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete account')
    }
  }

  const resetForm = () => setForm({ name: '', type: 'bank', balance: 0, currency: 'USD', isDefault: false })

  const openCreate = () => { resetForm(); setEditing(null); setShowModal(true) }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage your financial accounts and track balances</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" /> Add Account
        </button>
      </div>

      {error && <div className="card border-expense-DEFAULT/30 bg-expense-light/50 dark:bg-expense-dark/10 p-4 text-expense-dark dark:text-expense-light">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map(account => {
          const Icon = typeIcons[account.type] || WalletIcon
          return (
            <div key={account._id} className="card card-interactive">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-warm-900 dark:text-warm-100">{account.name}</h3>
                      {account.isDefault && <span className="badge badge-warning text-xs">Default</span>}
                    </div>
                    <p className="text-sm text-warm-500 dark:text-warm-400 capitalize">{typeLabels[account.type]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold text-warm-900 dark:text-warm-50">
                    ${account.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-warm-500 dark:text-warm-400">{account.currency}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-warm-200 dark:border-warm-800">
                <button onClick={() => handleEdit(account)} className="btn-ghost btn-icon p-2" aria-label="Edit account">
                  <EditIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(account._id)} className="btn-ghost btn-icon p-2 text-expense-DEFAULT hover:text-expense-dark" aria-label="Delete account">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
        
        {accounts.length === 0 && (
          <div className="card col-span-full empty-state">
            <div className="empty-state-icon">
              <WalletIcon className="w-16 h-16" />
            </div>
            <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">No accounts yet</h3>
            <p className="mb-4">Create your first account to start tracking your finances</p>
            <button onClick={openCreate} className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" /> Add Account
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-elevated w-full max-w-md p-6 animate-in">
            <h2 className="text-xl font-display font-bold text-warm-900 dark:text-warm-50 mb-6">
              {editing ? 'Edit Account' : 'Add Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Checking Account" required />
              </div>
              <div>
                <label className="label" htmlFor="type">Type</label>
                <select id="type" className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="credit">Credit Card</option>
                  <option value="wallet">Digital Wallet</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="balance">Initial Balance</label>
                <input id="balance" type="number" step="0.01" className="input" value={form.balance} onChange={e => setForm({...form, balance: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <label className="label" htmlFor="currency">Currency</label>
                <input id="currency" className="input" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-warm-300 text-primary-500 focus:ring-primary-500" checked={form.isDefault} onChange={e => setForm({...form, isDefault: e.target.checked})} />
                <span className="text-sm text-warm-700 dark:text-warm-300">Set as default account</span>
              </label>
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