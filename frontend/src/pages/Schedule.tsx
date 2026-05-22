import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { plansApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import clsx from 'clsx'

const TYPE_COLORS: Record<string, string> = {
  preventive: 'bg-blue-500', corrective: 'bg-red-500', predictive: 'bg-purple-500',
  lubrication: 'bg-amber-500', calibration: 'bg-cyan-500', inspection: 'bg-indigo-500',
}

export default function Schedule() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const { data: upcoming = [] } = useQuery({
    queryKey: ['upcoming-schedule'],
    queryFn: () => plansApi.upcoming(90).then(r => r.data),
  })

  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const firstDayOfMonth = startOfMonth(currentMonth).getDay()

  const getEventsForDay = (day: Date) =>
    upcoming.filter((ev: any) => isSameDay(new Date(ev.scheduled_date), day))

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronograma de Mantenimiento</h1>
          <p className="text-sm text-gray-500">Vista de mantenimientos programados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="card lg:col-span-2">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors">Hoy</button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {daysInMonth.map(day => {
              const events = getEventsForDay(day)
              const isSelected = selectedDay && isSameDay(day, selectedDay)
              const today = isToday(day)
              return (
                <div key={day.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                  className={clsx(
                    'min-h-[72px] p-1.5 rounded-lg cursor-pointer transition-all border',
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50',
                    today && !isSelected ? 'bg-blue-50 border-blue-200' : ''
                  )}>
                  <p className={clsx(
                    'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                    today ? 'bg-blue-600 text-white' : 'text-gray-700'
                  )}>
                    {format(day, 'd')}
                  </p>
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((ev: any) => (
                      <div key={ev.plan_id} className={`${TYPE_COLORS[ev.type] || 'bg-gray-400'} text-white text-[10px] rounded px-1 py-0.5 truncate`}>
                        {ev.equipment_code}
                      </div>
                    ))}
                    {events.length > 2 && <p className="text-[10px] text-gray-400">+{events.length - 2}</p>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className={`w-3 h-3 rounded-sm ${color}`} />
                <StatusBadge value={type} />
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Selected day events */}
          {selectedDay && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">
                {format(selectedDay, "d 'de' MMMM", { locale: es })}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Sin mantenimientos en este día</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((ev: any) => (
                    <div key={ev.plan_id} className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${TYPE_COLORS[ev.type] || 'bg-gray-400'}`} />
                        <StatusBadge value={ev.type} />
                      </div>
                      <p className="text-sm font-medium text-gray-800">{ev.equipment_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{ev.equipment_code}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> {ev.estimated_hours}h estimadas
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming list */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Próximos 30 días</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {upcoming.slice(0, 15).map((ev: any) => (
                <div key={ev.plan_id} className={clsx(
                  'flex items-center gap-3 p-2.5 rounded-lg transition-colors',
                  ev.days_until < 0 ? 'bg-red-50' : ev.days_until <= 3 ? 'bg-orange-50' : 'bg-gray-50'
                )}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_COLORS[ev.type] || 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{ev.equipment_name}</p>
                    <p className="text-[10px] text-gray-400">{ev.scheduled_date}</p>
                  </div>
                  <span className={clsx(
                    'text-xs font-semibold flex-shrink-0',
                    ev.days_until < 0 ? 'text-red-600' : ev.days_until <= 3 ? 'text-orange-600' : 'text-gray-500'
                  )}>
                    {ev.days_until < 0 ? `Vencido ${Math.abs(ev.days_until)}d` : ev.days_until === 0 ? 'Hoy' : `${ev.days_until}d`}
                  </span>
                </div>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Sin mantenimientos programados</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
