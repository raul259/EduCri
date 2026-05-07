import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

const COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-500',
  'from-pink-500 to-orange-400',
  'from-green-500 to-teal-400',
  'from-yellow-500 to-red-400',
]

const SAFE_COLOR_RE = /^from-[a-z0-9-]+ to-[a-z0-9-]+$/i

const DEFAULT_AULAS = [
  { id: 1, name: 'Corderitos',  category: 'corderitos', teacher: 'Prof. Cordero',  classroom: 'Sala C1', day: 'Lunes',      time: '09:00', description: '', pdfName: 'temario_corderitos.pdf', pdfUrl: null, color: 'from-blue-500 to-cyan-400' },
  { id: 2, name: 'Soldaditos',  category: 'soldaditos', teacher: 'Prof. Valiente', classroom: 'Sala S1', day: 'Miércoles', time: '14:00', description: '', pdfName: 'temario_soldaditos.pdf', pdfUrl: null, color: 'from-purple-500 to-pink-500' },
  { id: 3, name: 'Vencedores',  category: 'vencedores', teacher: 'Prof. Victoria', classroom: 'Sala V1', day: 'Viernes',   time: '11:00', description: '', pdfName: 'temario_vencedores.pdf', pdfUrl: null, color: 'from-pink-500 to-orange-400' },
]

function mapRow(row) {
  return {
    id:          Number(row.id),
    name:        String(row.name        || '').trim(),
    category:    String(row.category    || 'otros').trim(),
    teacher:     String(row.teacher     || '').trim(),
    classroom:   String(row.classroom   || '').trim(),
    day:         String(row.day         || '').trim(),
    time:        String(row.time        || '').trim(),
    description: String(row.description || '').trim(),
    pdfName:     String(row.pdf_name    || 'temario.pdf').trim(),
    pdfUrl:      row.pdf_url || null,
    color:       SAFE_COLOR_RE.test(String(row.color || ''))
                   ? String(row.color)
                   : 'from-blue-500 to-cyan-400',
  }
}

export function useAulas() {
  const { user, showToast } = useApp()
  const [aulas, setAulas]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!supabase || !user?.id) {
      setAulas(DEFAULT_AULAS)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('classes')
      .select('id,name,category,teacher,classroom,day,time,description,pdf_name,pdf_url,color')
      .eq('user_id', user.id)
      .order('id', { ascending: true })

    if (error) {
      console.error('Error loading aulas', error)
      showToast('No se pudieron cargar las aulas.', 'warning')
      setAulas(DEFAULT_AULAS)
      setLoading(false)
      return
    }

    if (!data.length) {
      // Primer acceso: sembrar aulas por defecto
      const payload = DEFAULT_AULAS.map(a => ({
        user_id: user.id, name: a.name, category: a.category,
        teacher: a.teacher, classroom: a.classroom, day: a.day,
        time: a.time, description: a.description,
        pdf_name: a.pdfName, color: a.color,
      }))
      const { data: seeded, error: seedErr } = await supabase
        .from('classes').insert(payload)
        .select('id,name,category,teacher,classroom,day,time,description,pdf_name,pdf_url,color')
      if (seedErr) {
        console.error('Error seeding aulas', seedErr)
        setAulas(DEFAULT_AULAS)
      } else {
        setAulas(seeded.map(mapRow))
      }
    } else {
      setAulas(data.map(mapRow))
    }
    setLoading(false)
  }, [user, showToast])

  useEffect(() => { load() }, [load])

  async function addAula(fields) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    if (!supabase || !user?.id) {
      setAulas(prev => [...prev, { ...fields, id: Date.now(), color }])
      return
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        user_id: user.id,
        name: fields.name, category: fields.category,
        teacher: fields.teacher, classroom: fields.classroom,
        day: fields.day, time: fields.time,
        description: fields.description, pdf_name: fields.pdfName,
        pdf_url: fields.pdfUrl || null, color,
      })
      .select('id,name,category,teacher,classroom,day,time,description,pdf_name,pdf_url,color')
      .single()

    if (error) throw error
    setAulas(prev => [...prev, mapRow(data)])
  }

  async function deleteAula(id) {
    if (!supabase || !user?.id) {
      setAulas(prev => prev.filter(a => a.id !== id))
      return
    }
    const { error } = await supabase.from('classes').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    setAulas(prev => prev.filter(a => a.id !== id))
  }

  async function uploadPdf(file) {
    if (!supabase || !user?.id) return null
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/${Date.now()}_${safeName}`

    const { error } = await supabase.storage
      .from('syllabi').upload(path, file, { upsert: true, contentType: 'application/pdf' })
    if (error) throw error

    // Bucket privado: signed URL válida 1 hora
    const { data } = await supabase.storage.from('syllabi').createSignedUrl(path, 3600)
    return { path, signedUrl: data?.signedUrl ?? null }
  }

  return { aulas, loading, addAula, deleteAula, uploadPdf, reload: load }
}
