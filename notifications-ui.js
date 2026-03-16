// notifications-ui.js — Notificaciones

function getBaseNotifications() {
    const items = [];
    const todayName = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

    aulas.forEach((aula) => {
        if(String(aula.day || '').toLowerCase() !== todayName) return;
        items.push({
            id: `class_today_${aula.id}`,
            type: 'info',
            title: 'Clase programada hoy',
            message: `${aula.name} (${aula.classroom}) con ${aula.teacher}.`,
            timeLabel: 'Hoy'
        });
    });

    const profile = getTeacherProfileFromMetadata();
    const teacherName = String(profile.full_name || '').trim().toLowerCase();
    const userEmail = String(currentUser?.email || '').trim().toLowerCase();

    moderatorAssignments.forEach((task) => {
        const taskTeacherId = String(task.teacher_id || '').trim();
        const taskTeacherName = String(task.teacher_name || '').trim().toLowerCase();
        const visibleForTeacher = currentRole === 'moderador'
            || taskTeacherId === String(currentUser?.id || '')
            || taskTeacherName === teacherName
            || taskTeacherName === userEmail;
        if(!visibleForTeacher) return;

        items.push({
            id: `task_${task.id}`,
            type: 'warning',
            title: 'Tarea asignada',
            message: `${task.title} · ${getCategoryName(task.class_category || task.classroom || 'otros')} · ${task.day} ${task.time}.`,
            timeLabel: 'Asignada'
        });
    });

    return items;
}

function getVisibleAssignments() {
    const profile = getTeacherProfileFromMetadata();
    const teacherName = String(profile.full_name || '').trim().toLowerCase();
    const userEmail = String(currentUser?.email || '').trim().toLowerCase();
    const userId = String(currentUser?.id || '');

    return moderatorAssignments.filter((task) => {
        if(currentRole === 'moderador') return true;
        const taskTeacherId = String(task.teacher_id || '').trim();
        const taskTeacherName = String(task.teacher_name || '').trim().toLowerCase();
        return taskTeacherId === userId
            || taskTeacherName === teacherName
            || taskTeacherName === userEmail;
    });
}

function renderNotifications() {
    const container = document.getElementById('notificationsList');
    if(!container) return;

    const items = getBaseNotifications().filter((n) => !dismissedNotifications.includes(n.id));

    if(items.length === 0) {
        container.innerHTML = '<div class="bg-white rounded-2xl shadow-lg p-6 text-gray-500">No hay notificaciones por ahora.</div>';
        updateNotificationBadges(0);
        return;
    }

    container.innerHTML = items.map((item) => {
        const style = item.type === 'warning'
            ? 'border-yellow-500 bg-yellow-100 text-yellow-600 fa-exclamation'
            : 'border-blue-500 bg-blue-100 text-blue-600 fa-calendar';
        const [borderClass, iconBgClass, iconColorClass, iconClass] = style.split(' ');

        return `
            <div class="bg-white rounded-2xl shadow-lg p-6 border-l-4 ${borderClass} flex items-start gap-4">
                <div class="w-10 h-10 rounded-full ${iconBgClass} flex items-center justify-center ${iconColorClass} flex-shrink-0">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(item.title)}</h4>
                    <p class="text-gray-600 text-sm mt-1">${escapeHtml(item.message)}</p>
                    <p class="text-gray-400 text-xs mt-2">${escapeHtml(item.timeLabel)}</p>
                </div>
                <button onclick="dismissNotification('${escapeHtml(item.id)}')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');

    updateNotificationBadges(items.length);
    updateDashboardStats();
}

function updateNotificationBadges(count) {
    const sidebarCount = document.getElementById('notificationsSidebarCount');
    const mobileDot = document.getElementById('mobileNotificationBadge');
    const desktopDot = document.getElementById('desktopNotificationBadge');

    if(sidebarCount) {
        sidebarCount.textContent = String(count);
        sidebarCount.classList.toggle('hidden', count === 0);
    }
    if(mobileDot) {
        mobileDot.classList.toggle('hidden', count === 0);
    }
    if(desktopDot) {
        desktopDot.classList.toggle('hidden', count === 0);
    }
}

function dismissNotification(id) {
    if(!dismissedNotifications.includes(id)) {
        dismissedNotifications.push(id);
        localStorage.setItem('educri_dismissed_notifications', JSON.stringify(dismissedNotifications));
    }
    renderNotifications();
}

function showNotifications() {
    showSection('notificaciones');
    renderNotifications();
}
