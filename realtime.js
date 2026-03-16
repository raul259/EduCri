// realtime.js — Suscripciones en tiempo real con Supabase

function setupRealtimeSubscriptions() {
    if(!supabaseClient || !currentUser?.id) return;

    // Nuevas tareas asignadas al profesor actual
    supabaseClient
        .channel('teacher_tasks_realtime')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'teacher_tasks',
            filter: `teacher_id=eq.${currentUser.id}`
        }, (payload) => {
            const task = payload.new;
            moderatorAssignments.unshift({
                id: task.id,
                teacher_id: task.teacher_id,
                teacher_name: getTeacherNameById(task.teacher_id),
                class_category: task.class_category,
                title: task.title,
                notes: task.notes || '',
                day: task.day,
                time: task.time
            });
            localStorage.setItem('educri_assignments', JSON.stringify(moderatorAssignments));
            renderAssignmentsList();
            renderNotifications();
            showToast(`Nueva tarea asignada: ${task.title}`, 'info');
        })
        .subscribe();

    // Moderador: alertas cuando se añaden nuevos alumnos
    if(currentRole === 'moderador') {
        supabaseClient
            .channel('students_realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'students'
            }, (payload) => {
                const s = payload.new;
                students.unshift({
                    id: s.id,
                    name: s.full_name,
                    classroom: s.class_category,
                    teacher_id: s.teacher_id,
                    teacher: s.teacher_id ? getTeacherNameById(s.teacher_id) : 'Sin asignar'
                });
                renderStudentsList();
                showToast(`Nuevo alumno registrado: ${s.full_name}`, 'info');
            })
            .subscribe();
    }
}
