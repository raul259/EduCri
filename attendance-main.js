// attendance-main.js — Control de Asistencia

function populateClassSelect() {
    const select = document.getElementById('classSelect');
    select.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccionar clase...';
    select.appendChild(defaultOption);

    aulas.forEach((aula) => {
        const safeId = Number(aula.id);
        if(!Number.isFinite(safeId)) return;

        const option = document.createElement('option');
        option.value = String(safeId);
        option.textContent = aula.name || 'Clase sin nombre';
        select.appendChild(option);
    });
}

async function loadAttendance() {
    const classId = document.getElementById('classSelect').value;
    const date = document.getElementById('attendanceDate').value;

    if(!classId || !date) {
        document.getElementById('attendanceList').innerHTML =
            '<tr><td colspan="5" class="text-center py-8 text-gray-500">Selecciona una clase y fecha</td></tr>';
        return;
    }

    const selectedClass = aulas.find((a) => String(a.id) === String(classId));
    const classCategory = selectedClass?.category || '';
    let studentsForAttendance = students.filter((student) => {
        if(!classCategory) return true;
        return String(student.classroom || '').toLowerCase() === classCategory.toLowerCase();
    });

    let saved = {};

    if(supabaseClient && currentUser?.id) {
        const { data: studentsData, error: studentsError } = await supabaseClient
            .from('students')
            .select('id,full_name,class_category,teacher_id')
            .eq('class_category', classCategory)
            .order('full_name', { ascending: true });

        if(studentsError) {
            console.error('No se pudieron cargar alumnos para asistencia', studentsError);
            showToast(getDataErrorMessage(studentsError, 'No se pudieron cargar alumnos desde Supabase.'), 'warning');
        } else {
            studentsForAttendance = (Array.isArray(studentsData) ? studentsData : []).map((row) => ({
                id: row.id,
                name: row.full_name,
                classroom: row.class_category,
                teacher_id: row.teacher_id,
                teacher: row.teacher_id ? getTeacherNameById(row.teacher_id) : 'Sin asignar'
            }));
        }

        const { data: attendanceData, error: attendanceError } = await supabaseClient
            .from('attendance_records')
            .select('student_id,status,note')
            .eq('class_id', Number(classId))
            .eq('attendance_date', date);

        if(attendanceError) {
            console.error('No se pudo cargar asistencia desde Supabase', attendanceError);
            showToast(getDataErrorMessage(attendanceError, 'No se pudo cargar la asistencia desde Supabase.'), 'warning');
        } else {
            currentAttendanceEntries = {};
            (Array.isArray(attendanceData) ? attendanceData : []).forEach((row) => {
                saved[row.student_id] = row.status;
                saved[row.student_id + '_note'] = row.note || '';
                currentAttendanceEntries[row.student_id] = {
                    status: row.status,
                    note: row.note || ''
                };
            });
        }
    } else {
        const key = `${classId}_${date}`;
        saved = attendance[key] || {};
        currentAttendanceEntries = {};
        Object.keys(saved).forEach((k) => {
            if(String(k).endsWith('_note')) return;
            currentAttendanceEntries[k] = {
                status: saved[k],
                note: saved[k + '_note'] || ''
            };
        });
    }

    currentAttendanceStudents = studentsForAttendance;

    if(studentsForAttendance.length === 0) {
        document.getElementById('attendanceList').innerHTML =
            '<tr><td colspan="6" class="text-center py-8 text-gray-500">No hay alumnos registrados para esta clase.</td></tr>';
        document.getElementById('attendanceStats').innerHTML =
            '<span class="text-gray-500">0 Presentes - 0 Ausentes - 0 Retardos</span>';
        return;
    }

    let html = '';
    let presentCount = 0, absentCount = 0, lateCount = 0;

    studentsForAttendance.forEach((student, index) => {
        const studentId = Number.isFinite(Number(student.id)) ? Number(student.id) : index + 1;
        const studentName = String(student.name || '').trim() || 'Alumno';
        const status = saved[studentId] || '';
        if(status === 'present') presentCount++;
        if(status === 'absent') absentCount++;
        if(status === 'late') lateCount++;

        html += `
            <tr class="hover:bg-gray-50" data-name="${escapeHtml(studentName.toLowerCase())}" data-status="${status}">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">
                            ${escapeHtml(studentName.charAt(0))}
                        </div>
                        <span class="font-medium text-gray-800">${escapeHtml(studentName)}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="setAttendance(${studentId}, 'present')"
                        class="attendance-btn w-10 h-10 rounded-full ${status === 'present' ? 'present' : 'bg-gray-200 text-gray-600 hover:bg-green-100'}">
                        <i class="fas fa-check"></i>
                    </button>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="setAttendance(${studentId}, 'absent')"
                        class="attendance-btn w-10 h-10 rounded-full ${status === 'absent' ? 'absent' : 'bg-gray-200 text-gray-600 hover:bg-red-100'}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="setAttendance(${studentId}, 'late')"
                        class="attendance-btn w-10 h-10 rounded-full ${status === 'late' ? 'late' : 'bg-gray-200 text-gray-600 hover:bg-yellow-100'}">
                        <i class="fas fa-clock"></i>
                    </button>
                </td>
                <td class="px-6 py-4">
                    <input type="text" placeholder="Notas..." class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value="${escapeHtml(saved[studentId + '_note'] || '')}" onchange="saveNote(${studentId}, this.value)">
                </td>
                <td class="px-6 py-4" id="rate-${studentId}">
                    <span class="text-xs text-gray-400">cargando...</span>
                </td>
            </tr>
        `;
    });

    document.getElementById('attendanceList').innerHTML = html;
    document.getElementById('attendanceStats').innerHTML =
        `<span class="text-green-600 font-semibold">${presentCount} Presentes</span> - ` +
        `<span class="text-red-600 font-semibold">${absentCount} Ausentes</span> - ` +
        `<span class="text-yellow-600 font-semibold">${lateCount} Retardos</span>`;
    updateDashboardStats();

    const studentIds = studentsForAttendance
        .map((s) => Number.isFinite(Number(s.id)) ? Number(s.id) : null)
        .filter(Boolean);
    loadStudentAttendanceRates(classId, studentIds);
}

