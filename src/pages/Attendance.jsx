import React, { useState, useEffect, useCallback } from 'react'
import { useAulas } from '../hooks/useAulas'
import { useAttendance } from '../hooks/useAttendance'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const TODAY = new Date().toISOString().split('T')[0]

const STATUS_CFG = {
  present: { label: 'P', title: 'Presente', cls: 'present' },
  absent:  { label: 'A', title: 'Ausente',  cls: 'absent'  },
  late:    { label: 'T', title: 'Tarde',     cls: 'late'    },
}

function AttendanceBtn({ current, value, onMark, onClear }) {
  const cfg = STATUS_CFG[value]
  return (
    <button
      onClick={() => current === value ? onClear() : onMark(value)}
      title={current === value ? 'Quitar' : cfg.title}
      className={`attendance-btn ${current === value ? cfg.cls : 'inactive'}`}
      aria-pressed={current === value}
    >
      {cfg.label}
    </button>
  )
}

function exportCSV(students, records, aulaName, date) {
  const statusLabel = { present: 'Presente', absent: 'Ausente', late: 'Tarde' }
  const lines = ['Alumno,Estado,Nota']
  students.forEach(s => {
    const r      = records[s.id] ?? {}
    const name   = s.full_name.replace(/,/g, ' ')
    const status = statusLabel[r.status] ?? 'Sin registrar'
    const note   = (r.note ?? '').replace(/,/g, ' ').replace(/\n/g, ' ')
    lines.push(`${name},${status},${note}`)
  })
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `asistencia_${aulaName.replace(/\s/g, '_')}_${date}.csv`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

// ── Hook historial ─────────────────────────────────────────────────────────
function useHistory(classId) {
  const { user } = useApp()
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(false)

  const load = useCallback(async () => {
    if (!supabase || !user?.id || !classId) return
    setLoading(true)
    const { data } = await supabase
      .from('attendance_records')
      .select('attendance_date, status')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .order('attendance_date', { ascending: false })

    if (data) {
      const map = {}
      data.forEach(r => {
        if (!map[r.attendance_date]) map[r.attendance_date] = { present: 0, absent: 0, late: 0, total: 0 }
        map[r.attendance_date][r.status] = (map[r.attendance_date][r.status] ?? 0) + 1
        map[r.attendance_date].total++
      })
      setSessions(Object.entries(map).map(([date, counts]) => ({ date, ...counts })))
    }
    setLoading(false)
  }, [classId, user])

  useEffect(() => { load() }, [load])
  return { sessions, loading }
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function Attendance() {
  const { showToast } = useApp()
  const { aulas, loading: aulasLoading } = useAulas()

  const [tab,           setTab]           = useState('lista')   // 'lista' | 'historial'
  const [selectedAulaId, setSelectedAulaId] = useState('')
  const [date,          setDate]          = useState(TODAY)
  const [loaded,        setLoaded]        = useState(false)
  const [search,        setSearch]        = useState('')

  const selectedAula = aulas.find(a => String(a.id) === selectedAulaId)

  const { students, records, loading, counts, reload, markAttendance, clearAttendance, saveNote } =
    useAttendance({
      classId:       loaded ? selectedAula?.id       : null,
      classCategory: loaded ? selectedAula?.category : null,
      date:          loaded ? date                   : null,
    })

  const { sessions, loading: histLoading } = useHistory(loaded ? selectedAula?.id : null)

  function handleAulaChange(id) { setSelectedAulaId(id); if (id && date) setLoaded(true); else setLoaded(false) }
  function handleDateChange(d)  { setDate(d); if (selectedAulaId && d) setLoaded(true); else setLoaded(false) }

  function handleValidar() {
    const total    = students.length
    const marcados = Object.keys(records).length
    if (marcados === 0) { showToast('No has marcado a ningún alumno todavía.', 'warning'); return }
    showToast(
      `Lista validada: ${counts.present} presentes · ${counts.absent} ausentes · ${counts.late} tarde (${marcados}/${total})`,
      'success'
    )
    setLoaded(false)
    setSelectedAulaId('')
    setDate(TODAY)
    setSearch('')
  }

  const filtered    = students.filter(s => !search || s.full_name.toLowerCase().includes(search.toLowerCase()))
  const noStudents  = loaded && !loading && students.length === 0

  return (
    <div className="space-y-5">

      {/* ── Selector clase + fecha ── */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Clase</label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedAulaId}
              onChange={e => handleAulaChange(e.target.value)}
            >
              <option value="">Seleccionar clase...</option>
              {aulasLoading
                ? <option disabled>Cargando...</option>
                : aulas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
              }
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={date}
              onChange={e => handleDateChange(e.target.value)}
              max={TODAY}
            />
          </div>

          {loaded && (
            <button
              onClick={reload}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <i className="fas fa-sync-alt mr-2" />Recargar
            </button>
          )}

          {loaded && students.length > 0 && (
            <button
              onClick={() => exportCSV(students, records, selectedAula?.name ?? 'clase', date)}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <i className="fas fa-file-csv mr-2" />CSV
            </button>
          )}
        </div>

        {/* Tabs */}
        {loaded && (
          <div className="flex gap-1 mt-4 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setTab('lista')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Pasar lista
            </button>
            <button
              onClick={() => setTab('historial')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'historial' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Historial
            </button>
          </div>
        )}
      </div>

      {/* ── Tab: Pasar lista ── */}
      {(!loaded || tab === 'lista') && (
        <>
          {/* Stats */}
          {loaded && students.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{counts.present}</p>
                <p className="text-xs text-emerald-500 mt-0.5">Presentes</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{counts.absent}</p>
                <p className="text-xs text-red-400 mt-0.5">Ausentes</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{counts.late}</p>
                <p className="text-xs text-amber-400 mt-0.5">Tarde</p>
              </div>
            </div>
          )}

          {/* Tabla */}
          {loaded && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-400">
                  <i className="fas fa-spinner fa-spin text-3xl mb-3 block" />
                  <p className="text-sm">Cargando alumnos...</p>
                </div>
              ) : noStudents ? (
                <div className="p-12 text-center text-gray-400">
                  <i className="fas fa-users text-4xl mb-3 block" />
                  <p className="text-sm font-medium">No hay alumnos asignados a esta clase.</p>
                  <p className="text-xs mt-1 text-gray-300">El moderador debe añadir alumnos y asignarte como profesor.</p>
                </div>
              ) : (
                <>
                  <div className="px-5 py-3 border-b border-gray-100">
                    <input
                      type="search"
                      placeholder="Buscar alumno..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div className="divide-y divide-gray-50">
                    {filtered.map(student => {
                      const rec = records[student.id] ?? {}
                      return (
                        <div key={student.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {student.full_name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-medium text-gray-800 flex-1 min-w-0 truncate text-sm">{student.full_name}</p>
                          <div className="flex gap-1.5 flex-shrink-0">
                            {['present', 'absent', 'late'].map(s => (
                              <AttendanceBtn
                                key={s}
                                value={s}
                                current={rec.status}
                                onMark={status => markAttendance(student.id, status)}
                                onClear={() => clearAttendance(student.id)}
                              />
                            ))}
                          </div>
                          <input
                            type="text"
                            placeholder="Nota..."
                            defaultValue={rec.note ?? ''}
                            onBlur={e => saveNote(student.id, e.target.value)}
                            className="hidden sm:block w-32 lg:w-48 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        </div>
                      )
                    })}
                  </div>

                  {filtered.length === 0 && search && (
                    <p className="text-center text-gray-400 text-sm py-8">No hay resultados para "{search}"</p>
                  )}

                  {/* Botón validar */}
                  <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={handleValidar}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-sm"
                    >
                      <i className="fas fa-check-circle" />
                      Validar lista
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!loaded && (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-300">
              <i className="fas fa-clipboard-check text-5xl mb-3 block" />
              <p className="text-sm text-gray-400">Selecciona una clase para comenzar.</p>
            </div>
          )}
        </>
      )}

      {/* ── Tab: Historial ── */}
      {loaded && tab === 'historial' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Historial de sesiones — {selectedAula?.name}</h3>
          </div>

          {histLoading ? (
            <div className="p-12 text-center text-gray-400">
              <i className="fas fa-spinner fa-spin text-3xl mb-3 block" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <i className="fas fa-history text-4xl mb-3 block text-gray-200" />
              <p className="text-sm">No hay sesiones registradas para esta clase.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessions.map(s => (
                <div key={s.date} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(s.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">{s.total} alumnos</p>
                  </div>
                  <div className="flex gap-3 flex-1">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium">
                      <i className="fas fa-check" />{s.present} presentes
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-medium">
                      <i className="fas fa-times" />{s.absent} ausentes
                    </span>
                    {s.late > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-500 rounded-lg text-xs font-medium">
                        <i className="fas fa-clock" />{s.late} tarde
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
