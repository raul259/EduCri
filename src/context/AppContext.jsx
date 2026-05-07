import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

let _toastId = 0

export function AppProvider({ children }) {
  const [session,        setSession]        = useState(undefined) // undefined = cargando auth
  const [teacherProfile, setTeacherProfile] = useState(undefined) // undefined = cargando perfil
  const [toasts,         setToasts]         = useState([])

  // Sesión
  useEffect(() => {
    if (!supabase) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Perfil del profesor (approval_status, teacher_type, etc.)
  useEffect(() => {
    const user = session?.user ?? null

    if (!supabase || !user) {
      setTeacherProfile(null)
      return
    }
    // Moderadores no necesitan validación de aprobación
    if (user.app_metadata?.role === 'moderador') {
      setTeacherProfile({ approval_status: 'approved', teacher_type: 'titular' })
      return
    }

    setTeacherProfile(undefined) // cargando
    supabase
      .from('teacher_profiles')
      .select('approval_status, teacher_type, approval_notes, cds_expiry_date, full_name')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setTeacherProfile(data ?? null))
  }, [session])

  const reloadTeacherProfile = useCallback(async () => {
    const user = session?.user ?? null
    if (!supabase || !user) return
    const { data } = await supabase
      .from('teacher_profiles')
      .select('approval_status, teacher_type, approval_notes, cds_expiry_date, full_name')
      .eq('user_id', user.id)
      .single()
    setTeacherProfile(data ?? null)
  }, [session])

  const showToast = useCallback((message, type = 'info') => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setTeacherProfile(null)
  }, [])

  const user = session?.user ?? null
  const role = user?.app_metadata?.role === 'moderador' ? 'moderador' : 'profesor'

  // loading = true mientras sesión o perfil estén cargando
  const loading = session === undefined || (session !== null && teacherProfile === undefined)

  return (
    <AppContext.Provider value={{
      session, user, role, loading,
      teacherProfile, reloadTeacherProfile,
      toasts, showToast, dismissToast, signOut,
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
