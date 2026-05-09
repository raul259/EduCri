import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useUnreadCount } from '../../hooks/useUnreadCount'

export default function MobileHeader() {
  const navigate  = useNavigate()
  const { signOut } = useApp()
  const unread = useUnreadCount()

  async function handleLogout() {
    if (!window.confirm('¿Cerrar sesión?')) return
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="lg:hidden bg-gradient-to-r from-blue-600 to-pink-500 text-white px-4 py-3 sticky top-0 z-40 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>🐑</span>
        <span className="font-display font-bold text-xl">EduCri</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate('/notificaciones')}
          className="relative p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Notificaciones"
        >
          <i className="fas fa-bell text-lg" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Cerrar sesión"
        >
          <i className="fas fa-sign-out-alt text-lg" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
