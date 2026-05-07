import React, { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function PendingApproval() {
  const { teacherProfile, reloadTeacherProfile, signOut, user } = useApp()
  const [checking, setChecking] = useState(false)

  const status  = teacherProfile?.approval_status ?? 'pending'
  const notes   = teacherProfile?.approval_notes
  const name    = teacherProfile?.full_name || user?.user_metadata?.full_name || 'Profesor'

  async function handleCheck() {
    setChecking(true)
    await reloadTeacherProfile()
    setChecking(false)
  }

  const isRejected = status === 'rejected'

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">

        {/* Cabecera */}
        <div className={`px-8 py-6 text-white ${isRejected ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
          <div className="text-5xl mb-3">{isRejected ? '⚠️' : '⏳'}</div>
          <h1 className="font-display text-2xl font-bold">
            {isRejected ? 'Solicitud rechazada' : 'Pendiente de validación'}
          </h1>
          <p className="text-white/75 text-sm mt-1">Hola, {name}</p>
        </div>

        <div className="p-8 space-y-5">
          {isRejected ? (
            <>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tu solicitud de acceso no ha sido aprobada por el administrador.
              </p>
              {notes && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-600 mb-1">Motivo:</p>
                  <p className="text-sm text-red-700">{notes}</p>
                </div>
              )}
              <p className="text-gray-400 text-xs">
                Si crees que es un error, contacta con el administrador de EduCri.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tu cuenta ha sido creada correctamente. El administrador revisará
                tu solicitud y recibirás acceso una vez aprobada.
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <i className="fas fa-check-circle text-blue-400" />
                  Cuenta creada
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <i className="fas fa-check-circle text-blue-400" />
                  Perfil completado
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="fas fa-clock text-gray-300" />
                  Esperando validación del administrador
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <i className="fas fa-circle text-gray-200" />
                  Acceso al panel
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={signOut}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
            >
              Cerrar sesión
            </button>
            {!isRejected && (
              <button
                onClick={handleCheck}
                disabled={checking}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60"
              >
                {checking
                  ? <><i className="fas fa-spinner fa-spin mr-2" />Comprobando...</>
                  : <><i className="fas fa-rotate-right mr-2" />Comprobar estado</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
