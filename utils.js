// utils.js — Funciones de utilidad compartidas

function escapeHtml(value) {
    const str = String(value ?? '');
    const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
    return str.replace(/[&<>"'`]/g, (char) => htmlEscapes[char]);
}

function safeParseJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
        if (!Array.isArray(fallback) && typeof fallback === 'object' && fallback !== null) {
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;
        }
        return parsed;
    } catch (error) {
        console.warn(`No se pudo parsear ${key} desde localStorage`, error);
        return fallback;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    toast.className = `${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300 pointer-events-auto`;
    toast.innerHTML = `<i class="fas fa-${icons[type]}" aria-hidden="true"></i><span class="font-medium">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 100);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getCategoryName(cat) {
    const names = { corderitos: 'Corderitos', soldaditos: 'Soldaditos', vencedores: 'Vencedores', otros: 'Otros' };
    return names[cat] || cat;
}

function getDataErrorMessage(error, fallback = 'No se pudo completar la operación.') {
    const raw = String(error?.message || '').toLowerCase();
    if (!raw) return fallback;
    if (raw.includes('violates row-level security')) return 'No tienes permisos para realizar esta acción.';
    if (raw.includes('duplicate key')) return 'Ya existe un registro con esos datos.';
    if (raw.includes('foreign key')) return 'Referencia inválida: revisa profesor, clase o alumno.';
    if (raw.includes('invalid input syntax')) return 'Uno de los campos tiene un formato inválido.';
    if (raw.includes('failed to fetch') || raw.includes('network')) return 'No hay conexión con Supabase en este momento.';
    return `${fallback} (${error?.message || 'error desconocido'})`;
}

function getAuthErrorMessage(error, mode = 'login') {
    const raw = String(error?.message || '').toLowerCase();
    if (!raw) return mode === 'register' ? 'No se pudo crear la cuenta.' : 'No se pudo iniciar sesión.';
    if (raw.includes('failed to fetch') || raw.includes('network')) return 'No hay conexión con Supabase. Verifica internet, SUPABASE_URL/SUPABASE_ANON_KEY y abre la app con http://localhost (no file://).';
    if (raw.includes('user already registered')) return 'Ese correo ya está registrado. Inicia sesión.';
    if (raw.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (raw.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.';
    if (raw.includes('signup is disabled')) return 'El registro está desactivado en Supabase.';
    if (raw.includes('password')) return 'La contraseña no cumple la política de seguridad de Supabase.';
    if (raw.includes('email')) return 'El correo no es válido.';
    return mode === 'register' ? `No se pudo crear la cuenta: ${error?.message || 'error desconocido'}` : `No se pudo iniciar sesión: ${error?.message || 'error desconocido'}`;
}

// Fallbacks para validación (la implementación principal está en auth.js)
function isValidEmail(email) {
    return window.EducriAuth?.isValidEmail ? window.EducriAuth.isValidEmail(email) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidE164Phone(phone) {
    return window.EducriAuth?.isValidE164Phone ? window.EducriAuth.isValidE164Phone(phone) : /^\+[1-9]\d{7,14}$/.test(String(phone || '').trim());
}
function hasMinimumAge(birthDate, minAge = 18) {
    return window.EducriAuth?.hasMinimumAge ? window.EducriAuth.hasMinimumAge(birthDate, minAge) : false;
}
function getEmailTypoSuggestion(email) {
    return window.EducriAuth?.getEmailTypoSuggestion ? window.EducriAuth.getEmailTypoSuggestion(email) : null;
}
