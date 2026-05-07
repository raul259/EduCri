import React from 'react'
import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const BASE_ITEMS = [
  { to: '/',              icon: 'fa-home',            label: 'Inicio'    },
  { to: '/asistencia',   icon: 'fa-clipboard-check', label: 'Asistencia' },
  { to: '/notificaciones', icon: 'fa-bell',           label: 'Avisos'    },
  { to: '/perfil',        icon: 'fa-user-gear',       label: 'Perfil'    },
]

const MOD_ITEM = { to: '/moderador', icon: 'fa-user-shield', label: 'Mod' }

export default function MobileNav() {
  const { role } = useApp()
  const items = role === 'moderador' ? [...BASE_ITEMS, MOD_ITEM] : BASE_ITEMS

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-white/10 flex" aria-label="Navegación móvil">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors
            ${isActive ? 'text-pink-400' : 'text-gray-400 hover:text-gray-200'}`
          }
        >
          <i className={`fas ${item.icon} text-lg`} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
