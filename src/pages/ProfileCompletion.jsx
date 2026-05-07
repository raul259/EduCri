import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'

function RoleCard({ value, selected, onChange, icon, title, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center
        ${selected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}
    >
      <span className="text-3xl">{icon}</span>
      <span className="font-semibold text-sm">{title}</span>
      <span className="text-xs leading-snug opacity-75">{description}</span>
    </button>
  )
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

export default function ProfileCompletion() {
  const { user, showToast, signOut } = useApp()
  const navigate = useNavigate()

  // Pre-rellenar nombre desde Google si existe
  const googleName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''

  const [fullName,           setFullName]           = useState(googleName)
  const [birthDate,          setBirthDate]          = useState('')
  const [phone,              setPhone]              = useState('')
  const [hasCds,             setHasCds]             = useState(false)
  const [cdsExpiry,          setCdsExpiry]          = useState('')
  const [receivedHolySpirit, setReceivedHolySpirit] = useState(false)
  const [teachingExperience, setTeachingExperience] = useState('')
  const [teacherType,        setTeacherType]        = useState('titular')
  const [saving,             setSaving]             = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (fullName.trim().length < 6)    { showToast('Escribe nombre completo con apellidos.', 'warning'); return }
    if (!birthDate)                    { showToast('Selecciona tu fecha de nacimiento.', 'warning'); return }
    if (!hasMinimumAge(birthDate, 18)) { showToast('Debes ser mayor de 18 años.', 'warning'); return }
    if (!isValidE164Phone(phone))      { showToast('Teléfono en formato E.164 (ej: +34600111222).', 'warning'); return }
    if (teachingExperience.trim().length < 10) { showToast('Describe tu experiencia previa.', 'warning'); return }

    setSaving(true)
    const profileData = {
      full_name:          fullName.trim(),
      birth_date:         birthDate,
      phone:              phone.trim(),
      has_cds:            hasCds,
      cds_expiry_date:    hasCds && cdsExpiry ? cdsExpiry : null,
      received_holy_spirit: receivedHolySpirit,
      teaching_experience: teachingExperience.trim(),
      teacher_type:       teacherType,
    }

    const { error } = await supabase.auth.updateUser({ data: profileData })

    if (error) {
      showToast('No se pudo guardar el perfil.', 'error')
      setSaving(false)
      return
    }

    // Sincronizar con teacher_profiles en Supabase
    await supabase.from('teacher_profiles').upsert({
      user_id:             user.id,
      full_name:           profileData.full_name,
      birth_date:          profileData.birth_date,
      phone:               profileData.phone,
      has_cds:             profileData.has_cds,
      cds_expiry_date:     profileData.cds_expiry_date,
      received_holy_spirit: profileData.received_holy_spirit,
      teaching_experience: profileData.teaching_experience,
    }, { onConflict: 'user_id' })

    showToast('Perfil completado. ¡Bienvenido!', 'success')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-500 to-pink-500 px-8 py-6 text-white">
          <div className="text-4xl mb-2">🐑</div>
          <h1 className="font-display text-2xl font-bold">Completa tu perfil</h1>
          <p className="text-white/75 text-sm mt-1">
            Necesitamos unos datos antes de continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[70vh]">

          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">¿Qué rol cumplirás?</label>
            <div className="flex gap-3">
              <RoleCard
                value="titular"
                selected={teacherType === 'titular'}
                onChange={setTeacherType}
                icon="🎓"
                title="Profesor titular"
                description="Diriges una clase propia y eres responsable del grupo"
              />
              <RoleCard
                value="auxiliar"
                selected={teacherType === 'auxiliar'}
                onChange={setTeacherType}
                icon="🤝"
                title="Ayudante"
                description="Apoyas al profesor titular en el aula"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo y apellidos *</label>
              <input
                type="text" className={INPUT} value={fullName}
                onChange={e => setFullName(e.target.value)} required
                placeholder="Ej: María García López"
              />
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de nacimiento *</label>
              <input
                type="date" className={INPUT} value={birthDate}
                onChange={e => setBirthDate(e.target.value)} required
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono *</label>
              <input
                type="tel" className={INPUT} value={phone}
                onChange={e => setPhone(e.target.value)} required
                placeholder="+34600111222"
              />
            </div>

            {/* CDS */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox" checked={hasCds} onChange={e => setHasCds(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-blue-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">Tengo certificado de delitos sexuales (CDS)</span>
            </label>
            {hasCds && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de vencimiento del CDS</label>
                <input
                  type="date" className={INPUT} value={cdsExpiry}
                  onChange={e => setCdsExpiry(e.target.value)}
                />
              </div>
            )}

            {/* Espíritu Santo */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox" checked={receivedHolySpirit} onChange={e => setReceivedHolySpirit(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-blue-500 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">He recibido el Espíritu Santo</span>
            </label>

            {/* Experiencia */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experiencia previa *</label>
              <textarea
                className={INPUT + ' resize-none'} rows={3}
                value={teachingExperience} onChange={e => setTeachingExperience(e.target.value)}
                required placeholder="Pedagogía, cursos bíblicos, talleres, años de experiencia..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={async () => { await signOut(); navigate('/login', { replace: true }) }}
              className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
            >
              Salir
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60"
            >
              {saving ? <><i className="fas fa-spinner fa-spin mr-2" />Guardando...</> : 'Guardar y continuar →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
