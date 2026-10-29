import { useEffect, useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, subMonths, addMonths, eachDayOfInterval } from 'date-fns'
import { transactionAPI, recurringAPI } from '../services/api'
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, PlusIcon, DollarSignIcon } from '../components/Icons'

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [transactions, setTransactions] = useState([])
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dayDetails, setDayDetails] = useState({ transactions: [], recurring: [] })

  useEffect(() => {
    loadData()
  }, [currentMonth])

  const loadData = async () => {
    try {
      setLoading(true)
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)
      const [txRes, recRes] = await Promise.all([
        transactionAPI.getAll({ startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') }),
        recurringAPI.getAll()
      ])
      setTransactions(txRes.data.transactions)
      setRecurring(recRes.data)
    } catch (e) {
      console.error('Failed to load calendar data', e)
    } finally {
      setLoading(false)
    }
  }

  const getDayEvents = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTx = transactions.filter(tx => format(new Date(tx.date), 'yyyy-MM-dd') === dayStr)
    const dayRec = recurring.filter(r => {
      // Simplified: check if recurring falls on this day
      const next = new Date(r.nextRunAt)
      return format(next, 'yyyy-MM-dd') === dayStr
    })
    return { transactions: dayTx, recurring: dayRec }
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
    setDayDetails(getDayEvents(day))
  }

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const weeks = useMemo(() => {
    const result = []
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7))
    }
    return result
  }, [days])

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>

  return (
    <div className="space-y-6 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">View upcoming payments and income at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-secondary btn-icon p-2" aria-label="Previous month">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="px-4 font-semibold text-warm-900 dark:text-warm-100">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="btn-secondary btn-icon p-2" aria-label="Next month">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-warm-200 dark:border-warm-800">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-3 py-2 text-center text-xs font-semibold text-warm-500 dark:text-warm-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="contents">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const today = isToday(day)
                const selected = selectedDay && isSameDay(day, selectedDay)
                const events = getDayEvents(day)
                const hasEvents = events.transactions.length > 0 || events.recurring.length > 0
                const incomeTotal = events.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
                const expenseTotal = events.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                const recurringTotal = events.recurring.reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0)

                return (
                  <button
                    key={`${weekIndex}-${dayIndex}`}
                    onClick={() => handleDayClick(day)}
                    className={`relative aspect-square p-2 transition-colors ${
                      !isCurrentMonth ? 'bg-warm-50/50 dark:bg-warm-900/50' : 'bg-white dark:bg-warm-900'
                    } ${today ? 'bg-primary-50 dark:bg-primary-900/20' : ''} ${selected ? 'ring-2 ring-primary-500' : ''} hover:bg-warm-100 dark:hover:bg-warm-800`}
                    style={{ borderRight: dayIndex < 6 ? '1px solid #e7e5e4' : 'none', borderBottom: '1px solid #e7e5e4' }}
                  >
                    <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-warm-400' : today ? 'text-primary-600 dark:text-primary-400' : 'text-warm-900 dark:text-warm-100'}`}>
                      {format(day, 'd')}
                    </span>
                    {hasEvents && (
                      <div className="mt-1 space-y-1 max-h-20 overflow-hidden">
                        {events.transactions.slice(0, 2).map(tx => (
                          <div key={tx._id} className={`text-xs px-1.5 py-0.5 rounded truncate ${tx.type === 'income' ? 'bg-income-light text-income-dark' : 'bg-expense-light text-expense-dark'}`}>
                            {tx.type === 'income' ? '+' : '-'}${tx.amount}
                          </div>
                        ))}
                        {events.recurring.slice(0, 2).map(r => (
                          <div key={r._id} className={`text-xs px-1.5 py-0.5 rounded truncate border ${r.type === 'income' ? 'bg-income-light text-income-dark border-income-DEFAULT' : 'bg-expense-light text-expense-dark border-expense-DEFAULT'}`}>
                            ⏰ {r.type === 'income' ? '+' : '-'}${r.amount}
                          </div>
                        ))}
                        {(events.transactions.length + events.recurring.length > 4) && (
                          <div className="text-xs text-warm-500 dark:text-warm-400 text-center">
                            +{events.transactions.length + events.recurring.length - 4} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="card animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">
              <CalendarIcon className="w-5 h-5" />
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}{today && ' (Today)'}
            </h2>
            <button onClick={() => setSelectedDay(null)} className="btn-ghost btn-icon p-2">
              <ChevronRightIcon className="w-5 h-5 rotate-180" />
            </button>
          </div>
          {dayDetails.transactions.length === 0 && dayDetails.recurring.length === 0 ? (
            <div className="empty-state py-8">
              <CalendarIcon className="w-12 h-12 empty-state-icon" />
              <p>No transactions or recurring payments scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dayDetails.transactions.length > 0 && (
                <div>
                  <h3 className="font-medium text-warm-900 dark:text-warm-100 mb-2 flex items-center gap-2">
                    <DollarSignIcon className="w-5 h-5 text-primary-600" />
                    Transactions ({dayDetails.transactions.length})
                  </h3>
                  <div className="space-y-2">
                    {dayDetails.transactions.map(tx => (
                      <div key={tx._id} className="flex items-center justify-between p-3 rounded-xl bg-warm-50 dark:bg-warm-800/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-income-light dark:bg-income-dark/20' : 'bg-expense-light dark:bg-expense-dark/20'}`}>
                            <DollarSignIcon className={`w-5 h-5 ${tx.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-warm-900 dark:text-warm-100">{tx.description || tx.category?.name || 'Transaction'}</p>
                            <p className="text-sm text-warm-500 dark:text-warm-400">{tx.category?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${tx.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`}>
                          {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dayDetails.recurring.length > 0 && (
                <div>
                  <h3 className="font-medium text-warm-900 dark:text-warm-100 mb-2 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary-600" />
                    Recurring Payments ({dayDetails.recurring.length})
                  </h3>
                  <div className="space-y-2">
                    {dayDetails.recurring.map(r => (
                      <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-warm-900 dark:text-warm-100">{r.name}</p>
                            <p className="text-sm text-warm-500 dark:text-warm-400">{r.frequency}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${r.type === 'income' ? 'text-income-dark' : 'text-expense-dark'}`}>
                          {r.type === 'income' ? '+' : '-'}${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-warm-200 dark:border-warm-800">
                <div className="flex items-center gap-4 text-sm text-warm-500 dark:text-warm-400">
                  <span>Income: <span className="text-income-dark font-semibold">{formatMoney(dayDetails.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) + dayDetails.recurring.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0))}</span></span>
                  <span>Expenses: <span className="text-expense-dark font-semibold">{formatMoney(dayDetails.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) + dayDetails.recurring.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0))}</span></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="card p-4">
        <h3 className="font-medium text-warm-900 dark:text-warm-100 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <LegendItem color="bg-primary-50 dark:bg-primary-900/20" text="Today" />
          <LegendItem color="bg-income-light dark:bg-income-dark/20" text="Income" textColor="text-income-dark" />
          <LegendItem color="bg-expense-light dark:bg-expense-dark/20" text="Expense" textColor="text-expense-dark" />
          <LegendItem color="bg-primary-50 dark:bg-primary-900/20 border border-primary-DEFAULT" text="Recurring" textColor="text-primary-600" />
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, text, textColor = 'text-warm-700 dark:text-warm-300' }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 rounded ${color}`} />
      <span className={textColor}>{text}</span>
    </div>
  )
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}