function setAttendance(studentId, status) {
    const classId = document.getElementById('classSelect').value;
    const date = document.getElementById('attendanceDate').value;
    const key = `${classId}_${date}`;

    if(supabaseClient && currentUser?.id) {
        const existingNote = currentAttendanceEntries[studentId]?.note || '';
        supabaseClient
            .from('attendance_records')
            .upsert({
                teacher_id: currentUser.id,
                student_id: Number(studentId),
                class_id: Number(classId),
                attendance_date: date,
                status,
                note: existingNote || null
            }, { onConflict: 'teacher_id,student_id,attendance_date' })
            .then(({ error }) => {
                if(error) {
                    console.error('No se pudo guardar asistencia en Supabase', error);
                    showToast(getDataErrorMessage(error, 'No se pudo guardar la asistencia.'), 'error');
                    return;
                }
                currentAttendanceEntries[studentId] = { status, note: existingNote };
                loadAttendance();
            });
        return;
    }

    if(!attendance[key]) attendance[key] = {};
    attendance[key][studentId] = status;

    localStorage.setItem('educri_attendance', JSON.stringify(attendance));
    loadAttendance();
}

function saveNote(studentId, note) {
    const classId = document.getElementById('classSelect').value;
    const date = document.getElementById('attendanceDate').value;
    const key = `${classId}_${date}`;

    if(supabaseClient && currentUser?.id) {
        const existingStatus = currentAttendanceEntries[studentId]?.status;
        if(!existingStatus) {
            showToast('Marca primero la asistencia antes de guardar nota.', 'warning');
            return;
        }

        supabaseClient
            .from('attendance_records')
            .upsert({
                teacher_id: currentUser.id,
                student_id: Number(studentId),
                class_id: Number(classId),
                attendance_date: date,
                status: existingStatus,
                note: String(note || '')
            }, { onConflict: 'teacher_id,student_id,attendance_date' })
            .then(({ error }) => {
                if(error) {
                    console.error('No se pudo guardar nota en Supabase', error);
                    showToast(getDataErrorMessage(error, 'No se pudo guardar la nota.'), 'error');
                    return;
                }
                currentAttendanceEntries[studentId] = { status: existingStatus, note: String(note || '') };
            });
        return;
    }

    if(!attendance[key]) attendance[key] = {};
    attendance[key][studentId + '_note'] = note;

    localStorage.setItem('educri_attendance', JSON.stringify(attendance));
}

