// nav-ui.js — Navegación y control de acceso por rol

function showSection(section, triggerEl = null) {
    const allowed = getAllowedSectionsByRole(currentRole);
    if(!allowed.includes(section)) {
        showToast('No tienes permisos para acceder a esta sección.', 'warning');
        section = 'dashboard';
    }

    // Ocultar todas las secciones
    document.querySelectorAll('main section').forEach(s => s.classList.add('hidden'));

    // Mostrar sección seleccionada
    document.getElementById(section + 'Section').classList.remove('hidden');

    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'aulas': 'Gestión de Aulas',
        'calendario': 'Calendario Académico',
        'asistencia': 'Control de Asistencia',
        'notificaciones': 'Notificaciones',
        'perfil': 'Perfil del Profesor',
        'moderador': 'Panel de Moderador'
    };
    document.getElementById('pageTitle').textContent = titles[section];

    // Actualizar sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const activeButton = triggerEl || document.querySelector(`.sidebar-item[data-section="${section}"]`);
    if(activeButton) activeButton.classList.add('active');

    // Cerrar sidebar en móvil
    if(window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        if(!sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if(sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

function refreshRoleAccessUI() {
    currentRole = getCurrentUserRole();
    const allowed = getAllowedSectionsByRole(currentRole);
    document.querySelectorAll('.sidebar-item[data-section]').forEach((btn) => {
        const section = btn.getAttribute('data-section');
        btn.classList.toggle('hidden', !allowed.includes(section));
    });
}

function getCurrentUserRole() {
    const role = String(currentUser?.user_metadata?.role || 'profesor').toLowerCase().trim();
    return role === 'moderador' ? 'moderador' : 'profesor';
}

function getAllowedSectionsByRole(role = currentRole) {
    if(role === 'moderador') {
        return ['dashboard', 'aulas', 'calendario', 'asistencia', 'notificaciones', 'perfil', 'moderador'];
    }
    return ['dashboard', 'asistencia', 'notificaciones', 'perfil'];
}
