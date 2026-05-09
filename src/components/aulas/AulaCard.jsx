import React from 'react'

const CATEGORY_LABELS = { semillitas: 'Semillitas', conquistadores: 'Conquistadores', valientes: 'Valientes', sala_cuna: 'Sala Cuna', otros: 'Otros' }
const SAFE_COLOR_RE   = /^from-[a-z0-9-]+ to-[a-z0-9-]+$/i

export default function AulaCard({ aula, onViewSyllabus, onDelete }) {
  const safeColor = SAFE_COLOR_RE.test(aula.color) ? aula.color : 'from-blue-500 to-cyan-400'
  const catLabel  = CATEGORY_LABELS[aula.category] ?? aula.category

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 card-hover overflow-hidden flex flex-col sm:flex-row">

      {/* ── Panel izquierdo de color ── */}
      <div className={`bg-gradient-to-br ${safeColor} sm:w-36 w-full h-28 sm:h-auto relative flex-shrink-0 flex items-center justify-center overflow-hidden`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" aria-hidden />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-6 -mb-6" aria-hidden />
        <i className="fas fa-chalkboard relative z-10 text-white/60 text-4xl" aria-hidden />
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
        <div>
          {/* Categoría + título */}
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{catLabel}</span>
          <h3 className="font-display text-lg font-bold text-gray-900 leading-tight mt-0.5 mb-3">{aula.name}</h3>

          {/* Metadatos */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {aula.teacher && (
              <span className="flex items-center gap-1">
                <i className="fas fa-user-tie text-blue-400" />{aula.teacher}
              </span>
            )}
            <span className="flex items-center gap-1">
              <i className="fas fa-door-open text-purple-400" />{aula.classroom}
            </span>
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-pink-400" />Domingo · {aula.time}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onViewSyllabus(aula)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors
              ${aula.pdfPath
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gray-100 text-gray-400 cursor-default'}`}
            disabled={!aula.pdfPath}
            title={aula.pdfPath ? 'Ver temario' : 'Sin temario disponible'}
          >
            <i className="fas fa-file-pdf" aria-hidden />
            {aula.pdfPath ? 'Ver temario' : 'Sin temario'}
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(aula.id)}
              className="ml-auto p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={`Eliminar ${aula.name}`}
            >
              <i className="fas fa-trash text-sm" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