function saveAttendance() {
    showToast('Asistencia guardada correctamente OK.', 'success');
}

function exportAttendanceCSV() {
    const classId = document.getElementById('classSelect').value;
    const date = document.getElementById('attendanceDate').value;
    const selectedClass = aulas.find((a) => String(a.id) === String(classId));

    if(!classId || !date) {
        showToast('Selecciona una clase y fecha primero.', 'warning');
        return;
    }

    if(currentAttendanceStudents.length === 0) {
        showToast('No hay alumnos para exportar.', 'warning');
        return;
    }

    const statusLabel = { present: 'Presente', absent: 'Ausente', late: 'Tarde', '': 'Sin registrar' };
    const lines = ['Alumno,Estado,Nota'];

    currentAttendanceStudents.forEach((student) => {
        const entry = currentAttendanceEntries[student.id] || {};
        const name = String(student.name || '').replace(/,/g, ' ');
        const status = statusLabel[entry.status || ''] || 'Sin registrar';
        const note = String(entry.note || '').replace(/,/g, ' ').replace(/\n/g, ' ');
        lines.push(`${name},${status},${note}`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asistencia_${(selectedClass?.name || 'clase').replace(/\s/g, '_')}_${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV exportado correctamente.', 'success');
}

async function loadStudentAttendanceRates(classId, studentIds) {
    if(!supabaseClient || !currentUser?.id || studentIds.length === 0) {
        studentIds.forEach((id) => {
            const cell = document.getElementById(`rate-${id}`);
            if(cell) cell.innerHTML = '<span class="text-xs text-gray-400">—</span>';
        });
        return;
    }

    const { data, error } = await supabaseClient
        .from('attendance_records')
        .select('student_id,status')
        .eq('class_id', Number(classId))
        .in('student_id', studentIds);

    if(error) {
        console.warn('No se pudo cargar historial de asistencia', error);
        return;
    }

    const totals = {};
    const presents = {};
    (Array.isArray(data) ? data : []).forEach((row) => {
        const sid = row.student_id;
        totals[sid] = (totals[sid] || 0) + 1;
        if(row.status === 'present') presents[sid] = (presents[sid] || 0) + 1;
    });

    studentIds.forEach((id) => {
        const cell = document.getElementById(`rate-${id}`);
        if(!cell) return;
        const total = totals[id] || 0;
        const present = presents[id] || 0;
        const rate = total > 0 ? Math.round((present / total) * 100) : null;

        if(rate === null) {
            cell.innerHTML = '<span class="text-xs text-gray-400">Sin datos</span>';
            return;
        }

        const color = rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-400' : 'bg-red-500';
        cell.innerHTML = `
            <div class="flex items-center gap-2 min-w-[80px]">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div class="${color} h-2 rounded-full" style="width:${rate}%"></div>
                </div>
                <span class="text-xs font-semibold text-gray-600">${rate}%</span>
            </div>`;
    });
}

function filterAttendanceList() {
    const search = (document.getElementById('attendanceSearch')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('attendanceStatusFilter')?.value || '';
    const rows = document.querySelectorAll('#attendanceList tr[data-name]');
    rows.forEach((row) => {
        const name = row.getAttribute('data-name') || '';
        const status = row.getAttribute('data-status') || '';
        const matchName = !search || name.includes(search);
        const matchStatus = !statusFilter || status === statusFilter;
        row.style.display = matchName && matchStatus ? '' : 'none';
    });
}
