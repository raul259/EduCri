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
      .select('id, title, notes, day, time, class_category, assigned_by, created_at, deleted_at')
      .eq('teacher_id', user.id)
      .is('deleted_at', null)
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
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, markDone }
}

const CATEGORY_LABELS = {
  semillitas: 'Semillitas', conquistadores: 'Conquistadores',
  valientes: 'Valientes', sala_cuna: 'Sala Cuna', otros: 'Otros',
}

export default function Notifications() {
  const { teacherProfile, role } = useApp()
  const { tasks, loading, markDone } = useNotifications()

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

      {/* ── Avisos ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-semibold text-gray-900">Avisos</h2>
          {tasks.length > 0 && (
            <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-semibold rounded-full">
              {tasks.length} nuevos
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
            <i className="fas fa-bell-slash text-4xl mb-3 block text-gray-200" aria-hidden />
            <p className="text-sm">No tienes avisos por el momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <i className="fas fa-bell text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{task.title}</p>
                  {task.notes && (
                    <p className="text-xs text-gray-500 mt-0.5">{task.notes}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {task.class_category && (
                      <span className="text-xs text-blue-500">
                        <i className="fas fa-chalkboard mr-1" />
                        {CATEGORY_LABELS[task.class_category] ?? task.class_category}
                      </span>
                    )}
                    {task.created_at && (
                      <span className="text-xs text-gray-400">
                        <i className="fas fa-clock mr-1" />
                        {new Date(task.created_at).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => markDone(task.id)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  Marcar leído
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
