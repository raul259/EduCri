import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useUnreadCount } from '../../hooks/useUnreadCount'

const TITLES = {
  '/':               'Dashboard',
  '/aulas':          'Gestión de Aulas',
  '/asistencia':     'Control de Asistencia',
  '/calendario':     'Calendario Académico',
  '/notificaciones': 'Notificaciones',
  '/perfil':         'Perfil del Profesor',
  '/moderador':      'Panel de Moderador',
}

export default function Header() {
  const { user, role } = useApp()
  const unread = useUnreadCount()
  const location = useLocation()
  const navigate = useNavigate()
  const title  = TITLES[location.pathname] ?? 'EduCri'
  const name   = user?.user_metadata?.full_name || user?.email || 'Usuario'
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80`

  return (
    <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-400 text-sm mt-0.5" id="currentDate">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/notificaciones')}
          className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Notificaciones"
        >
          <i className="fas fa-bell text-lg" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <img src={avatar} alt="" className="w-9 h-9 rounded-full shadow-sm" loading="lazy" />
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800 leading-none">{name}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
