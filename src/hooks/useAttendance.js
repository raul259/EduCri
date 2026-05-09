import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useAttendance({ classId, classCategory, date }) {
  const { user, showToast } = useApp()
  const [students, setStudents] = useState([])
  const [records,  setRecords]  = useState({}) // { studentId: { status, note } }
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !classId || !classCategory || !date) return
    setLoading(true)

    // Alumnos de esta categoría asignados al profesor (RLS filtra teacher_id = auth.uid())
    const { data: studentsData, error: studentsErr } = await supabase
      .from('students')
      .select('id, full_name, class_category')
      .is('deleted_at', null)
      .eq('class_category', classCategory)
      .order('full_name', { ascending: true })

    if (studentsErr) {
      showToast('Error cargando alumnos de la clase.', 'error')
      setLoading(false)
      return
    }

    // Registros de asistencia ya guardados para esta clase + fecha
    const { data: recData } = await supabase
      .from('attendance_records')
      .select('student_id, status, note')
      .eq('class_id', classId)
      .eq('attendance_date', date)

    const map = {}
    ;(recData ?? []).forEach(r => {
      map[r.student_id] = { status: r.status, note: r.note ?? '' }
    })

    setStudents(studentsData ?? [])
    setRecords(map)
    setLoading(false)
  }, [classId, classCategory, date, user, showToast])

  useEffect(() => { load() }, [load])

  async function clearAttendance(studentId) {
    if (!supabase || !user?.id) return
    await supabase
      .from('attendance_records')
      .delete()
      .eq('teacher_id', user.id)
      .eq('student_id', Number(studentId))
      .eq('attendance_date', date)
    setRecords(prev => { const next = { ...prev }; delete next[studentId]; return next })
  }

  async function markAttendance(studentId, status) {
    if (!supabase || !user?.id) return
    const existing = records[studentId] ?? {}

    const { error } = await supabase.from('attendance_records').upsert(
      {
        teacher_id:      user.id,
        student_id:      Number(studentId),
        class_id:        Number(classId),
        attendance_date: date,
        status,
        note:            existing.note || null,
      },
      { onConflict: 'teacher_id,student_id,attendance_date' }
    )

    if (error) {
      console.error(error)
      showToast('No se pudo guardar la asistencia.', 'error')
      return
    }
    setRecords(prev => ({ ...prev, [studentId]: { ...existing, status } }))
  }

  async function saveNote(studentId, note) {
    if (!supabase || !user?.id) return
    const existing = records[studentId]
    if (!existing?.status) {
      showToast('Marca la asistencia antes de guardar la nota.', 'warning')
      return
    }

    const { error } = await supabase.from('attendance_records').upsert(
      {
        teacher_id:      user.id,
        student_id:      Number(studentId),
        class_id:        Number(classId),
        attendance_date: date,
        status:          existing.status,
        note:            note || null,
      },
      { onConflict: 'teacher_id,student_id,attendance_date' }
    )

    if (!error) setRecords(prev => ({ ...prev, [studentId]: { ...existing, note } }))
  }

  const counts = Object.values(records).reduce(
    (acc, r) => {
      if (r.status === 'present') acc.present++
      else if (r.status === 'absent') acc.absent++
      else if (r.status === 'late')   acc.late++
      return acc
    },
    { present: 0, absent: 0, late: 0 }
  )

  return { students, records, loading, counts, reload: load, markAttendance, clearAttendance, saveNote }
}
