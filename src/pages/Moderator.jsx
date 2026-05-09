import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { useStudents } from '../hooks/useStudents'
import Modal from '../components/ui/Modal'

const TYPE_LABEL = { titular: 'Titular', auxiliar: 'Ayudante' }
const TYPE_ICON  = { titular: '🎓', auxiliar: '🤝' }

const CATEGORY_OPTS = [
  { value: 'semillitas',     label: 'Semillitas'     },
  { value: 'conquistadores', label: 'Conquistadores' },
  { value: 'valientes',      label: 'Valientes'      },
  { value: 'sala_cuna',      label: 'Sala Cuna'      },
  { value: 'otros',          label: 'Otros'          },
]

// ── Hook perfiles ────────────────────────────────────────────
function useTeacherProfiles() {
  const { showToast } = useApp()
  const [profiles, setProfiles] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from('teacher_profiles')
      .select('user_id, full_name, phone, teaching_experience, approval_status, approval_notes, teacher_type, has_cds, cds_expiry_date, created_at')
      .order('created_at', { ascending: false })
    if (error) { showToast('No se pudieron cargar los perfiles.', 'error') }
    else        { setProfiles(data ?? []) }
    setLoading(false)
  }, [showToast])

  useEffect(() => { load() }, [load])

  async function approve(userId) {
    const { error } = await supabase.from('teacher_profiles').update({ approval_status: 'approved', approval_notes: null }).eq('user_id', userId)
    if (error) throw error
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approval_status: 'approved', approval_notes: null } : p))
  }

  async function reject(userId, notes) {
    const { error } = await supabase.from('teacher_profiles').update({ approval_status: 'rejected', approval_notes: notes || null }).eq('user_id', userId)
    if (error) throw error
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, approval_status: 'rejected', approval_notes: notes } : p))
  }

  async function changeRole(userId, newType) {
    const { error } = await supabase.from('teacher_profiles').update({ teacher_type: newType }).eq('user_id', userId)
    if (error) throw error
    setProfiles(prev => prev.map(p => p.user_id === userId ? { ...p, teacher_type: newType } : p))
  }

  const approved = profiles.filter(p => p.approval_status === 'approved')
  return { profiles, approved, loading, approve, reject, changeRole, reload: load }
}

// ── Tarjeta pendiente ────────────────────────────────────────
function PendingCard({ profile, onApprove, onReject }) {
  const [loading, setLoading] = useState(false)
  async function handleApprove() { setLoading(true); try { await onApprove(profile.user_id) } finally { setLoading(false) } }
  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{TYPE_ICON[profile.teacher_type] ?? '👤'}</span>
            <p className="font-semibold text-gray-800">{profile.full_name || 'Sin nombre'}</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{TYPE_LABEL[profile.teacher_type] ?? profile.teacher_type}</p>
        </div>
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">Pendiente</span>
      </div>
      <ul className="text-sm text-gray-600 space-y-1">
        <li className="flex items-center gap-2"><i className="fas fa-phone text-gray-400 w-4" />{profile.phone || '—'}</li>
        <li className="flex items-start gap-2"><i className="fas fa-book-open text-gray-400 w-4 mt-0.5" /><span className="line-clamp-2">{profile.teaching_experience || '—'}</span></li>
        <li className="flex items-center gap-2"><i className={`fas fa-shield-halved w-4 ${profile.has_cds ? 'text-green-500' : 'text-gray-300'}`} />{profile.has_cds ? `CDS${profile.cds_expiry_date ? ` hasta ${profile.cds_expiry_date}` : ''}` : 'Sin CDS'}</li>
      </ul>
      <div className="flex gap-2 pt-1">
        <button onClick={handleApprove} disabled={loading} className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"><i className="fas fa-check mr-1.5" />Aprobar</button>
        <button onClick={() => onReject(profile)} disabled={loading} className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"><i className="fas fa-times mr-1.5" />Rechazar</button>
      </div>
    </div>
  )
}

