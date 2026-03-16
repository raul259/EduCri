export function isValidE164Phone(phone) {
  return /^\+[1-9]\d{7,14}$/.test(String(phone || '').trim());
}

export function hasMinimumAge(birthDate, minAge = 18) {
  if (!birthDate) return false;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date('2026-02-26T00:00:00Z');
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= minAge;
}

export function filterAndPaginate(items, query, predicate, page, pageSize) {
  const list = Array.isArray(items) ? items : [];
  const q = String(query || '').trim().toLowerCase();
  const filtered = q ? list.filter((item) => predicate(item, q)) : list;
  const safePageSize = Math.max(1, Number(pageSize || 10));
  const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
  const currentPage = Math.min(Math.max(1, Number(page || 1)), totalPages);
  const start = (currentPage - 1) * safePageSize;
  const pageItems = filtered.slice(start, start + safePageSize);
  return { filtered, pageItems, totalPages, currentPage };
}

export function calculateAttendanceRate(rows) {
  const items = Array.isArray(rows) ? rows : [];
  let present = 0;
  let total = 0;
  items.forEach((status) => {
    if (!status) return;
    total += 1;
    if (status === 'present') present += 1;
  });
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

export function getAllowedSectionsByRole(role) {
  if (role === 'moderador') return ['dashboard', 'aulas', 'calendario', 'asistencia', 'notificaciones', 'perfil', 'moderador'];
  return ['dashboard', 'asistencia', 'notificaciones', 'perfil'];
}

