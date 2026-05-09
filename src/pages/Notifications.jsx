import React, { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

function useNotifications() {
  const { user, showToast } = useApp()
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!supabase || !user?.id) { setLoading(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('teacher_tasks')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      showToast('Error cargando avisos.', 'error')
    } else {
      setTasks(data ?? [])
    }
    setLoading(false)
  }, [user, showToast])

  useEffect(() => { load() }, [load])

  async function markDone(id) {
    const { error } = await supabase
      .from('teacher_tasks')
      .update({ status: 'done' })
      .eq('id', id)
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
  }

  return { tasks, loading, markDone }
}

export default function Notifications() {
  const { teacherProfile, role } = useApp()
  const { tasks, loading, markDone } = useNotifications()

  const pending = tasks.filter(t => t.status !== 'done')
  const done    = tasks.filter(t => t.status === 'done')

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Banner estado de cuenta ── */}
      {role !== 'moderador' && teacherProfile?.approval_status === 'approved' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm">
          <i className="fas fa-check-circle text-green-500 text-lg flex-shrink-0" />
          <span>Tu cuenta está aprobada y activa.</span>
        </div>
      )}

      {role !== 'moderador' && teacherProfile?.approval_status === 'pending' && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-yellow-700 text-sm">
          <i className="fas fa-clock text-yellow-500 text-lg flex-shrink-0" />
          <span>Tu cuenta está pendiente de aprobación por el moderador.</span>
        </div>
      )}

      {role !== 'moderador' && teacherProfile?.approval_status === 'rejected' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          <i className="fas fa-times-circle text-red-500 text-lg flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cuenta rechazada</p>
            {teacherProfile.approval_notes && (
              <p className="text-xs mt-0.5 text-red-600">{teacherProfile.approval_notes}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Avisos / Tareas ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-semibold text-gray-900">Avisos</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-semibold rounded-full">
              {pending.length} nuevos
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <i className="fas fa-bell-slash text-4xl mb-3 block text-gray-200" aria-hidden="true" />
            <p className="text-sm">No tienes avisos por el momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pendientes */}
            {pending.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <i className="fas fa-bell text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                  {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-blue-500 mt-1">
                      <i className="fas fa-calendar-alt mr-1" />
                      {new Date(task.due_date).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => markDone(task.id)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  Marcar leído
                </button>
              </div>
            ))}

            {/* Leídos */}
            {done.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Leídos</p>
                <div className="space-y-2">
                  {done.map(task => (
                    <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-60">
                      <i className="fas fa-check-circle text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-500 line-through truncate">{task.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
