import React, { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'

const ICONS  = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' }
const COLORS = { success: 'bg-emerald-500', error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-blue-500' }

function Toast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20)
    return () => clearTimeout(t)
  }, [])

  const color = COLORS[toast.type] ?? COLORS.info
  const icon  = ICONS[toast.type]  ?? ICONS.info

  return (
    <div
      onClick={() => onDismiss(toast.id)}
      className={`${color} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 cursor-pointer
        transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
    >
      <i className={`fas ${icon} text-sm`} aria-hidden="true" />
      <span className="text-sm font-medium leading-snug">{toast.message}</span>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  )
}
