/**
 * Edge Function protegida — solo moderadores
 * GET /functions/v1/admin-stats
 *
 * Ejemplo de uso desde el frontend:
 *   const { data: { session } } = await supabase.auth.getSession()
 *   const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-stats`, {
 *     headers: { Authorization: `Bearer ${session.access_token}` }
 *   })
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAuth, requireModerador } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validar JWT → obtener usuario
    const user = await requireAuth(req)

    // 2. Verificar que sea moderador
    requireModerador(user)

    // 3. Lógica protegida — aquí con service_role (sin restricciones RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const [{ count: totalStudents }, { count: pendingTeachers }] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('teacher_profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    ])

    return new Response(
      JSON.stringify({
        moderador:       user.email,
        totalStudents,
        pendingTeachers,
        generatedAt:     new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    // Si requireAuth/requireModerador lanzaron una Response, la devolvemos tal cual
    if (err instanceof Response) return err

    console.error('Error inesperado:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
