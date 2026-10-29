import { useEffect, useState } from 'react'
import { categoryAPI } from '../services/api'
import { PlusIcon, EditIcon, TrashIcon, TagIcon, PlaneIcon } from '../components/Icons'

// Custom icon components to replace emojis
function MoneyIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function BurgerIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function BusIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
}
function ShoppingIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v7m12 0l-4 4m4-4H6m14 0l-4-4m0 0H6" /></svg>
}
function BookIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20a4.5 4.5 0 001.5-9V5.5A2.5 2.5 0 0116.5 3H6.5A2.5 2.5 0 014 5.5V17a2 2 0 002 2h10a2 2 0 002-2V7.5A2.5 2.5 0 0019.5 5H4v14.5z" /></svg>
}
function GameIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
}
function HeartIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
}
function HomeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
function PhoneIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 2.257a1 1 0 01-1.21.502l-4.493 1.498a1 1 0 01-1.21-.502L3 10.5V5a2 2 0 012-2h.5a1.5 1.5 0 010 3H3v7a2 2 0 002 2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 2.257a1 1 0 01-1.21.502l-4.493 1.498a1 1 0 01-1.21-.502L3 21.5V15a2 2 0 01-2-2v-2.5a.5.5 0 00-.5-.5h-1a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h.5a1 1 0 01.5.5v1.5a1 1 0 001 1h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 2.257a1 1 0 01-1.21.502L3 23.5V19a2 2 0 012-2z" /></svg>
}
function BriefcaseIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
}

function CoffeeIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16a2 2 0 010 4H4a2 2 0 010-4zm0 6h16a2 2 0 010 4H4a2 2 0 010-4z" /></svg>
}
function DogIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5a2.5 2.5 0 015 0v1.5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1.5a1.5 1.5 0 00-3 0v1.5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1.5a2.5 2.5 0 015 0zM8 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1v-1zM16 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z" /></svg>
}
function CoffeeBeanIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5a2.5 2.5 0 015 0v1.5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1.5a2.5 2.5 0 015 0zM8 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1v-1zM16 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z" /></svg>
}
function PillIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16a2 2 0 010 4H4a2 2 0 010-4zm0 6h16a2 2 0 010 4H4a2 2 0 010-4z" /></svg>
}
function GiftIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
}
function RunIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
}
function BulbIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
}
function ScissorsIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18M17 4l4 4m0 0l-4 4m4-4H3" /></svg>
}
function BoxIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
}
function TrendingIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
}
function RefundIcon({ className }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
}

// Map stored icon keys (emoji strings kept in DB for compatibility) to SVG components.
// Icons are rendered from this map so no emoji is ever displayed in the UI.
const ICON_MAP = {
  '🍔': BurgerIcon,
  '🚌': BusIcon,
  '🛍️': ShoppingIcon,
  '🎮': GameIcon,
  '🏥': HeartIcon,
  '🏠': HomeIcon,
  '💡': BulbIcon,
  '📱': PhoneIcon,
  '📚': BookIcon,
  '💇': ScissorsIcon,
  '🎁': GiftIcon,
  '✈️': PlaneIcon,
  '📦': BoxIcon,
  '💻': BriefcaseIcon,
  '💼': BriefcaseIcon,
  '📈': TrendingIcon,
  '💰': MoneyIcon,
  '↩️': RefundIcon,
}
const DEFAULT_ICON = '🍔'

function CategoryIcon({ icon, className }) {
  const IconComp = ICON_MAP[icon] || TagIcon
  return <IconComp className={className} />
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'expense', color: '#7c4dff', icon: DEFAULT_ICON })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const presetColors = ['#7c4dff', '#3b82f6', '#f97316', '#84cc16', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#ef4444', '#22c55e']
  const presetIcons = Object.keys(ICON_MAP)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const { data } = await categoryAPI.getAll()
      setCategories(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    try {
      if (editing) {
        await categoryAPI.update(editing._id, form)
      } else {
        await categoryAPI.create(form)
      }
      setShowModal(false)
      setEditing(null)
      resetForm()
      loadCategories()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save category')
    }
  }

  const handleEdit = (category) => {
    setEditing(category)
    setForm({ name: category.name, type: category.type, color: category.color || '#7c4dff', icon: category.icon || DEFAULT_ICON })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? This will not delete associated transactions.')) return
    try {
      await categoryAPI.delete(id)
      loadCategories()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete category')
    }
  }

  const resetForm = () => setForm({ name: '', type: 'expense', color: '#7c4dff', icon: DEFAULT_ICON })

  const openCreate = () => { resetForm(); setEditing(null); setShowModal(true) }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your transactions with custom categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" /> Add Category
        </button>
      </div>

      {error && <div className="card border-expense-DEFAULT/30 bg-expense-light/50 dark:bg-expense-dark/10 p-4 text-expense-dark dark:text-expense-light">{error}</div>}

      {/* Categories Grid */}
      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {categories.map(category => (
            <div key={category._id} className="card-interactive p-4 relative group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: category.color + '20', color: category.color }}>
                  <CategoryIcon icon={category.icon} className="w-6 h-6" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(category)} className="btn-ghost btn-icon p-1" aria-label="Edit">
                    <EditIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-warm-900 dark:text-warm-100 mb-1">{category.name}</h3>
              <span className={`badge ${category.type === 'income' ? 'badge-income' : 'badge-expense'} text-xs`}>
                {category.type}
              </span>
              {category.isSystem && <span className="absolute top-3 right-3 badge badge-warning text-xs">System</span>}
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full empty-state py-12">
              <TagIcon className="w-16 h-16 empty-state-icon" />
              <h3 className="text-lg font-semibold text-warm-900 dark:text-warm-100 mb-2">No categories yet</h3>
              <p className="mb-4">Create categories to organize your transactions</p>
              <button onClick={openCreate} className="btn-primary">
                <PlusIcon className="w-5 h-5 mr-2" /> Add Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-warm-900 rounded-2xl shadow-elevated w-full max-w-md p-6 animate-in">
            <h2 className="text-xl font-display font-bold text-warm-900 dark:text-warm-50 mb-6">
              {editing ? 'Edit Category' : 'Create Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Groceries" required autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="type">Type</label>
                <select id="type" className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({...form, color})}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        form.color === color ? 'border-primary-500 scale-110' : 'border-transparent hover:border-warm-300 dark:hover:border-warm-600'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                      aria-pressed={form.color === color}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {presetIcons.map(iconKey => {
                    const IconComp = ICON_MAP[iconKey]
                    return (
                      <button
                        key={iconKey}
                        type="button"
                        onClick={() => setForm({...form, icon: iconKey})}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                          form.icon === iconKey ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-110' : 'border-transparent hover:border-warm-300 dark:hover:border-warm-600'
                        }`}
                        aria-label={iconKey}
                        aria-pressed={form.icon === iconKey}
                      >
                        <IconComp className="w-6 h-6" />
                      </button>
                    )
                  })}
                </div>
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