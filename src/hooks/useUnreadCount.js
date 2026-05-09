import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export function useUnreadCount() {
  const { user } = useApp()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!supabase || !user?.id) return
    supabase
      .from('teacher_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', user.id)
      .is('deleted_at', null)
      .then(({ count: c }) => setCount(c ?? 0))
  }, [user])

  return count
}
