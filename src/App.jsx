/**
 * App.jsx — Router principal con protección de rutas
 *
 * ÁRBOL DE DECISIÓN para cada petición de ruta:
 *
 *  ¿Hay sesión?
 *  ├─ NO  → /login (GuestGuard redirige aquí si intenta entrar a rutas privadas)
 *  └─ SÍ
 *     ¿Perfil completo? (phone + birth_date + teaching_experience)
 *     ├─ NO  → /complete-profile
 *     └─ SÍ
 *        ¿Es moderador? (app_metadata.role === 'moderador')
 *        ├─ SÍ → acceso total, incluyendo /moderador
 *        └─ NO (es profesor)
 *           ¿approval_status?
 *           ├─ 'pending'  → /pending-approval
 *           ├─ 'rejected' → /pending-approval (con mensaje de rechazo)
 *           └─ 'approved' → acceso al panel de profesor
 */

import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import ToastContainer from './components/ui/ToastContainer'
import Layout from './components/layout/Layout'

// Páginas de incorporación (sin Layout)
import Auth             from './pages/Auth'
import ProfileCompletion from './pages/ProfileCompletion'
import PendingApproval  from './pages/PendingApproval'

// Páginas de la app
import Dashboard      from './pages/Dashboard'
import Aulas          from './pages/Aulas'
import Attendance     from './pages/Attendance'
import Calendar       from './pages/Calendar'
import Notifications  from './pages/Notifications'
import Profile        from './pages/Profile'
import Moderator      from './pages/Moderator'

// ── Pantalla de carga ──────────────────────────────────────────
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

// ── Utilidad: ¿tiene el perfil completo? ──────────────────────
function isProfileComplete(user) {
  const m = user?.user_metadata ?? {}
  return Boolean(m.phone && m.birth_date && m.teaching_experience)
}

// ── Guard 1: rutas privadas ────────────────────────────────────
// Verifica: sesión → perfil completo → aprobado → rol correcto
function AuthGuard({ children }) {
  const { session, loading, user, role, teacherProfile } = useApp()
  const { pathname } = useLocation()

  if (loading) return <Loader />

  // Sin sesión → login
  if (!session) return <Navigate to="/login" replace />

  // Perfil incompleto (usuarios de Google OAuth sin datos extra)
  if (!isProfileComplete(user) && pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  // Moderadores: acceso total sin restricciones de aprobación
  if (role === 'moderador') return children

  // Profesores: deben estar aprobados
  const status = teacherProfile?.approval_status
  if ((status === 'pending' || status === 'rejected') && pathname !== '/pending-approval') {
    return <Navigate to="/pending-approval" replace />
  }

  return children
}

// ── Guard 2: rutas públicas (login) ───────────────────────────
// Si ya hay sesión, va al dashboard en lugar del login
function GuestGuard({ children }) {
  const { session, loading } = useApp()
  if (loading) return <Loader />
  if (session)  return <Navigate to="/" replace />
  return children
}

// ── Guard 3: panel de moderador ───────────────────────────────
// Solo accesible si role === 'moderador'
function ModeratorGuard({ children }) {
  const { role } = useApp()
  if (role !== 'moderador') return <Navigate to="/" replace />
  return children
}

// ── Rutas ──────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ── Pública ── */}
        <Route path="/login"
          element={<GuestGuard><Auth /></GuestGuard>}
        />

        {/* ── Incorporación (autenticado pero sin Layout) ── */}
        <Route path="/complete-profile"
          element={<AuthGuard><ProfileCompletion /></AuthGuard>}
        />
        <Route path="/pending-approval"
          element={<AuthGuard><PendingApproval /></AuthGuard>}
        />

        {/* ── App principal (autenticado + aprobado) ── */}
        <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
          <Route index                  element={<Dashboard />} />
          <Route path="aulas"           element={<Aulas />} />
          <Route path="asistencia"      element={<Attendance />} />
          <Route path="calendario"      element={<Calendar />} />
          <Route path="notificaciones"  element={<Notifications />} />
          <Route path="perfil"          element={<Profile />} />

          {/* ── Panel administrador: doble verificación ── */}
          <Route path="moderador"
            element={
              <ModeratorGuard>
                <Moderator />
              </ModeratorGuard>
            }
          />
        </Route>

        {/* Cualquier ruta desconocida → inicio */}
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
