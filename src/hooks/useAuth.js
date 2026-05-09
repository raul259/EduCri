import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())
}

function isValidE164Phone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(String(phone || '').trim())
}

function hasMinimumAge(birthDate, minAge = 18) {
  if (!birthDate) return false
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= minAge
}

function getTypoSuggestion(email) {
  const parts = String(email || '').toLowerCase().split('@')
  if (parts.length !== 2) return null
  const fixes = {
    'gmil.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com',
    'gmail.con': 'gmail.com', 'hotnail.com': 'hotmail.com', 'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com', 'yaho.com': 'yahoo.com', 'yhoo.com': 'yahoo.com',
  }
  const fix = fixes[parts[1]]
  return fix ? `${parts[0]}@${fix}` : null
}

function authError(error, mode = 'login') {
  const msg = String(error?.message || '').toLowerCase()
  if (!msg) return mode === 'register' ? 'No se pudo crear la cuenta.' : 'No se pudo iniciar sesión.'
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Sin conexión con Supabase.'
  if (msg.includes('user already registered')) return 'Ese correo ya está registrado. Inicia sesión.'
  if (msg.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (msg.includes('email not confirmed')) return 'Confirma tu correo antes de entrar.'
  if (msg.includes('signup is disabled')) return 'El registro está desactivado.'
  return `${mode === 'register' ? 'No se pudo crear la cuenta' : 'No se pudo iniciar sesión'}: ${error?.message}`
}

export function useAuth() {
  const { showToast } = useApp()
  const [submitting, setSubmitting] = useState(false)

  async function login({ email, password }) {
    if (!isValidEmail(email)) { showToast('Correo inválido.', 'warning'); return false }
    const typo = getTypoSuggestion(email)
    if (typo) { showToast(`¿Quisiste escribir ${typo}?`, 'warning'); return false }

    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setSubmitting(false)

    if (error) { showToast(authError(error, 'login'), 'error'); return false }
    return true
  }

  async function register({ email, password, confirmPassword, fullName, birthDate, phone, hasCds, cdsExpiry, receivedHolySpirit, teachingExperience, teacherType = 'titular' }) {
    if (!isValidEmail(email))          { showToast('Correo inválido.', 'warning'); return false }
    const typo = getTypoSuggestion(email)
    if (typo)                          { showToast(`¿Quisiste escribir ${typo}?`, 'warning'); return false }
    if (fullName.trim().length < 6)    { showToast('Escribe nombre completo con apellidos.', 'warning'); return false }
    if (!birthDate)                    { showToast('Selecciona tu fecha de nacimiento.', 'warning'); return false }
    if (!hasMinimumAge(birthDate, 18)) { showToast('Debes ser mayor de 18 años.', 'warning'); return false }
    if (!isValidE164Phone(phone))      { showToast('Teléfono en formato E.164 (ej: +34600111222).', 'warning'); return false }
    if (teachingExperience.trim().length < 3) { showToast('Describe tu experiencia previa.', 'warning'); return false }
    if (password.length < 8)           { showToast('Contraseña mínimo 8 caracteres.', 'warning'); return false }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      showToast('Contraseña debe tener mayúscula, minúscula y número.', 'warning'); return false
    }
    if (password !== confirmPassword)  { showToast('Las contraseñas no coinciden.', 'warning'); return false }

    setSubmitting(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          birth_date: birthDate,
          phone: phone.trim(),
          has_cds: hasCds,
          cds_expiry_date: hasCds && cdsExpiry ? cdsExpiry : null,
          received_holy_spirit: receivedHolySpirit,
          teaching_experience: teachingExperience.trim(),
          teacher_type: teacherType,
        },
      },
    })
    setSubmitting(false)

    if (error) { showToast(authError(error, 'register'), 'error'); return false }
    if (!data.session) return 'confirm' // email confirmation required
    return true
  }

  async function resetPassword(email) {
    if (!isValidEmail(email)) { showToast('Correo inválido.', 'warning'); return false }
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/login`,
    })
    setSubmitting(false)
    if (error) { showToast('No se pudo enviar el correo de recuperación.', 'error'); return false }
    showToast('Enlace enviado. Revisa tu correo.', 'success')
    return true
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) showToast('No se pudo iniciar sesión con Google.', 'error')
  }

  return { login, register, resetPassword, loginWithGoogle, submitting }
}
