import { describe, it, expect } from 'vitest'

// --- Validaciones auth (espejo de src/hooks/useAuth.js) ---
function isValidE164Phone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(String(phone || '').trim())
}

function hasMinimumAge(birthDate, minAge = 18) {
  if (!birthDate) return false
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return false
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= minAge
}

// --- Paginación (espejo de useStudents / useModerator) ---
function filterAndPaginate(items, query, predicate, page, pageSize) {
  const list = Array.isArray(items) ? items : []
  const q = String(query || '').trim().toLowerCase()
  const filtered = q ? list.filter(item => predicate(item, q)) : list
  const safePageSize = Math.max(1, Number(pageSize || 10))
  const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize))
  const currentPage = Math.min(Math.max(1, Number(page || 1)), totalPages)
  const start = (currentPage - 1) * safePageSize
  return { filtered, pageItems: filtered.slice(start, start + safePageSize), totalPages, currentPage }
}

// --- Asistencia (espejo de useAttendance) ---
function calculateAttendanceRate(statuses) {
  const items = Array.isArray(statuses) ? statuses : []
  if (!items.length) return 0
  const present = items.filter(s => s === 'present').length
  return Math.round((present / items.length) * 100)
}

// --- Roles (espejo de AppContext + Sidebar) ---
function getAllowedSectionsByRole(role) {
  if (role === 'moderador') return ['dashboard', 'aulas', 'calendario', 'asistencia', 'notificaciones', 'perfil', 'moderador']
  return ['dashboard', 'asistencia', 'notificaciones', 'perfil']
}

// -------------------------------------------------------

describe('Validación de teléfono E.164', () => {
  it('acepta formato correcto', () => expect(isValidE164Phone('+34600111222')).toBe(true))
  it('rechaza sin prefijo +',   () => expect(isValidE164Phone('600111222')).toBe(false))
  it('rechaza +0 como prefijo', () => expect(isValidE164Phone('+012345678')).toBe(false))
})

describe('Validación de edad mínima', () => {
  it('acepta mayor de 18',  () => expect(hasMinimumAge('2000-01-01', 18)).toBe(true))
  it('rechaza menor de 18', () => expect(hasMinimumAge('2010-01-01', 18)).toBe(false))
  it('rechaza sin fecha',   () => expect(hasMinimumAge('', 18)).toBe(false))
})

describe('Paginación y filtrado', () => {
  const items = [{ name: 'Ana' }, { name: 'Carlos' }, { name: 'Carla' }]
  const pred  = (item, q) => item.name.toLowerCase().includes(q)

  it('filtra por query',          () => expect(filterAndPaginate(items, 'car', pred, 1, 10).filtered.length).toBe(2))
  it('pagina correctamente',      () => expect(filterAndPaginate(items, 'car', pred, 1, 1).pageItems.length).toBe(1))
  it('calcula total de páginas',  () => expect(filterAndPaginate(items, 'car', pred, 1, 1).totalPages).toBe(2))
  it('sin query devuelve todo',   () => expect(filterAndPaginate(items, '', pred, 1, 10).filtered.length).toBe(3))
})

describe('Cálculo de asistencia', () => {
  it('calcula porcentaje correcto', () => expect(calculateAttendanceRate(['present', 'present', 'absent', 'late'])).toBe(50))
  it('retorna 0 si lista vacía',   () => expect(calculateAttendanceRate([])).toBe(0))
  it('100% si todos presentes',    () => expect(calculateAttendanceRate(['present', 'present'])).toBe(100))
})

describe('Secciones por rol', () => {
  it('profesor no accede a moderador', () => expect(getAllowedSectionsByRole('profesor').includes('moderador')).toBe(false))
  it('moderador accede a todo',        () => expect(getAllowedSectionsByRole('moderador').includes('moderador')).toBe(true))
  it('profesor accede a asistencia',   () => expect(getAllowedSectionsByRole('profesor').includes('asistencia')).toBe(true))
})
