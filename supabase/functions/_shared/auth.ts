import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthUser {
  id: string
  email: string
  role: string
}

/**
 * Valida el JWT del header Authorization y devuelve el usuario.
 * Lanza Response con 401/403 si falla.
 */
export async function requireAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ error: 'Token no proporcionado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.replace('Bearer ', '')

  // Service role para validar el token del usuario
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Token inválido o expirado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return {
    id:    user.id,
    email: user.email ?? '',
    // SEGURO: app_metadata solo lo puede escribir el servidor
    role:  user.app_metadata?.role ?? 'profesor',
  }
}

/**
 * Verifica que el usuario sea moderador. Lanza 403 si no lo es.
 */
export function requireModerador(user: AuthUser): void {
  if (user.role !== 'moderador') {
    throw new Response(JSON.stringify({ error: 'Acceso denegado. Se requiere rol moderador.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
