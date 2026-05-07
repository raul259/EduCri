import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

let _toastId = 0

export function AppProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    if (!supabase) { setSession(null); return }

    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

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
  }, [])

  const user = session?.user ?? null

  // Rol derivado exclusivamente de app_metadata (solo el servidor puede editarlo)
  const role = user?.app_metadata?.role === 'moderador' ? 'moderador' : 'profesor'

  const loading = session === undefined

  return (
    <AppContext.Provider value={{ session, user, role, loading, toasts, showToast, dismissToast, signOut }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
