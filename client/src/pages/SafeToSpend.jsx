import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { safeToSpendAPI } from '../services/api'
import { WalletIcon, AlertTriangleIcon, CheckCircleIcon, CalculatorIcon, ShieldIcon, ArrowRightIcon, MinusIcon, PlusIcon, InfoIcon } from '../components/Icons'

export default function SafeToSpend() {
  const [calculation, setCalculation] = useState(null)
  const [quick, setQuick] = useState(null)
  const [loading, setLoading] = useState(true)
  const [horizon, setHorizon] = useState('month')
  const [plannedPurchase, setPlannedPurchase] = useState('')
  const [emergencyReserve, setEmergencyReserve] = useState('')
  const [showBreakdown, setShowBreakdown] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadQuick()
    calculate()
  }, [horizon, plannedPurchase, emergencyReserve])

  const loadQuick = async () => {
    try {
      const { data } = await safeToSpendAPI.quick()
      setQuick(data)
    } catch (e) {
      console.error('Failed to load quick calculation', e)
    }
  }

  const calculate = async () => {
    try {
      setLoading(true)
      const { data } = await safeToSpendAPI.calculate({
        horizon,
        plannedPurchase: parseFloat(plannedPurchase) || 0,
        emergencyReserve: parseFloat(emergencyReserve) || undefined
      })
      setCalculation(data)
      setError('')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to calculate')
    } finally {
      setLoading(false)
    }
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
  }

  const getStatusColor = (amount, isPositive = true) => {
    if (amount === 0) return 'text-warm-500'
    return isPositive ? (amount > 0 ? 'text-income-DEFAULT' : 'text-expense-DEFAULT') : (amount > 0 ? 'text-expense-DEFAULT' : 'text-income-DEFAULT')
  }

  if (loading && !calculation) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Safe to Spend</h1>
          <p className="page-subtitle">Calculate how much you can safely spend without compromising your financial goals</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={horizon} onChange={e => setHorizon(e.target.value)} className="input w-auto">
            <option value="today">Today</option>
            <option value="week">Next 7 Days</option>
            <option value="month">Rest of Month</option>
          </select>
        </div>
      </div>

      {/* Quick Summary Card */}
      {quick && (
        <div className="card bg-gradient-to-br from-primary-50 to-cobalt-50 dark:from-primary-900/20 dark:to-cobalt-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700 dark:text-primary-300 font-medium">Quick Estimate (Next 7 Days)</p>
              <p className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400 mt-1">
                {formatMoney(quick.safeToSpend)}
              </p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <WalletIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white/50 dark:bg-warm-900/50 rounded-xl">
              <p className="text-primary-600 dark:text-primary-400 font-semibold">{formatMoney(quick.availableFunds)}</p>
              <p className="text-warm-500 dark:text-warm-400">Available</p>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-warm-900/50 rounded-xl">
              <p className="text-expense-DEFAULT font-semibold">{formatMoney(quick.upcomingWeek)}</p>
              <p className="text-warm-500 dark:text-warm-400">Upcoming</p>
            </div>
            <div className="text-center p-3 bg-white/50 dark:bg-warm-900/50 rounded-xl">
              <p className="text-income-DEFAULT font-semibold">{formatMoney(quick.safeToSpend)}</p>
              <p className="text-warm-500 dark:text-warm-400">Safe to Spend</p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Planner */}
      <div className="card">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <CalculatorIcon className="w-5 h-5" />
          Scenario Planner
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="plannedPurchase">Planned Purchase</label>
            <input id="plannedPurchase" type="number" step="0.01" min="0" className="input" placeholder="0.00" value={plannedPurchase} onChange={e => setPlannedPurchase(e.target.value)} />
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">Test how a purchase affects your safe-to-spend</p>
          </div>
          <div>
            <label className="label" htmlFor="emergencyReserve">Emergency Reserve</label>
            <input id="emergencyReserve" type="number" step="0.01" min="0" className="input" placeholder="Optional" value={emergencyReserve} onChange={e => setEmergencyReserve(e.target.value)} />
            <p className="text-xs text-warm-500 dark:text-warm-400 mt-1">Override default emergency reserve</p>
          </div>
          <div className="flex items-end">
            <button onClick={calculate} className="btn-primary w-full" disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="card border-expense-DEFAULT/30 bg-expense-light/50 dark:bg-expense-dark/10 p-4 text-expense-dark dark:text-expense-light">{error}</div>}

      {/* Main Calculation */}
      {calculation && (
        <div className="space-y-6">
          {/* Result Card */}
          <div className="card bg-gradient-to-br from-warm-50 to-white dark:from-warm-900/50 dark:to-warm-900 border-warm-200 dark:border-warm-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Your Safe-to-Spend Amount</h2>
              <button onClick={() => setShowBreakdown(!showBreakdown)} className="btn-ghost btn-icon p-2" aria-label={showBreakdown ? 'Hide breakdown' : 'Show breakdown'}>
                {showBreakdown ? <MinusIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
              </button>
            </div>
            <div className="text-center py-4">
              <p className={`text-5xl font-display font-bold ${calculation.safeToSpend > 0 ? 'text-income-DEFAULT' : 'text-expense-DEFAULT'}`}>
                {formatMoney(calculation.safeToSpend)}
              </p>
              <p className="text-warm-500 dark:text-warm-400 mt-2">
                {calculation.horizon === 'today' ? 'Available to spend today' : calculation.horizon === 'week' ? 'Available for the next 7 days' : 'Available for the rest of the month'}
              </p>
              {calculation.dailySafeAmount && (
                <p className="text-sm text-warm-500 dark:text-warm-400 mt-1">
                  ≈ {formatMoney(calculation.dailySafeAmount)} per day
                </p>
              )}
            </div>

            {/* Scenario Result */}
            {calculation.scenario.plannedPurchase > 0 && (
              <div className={`mt-4 p-4 rounded-xl ${calculation.scenario.wouldExceed ? 'bg-expense-light/50 dark:bg-expense-dark/10 border border-expense-DEFAULT/20' : 'bg-income-light/50 dark:bg-income-dark/10 border border-income-DEFAULT/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-warm-500 dark:text-warm-400">After planned purchase of {formatMoney(calculation.scenario.plannedPurchase)}</p>
                    <p className={`font-semibold ${calculation.scenario.wouldExceed ? 'text-expense-DEFAULT' : 'text-income-DEFAULT'}`}>
                      {formatMoney(calculation.scenario.safeAfterPurchase)}
                    </p>
                  </div>
                  {calculation.scenario.wouldExceed && (
                    <AlertTriangleIcon className="w-6 h-6 text-expense-DEFAULT" />
                  )}
                </div>
              </div>
            )}

            {calculation.warning && (
              <div className="mt-4 p-4 rounded-xl bg-warning-light/50 dark:bg-warning-dark/10 border border-warning-DEFAULT/20 flex items-center gap-3">
                <AlertTriangleIcon className="w-6 h-6 text-warning-dark flex-shrink-0" />
                <p className="text-warning-dark">{calculation.warning}</p>
              </div>
            )}
          </div>

          {/* Breakdown */}
          {showBreakdown && (
            <div className="card">
              <h2 className="section-title mb-4">Detailed Breakdown</h2>
              <div className="space-y-3">
                <BreakdownRow label="Available Funds" value={calculation.availableFunds} icon={<WalletIcon className="w-5 h-5" />} positive />
                <BreakdownRow label="Expected Income" value={calculation.expectedIncome} icon={<ArrowRightIcon className="w-5 h-5" />} positive />
                <BreakdownRow label="Upcoming Recurring Bills" value={calculation.upcomingRecurring} icon={<ShieldIcon className="w-5 h-5" />} negative />
                <BreakdownRow label="Essential Expenses" value={calculation.essentialExpenses} icon={<ShieldIcon className="w-5 h-5" />} negative />
                <BreakdownRow label="Planned Savings" value={calculation.plannedSavings} icon={<ShieldIcon className="w-5 h-5" />} negative />
                <BreakdownRow label="Emergency Reserve" value={calculation.requiredReserve} icon={<ShieldIcon className="w-5 h-5" />} negative />
                {calculation.paidRecurringAdjustment > 0 && (
                  <BreakdownRow label="Already Paid (Adjustment)" value={calculation.paidRecurringAdjustment} icon={<CheckCircleIcon className="w-5 h-5" />} positive />
                )}
                <div className="border-t border-warm-200 dark:border-warm-800 pt-3">
                  <BreakdownRow label="Total Available" value={calculation.totalAvailable} icon={<WalletIcon className="w-5 h-5" />} isTotal />
                  <BreakdownRow label="Total Committed" value={calculation.totalCommitted} icon={<ShieldIcon className="w-5 h-5" />} isTotal negative />
                  <BreakdownRow label="Safe to Spend" value={calculation.safeToSpend} icon={<CalculatorIcon className="w-5 h-5" />} isTotal highlight />
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Recurring Details */}
          {calculation.upcomingRecurringDetails.length > 0 && showBreakdown && (
            <div className="card">
              <h2 className="section-title mb-4">Upcoming Recurring Payments</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {calculation.upcomingRecurringDetails.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-expense-light dark:bg-expense-dark/20 flex items-center justify-center">
                        <ShieldIcon className="w-5 h-5 text-expense-DEFAULT" />
                      </div>
                      <div>
                        <p className="font-medium text-warm-900 dark:text-warm-100">{item.name}</p>
                        <p className="text-sm text-warm-500 dark:text-warm-400">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-expense-DEFAULT">{formatMoney(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions */}
          {showBreakdown && (
            <div className="card border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-900/50">
              <h3 className="font-semibold text-warm-900 dark:text-warm-100 mb-3 flex items-center gap-2">
                <InfoIcon className="w-5 h-5 text-warm-500" />
                Assumptions & Limitations
              </h3>
              <ul className="space-y-2 text-sm text-warm-600 dark:text-warm-400">
                {calculation.assumptions.map((assumption, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-warm-400 mt-2 flex-shrink-0" />
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="card border-warm-200 dark:border-warm-800 bg-warm-50 dark:bg-warm-900/50 text-sm text-warm-600 dark:text-warm-400">
        <p className="font-medium text-warm-900 dark:text-warm-100 mb-2">Important Disclaimer</p>
        <p>This calculator provides estimates based on your current data and assumptions. It does not constitute financial advice. Actual results may vary due to unexpected expenses, income changes, or timing differences. Always maintain an adequate emergency fund and consult a financial advisor for major decisions.</p>
      </div>
    </div>
  )
}

function BreakdownRow({ label, value, icon, positive = true, negative = false, isTotal = false, highlight = false }) {
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
  }

  let colorClass = 'text-warm-900 dark:text-warm-100'
  if (highlight) colorClass = value >= 0 ? 'text-income-DEFAULT' : 'text-expense-DEFAULT'
  else if (isTotal) colorClass = 'text-warm-900 dark:text-warm-100 font-semibold'
  else if (positive) colorClass = 'text-income-DEFAULT'
  else if (negative) colorClass = 'text-expense-DEFAULT'

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl ${isTotal || highlight ? 'bg-warm-100 dark:bg-warm-800' : 'bg-white dark:bg-warm-900'} border border-warm-200 dark:border-warm-700`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-warm-400">{icon}</span>}
        <span className={isTotal || highlight ? 'font-semibold' : ''}>{label}</span>
      </div>
      <span className={colorClass}>{formatMoney(value)}</span>
    </div>
  )
}