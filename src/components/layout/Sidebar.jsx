import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const NAV_ITEMS = [
  { to: '/',            icon: 'fa-home',           label: 'Dashboard',    roles: ['profesor', 'moderador'] },
  { to: '/aulas',       icon: 'fa-chalkboard',     label: 'Aulas',        roles: ['moderador'] },
  { to: '/calendario',  icon: 'fa-calendar-alt',   label: 'Calendario',   roles: ['moderador'] },
  { to: '/asistencia',  icon: 'fa-clipboard-check', label: 'Asistencia',  roles: ['profesor', 'moderador'] },
  { to: '/notificaciones', icon: 'fa-bell',        label: 'Notificaciones', roles: ['profesor', 'moderador'] },
  { to: '/perfil',      icon: 'fa-user-gear',      label: 'Perfil',       roles: ['profesor', 'moderador'] },
  { to: '/moderador',   icon: 'fa-user-shield',    label: 'Moderador',    roles: ['moderador'] },
]

export default function Sidebar() {
  const { user, role, signOut } = useApp()
  const navigate = useNavigate()
  const name   = user?.user_metadata?.full_name || user?.email || 'Usuario'
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=80`

  async function handleLogout() {
    if (!window.confirm('¿Cerrar sesión?')) return
    await signOut()
    navigate('/login', { replace: true })
  }

  const visible = NAV_ITEMS.filter(item => item.roles.includes(role))

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl flex-shrink-0">
      {/* Logo + usuario */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center text-xl shadow flex-shrink-0">
            🐑
          </div>
          <div>
            <h2 className="font-display font-bold text-lg leading-none">EduCri</h2>
            <p className="text-xs text-gray-400 mt-0.5">Panel de Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <img src={avatar} alt="" className="w-9 h-9 rounded-full" loading="lazy" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-gray-400 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Navegación principal">
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `sidebar-item w-full flex items-center gap-3 px-4 py-3 text-left text-sm ${isActive ? 'active text-white' : 'text-gray-300 hover:text-white'}`
            }
          >
            <i className={`fas ${item.icon} w-5 text-center`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm"
        >
          <i className="fas fa-sign-out-alt w-5 text-center" aria-hidden="true" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
