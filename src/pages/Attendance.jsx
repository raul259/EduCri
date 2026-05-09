import React, { useState, useCallback } from 'react'
import { useAulas } from '../hooks/useAulas'
import { useAttendance } from '../hooks/useAttendance'
import { useApp } from '../context/AppContext'

const TODAY = new Date().toISOString().split('T')[0]

const STATUS_CFG = {
  present: { label: 'P', title: 'Presente',  cls: 'present'  },
  absent:  { label: 'A', title: 'Ausente',   cls: 'absent'   },
  late:    { label: 'T', title: 'Tarde',      cls: 'late'     },
}

function AttendanceBtn({ current, value, onClick }) {
  const cfg = STATUS_CFG[value]
  return (
    <button
      onClick={() => onClick(value)}
      title={cfg.title}
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
    const r = records[s.id] ?? {}
    const name   = s.full_name.replace(/,/g, ' ')
    const status = statusLabel[r.status] ?? 'Sin registrar'
    const note   = (r.note ?? '').replace(/,/g, ' ').replace(/\n/g, ' ')
    lines.push(`${name},${status},${note}`)
  })
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `asistencia_${aulaName.replace(/\s/g, '_')}_${date}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Attendance() {
  const { showToast } = useApp()
  const { aulas, loading: aulasLoading } = useAulas()

  const [selectedAulaId, setSelectedAulaId] = useState('')
  const [date,           setDate]           = useState(TODAY)
  const [search,         setSearch]         = useState('')
  const [loaded,         setLoaded]         = useState(false)

  const selectedAula = aulas.find(a => String(a.id) === selectedAulaId)

  const { students, records, loading, counts, reload, markAttendance, saveNote } = useAttendance({
    classId:       loaded ? selectedAula?.id       : null,
    classCategory: loaded ? selectedAula?.category : null,
    date:          loaded ? date                   : null,
  })

  function handleLoad(e) {
    e.preventDefault()
    if (!selectedAulaId || !date) {
      showToast('Selecciona una clase y una fecha.', 'warning')
      return
    }
    setLoaded(true)
    setSearch('')
  }

  function handleAulaChange(id) { setSelectedAulaId(id); if (id && date)           setLoaded(true); else setLoaded(false) }
  function handleDateChange(d)  { setDate(d);             if (selectedAulaId && d) setLoaded(true); else setLoaded(false) }

  const filtered = students.filter(s =>
    !search || s.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const noStudents = loaded && !loading && students.length === 0

  return (
    <div className="space-y-5">
      {/* Selector */}
      <form onSubmit={handleLoad} className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Clase</label>
            <select
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={selectedAulaId}
              onChange={e => handleAulaChange(e.target.value)}
              required
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
              required
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
          >
            <i className="fas fa-search mr-2" />Cargar
          </button>

          {loaded && students.length > 0 && (
            <button
              type="button"
              onClick={() => exportCSV(students, records, selectedAula?.name ?? 'clase', date)}
              className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <i className="fas fa-file-csv mr-2" />CSV
            </button>
          )}
        </div>
      </form>

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
              <p className="text-xs mt-1 text-gray-300">
                El moderador debe añadir alumnos y asignarte como profesor.
              </p>
            </div>
          ) : (
            <>
              {/* Búsqueda */}
              <div className="px-5 py-3 border-b border-gray-100">
                <input
                  type="search"
                  placeholder="Buscar alumno..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Filas */}
              <div className="divide-y divide-gray-50">
                {filtered.map(student => {
                  const rec = records[student.id] ?? {}
                  return (
                    <div key={student.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                      {/* Avatar inicial */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>

                      {/* Nombre */}
                      <p className="font-medium text-gray-800 flex-1 min-w-0 truncate text-sm">
                        {student.full_name}
                      </p>

                      {/* Botones P/A/T */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        {['present', 'absent', 'late'].map(s => (
                          <AttendanceBtn
                            key={s}
                            value={s}
                            current={rec.status}
                            onClick={status => markAttendance(student.id, status)}
                          />
                        ))}
                      </div>

                      {/* Nota */}
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
                <p className="text-center text-gray-400 text-sm py-8">
                  No hay resultados para "{search}"
                </p>
              )}
            </>
          )}
        </div>
      )}

      {!loaded && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-300">
          <i className="fas fa-clipboard-check text-5xl mb-3 block" />
          <p className="text-sm text-gray-400">Selecciona una clase y una fecha para comenzar.</p>
        </div>
      )}
    </div>
  )
}
