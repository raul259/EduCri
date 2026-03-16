// dashboard.js — Dashboard y estadísticas

async function updateDashboardStats() {
    const todayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const classesToday = aulas.filter((a) => String(a.day || '').toLowerCase() === todayName).length;
    const pending = getVisibleAssignments().length;

    const statuses = [];

    if(supabaseClient && currentUser?.id) {
        let query = supabaseClient
            .from('attendance_records')
            .select('status');

        if(currentRole !== 'moderador') {
            query = query.eq('teacher_id', currentUser.id);
        }

        const { data, error } = await query;
        if(!error && Array.isArray(data)) {
            data.forEach((row) => {
                statuses.push(row.status);
            });
        }
    } else {
        Object.values(attendance).forEach((entry) => {
            if(typeof entry !== 'object' || !entry) return;
            Object.entries(entry).forEach(([k, v]) => {
                if(String(k).endsWith('_note')) return;
                statuses.push(v);
            });
        });
    }

    const attendancePct = window.EducriAttendance?.calculateAttendanceRate
        ? window.EducriAttendance.calculateAttendanceRate(statuses)
        : 0;

    const totalAulasEl = document.getElementById('totalAulas');
    const classesTodayEl = document.getElementById('classesTodayCount');
    const attendanceRateEl = document.getElementById('attendanceRate');
    const pendingEl = document.getElementById('pendingCount');

    if(totalAulasEl) totalAulasEl.textContent = String(aulas.length);
    if(classesTodayEl) classesTodayEl.textContent = String(classesToday);
    if(attendanceRateEl) attendanceRateEl.textContent = `${attendancePct}%`;
    if(pendingEl) pendingEl.textContent = String(pending);
}

async function renderAttendanceByTeacher() {
    const container = document.getElementById('attendanceByTeacher');
    if(!container) return;

    if(supabaseClient && currentUser?.id) {
        const { data, error } = await supabaseClient
            .from('attendance_summary_by_teacher')
            .select('teacher_id,teacher_name,present_count,absent_count,late_count')
            .order('teacher_name', { ascending: true });

        if(!error && Array.isArray(data) && data.length) {
            container.innerHTML = data.map((row) => `
                <div class="border border-gray-200 rounded-xl p-3">
                    <p class="font-semibold text-gray-800">${escapeHtml(row.teacher_name || 'Profesor')}</p>
                    <p class="text-xs text-gray-500 mt-1">Presentes: ${Number(row.present_count || 0)} · Ausentes: ${Number(row.absent_count || 0)} · Tarde: ${Number(row.late_count || 0)}</p>
                </div>
            `).join('');
            return;
        }
    }

    const classroomMap = new Map(aulas.map((a) => [String(a.id), a.teacher || 'Sin profesor']));
    const summary = {};

    Object.entries(attendance).forEach(([key, values]) => {
        if(typeof values !== 'object' || values === null) return;
        const classId = String(key).split('_')[0];
        const teacher = classroomMap.get(classId) || 'Sin profesor';

        if(!summary[teacher]) {
            summary[teacher] = { present: 0, absent: 0, late: 0 };
        }

        Object.entries(values).forEach(([studentKey, status]) => {
            if(String(studentKey).endsWith('_note')) return;
            if(status === 'present') summary[teacher].present += 1;
            if(status === 'absent') summary[teacher].absent += 1;
            if(status === 'late') summary[teacher].late += 1;
        });
    });

    const entries = Object.entries(summary);
    if(!entries.length) {
        container.innerHTML = '<p class="text-gray-500">Aún no hay registros de asistencia por profesor.</p>';
        return;
    }

    container.innerHTML = entries.map(([teacher, stats]) => `
        <div class="border border-gray-200 rounded-xl p-3">
            <p class="font-semibold text-gray-800">${escapeHtml(teacher)}</p>
            <p class="text-xs text-gray-500 mt-1">Presentes: ${stats.present} · Ausentes: ${stats.absent} · Tarde: ${stats.late}</p>
        </div>
    `).join('');
}

function renderUpcomingClasses() {
    const container = document.getElementById('upcomingClasses');
    const today = new Date();
    const dayName = today.toLocaleDateString('es-ES', { weekday: 'long' });

    const todayClasses = aulas.filter(a =>
        a.day.toLowerCase() === dayName.toLowerCase()
    ).sort((a, b) => a.time.localeCompare(b.time));

    if(todayClasses.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay clases programadas para hoy</p>';
        return;
    }

    container.innerHTML = todayClasses.map((aula, index) => `
        <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all cursor-pointer" style="animation-delay: ${index * 100}ms">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${typeof aula.color === 'string' && /^from-[a-z0-9-]+\s+to-[a-z0-9-]+$/i.test(aula.color) ? aula.color : 'from-blue-500 to-cyan-400'} flex flex-col items-center justify-center text-white shadow-lg flex-shrink-0">
                <span class="text-xs font-bold opacity-80">HOY</span>
                <span class="text-lg font-bold">${escapeHtml(aula.time)}</span>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-800 truncate">${escapeHtml(aula.name)}</h4>
                <p class="text-sm text-gray-500 flex items-center gap-2">
                    <i class="fas fa-map-marker-alt text-pink-500"></i> ${escapeHtml(aula.classroom)}
                </p>
                <p class="text-xs text-gray-400 mt-1">${escapeHtml(aula.teacher)}</p>
            </div>
            <button class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `).join('');
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', options);
}
