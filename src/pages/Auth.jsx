import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const INPUT = 'w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/55 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm'

function RoleCard({ value, selected, onChange, icon, title, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center
        ${selected
          ? 'border-white bg-white/20 text-white'
          : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
        }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold text-xs leading-tight">{title}</span>
      <span className="text-[11px] leading-snug opacity-75">{description}</span>
    </button>
  )
}

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
  const [teacherType, setTeacherType]               = useState('titular')

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
        hasCds, cdsExpiry, receivedHolySpirit, teachingExperience, teacherType,
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
              {/* Selector de rol */}
              <div>
                <p className="text-white/70 text-xs mb-2">¿Qué rol cumplirás?</p>
                <div className="flex gap-2">
                  <RoleCard
                    value="titular"
                    selected={teacherType === 'titular'}
                    onChange={setTeacherType}
                    icon="🎓"
                    title="Profesor titular"
                    description="Diriges tu propia clase"
                  />
                  <RoleCard
                    value="auxiliar"
                    selected={teacherType === 'auxiliar'}
                    onChange={setTeacherType}
                    icon="🤝"
                    title="Ayudante"
                    description="Apoyas al titular"
                  />
                </div>
              </div>
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
