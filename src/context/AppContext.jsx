/**
 * AppContext — Estado global de autenticación
 *
 * Proporciona a toda la app:
 *   session      → sesión Supabase (token incluido)
 *   user         → datos del usuario autenticado
 *   role         → 'moderador' | 'profesor'  (solo de app_metadata)
 *   teacherProfile → { approval_status, teacher_type, ... }
 *   loading      → true mientras se carga la sesión inicial
 *
 * Flujo al arrancar:
 *   1. getSession() → recupera sesión del localStorage (si existe)
 *   2. onAuthStateChange → escucha cambios (login, logout, token renovado)
 *   3. Cuando hay usuario → loadTeacherProfile() → carga approval_status
 *   4. Guards en App.jsx leen estos valores y redirigen según corresponda
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  getUserRole,
  isModerador,
  loadTeacherProfile,
  signOut as authSignOut,
} from '../lib/authService'

const AppContext = createContext(null)

let _toastId = 0

export function AppProvider({ children }) {
  // undefined = todavía cargando | null = no logueado | objeto = logueado
  const [session,        setSession]        = useState(undefined)
  const [teacherProfile, setTeacherProfile] = useState(undefined)
  const [toasts,         setToasts]         = useState([])

  // ── Escuchar cambios de sesión ──────────────────────────────
  useEffect(() => {
    if (!supabase) {
      setSession(null)
      setTeacherProfile(null)
      return
    }

    // 1. Recuperar sesión guardada en localStorage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    // 2. Escuchar eventos: LOGIN, LOGOUT, TOKEN_REFRESHED, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Cargar perfil cuando cambia el usuario ──────────────────
  useEffect(() => {
    const user = session?.user ?? null

    if (!user) {
      setTeacherProfile(null)
      return
    }

    // Los moderadores no necesitan esperar aprobación
    if (isModerador(user)) {
      setTeacherProfile({ approval_status: 'approved', teacher_type: 'titular' })
      return
    }

    setTeacherProfile(undefined) // cargando
    loadTeacherProfile(user).then(profile => setTeacherProfile(profile ?? null))
  }, [session])

  // ── Recargar perfil manualmente (ej: botón "Comprobar estado") ─
  const reloadTeacherProfile = useCallback(async () => {
    const user = session?.user ?? null
    if (!user) return
    const profile = await loadTeacherProfile(user)
    setTeacherProfile(profile ?? null)
  }, [session])

  // ── Cerrar sesión ───────────────────────────────────────────
  const signOut = useCallback(async () => {
    await authSignOut()
    setSession(null)
    setTeacherProfile(null)
  }, [])

  // ── Toasts ──────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'info') => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Valores derivados ───────────────────────────────────────
  const user    = session?.user ?? null
  const role    = getUserRole(user)          // 'moderador' | 'profesor'
  const loading = session === undefined      // true solo en la carga inicial
               || (session !== null && teacherProfile === undefined)

  return (
    <AppContext.Provider value={{
      session,
      user,
      role,
      loading,
      teacherProfile,
      reloadTeacherProfile,
      toasts,
      showToast,
      dismissToast,
      signOut,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
