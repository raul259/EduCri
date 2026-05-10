import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

let _seq = 0

export function useUnreadCount() {
  const { user } = useApp()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!supabase || !user?.id) return

    let active = true

    async function fetchCount() {
      const { count: c } = await supabase
        .from('teacher_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .is('deleted_at', null)
      if (active) setCount(c ?? 0)
    }

    fetchCount()

    // Contador de módulo: garantiza nombre único incluso si Date.now() repite
    const channel = supabase
      .channel(`unread-${user.id}-${++_seq}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teacher_tasks',
        filter: `teacher_id=eq.${user.id}`,
      }, fetchCount)
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return count
}
