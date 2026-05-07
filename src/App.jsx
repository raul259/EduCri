import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import ToastContainer from './components/ui/ToastContainer'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
import ProfileCompletion from './pages/ProfileCompletion'
import PendingApproval from './pages/PendingApproval'
import Dashboard from './pages/Dashboard'
import Aulas from './pages/Aulas'
import Attendance from './pages/Attendance'
import Calendar from './pages/Calendar'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Moderator from './pages/Moderator'

function Loader() {
  return (
    <div className="fixed inset-0 gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl animate-float mb-4">🐑</div>
        <p className="text-white/70 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

function isProfileComplete(user) {
  const m = user?.user_metadata || {}
  return Boolean(m.phone && m.birth_date && m.teaching_experience)
}

function AuthGuard({ children }) {
  const { session, loading, user, role, teacherProfile } = useApp()
  const location = useLocation()
  const path = location.pathname

  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />

  // 1. Perfil incompleto (típicamente usuarios de Google OAuth)
  if (!isProfileComplete(user) && path !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  // 2. Moderadores siempre tienen acceso total
  if (role === 'moderador') return children

  // 3. Profesores: comprobar validación del moderador
  if (teacherProfile?.approval_status === 'pending' && path !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />
  }
  if (teacherProfile?.approval_status === 'rejected' && path !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />
  }

  return children
}

function GuestGuard({ children }) {
  const { session, loading } = useApp()
  if (loading) return <Loader />
  if (session) return <Navigate to="/" replace />
  return children
}

function ModeratorGuard({ children }) {
  const { role } = useApp()
  if (role !== 'moderador') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<GuestGuard><Auth /></GuestGuard>} />

        {/* Flujos de incorporación — autenticado, sin Layout */}
        <Route path="/complete-profile"  element={<AuthGuard><ProfileCompletion /></AuthGuard>} />
        <Route path="/pending-approval"  element={<AuthGuard><PendingApproval /></AuthGuard>} />

        {/* App principal */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index                  element={<Dashboard />} />
          <Route path="aulas"           element={<Aulas />} />
          <Route path="asistencia"      element={<Attendance />} />
          <Route path="calendario"      element={<Calendar />} />
          <Route path="notificaciones"  element={<Notifications />} />
          <Route path="perfil"          element={<Profile />} />
          <Route path="moderador"       element={<ModeratorGuard><Moderator /></ModeratorGuard>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
