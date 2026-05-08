/**
 * authService.js — Capa de autenticación centralizada
 *
 * Responsabilidades:
 *  1. Obtener y guardar el token JWT (Supabase lo guarda en localStorage automáticamente)
 *  2. Leer el usuario y su perfil
 *  3. Verificar si está autenticado y qué rol tiene
 *  4. Proveer el token para llamadas a Edge Functions / APIs externas
 *
 * FLUJO COMPLETO:
 *
 *  Login ──▶ Supabase genera JWT ──▶ guardado en localStorage
 *       ──▶ onAuthStateChange dispara ──▶ AppContext actualiza session
 *       ──▶ AppContext carga teacher_profiles ──▶ obtiene approval_status + teacher_type
 *       ──▶ Guards en App.jsx leen session + role + teacherProfile
 *       ──▶ Redirigen a la pantalla correcta
 */

import { supabase } from './supabase'

// ── 1. Token ────────────────────────────────────────────────────────────────

/**
 * Devuelve el token JWT activo.
 * Supabase lo renueva automáticamente antes de que expire (cada ~1h).
 * Úsalo para llamar a Edge Functions o APIs externas.
 */
export async function getAccessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

// ── 2. Sesión y usuario ─────────────────────────────────────────────────────

/**
 * Devuelve la sesión completa (user + token + expires_at).
 * null si no hay sesión activa.
 */
export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

/**
 * Devuelve solo el usuario autenticado.
 * Verifica el token con Supabase (no solo lee localStorage).
 */
export async function getUser() {
  if (!supabase) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

// ── 3. Rol ──────────────────────────────────────────────────────────────────

/**
 * Extrae el rol del usuario de forma segura.
 *
 * - app_metadata  → solo el SERVIDOR puede escribirlo → fuente de verdad para rol
 * - user_metadata → el cliente puede editarlo → NUNCA confiar para autorización
 *
 * Roles posibles: 'moderador' | 'profesor'
 */
export function getUserRole(user) {
  if (!user) return 'profesor'
  return user.app_metadata?.role === 'moderador' ? 'moderador' : 'profesor'
}

export function isModerador(user) {
  return getUserRole(user) === 'moderador'
}

export function isAuthenticated(session) {
  return Boolean(session?.user)
}

// ── 4. Perfil del profesor ──────────────────────────────────────────────────

/**
 * Carga el perfil del profesor desde teacher_profiles.
 * Incluye: approval_status, teacher_type, cds_expiry_date, full_name.
 * Los moderadores no necesitan aprobación → devuelve perfil aprobado automáticamente.
 */
export async function loadTeacherProfile(user) {
  if (!supabase || !user) return null

  if (isModerador(user)) {
    return { approval_status: 'approved', teacher_type: 'titular' }
  }

  const { data } = await supabase
    .from('teacher_profiles')
    .select('approval_status, teacher_type, approval_notes, cds_expiry_date, full_name')
    .eq('user_id', user.id)
    .single()

  return data ?? null
}

// ── 5. Llamadas a APIs protegidas ───────────────────────────────────────────

/**
 * Helper para llamar a Supabase Edge Functions con el token del usuario.
 *
 * Ejemplo:
 *   const data = await callProtectedApi('admin-stats')
 *   const data = await callProtectedApi('send-report', 'POST', { teacherId: '...' })
 */
export async function callProtectedApi(functionName, method = 'GET', body = null) {
  const token = await getAccessToken()
  if (!token) throw new Error('No hay sesión activa')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const url = `${supabaseUrl}/functions/v1/${functionName}`

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `Error ${res.status}`)
  }

  return res.json()
}

// ── 6. Cerrar sesión ────────────────────────────────────────────────────────

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
  // Supabase elimina el token de localStorage automáticamente
}
