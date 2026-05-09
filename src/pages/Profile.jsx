import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
const LABEL = 'block text-xs font-medium text-gray-500 mb-1'

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

function cdsDaysLeft(expiryDate) {
  if (!expiryDate) return null
  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((expiry - today) / (1000 * 60 * 60 * 24))
}

function CdsBanner({ hasCds, expiryDate }) {
  if (!hasCds) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-500 text-sm">
        <i className="fas fa-shield-alt text-gray-400 text-lg flex-shrink-0" />
        <span>Sin certificado de delitos sexuales (CDS) registrado.</span>
      </div>
    )
  }

  const days = cdsDaysLeft(expiryDate)

  if (days === null) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm">
        <i className="fas fa-shield-check text-green-500 text-lg flex-shrink-0" />
        <span>CDS registrado y vigente.</span>
      </div>
    )
  }

  if (days < 0) {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
        <i className="fas fa-exclamation-triangle text-red-500 text-lg flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">CDS vencido hace {Math.abs(days)} días</p>
          <p className="text-xs text-red-500 mt-0.5">Renueva el certificado cuanto antes.</p>
        </div>
      </div>
    )
  }

  if (days <= 30) {
    return (
      <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-700 text-sm">
        <i className="fas fa-clock text-yellow-500 text-lg flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">CDS vence en {days} días</p>
          <p className="text-xs text-yellow-600 mt-0.5">
            Vencimiento: {new Date(expiryDate).toLocaleDateString('es-ES')}. Renueva pronto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm">
      <i className="fas fa-shield-check text-green-500 text-lg flex-shrink-0" />
      <span>
        CDS vigente — vence el {new Date(expiryDate).toLocaleDateString('es-ES')} ({days} días)
      </span>
    </div>
  )
}

const STATUS_CONFIG = {
  approved: { label: 'Aprobado',  color: 'text-green-600 bg-green-50 border-green-200',   icon: 'fa-check-circle' },
  pending:  { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: 'fa-clock' },
  rejected: { label: 'Rechazado', color: 'text-red-600 bg-red-50 border-red-200',          icon: 'fa-times-circle' },
}

const TYPE_LABEL = { titular: 'Profesor titular', auxiliar: 'Ayudante' }

