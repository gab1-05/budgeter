import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { importExportAPI, authAPI } from '../services/api'
import { UserIcon, MoonIcon, SunIcon, GlobeIcon, DownloadIcon, UploadIcon, FileIcon, LockIcon, ShieldIcon, BellIcon, TrashIcon, RefreshIcon } from '../components/Icons'

export default function Settings() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('general')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('light')
  const [currency, setCurrency] = useState('USD')
  const [notifications, setNotifications] = useState({ email: true, push: true, budget: true, recurring: true })
  const [exportLoading, setExportLoading] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    loadUser()
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')
  }, [])

  const loadUser = async () => {
    try {
      const { data } = await authAPI.me()
      setUser(data)
      setCurrency(data.currency || 'USD')
      setNotifications({
        email: data.emailNotifications,
        push: data.pushNotifications,
        budget: data.budgetAlerts,
        recurring: data.recurringReminders
      })
    } catch (e) {
      console.error('Failed to load user', e)
    } finally {
      setLoading(false)
    }
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const { data: blob } = await importExportAPI.export()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert('Export failed: ' + e.message)
    } finally {
      setExportLoading(false)
    }
  }

  const handleImportPreview = async (file) => {
    const text = await file.text()
    try {
      const { data } = await importExportAPI.preview({ csv: text })
      setImportPreview(data)
      setImportError('')
    } catch (e) {
      setImportError(e.response?.data?.message || 'Invalid CSV format')
      setImportPreview(null)
    }
  }

  const handleImportConfirm = async () => {
    if (!importFile) return
    const text = await importFile.text()
    try {
      const { data } = await importExportAPI.import({ csv: text, accountId: importPreview.accountId })
      alert(`Imported ${data.imported} transactions. ${data.duplicates} duplicates skipped. ${data.errors.length} errors.`)
      setImportFile(null)
      setImportPreview(null)
    } catch (e) {
      alert('Import failed: ' + e.message)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: UserIcon },
    { id: 'appearance', label: 'Appearance', icon: MoonIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'data', label: 'Data Management', icon: FileIcon },
    { id: 'security', label: 'Security', icon: ShieldIcon },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your preferences and account</p>

      {/* Tab Navigation */}
      <div className="card p-1">
        <div className="flex flex-wrap gap-1" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-warm-900 shadow-card text-primary-600 dark:text-primary-400'
                  : 'text-warm-500 hover:text-warm-700 dark:text-warm-400 dark:hover:text-warm-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="card" role="tabpanel" aria-labelledby={activeTab}>
        {/* General */}
        {activeTab === 'general' && (
          <div className="p-6 space-y-6">
            <h2 className="section-title">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" defaultValue={user?.name} disabled />
                <p className="text-xs text-warm-500 mt-1">Name changes require account verification</p>
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" defaultValue={user?.email} disabled />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="currency">Default Currency</label>
                  <select id="currency" className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="dateFormat">Date Format</label>
                  <select id="dateFormat" className="input" defaultValue="MM/DD/YYYY" disabled>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>

            <h2 className="section-title pt-4 border-t border-warm-200 dark:border-warm-800">Financial Preferences</h2>
            <div>
              <label className="label" htmlFor="emergencyReserve">Emergency Reserve</label>
              <input id="emergencyReserve" type="number" step="0.01" min="0" className="input" placeholder="0.00" defaultValue={user?.emergencyReserve || 0} />
              <p className="text-xs text-warm-500 mt-1">Minimum amount to keep reserved. Used in Safe-to-Spend calculations.</p>
            </div>
          </div>
        )}

        {/* Appearance */}
        {activeTab === 'appearance' && (
          <div className="p-6 space-y-6">
            <h2 className="section-title">Theme</h2>
            <div className="grid grid-cols-3 gap-3">
              {['light', 'dark', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === t
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-warm-200 dark:border-warm-700 hover:border-primary-300 dark:hover:border-primary-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center">
                    {t === 'light' && <SunIcon className="w-6 h-6 text-amber-500" />}
                    {t === 'dark' && <MoonIcon className="w-6 h-6 text-cobalt-500" />}
                    {t === 'system' && <GlobeIcon className="w-6 h-6 text-warm-500" />}
                  </div>
                  <p className="text-center font-medium capitalize">{t}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-4">
            <h2 className="section-title">Notification Preferences</h2>
            <NotificationToggle label="Email Notifications" description="Receive email updates about your finances" checked={notifications.email} onChange={e => setNotifications({...notifications, email: e.target.checked})} />
            <NotificationToggle label="Push Notifications" description="Receive browser push notifications" checked={notifications.push} onChange={e => setNotifications({...notifications, push: e.target.checked})} />
            <NotificationToggle label="Budget Alerts" description="Get notified when approaching budget limits" checked={notifications.budget} onChange={e => setNotifications({...notifications, budget: e.target.checked})} />
            <NotificationToggle label="Recurring Reminders" description="Reminders for upcoming recurring payments" checked={notifications.recurring} onChange={e => setNotifications({...notifications, recurring: e.target.checked})} />
          </div>
        )}

        {/* Data Management */}
        {activeTab === 'data' && (
          <div className="p-6 space-y-8">
            <div>
              <h2 className="section-title mb-4">Export Data</h2>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-warm-50 dark:bg-warm-800/50 border border-warm-200 dark:border-warm-700">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <DownloadIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium text-warm-900 dark:text-warm-100">Export Transactions</p>
                  <p className="text-sm text-warm-500 dark:text-warm-400">Download all your transactions as a CSV file</p>
                </div>
                <button onClick={handleExport} disabled={exportLoading} className="btn-primary ml-auto">
                  {exportLoading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>

            <div>
              <h2 className="section-title mb-4">Import Transactions</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border-2 border-dashed border-warm-300 dark:border-warm-700">
                  <input type="file" accept=".csv" className="hidden" id="importFile" onChange={e => { setImportFile(e.target.files[0]); if (e.target.files[0]) handleImportPreview(e.target.files[0]) }} />
                  <label htmlFor="importFile" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-warm-100 dark:bg-warm-800 flex items-center justify-center">
                      <UploadIcon className="w-8 h-8 text-warm-500" />
                    </div>
                    <p className="text-warm-600 dark:text-warm-400">Click or drag a CSV file to upload</p>
                    <p className="text-xs text-warm-400">CSV must include: Date, Type, Amount</p>
                  </label>
                </div>

                {importPreview && (
                  <div className="p-4 rounded-xl bg-warm-50 dark:bg-warm-800/50 border border-warm-200 dark:border-warm-700">
                    <h4 className="font-medium text-warm-900 dark:text-warm-100 mb-3">Preview ({importPreview.totalRows} rows)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-warm-500">
                            {importPreview.headers.map(h => <th key={h} className="pb-2">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.preview.map((row, i) => (
                            <tr key={i} className="border-t border-warm-200 dark:border-warm-700">
                              {importPreview.headers.map(h => <td key={h} className="py-2">{row[h] || ''}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importError && <p className="text-expense-DEFAULT text-sm mt-2">{importError}</p>}
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => { setImportFile(null); setImportPreview(null); }} className="btn-secondary">Cancel</button>
                      <button onClick={handleImportConfirm} disabled={importError} className="btn-primary">Import Transactions</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-warm-200 dark:border-warm-800">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <TrashIcon className="w-5 h-5 text-expense-DEFAULT" />
                Danger Zone
              </h2>
              <p className="text-warm-600 dark:text-warm-400 mb-4">These actions are irreversible. Please proceed with caution.</p>
              <div className="flex items-center justify-between p-4 rounded-xl bg-expense-light/50 dark:bg-expense-dark/10 border border-expense-DEFAULT/20">
                <div>
                  <p className="font-medium text-expense-dark">Delete All Data</p>
                  <p className="text-sm text-expense-DEFAULT">Permanently delete all transactions, accounts, budgets, and recurring schedules</p>
                </div>
                <button className="btn-danger">Delete Everything</button>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-6">
            <h2 className="section-title">Account Security</h2>
            <div className="space-y-4">
              <SecurityItem
                icon={LockIcon}
                title="Change Password"
                description="Update your account password"
                action="Change"
              />
              <SecurityItem
                icon={ShieldIcon}
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                action="Enable"
                disabled
              />
              <SecurityItem
                icon={RefreshIcon}
                title="Active Sessions"
                description="View and manage your active login sessions"
                action="View"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationToggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-warm-50 dark:bg-warm-800/50 border border-warm-200 dark:border-warm-700">
      <div>
        <p className="font-medium text-warm-900 dark:text-warm-100">{label}</p>
        <p className="text-sm text-warm-500 dark:text-warm-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-warm-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-warm-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-warm-600 peer-checked:bg-primary-500"></div>
      </label>
    </div>
  )
}

function SecurityItem({ icon: Icon, title, description, action, disabled }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-warm-50 dark:bg-warm-800/50 border border-warm-200 dark:border-warm-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="font-medium text-warm-900 dark:text-warm-100">{title}</p>
          <p className="text-sm text-warm-500 dark:text-warm-400">{description}</p>
        </div>
      </div>
      <button disabled={disabled} className="btn-secondary">
        {action}
      </button>
    </div>
  )
}