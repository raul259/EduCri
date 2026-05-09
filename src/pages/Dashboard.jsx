import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAulas } from '../hooks/useAulas'
import { supabase } from '../lib/supabase'

const CATEGORY_NAMES = { semillitas: 'Semillitas', conquistadores: 'Conquistadores', valientes: 'Valientes', sala_cuna: 'Sala Cuna', otros: 'Otros' }
const DAYS_ES = { 0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miércoles', 4: 'jueves', 5: 'viernes', 6: 'sábado' }

const SAFE_COLOR_RE = /^from-[a-z0-9-]+ to-[a-z0-9-]+$/i

const STAT_VARIANTS = {
  blue:   { border: 'border-blue-500',   iconBg: 'bg-blue-100',   iconText: 'text-blue-600' },
  pink:   { border: 'border-pink-500',   iconBg: 'bg-pink-100',   iconText: 'text-pink-600' },
  purple: { border: 'border-purple-500', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
  yellow: { border: 'border-yellow-500', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
}

function StatCard({ title, value, icon, variant = 'blue' }) {
  const v = STAT_VARIANTS[variant]
  return (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${v.border} card-hover`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${v.iconBg} ${v.iconText} flex-shrink-0`}>
          <i className={`fas ${icon} text-xl`} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

function getNextSunday(fromToday = false) {
  const today = new Date()
  const day = today.getDay()
  const diff = fromToday && day === 0 ? 7 : (day === 0 ? 0 : 7 - day)
  const sun = new Date(today)
  sun.setDate(today.getDate() + diff)
  return sun
}

function AulaRow({ aula, label }) {
  const navigate = useNavigate()
  const safeColor = SAFE_COLOR_RE.test(aula.color) ? aula.color : 'from-blue-500 to-cyan-400'
  return (
    <div
      onClick={() => navigate('/aulas')}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${safeColor} flex flex-col items-center justify-center text-white shadow flex-shrink-0`}>
        <span className="text-[10px] font-bold opacity-80 uppercase">{label}</span>
        <span className="text-base font-bold leading-none">{aula.time}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-800 truncate">{aula.name}</h4>
        <p className="text-sm text-gray-500 truncate">
          <i className="fas fa-map-marker-alt text-pink-400 mr-1" aria-hidden="true" />
          {aula.classroom}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{aula.teacher}</p>
      </div>
      <i className="fas fa-chevron-right text-gray-300 text-sm flex-shrink-0" aria-hidden="true" />
    </div>
  )
}

export default function Dashboard() {
  const { user, role } = useApp()
  const { aulas, loading: aulasLoading } = useAulas()
  const [attendancePct, setAttendancePct] = useState(null)
  const [loadingStats, setLoadingStats]   = useState(false)

  const isToday      = new Date().getDay() === 0        // domingo = 0
  const todayClasses = isToday ? [...aulas].sort((a, b) => a.time.localeCompare(b.time)) : []
  const nextSunday   = getNextSunday(isToday)           // próximo domingo (si hoy es domingo, el siguiente)
  const nextSundayStr = nextSunday.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  useEffect(() => {
    if (!supabase || !user?.id) return
    setLoadingStats(true)

    let query = supabase.from('attendance_records').select('status').limit(500)
    if (role !== 'moderador') query = query.eq('teacher_id', user.id)

    query.then(({ data, error }) => {
      if (!error && Array.isArray(data) && data.length) {
        const present = data.filter(r => r.status === 'present').length
        setAttendancePct(Math.round((present / data.length) * 100))
      }
      setLoadingStats(false)
    })
  }, [user, role])

  return (
    <div className="space-y-6">
      {/* Stats — solo moderador */}
      {role === 'moderador' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Aulas" value={aulasLoading ? '—' : aulas.length}                                    icon="fa-chalkboard"    variant="blue"   />
          <StatCard title="Clases Hoy"  value={aulasLoading ? '—' : todayClasses.length}                             icon="fa-clock"         variant="pink"   />
          <StatCard title="Asistencia"  value={loadingStats || attendancePct === null ? '—' : `${attendancePct}%`}   icon="fa-users"         variant="purple" />
          <StatCard title="Sección"     value="Mod"                                                                   icon="fa-user-graduate" variant="yellow" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clases de hoy — solo si es domingo */}
        {isToday && (
          <section className="bg-white rounded-2xl shadow-sm p-6 lg:col-span-2">
            <h2 className="font-display font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-calendar-day text-blue-500" aria-hidden="true" />
              Clases de hoy
            </h2>
            {aulasLoading ? (
              <p className="text-gray-400 text-sm">Cargando...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {todayClasses.map(a => <AulaRow key={a.id} aula={a} label="HOY" />)}
              </div>
            )}
          </section>
        )}

        {/* Próxima clase */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-display font-bold text-gray-800 mb-1 flex items-center gap-2">
            <i className="fas fa-calendar-alt text-pink-500" aria-hidden="true" />
            Próxima clase
          </h2>
          <p className="text-xs text-gray-400 capitalize mb-4">{nextSundayStr}</p>
          {aulasLoading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : aulas.length ? (
            <div className="space-y-3">
              {[...aulas].sort((a, b) => a.time.localeCompare(b.time)).map(a => (
                <AulaRow key={a.id} aula={a} label={nextSunday.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4 text-center">No hay clases configuradas.</p>
          )}
        </section>

        {/* Accesos rápidos */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-display font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-bolt text-yellow-500" aria-hidden="true" />
            Acceso rápido
          </h2>
          <QuickActions role={role} />
        </section>
      </div>
    </div>
  )
}

function QuickActions({ role }) {
  const navigate = useNavigate()
  const actions = [
    { label: 'Registrar asistencia', icon: 'fa-clipboard-check', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', to: '/asistencia' },
    { label: 'Ver notificaciones',   icon: 'fa-bell',            color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',       to: '/notificaciones' },
    { label: 'Mi perfil',            icon: 'fa-user-gear',       color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', to: '/perfil' },
    ...(role === 'moderador'
      ? [{ label: 'Panel moderador', icon: 'fa-user-shield', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100', to: '/moderador' }]
      : []
    ),
  ]

  return (
    <div className="grid grid-cols-1 gap-3">
      {actions.map(a => (
        <button
          key={a.to}
          onClick={() => navigate(a.to)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-left ${a.color}`}
        >
          <i className={`fas ${a.icon} w-5 text-center`} aria-hidden="true" />
          {a.label}
        </button>
      ))}
    </div>
  )
}