export default function Profile() {
  const { user, role, teacherProfile, reloadTeacherProfile, showToast } = useApp()

  const m    = user?.user_metadata ?? {}
  const name = m.full_name || user?.email || 'Usuario'
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=160`

  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)

  function buildForm() {
    return {
      fullName:           m.full_name || '',
      birthDate:          m.birth_date || '',
      phone:              m.phone || '',
      hasCds:             Boolean(m.has_cds),
      cdsExpiry:          m.cds_expiry_date || '',
      receivedHolySpirit: Boolean(m.received_holy_spirit),
      teachingExperience: m.teaching_experience || '',
      teacherType:        teacherProfile?.teacher_type || 'titular',
    }
  }

  const [form, setForm] = useState(buildForm)
  function set(key, value) { setForm(prev => ({ ...prev, [key]: value })) }

  function cancelEdit() { setForm(buildForm()); setEditing(false) }

  async function handleSave(e) {
    e.preventDefault()
    if (form.fullName.trim().length < 6)         { showToast('Escribe nombre completo con apellidos.', 'warning'); return }
    if (!form.birthDate)                          { showToast('Selecciona tu fecha de nacimiento.', 'warning'); return }
    if (!hasMinimumAge(form.birthDate, 18))       { showToast('Debes ser mayor de 18 años.', 'warning'); return }
    if (!isValidE164Phone(form.phone))            { showToast('Teléfono en formato E.164 (ej: +34600111222).', 'warning'); return }
    if (form.teachingExperience.trim().length < 10) { showToast('Describe tu experiencia previa.', 'warning'); return }

    setSaving(true)

    const profileData = {
      full_name:            form.fullName.trim(),
      birth_date:           form.birthDate,
      phone:                form.phone.trim(),
      has_cds:              form.hasCds,
      cds_expiry_date:      form.hasCds && form.cdsExpiry ? form.cdsExpiry : null,
      received_holy_spirit: form.receivedHolySpirit,
      teaching_experience:  form.teachingExperience.trim(),
    }

    const { error } = await supabase.auth.updateUser({ data: profileData })
    if (error) { showToast('No se pudo guardar el perfil.', 'error'); setSaving(false); return }

    await supabase.from('teacher_profiles').upsert(
      { user_id: user.id, teacher_type: form.teacherType, ...profileData },
      { onConflict: 'user_id' }
    )

    await reloadTeacherProfile()
    showToast('Perfil actualizado.', 'success')
    setSaving(false)
    setEditing(false)
  }

  const status = STATUS_CONFIG[teacherProfile?.approval_status] ?? STATUS_CONFIG.pending

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Cabecera ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-pink-500" />
        <div className="px-6 pb-6 flex flex-col items-center text-center">
          <img src={avatar} alt="" className="w-20 h-20 rounded-full shadow-md border-4 border-white -mt-10 mb-3" />
          <h1 className="font-display text-xl font-bold text-gray-900">{name}</h1>
          <p className="text-sm text-gray-500 mb-4">{user?.email}</p>

          <div className="flex flex-wrap gap-2 justify-center">
            {role !== 'moderador' && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                <i className={`fas ${status.icon}`} />
                {status.label}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-purple-200 bg-purple-50 text-purple-600">
              <i className="fas fa-chalkboard-teacher" />
              {role === 'moderador' ? 'Moderador' : (TYPE_LABEL[teacherProfile?.teacher_type] ?? 'Profesor')}
            </span>
            {m.received_holy_spirit && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-600">
                <i className="fas fa-dove" />
                Espíritu Santo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Banner CDS ── */}
      <CdsBanner hasCds={Boolean(m.has_cds)} expiryDate={m.cds_expiry_date} />

      {/* ── Datos personales ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Datos personales</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <i className="fas fa-pen" />
              Editar
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {role !== 'moderador' && (
              <div>
                <label className={LABEL}>Rol</label>
                <div className="flex gap-3">
                  {[{ value: 'titular', icon: '🎓', label: 'Titular' }, { value: 'auxiliar', icon: '🤝', label: 'Ayudante' }].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set('teacherType', opt.value)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                        ${form.teacherType === opt.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={LABEL}>Nombre completo *</label>
              <input type="text" className={INPUT} value={form.fullName}
                onChange={e => set('fullName', e.target.value)} required placeholder="María García López" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Fecha de nacimiento *</label>
                <input type="date" className={INPUT} value={form.birthDate}
                  onChange={e => set('birthDate', e.target.value)} required />
              </div>
              <div>
                <label className={LABEL}>Teléfono *</label>
                <input type="tel" className={INPUT} value={form.phone}
                  onChange={e => set('phone', e.target.value)} required placeholder="+34600111222" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.hasCds}
                  onChange={e => set('hasCds', e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                <span className="text-sm text-gray-700">Tengo certificado de delitos sexuales (CDS)</span>
              </label>
              {form.hasCds && (
                <div>
                  <label className={LABEL}>Fecha de vencimiento del CDS</label>
                  <input type="date" className={INPUT} value={form.cdsExpiry}
                    onChange={e => set('cdsExpiry', e.target.value)} />
                </div>
              )}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.receivedHolySpirit}
                  onChange={e => set('receivedHolySpirit', e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
                <span className="text-sm text-gray-700">He recibido el Espíritu Santo</span>
              </label>
            </div>

            <div>
              <label className={LABEL}>Experiencia previa *</label>
              <textarea className={INPUT + ' resize-none'} rows={3}
                value={form.teachingExperience} onChange={e => set('teachingExperience', e.target.value)}
                required placeholder="Pedagogía, cursos bíblicos, talleres..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={cancelEdit}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60">
                {saving ? <><i className="fas fa-spinner fa-spin mr-2" />Guardando...</> : 'Guardar cambios'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {[
              { label: 'Nombre',           value: m.full_name || '—' },
              { label: 'Teléfono',         value: m.phone || '—' },
              { label: 'Fecha nacimiento', value: m.birth_date ? new Date(m.birth_date + 'T00:00:00').toLocaleDateString('es-ES') : '—' },
              { label: 'Experiencia',      value: m.teaching_experience || '—', wide: true },
            ].map(({ label, value, wide }) => (
              <div key={label} className={wide ? 'sm:col-span-2' : ''}>
                <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
                <dd className="text-gray-800 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* ── Motivo de rechazo ── */}
      {teacherProfile?.approval_status === 'rejected' && teacherProfile?.approval_notes && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <i className="fas fa-comment-alt text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold mb-1">Motivo del rechazo</p>
            <p className="text-red-600">{teacherProfile.approval_notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
