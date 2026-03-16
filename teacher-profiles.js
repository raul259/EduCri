// teacher-profiles.js — Perfiles de profesores y aprobaciones

function getTeacherNameById(teacherId) {
    const match = teacherProfiles.find((p) => String(p.user_id) === String(teacherId));
    return match?.full_name || 'Profesor';
}

function renderTeacherOptions() {
    const options = teacherProfiles
        .filter((p) => p.approval_status === 'approved')
        .sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || '')));
    const assignmentSelect = document.getElementById('assignmentTeacherId');
    const studentSelect = document.getElementById('studentTeacherId');

    if(assignmentSelect) assignmentSelect.innerHTML = '<option value="">Profesor asignado...</option>';
    if(studentSelect) studentSelect.innerHTML = '<option value="">Profesor responsable...</option>';

    options.forEach((p) => {
        const value = String(p.user_id);
        const label = p.full_name || p.user_id;

        if(assignmentSelect) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            assignmentSelect.appendChild(option);
        }

        if(studentSelect) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = label;
            studentSelect.appendChild(option);
        }
    });
}

async function loadTeacherProfilesFromStorage() {
    if(!supabaseClient || !currentUser?.id) {
        teacherProfiles = safeParseJSON('educri_teacher_profiles', []);
        renderTeacherOptions();
        renderTeacherApprovals();
        return;
    }

    const { data, error } = await supabaseClient
        .from('teacher_profiles')
        .select('user_id,full_name,approval_status,phone,teaching_experience,created_at')
        .order('full_name', { ascending: true });

    if(error) {
        console.error('Error cargando perfiles de profesor', error);
        teacherProfiles = safeParseJSON('educri_teacher_profiles', []);
        renderTeacherOptions();
        renderTeacherApprovals();
        return;
    }

    teacherProfiles = Array.isArray(data) ? data : [];
    localStorage.setItem('educri_teacher_profiles', JSON.stringify(teacherProfiles));
    renderTeacherOptions();
    renderTeacherApprovals();
}

function renderTeacherApprovals() {
    const list = document.getElementById('teacherApprovalsList');
    const count = document.getElementById('teacherApprovalsCount');
    if(!list || !count) return;

    const pending = teacherProfiles.filter((p) => p.approval_status === 'pending');
    count.textContent = `${pending.length} pendientes`;

    if(!pending.length) {
        list.innerHTML = '<p class="text-gray-500">No hay profesores pendientes por validar.</p>';
        return;
    }

    list.innerHTML = pending.map((profile) => `
        <div class="border border-gray-200 rounded-xl p-3">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="font-semibold text-gray-800">${escapeHtml(profile.full_name || 'Profesor sin nombre')}</p>
                    <p class="text-xs text-gray-500 mt-1">${escapeHtml(profile.phone || 'Sin teléfono')}</p>
                    <p class="text-xs text-gray-500 mt-1">${escapeHtml(profile.teaching_experience || 'Sin experiencia registrada')}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="updateTeacherApprovalStatus('${escapeHtml(String(profile.user_id))}','approved')" class="px-3 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs">Aprobar</button>
                    <button onclick="updateTeacherApprovalStatus('${escapeHtml(String(profile.user_id))}','rejected')" class="px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs">Rechazar</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateTeacherApprovalStatus(userId, status) {
    if(currentRole !== 'moderador') {
        showToast('Solo moderador puede validar profesores.', 'warning');
        return;
    }

    if(!supabaseClient || !currentUser?.id) {
        teacherProfiles = teacherProfiles.map((p) => p.user_id === userId ? { ...p, approval_status: status } : p);
        localStorage.setItem('educri_teacher_profiles', JSON.stringify(teacherProfiles));
        renderTeacherApprovals();
        renderTeacherOptions();
        showToast('Estado actualizado en modo local.', 'success');
        return;
    }

    const payload = {
        approval_status: status,
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from('teacher_profiles')
        .update(payload)
        .eq('user_id', userId);

    if(error) {
        console.error('No se pudo actualizar validación de profesor', error);
        showToast(getDataErrorMessage(error, 'No se pudo actualizar la validación del profesor.'), 'error');
        return;
    }

    await loadTeacherProfilesFromStorage();
    showToast(status === 'approved' ? 'Profesor aprobado.' : 'Profesor rechazado.', 'success');
}
