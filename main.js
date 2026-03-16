// main.js — Inicialización y evento principal

function refreshUIData() {
    updateDateDisplay();
    renderAulas();
    renderUpcomingClasses();
    renderMiniCalendar();
    renderMainCalendar();
    populateClassSelect();
    document.getElementById('attendanceDate').valueAsDate = new Date();
    renderNotifications();
    updateDashboardStats();
}

// Accesibilidad: focus trap para modales
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

function trapFocus(modalEl) {
    const focusable = Array.from(modalEl.querySelectorAll(FOCUSABLE));
    if(!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    modalEl._trapHandler = (e) => {
        if(e.key !== 'Tab') return;
        if(e.shiftKey) {
            if(document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if(document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };
    modalEl.addEventListener('keydown', modalEl._trapHandler);
    first.focus();
}

function releaseFocus(modalEl) {
    if(modalEl._trapHandler) {
        modalEl.removeEventListener('keydown', modalEl._trapHandler);
        delete modalEl._trapHandler;
    }
}

// Cerrar modales con Escape
document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
        closeAddClassModal();
        closeViewSyllabusModal();
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    setAuthMode('login');
    renderStudentsList();
    renderTeacherOptions();
    renderTeacherApprovals();
    renderAssignmentsList();
    renderAttendanceByTeacher();
    if(window.location.protocol === 'file:') {
        showToast('Abre la app con http://localhost para evitar errores de conexión con Supabase.', 'warning');
    }

    if(!hasSupabaseConfig) {
        currentUser = { email: 'modo-local@educri' };
        completeLogin(false);
        aulas = safeParseJSON('educri_aulas', DEFAULT_AULAS);
        await loadTeacherProfilesFromStorage();
        await loadStudentsFromStorage();
        await loadModeratorAssignmentsFromStorage();
        refreshUIData();
        showToast('Configura Supabase (window.__EDUCRI_CONFIG__ o localStorage: educri_supabase_url / educri_supabase_anon_key).', 'warning');
        return;
    }

    const { data, error } = await supabaseClient.auth.getSession();
    if(error || !data.session?.user) {
        showLoginScreen();
        return;
    }

    currentUser = data.session.user;
    completeLogin(false);
    await loadAulasFromStorage();
    await loadTeacherProfilesFromStorage();
    await loadStudentsFromStorage();
    await loadModeratorAssignmentsFromStorage();
    refreshUIData();
    setupRealtimeSubscriptions();
});

// Actualizar aria-current en nav al cambiar sección
const _origShowSection = typeof showSection === 'function' ? showSection : null;
document.addEventListener('DOMContentLoaded', () => {
    const navBtns = document.querySelectorAll('nav[aria-label] button[data-section]');
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-section]');
        if(!btn) return;
        navBtns.forEach((b) => b.removeAttribute('aria-current'));
        btn.setAttribute('aria-current', 'page');
    });

    // Actualizar aria-expanded del toggle del sidebar
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('sidebar');
    if(sidebarToggleBtn && sidebar) {
        const observer = new MutationObserver(() => {
            const isOpen = !sidebar.classList.contains('-translate-x-full');
            sidebarToggleBtn.setAttribute('aria-expanded', String(isOpen));
        });
        observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }
});
