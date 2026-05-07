import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import ToastContainer from './components/ui/ToastContainer'
import Layout from './components/layout/Layout'
import Auth from './pages/Auth'
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
      <div className="text-center text-white">
        <div className="text-6xl animate-float mb-4">🐑</div>
        <p className="text-white/70 text-sm">Cargando...</p>
      </div>
    </div>
  )
}

function AuthGuard({ children }) {
  const { session, loading } = useApp()
  if (loading) return <Loader />
  if (!session) return <Navigate to="/login" replace />
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
        <Route path="/login" element={<GuestGuard><Auth /></GuestGuard>} />
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index                element={<Dashboard />} />
          <Route path="aulas"         element={<Aulas />} />
          <Route path="asistencia"    element={<Attendance />} />
          <Route path="calendario"    element={<Calendar />} />
          <Route path="notificaciones" element={<Notifications />} />
          <Route path="perfil"        element={<Profile />} />
          <Route path="moderador"     element={<ModeratorGuard><Moderator /></ModeratorGuard>} />
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