// ── Fila de profesor activo ──────────────────────────────────
function ActiveRow({ profile, onChangeRole }) {
  const [loading, setLoading] = useState(false)
  const nextType  = profile.teacher_type === 'titular' ? 'auxiliar' : 'titular'
  async function handleSwitch() { setLoading(true); try { await onChangeRole(profile.user_id, nextType) } finally { setLoading(false) } }
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl flex-shrink-0">{TYPE_ICON[profile.teacher_type] ?? '👤'}</span>
        <div className="min-w-0">
          <p className="font-medium text-gray-800 truncate">{profile.full_name || 'Sin nombre'}</p>
          <p className="text-xs text-gray-400">{TYPE_LABEL[profile.teacher_type]}</p>
        </div>
      </div>
      <button onClick={handleSwitch} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0">
        {loading ? <i className="fas fa-spinner fa-spin" /> : <>{TYPE_ICON[nextType]} Pasar a {TYPE_LABEL[nextType]}</>}
      </button>
    </div>
  )
}

// ── Gestión de alumnos ───────────────────────────────────────
function StudentsTab({ approved }) {
  const { showToast } = useApp()
  const { students, loading, addStudent, removeStudent } = useStudents()
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [form,      setForm]      = useState({ fullName: '', classCategory: 'semillitas', teacherId: '' })
  const [saving,    setSaving]    = useState(false)

  const visible = students.filter(s => {
    const matchSearch = !search    || s.full_name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !catFilter || s.class_category === catFilter
    return matchSearch && matchCat
  })

  const teacherMap = Object.fromEntries(approved.map(p => [p.user_id, p.full_name]))

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.fullName.trim()) { showToast('Escribe el nombre del alumno.', 'warning'); return }
    if (!form.teacherId)       { showToast('Asigna un profesor.', 'warning'); return }
    setSaving(true)
    try {
      await addStudent(form)
      showToast('Alumno añadido.', 'success')
      setForm(prev => ({ ...prev, fullName: '' }))
    } catch (err) {
      showToast(err?.message || 'No se pudo añadir el alumno.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(student) {
    if (!window.confirm(`¿Eliminar a ${student.full_name}?`)) return
    try {
      await removeStudent(student.id)
      showToast('Alumno eliminado.', 'info')
    } catch {
      showToast('No se pudo eliminar el alumno.', 'error')
    }
  }

  return (
    <div className="space-y-5">
      {/* Formulario añadir */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Añadir alumno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text" placeholder="Nombre completo *"
            value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 lg:col-span-1"
            required
          />
          <select
            value={form.classCategory} onChange={e => setForm(p => ({ ...p, classCategory: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {CATEGORY_OPTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={form.teacherId} onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            required
          >
            <option value="">Profesor responsable *</option>
            {approved.map(p => <option key={p.user_id} value={p.user_id}>{p.full_name} ({TYPE_LABEL[p.teacher_type]})</option>)}
          </select>
          <button type="submit" disabled={saving} className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60">
            {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-plus mr-1.5" />Añadir</>}
          </button>
        </div>
      </form>

      {/* Filtros + lista */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-3 p-4 border-b border-gray-100">
          <input
            type="search" placeholder="Buscar alumno..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
          >
            <option value="">Todas las clases</option>
            {CATEGORY_OPTS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <span className="text-xs text-gray-400 self-center">{visible.length} alumnos</span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-400"><i className="fas fa-spinner fa-spin text-2xl" /></div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <i className="fas fa-users text-3xl mb-2 block" />
            <p className="text-sm">{students.length === 0 ? 'No hay alumnos registrados aún.' : 'Sin resultados para estos filtros.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate text-sm">{s.full_name}</p>
                    <p className="text-xs text-gray-400">
                      {CATEGORY_OPTS.find(c => c.value === s.class_category)?.label ?? s.class_category}
                      {s.teacher_id && <> · {teacherMap[s.teacher_id] ?? 'Profesor'}</>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(s)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0"
                  aria-label={`Eliminar ${s.full_name}`}
                >
                  <i className="fas fa-trash text-sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────
export default function Moderator() {
  const { showToast } = useApp()
  const { profiles, approved, loading, approve, reject, changeRole } = useTeacherProfiles()

  const [tab,          setTab]          = useState('pending')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectNotes,  setRejectNotes]  = useState('')
  const [rejecting,    setRejecting]    = useState(false)

  const pending  = profiles.filter(p => p.approval_status === 'pending')
  const active   = profiles.filter(p => p.approval_status === 'approved')
  const rejected = profiles.filter(p => p.approval_status === 'rejected')

  async function handleApprove(userId) {
    try { await approve(userId); showToast('Profesor aprobado.', 'success') }
    catch { showToast('No se pudo aprobar.', 'error') }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return
    setRejecting(true)
    try { await reject(rejectTarget.user_id, rejectNotes); showToast('Solicitud rechazada.', 'info'); setRejectTarget(null); setRejectNotes('') }
    catch { showToast('No se pudo rechazar.', 'error') }
    finally { setRejecting(false) }
  }

  async function handleChangeRole(userId, newType) {
    try { await changeRole(userId, newType); showToast(`Rol actualizado a ${TYPE_LABEL[newType]}.`, 'success') }
    catch { showToast('No se pudo cambiar el rol.', 'error') }
  }

  const TABS = [
    { key: 'pending',   label: 'Pendientes', count: pending.length,  color: 'text-amber-600' },
    { key: 'active',    label: 'Profesores', count: active.length,   color: 'text-green-600' },
    { key: 'students',  label: 'Alumnos',    count: null,            color: 'text-blue-600'  },
    { key: 'rejected',  label: 'Rechazados', count: rejected.length, color: 'text-red-500'   },
  ]

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-w-[80px]
              ${tab === t.key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
            {t.count !== null && (
              <span className={`text-xs font-bold ${tab === t.key ? t.color : 'text-gray-400'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading && tab !== 'students' ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
          <i className="fas fa-spinner fa-spin text-3xl mb-3 block" /><p className="text-sm">Cargando...</p>
        </div>
      ) : (
        <>
          {tab === 'pending' && (
            pending.length
              ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{pending.map(p => <PendingCard key={p.user_id} profile={p} onApprove={handleApprove} onReject={prof => { setRejectTarget(prof); setRejectNotes('') }} />)}</div>
              : <Empty icon="fa-check-double" text="No hay solicitudes pendientes." />
          )}

          {tab === 'active' && (
            active.length
              ? <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">{active.map(p => <ActiveRow key={p.user_id} profile={p} onChangeRole={handleChangeRole} />)}</div>
              : <Empty icon="fa-users" text="No hay profesores aprobados aún." />
          )}

          {tab === 'students' && <StudentsTab approved={approved} />}

          {tab === 'rejected' && (
            rejected.length
              ? <div className="space-y-3">{rejected.map(p => (
                  <div key={p.user_id} className="bg-white rounded-2xl border border-red-100 p-4 flex items-center justify-between">
                    <div><p className="font-medium text-gray-700">{p.full_name || 'Sin nombre'}</p>{p.approval_notes && <p className="text-xs text-red-500 mt-0.5">{p.approval_notes}</p>}</div>
                    <button onClick={() => handleApprove(p.user_id)} className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">Aprobar igualmente</button>
                  </div>
                ))}</div>
              : <Empty icon="fa-thumbs-up" text="No hay solicitudes rechazadas." />
          )}
        </>
      )}

      <Modal isOpen={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title="Rechazar solicitud" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">¿Rechazar la solicitud de <strong>{rejectTarget?.full_name}</strong>?</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
              placeholder="Ej: Documentación incompleta, falta CDS..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleRejectConfirm} disabled={rejecting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
              {rejecting ? <i className="fas fa-spinner fa-spin" /> : 'Rechazar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Empty({ icon, text }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
      <i className={`fas ${icon} text-4xl mb-3 block`} /><p className="text-sm">{text}</p>
    </div>
  )
}
