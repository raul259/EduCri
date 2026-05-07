import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const INPUT = 'w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/55 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | register | reset
  const [email, setEmail]                           = useState('')
  const [password, setPassword]                     = useState('')
  const [confirmPassword, setConfirmPassword]       = useState('')
  const [fullName, setFullName]                     = useState('')
  const [birthDate, setBirthDate]                   = useState('')
  const [phone, setPhone]                           = useState('')
  const [hasCds, setHasCds]                         = useState(false)
  const [cdsExpiry, setCdsExpiry]                   = useState('')
  const [receivedHolySpirit, setReceivedHolySpirit] = useState(false)
  const [teachingExperience, setTeachingExperience] = useState('')

  const { login, register, resetPassword, loginWithGoogle, submitting } = useAuth()
  const { showToast } = useApp()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!supabase) {
      showToast('Crea un .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.', 'warning')
      return
    }

    if (mode === 'login') {
      await login({ email, password })

    } else if (mode === 'register') {
      const result = await register({
        email, password, confirmPassword,
        fullName, birthDate, phone,
        hasCds, cdsExpiry, receivedHolySpirit, teachingExperience,
      })
      if (result === 'confirm') { setMode('login'); setPassword(''); setConfirmPassword('') }

    } else {
      const ok = await resetPassword(email)
      if (ok) setMode('login')
    }
  }

  return (
    <div className="fixed inset-0 gradient-bg flex items-center justify-center p-4">
      <div className="absolute top-8 left-8 text-white/10 text-5xl select-none" aria-hidden>✨</div>
      <div className="absolute bottom-8 right-8 text-white/10 text-5xl select-none" aria-hidden>📚</div>

      <div className="glass rounded-3xl p-8 w-full max-w-md shadow-2xl animate-slide-up overflow-y-auto max-h-[92vh]">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-7xl animate-float select-none" aria-label="EduCri">🐑</div>
          <h1 className="font-display text-4xl font-bold text-white mt-2">EduCri</h1>
          <p className="text-white/65 text-sm mt-1">
            {mode === 'login'    ? 'Bienvenido de nuevo'
           : mode === 'register' ? 'Crear nueva cuenta'
           :                       'Recuperar contraseña'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* Email — todos los modos */}
          <input
            type="email" placeholder="Correo electrónico"
            value={email} onChange={e => setEmail(e.target.value)}
            className={INPUT} required autoComplete="email"
          />

          {/* Contraseña — login y register */}
          {(mode === 'login' || mode === 'register') && (
            <input
              type="password" placeholder="Contraseña"
              value={password} onChange={e => setPassword(e.target.value)}
              className={INPUT} required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          )}

          {/* Confirmar contraseña — register */}
          {mode === 'register' && (
            <input
              type="password" placeholder="Confirmar contraseña"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className={INPUT} required autoComplete="new-password"
            />
          )}

          {/* Campos extra — register */}
          {mode === 'register' && (
            <div className="space-y-3 pt-1 border-t border-white/20">
              <input
                type="text" placeholder="Nombre completo y apellidos"
                value={fullName} onChange={e => setFullName(e.target.value)}
                className={INPUT} required autoComplete="name"
              />
              <div>
                <label className="block text-white/65 text-xs mb-1">Fecha de nacimiento</label>
                <input
                  type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                  className={INPUT} required
                />
              </div>
              <input
                type="tel" placeholder="Teléfono (+34600111222)"
                value={phone} onChange={e => setPhone(e.target.value)}
                className={INPUT} required
              />
              <label className="flex items-center gap-3 text-white/85 text-sm cursor-pointer select-none">
                <input
                  type="checkbox" checked={hasCds} onChange={e => setHasCds(e.target.checked)}
                  className="w-4 h-4 rounded accent-pink-400 flex-shrink-0"
                />
                Tengo certificado de delitos sexuales (CDS)
              </label>
              {hasCds && (
                <div>
                  <label className="block text-white/65 text-xs mb-1">Fecha de vencimiento del CDS</label>
                  <input
                    type="date" value={cdsExpiry} onChange={e => setCdsExpiry(e.target.value)}
                    className={INPUT}
                  />
                </div>
              )}
              <label className="flex items-center gap-3 text-white/85 text-sm cursor-pointer select-none">
                <input
                  type="checkbox" checked={receivedHolySpirit} onChange={e => setReceivedHolySpirit(e.target.checked)}
                  className="w-4 h-4 rounded accent-pink-400 flex-shrink-0"
                />
                He recibido el Espíritu Santo
              </label>
              <textarea
                rows={3} placeholder="Experiencia previa: pedagogía, cursos bíblicos, talleres..."
                value={teachingExperience} onChange={e => setTeachingExperience(e.target.value)}
                className={INPUT + ' resize-none'} required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !supabase}
            className="w-full bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold py-3 rounded-xl
              hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
          >
            {submitting
              ? <><i className="fas fa-spinner fa-spin mr-2" />Procesando...</>
              : mode === 'login'    ? 'Iniciar Sesión'
              : mode === 'register' ? 'Crear Cuenta'
              :                       'Enviar enlace de recuperación'}
          </button>
        </form>

        {/* Google OAuth */}
        {(mode === 'login' || mode === 'register') && supabase && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-white/45 text-xs">o continúa con</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>
            <button
              type="button" onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 font-semibold py-3 rounded-xl hover:shadow-lg hover:bg-gray-50 transition-all text-sm"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Entrar con Google
            </button>
          </>
        )}

        {/* Links de modo */}
        <div className="mt-5 text-center text-sm text-white/65">
          {mode === 'login' && (
            <>
              <span>¿No tienes cuenta? </span>
              <button onClick={() => setMode('register')} className="text-white font-semibold hover:underline">Regístrate</button>
              <div className="mt-2">
                <button onClick={() => setMode('reset')} className="text-white/50 text-xs hover:text-white/80 hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </>
          )}
          {mode === 'register' && (
            <>
              <span>¿Ya tienes cuenta? </span>
              <button onClick={() => setMode('login')} className="text-white font-semibold hover:underline">Inicia sesión</button>
            </>
          )}
          {mode === 'reset' && (
            <>
              <span>¿Recuerdas tu contraseña? </span>
              <button onClick={() => setMode('login')} className="text-white font-semibold hover:underline">Inicia sesión</button>
            </>
          )}
        </div>

        {!supabase && (
          <p className="mt-4 text-center text-white/55 text-xs bg-white/10 rounded-lg p-3 leading-relaxed">
            Crea un archivo <code className="font-mono bg-white/10 px-1 rounded">.env</code> con<br />
            <code className="font-mono">VITE_SUPABASE_URL</code> y <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>
          </p>
        )}
      </div>
    </div>
  )
}
