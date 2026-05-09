import React, { useState, useMemo } from 'react'
import { useAulas } from '../hooks/useAulas'

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const SAFE_COLOR_RE = /^from-[a-z0-9-]+ to-[a-z0-9-]+$/i
const SUNDAY = 0

export default function Calendar() {
  const { aulas, loading } = useAulas()
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const { year, month } = cur
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function prev() { setCur(c => c.month === 0  ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }) }
  function next() { setCur(c => c.month === 11 ? { year: c.year + 1, month: 0  } : { ...c, month: c.month + 1 }) }


  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = d => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="space-y-5">

      {/* ── Navegación de mes ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
        <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Mes anterior">
          <i className="fas fa-chevron-left text-gray-500" />
        </button>
        <h2 className="font-display text-xl font-bold text-gray-900">
          {MONTHS_ES[month]} {year}
        </h2>
        <button onClick={next} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" aria-label="Mes siguiente">
          <i className="fas fa-chevron-right text-gray-500" />
        </button>
      </div>

      {/* ── Grid mensual ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cabecera días */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS_ES.map(d => (
            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="min-h-[80px] border-r border-b border-gray-50 bg-gray-50/50" />

            const weekday = (firstDay + day - 1) % 7
            const clases  = weekday === SUNDAY ? aulas : []

            return (
              <div
                key={day}
                className={`min-h-[80px] p-1.5 border-r border-b border-gray-50 ${isToday(day) ? 'bg-blue-50' : ''}`}
              >
                <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded-full mb-1
                  ${isToday(day) ? 'bg-blue-500 text-white' : 'text-gray-500'}`}>
                  {day}
                </span>
                {!loading && clases.map(a => {
                  const color = SAFE_COLOR_RE.test(a.color) ? a.color : 'from-blue-500 to-cyan-400'
                  return (
                    <div
                      key={a.id}
                      className={`bg-gradient-to-r ${color} text-white text-xs px-1.5 py-0.5 rounded-md truncate mb-0.5`}
                      title={`${a.name} · ${a.time} · ${a.classroom}`}
                    >
                      {a.name}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Leyenda ── */}
      {!loading && aulas.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Clases programadas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aulas.map(a => {
              const color = SAFE_COLOR_RE.test(a.color) ? a.color : 'from-blue-500 to-cyan-400'
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.name}</p>
                    <p className="text-xs text-gray-400">Domingo · {a.time} · {a.classroom}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
