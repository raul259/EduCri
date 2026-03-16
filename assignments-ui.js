// assignments-ui.js — Tareas del Moderador

async function loadModeratorAssignmentsFromStorage() {
    if(!supabaseClient || !currentUser?.id) {
        moderatorAssignments = safeParseJSON('educri_assignments', []);
        renderAssignmentsList();
        return;
    }

    const assignOffset = (assignmentsPage - 1) * assignmentsPageSize;
    const { data, error } = await supabaseClient
        .from('teacher_tasks')
        .select('id,teacher_id,class_category,title,notes,day,time,created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(assignOffset, assignOffset + assignmentsPageSize - 1);

    if(error) {
        console.error('Error cargando tareas asignadas', error);
        moderatorAssignments = safeParseJSON('educri_assignments', []);
        renderAssignmentsList();
        return;
    }

    moderatorAssignments = (Array.isArray(data) ? data : []).map((row) => ({
        id: row.id,
        teacher_id: row.teacher_id,
        teacher_name: getTeacherNameById(row.teacher_id),
        class_category: row.class_category,
        title: row.title,
        notes: row.notes || '',
        day: row.day,
        time: row.time
    }));

    localStorage.setItem('educri_assignments', JSON.stringify(moderatorAssignments));
    renderAssignmentsList();
}

function renderAssignmentsList() {
    const list = document.getElementById('assignmentsList');
    const count = document.getElementById('assignmentsCount');
    const pageInfo = document.getElementById('assignmentsPageInfo');
    if(!list || !count) return;

    const pagination = window.EducriModerator?.filterAndPaginate
        ? window.EducriModerator.filterAndPaginate(
            moderatorAssignments,
            assignmentsSearch,
            (task, q) =>
                String(task.title || '').toLowerCase().includes(q)
                || String(task.teacher_name || getTeacherNameById(task.teacher_id)).toLowerCase().includes(q)
                || String(task.class_category || '').toLowerCase().includes(q),
            assignmentsPage,
            assignmentsPageSize
        )
        : { filtered: moderatorAssignments, pageItems: moderatorAssignments, totalPages: 1, currentPage: 1 };
    const filtered = pagination.filtered;
    const pageItems = pagination.pageItems;
    assignmentsPage = pagination.currentPage;
    const totalPages = pagination.totalPages;

    if(!filtered.length) {
        count.textContent = '0 tareas';
        if(pageInfo) pageInfo.textContent = 'Página 1 de 1';
        list.innerHTML = '<p class="text-gray-500">No hay resultados.</p>';
        return;
    }

    count.textContent = `${filtered.length} tareas`;
    if(pageInfo) pageInfo.textContent = `Página ${assignmentsPage} de ${totalPages}`;
    list.innerHTML = pageItems.map((task) => `
        <div class="border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div>
                <p class="font-semibold text-gray-800">${escapeHtml(task.title)}</p>
                <p class="text-xs text-gray-500">Profesor: ${escapeHtml(task.teacher_name || getTeacherNameById(task.teacher_id))} · ${escapeHtml(task.day)} ${escapeHtml(task.time)} · ${escapeHtml(getCategoryName(task.class_category || task.classroom || 'otros'))}</p>
                ${task.notes ? `<p class="text-xs text-gray-500 mt-1">${escapeHtml(task.notes)}</p>` : ''}
            </div>
            <button onclick="removeAssignment('${escapeHtml(String(task.id))}')" class="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
        </div>
    `).join('');
}

async function persistAssignment(task) {
    if(!supabaseClient || !currentUser?.id) {
        const localTask = {
            ...task,
            id: Date.now(),
            teacher_name: task.teacher_name || getTeacherNameById(task.teacher_id)
        };
        moderatorAssignments.unshift(localTask);
        localStorage.setItem('educri_assignments', JSON.stringify(moderatorAssignments));
        return;
    }

    const payload = {
        teacher_id: task.teacher_id,
        class_category: task.class_category,
        title: task.title,
        notes: task.notes || null,
        day: task.day,
        time: task.time,
        assigned_by: currentUser.id
    };

    const { data, error } = await supabaseClient
        .from('teacher_tasks')
        .insert(payload)
        .select('id,teacher_id,class_category,title,notes,day,time,created_at')
        .single();

    if(error) throw error;

    moderatorAssignments.unshift({
        id: data.id,
        teacher_id: data.teacher_id,
        teacher_name: getTeacherNameById(data.teacher_id),
        class_category: data.class_category,
        title: data.title,
        notes: data.notes || '',
        day: data.day,
        time: data.time
    });
    localStorage.setItem('educri_assignments', JSON.stringify(moderatorAssignments));
}

async function persistDeleteAssignment(taskId) {
    if(!supabaseClient || !currentUser?.id) {
        moderatorAssignments = moderatorAssignments.filter((t) => String(t.id) !== String(taskId));
        localStorage.setItem('educri_assignments', JSON.stringify(moderatorAssignments));
        return;
    }

    const { error } = await supabaseClient
        .from('teacher_tasks')
        .update({ deleted_at: new Date().toISOString(), deleted_by: currentUser.id })
        .eq('id', taskId);

    if(error) throw error;

    moderatorAssignments = moderatorAssignments.filter((t) => String(t.id) !== String(taskId));
    localStorage.setItem('educri_assignments', JSON.stringify(moderatorAssignments));
}

function addAssignment(e) {
    e.preventDefault();
    const form = e.target;
    const task = {
        title: String(form.assignmentTitle.value || '').trim(),
        teacher_id: String(form.assignmentTeacherId.value || '').trim(),
        teacher_name: getTeacherNameById(form.assignmentTeacherId.value),
        class_category: String(form.assignmentClass.value || '').trim(),
        day: String(form.assignmentDay.value || '').trim(),
        time: String(form.assignmentTime.value || '').trim(),
        notes: String(form.assignmentNotes.value || '').trim()
    };

    if(!task.title || !task.teacher_id || !task.class_category || !task.day || !task.time) {
        showToast('Completa los datos de la tarea.', 'warning');
        return;
    }

    persistAssignment(task)
        .then(() => {
            form.reset();
            renderAssignmentsList();
            renderNotifications();
            showToast('Tarea asignada al profesor.', 'success');
        })
        .catch((error) => {
            console.error('No se pudo asignar la tarea', error);
            showToast(getDataErrorMessage(error, 'No se pudo asignar la tarea.'), 'error');
        });
}

function removeAssignment(taskId) {
    persistDeleteAssignment(taskId)
        .then(() => {
            renderAssignmentsList();
            renderNotifications();
        })
        .catch((error) => {
            console.error('No se pudo eliminar la tarea', error);
            showToast(getDataErrorMessage(error, 'No se pudo eliminar la tarea.'), 'error');
        });
}

function setAssignmentsSearch(value) {
    assignmentsSearch = String(value || '');
    assignmentsPage = 1;
    renderAssignmentsList();
}

function changeAssignmentsPage(delta) {
    assignmentsPage = Math.max(1, assignmentsPage + Number(delta || 0));
    renderAssignmentsList();
}
