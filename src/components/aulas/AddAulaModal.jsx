import React, { useState, useRef } from 'react'
import Modal from '../ui/Modal'

const DAYS       = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const CATEGORIES = [
  { value: 'semillitas',     label: 'Semillitas'     },
  { value: 'conquistadores', label: 'Conquistadores' },
  { value: 'valientes',      label: 'Valientes'      },
  { value: 'sala_cuna',      label: 'Sala Cuna'      },
  { value: 'otros',          label: 'Otros'          },
]

const FIELD = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'

const EMPTY = {
  name: '', category: 'semillitas', teacher: '',
  classroom: '', day: 'Lunes', time: '09:00', description: '',
}

export default function AddAulaModal({ isOpen, onClose, onSave, uploadPdf }) {
  const [fields, setFields]     = useState(EMPTY)
  const [pdfFile, setPdfFile]   = useState(null)
  const [pdfLabel, setPdfLabel] = useState('Ningún archivo seleccionado')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const fileRef = useRef(null)

  function set(key, value) { setFields(prev => ({ ...prev, [key]: value })) }

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') return
    setPdfFile(file)
    setPdfLabel(file.name)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fields.name.trim() || !fields.teacher.trim() || !fields.classroom.trim()) return
    setSaving(true)

    let pdfPath = null

    if (pdfFile && uploadPdf) {
      setUploading(true)
      try {
        pdfPath = await uploadPdf(pdfFile)   // ruta permanente en Storage
      } catch (err) {
        setUploading(false)
        setSaving(false)
        // Propagamos el error para que Aulas.jsx muestre un toast claro
        throw new Error(`No se pudo subir el PDF: ${err?.message ?? 'error desconocido'}`)
      }
      setUploading(false)
    }

    try {
      await onSave({ ...fields, pdfName: pdfFile?.name ?? 'temario.pdf', pdfPath })
      setFields(EMPTY)
      setPdfFile(null)
      setPdfLabel('Ningún archivo seleccionado')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Clase" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre + Categoría */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <input className={FIELD} value={fields.name} onChange={e => set('name', e.target.value)} required placeholder="Ej: Corderitos A" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoría *</label>
            <select className={FIELD} value={fields.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* Profesor + Aula */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Profesor titular *</label>
            <input className={FIELD} value={fields.teacher} onChange={e => set('teacher', e.target.value)} required placeholder="Nombre del profesor" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Aula / Sala *</label>
            <input className={FIELD} value={fields.classroom} onChange={e => set('classroom', e.target.value)} required placeholder="Ej: Sala A1" />
          </div>
        </div>

        {/* Día + Hora */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Día *</label>
            <select className={FIELD} value={fields.day} onChange={e => set('day', e.target.value)}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora *</label>
            <input type="time" className={FIELD} value={fields.time} onChange={e => set('time', e.target.value)} required />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
          <textarea
            className={FIELD + ' resize-none'} rows={2}
            value={fields.description} onChange={e => set('description', e.target.value)}
            placeholder="Notas sobre la clase..."
          />
        </div>

        {/* Upload PDF */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Temario (PDF)</label>
          <div
            className={`pdf-upload p-4 text-center cursor-pointer ${dragging ? 'dragover' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
          >
            <i className="fas fa-file-pdf text-2xl text-red-400 mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500">{uploading ? 'Subiendo...' : pdfLabel}</p>
            <p className="text-xs text-gray-400 mt-1">Haz clic o arrastra un PDF aquí</p>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-pink-500 text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60"
          >
            {saving ? <><i className="fas fa-spinner fa-spin mr-1.5" />Guardando...</> : 'Añadir Clase'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
