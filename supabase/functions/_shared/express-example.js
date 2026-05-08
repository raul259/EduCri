/**
 * REFERENCIA — Middleware equivalente en Express/Node.js
 * No se usa en EduCri (que usa Edge Functions), pero sirve
 * si en el futuro se añade un servidor Node propio.
 *
 * npm install @supabase/supabase-js express
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // ← clave secreta, NUNCA al frontend
)

// ── Middleware 1: validar JWT ────────────────────────────────
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  req.user = user  // disponible en los siguientes middlewares
  next()
}

// ── Middleware 2: verificar rol moderador ────────────────────
function requireModerador(req, res, next) {
  // app_metadata solo lo escribe el servidor → seguro
  const role = req.user?.app_metadata?.role

  if (role !== 'moderador') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol moderador.' })
  }

  next()
}

// ── Uso en rutas ─────────────────────────────────────────────
// app.get('/api/admin/stats',   requireAuth, requireModerador, handlerStats)
// app.get('/api/mis-clases',    requireAuth, handlerClases)       // cualquier profesor
// app.delete('/api/alumnos/:id', requireAuth, requireModerador, handlerDelete)

module.exports = { requireAuth, requireModerador }
