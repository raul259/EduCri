import React from 'react'

const CATEGORY_LABELS = { semillitas: 'Semillitas', conquistadores: 'Conquistadores', valientes: 'Valientes', sala_cuna: 'Sala Cuna', otros: 'Otros' }
const SAFE_COLOR_RE   = /^from-[a-z0-9-]+ to-[a-z0-9-]+$/i

export default function AulaCard({ aula, onViewSyllabus, onDelete }) {
  const safeColor = SAFE_COLOR_RE.test(aula.color) ? aula.color : 'from-blue-500 to-cyan-400'
  const catLabel  = CATEGORY_LABELS[aula.category] ?? aula.category

  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden card-hover border border-gray-100">
      {/* Cabecera de color */}
      <div className={`h-28 bg-gradient-to-r ${safeColor} px-5 relative overflow-hidden flex items-center justify-center`}>
        <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-8 -mt-8" aria-hidden />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-8 -mb-8"  aria-hidden />
        <h3 className="relative z-10 font-display text-2xl font-bold text-white text-center leading-tight">{aula.name}</h3>
      </div>

      {/* Cuerpo */}
      <div className="p-5">
        <ul className="space-y-2 mb-4 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <i className="fas fa-user-tie text-blue-500 w-4 text-center" aria-hidden="true" />
            {aula.teacher}
          </li>
          <li className="flex items-center gap-2">
            <i className="fas fa-door-open text-purple-500 w-4 text-center" aria-hidden="true" />
            {aula.classroom}
          </li>
          <li className="flex items-center gap-2">
            <i className="fas fa-clock text-pink-500 w-4 text-center" aria-hidden="true" />
            {aula.day}, {aula.time}
          </li>
        </ul>

        <div className="flex gap-2">
          <button
            onClick={() => onViewSyllabus(aula)}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1.5"
          >
            <i className="fas fa-file-pdf" aria-hidden="true" />
            Temario
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(aula.id)}
              className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              aria-label={`Eliminar ${aula.name}`}
            >
              <i className="fas fa-trash text-sm" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
