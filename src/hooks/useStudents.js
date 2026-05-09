import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useStudents() {
  const { user, showToast } = useApp()
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!supabase || !user?.id) { setStudents([]); setLoading(false); return }
    setLoading(true)

    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, class_category, teacher_id, birth_date, authorized, parent_name, parent_phone, created_at')
      .is('deleted_at', null)
      .order('full_name', { ascending: true })

    if (error) {
      console.error(error)
      showToast('Error cargando alumnos.', 'error')
    } else {
      setStudents(data ?? [])
    }
    setLoading(false)
  }, [user, showToast])

  useEffect(() => { load() }, [load])

  async function addStudent({ fullName, classCategory, teacherId, birthDate, authorized, parentName, parentPhone }) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        full_name:      fullName.trim(),
        class_category: classCategory,
        teacher_id:     teacherId   || null,
        birth_date:     birthDate   || null,
        authorized:     authorized  ?? false,
        parent_name:    parentName  || null,
        parent_phone:   parentPhone || null,
        created_by:     user.id,
      })
      .select('id, full_name, class_category, teacher_id, birth_date, authorized, parent_name, parent_phone')
      .single()

    if (error) throw error
    setStudents(prev =>
      [...prev, data].sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'))
    )
  }

  async function removeStudent(studentId) {
    const { error } = await supabase
      .from('students')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
      .eq('id', studentId)

    if (error) throw error
    setStudents(prev => prev.filter(s => s.id !== studentId))
  }

  return { students, loading, addStudent, removeStudent, reload: load }
}
