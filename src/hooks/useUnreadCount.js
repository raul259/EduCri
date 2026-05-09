import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useUnreadCount() {
  const { user } = useApp()
  const [count, setCount] = useState(0)

  async function fetchCount(userId) {
    const { count: c } = await supabase
      .from('teacher_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', userId)
      .is('deleted_at', null)
    setCount(c ?? 0)
  }

  useEffect(() => {
    if (!supabase || !user?.id) return

    fetchCount(user.id)

    // Suscripción en tiempo real a teacher_tasks del usuario actual
    const channel = supabase
      .channel(`unread-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teacher_tasks',
        filter: `teacher_id=eq.${user.id}`,
      }, () => fetchCount(user.id))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  return count
}
