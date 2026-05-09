import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useUnreadCount() {
  const { user } = useApp()
  const [count, setCount] = useState(0)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supabase || !user?.id) return

    async function fetchCount() {
      const { count: c } = await supabase
        .from('teacher_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .is('deleted_at', null)
      setCount(c ?? 0)
    }

    fetchCount()

    // Limpiar canal anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase
      .channel(`unread-${user.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teacher_tasks',
        filter: `teacher_id=eq.${user.id}`,
      }, fetchCount)
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [user?.id])

  return count
}
