import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAulas } from '../hooks/useAulas'
import AulaCard from '../components/aulas/AulaCard'
import AddAulaModal from '../components/aulas/AddAulaModal'
import Modal from '../components/ui/Modal'

const FILTERS = [
  { key: 'todas',      label: 'Todas' },
  { key: 'corderitos', label: 'Corderitos' },
  { key: 'soldaditos', label: 'Soldaditos' },
  { key: 'vencedores', label: 'Vencedores' },
  { key: 'otros',      label: 'Otros' },
]

export default function Aulas() {
  const { role, showToast } = useApp()
  const { aulas, loading, addAula, deleteAula, uploadPdf } = useAulas()

  const [filter, setFilter]           = useState('todas')
  const [addOpen, setAddOpen]         = useState(false)
  const [syllabusAula, setSyllabusAula] = useState(null)

  const visible = filter === 'todas' ? aulas : aulas.filter(a => a.category === filter)

  async function handleSave(fields) {
    try {
      await addAula(fields)
      showToast('Clase añadida correctamente.', 'success')
    } catch (err) {
      console.error(err)
      showToast('No se pudo guardar la clase.', 'error')
      throw err
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta clase?')) return
    try {
      await deleteAula(id)
      showToast('Clase eliminada.', 'info')
    } catch (err) {
      console.error(err)
      showToast('No se pudo eliminar la clase.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.key === 'todas' && <span className="ml-1.5 bg-white/20 px-1.5 rounded-full text-xs">{aulas.length}</span>}
            </button>
          ))}
        </div>

        {/* Botón añadir (solo moderador) */}
        {role === 'moderador' && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-sm"
          >
            <i className="fas fa-plus" aria-hidden="true" />
            Nueva Clase
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 h-56 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400">
          <i className="fas fa-chalkboard text-4xl mb-3 block" aria-hidden="true" />
          <p className="text-sm">No hay aulas en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map(aula => (
            <AulaCard
              key={aula.id}
              aula={aula}
              onViewSyllabus={setSyllabusAula}
              onDelete={role === 'moderador' ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {/* Modal añadir */}
      <AddAulaModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
        uploadPdf={uploadPdf}
      />

      {/* Modal temario */}
      <Modal
        isOpen={Boolean(syllabusAula)}
        onClose={() => setSyllabusAula(null)}
        title={syllabusAula?.name ?? ''}
        size="xl"
      >
        {syllabusAula && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Prof. {syllabusAula.teacher} · {syllabusAula.classroom}
            </p>
            {syllabusAula.pdfUrl ? (
              <>
                <a
                  href={syllabusAula.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  <i className="fas fa-download" aria-hidden="true" />
                  Descargar PDF
                </a>
                <iframe
                  src={syllabusAula.pdfUrl}
                  className="w-full min-h-[500px] rounded-xl border border-gray-100"
                  title={`Temario ${syllabusAula.name}`}
                />
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-file-pdf text-5xl mb-3 block text-red-300" aria-hidden="true" />
                <p className="text-sm">No hay temario subido para esta clase.</p>
                <p className="text-xs mt-1">Edita la clase y sube un PDF.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
