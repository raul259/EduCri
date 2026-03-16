// students-ui.js — Gestión de Alumnos

async function loadStudentsFromStorage(page = 1) {
    if(!supabaseClient || !currentUser?.id) {
        students = safeParseJSON('educri_students', []);
        renderStudentsList();
        return;
    }

    const pageSize = studentsPageSize;
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabaseClient
        .from('students')
        .select('id,full_name,class_category,teacher_id,created_by,created_at', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

    if(error) {
        console.error('Error cargando alumnos', error);
        students = safeParseJSON('educri_students', []);
        renderStudentsList();
        return;
    }

    students = (Array.isArray(data) ? data : []).map((row) => ({
        id: row.id,
        name: row.full_name,
        classroom: row.class_category,
        teacher_id: row.teacher_id,
        teacher: row.teacher_id ? getTeacherNameById(row.teacher_id) : 'Sin asignar'
    }));

    studentsTotalCount = count ?? students.length;
    studentsPage = page;
    localStorage.setItem('educri_students', JSON.stringify(students));
    renderStudentsList();
}

function renderStudentsList() {
    const list = document.getElementById('studentsList');
    const count = document.getElementById('studentsCount');
    const pageInfo = document.getElementById('studentsPageInfo');
    if(!list || !count) return;

    const pagination = window.EducriModerator?.filterAndPaginate
        ? window.EducriModerator.filterAndPaginate(
            students,
            studentsSearch,
            (student, q) =>
                String(student.name || '').toLowerCase().includes(q)
                || String(student.classroom || '').toLowerCase().includes(q)
                || String(student.teacher || '').toLowerCase().includes(q),
            studentsPage,
            studentsPageSize
        )
        : { filtered: students, pageItems: students, totalPages: 1, currentPage: 1 };
    const filtered = pagination.filtered;
    const pageItems = pagination.pageItems;
    studentsPage = pagination.currentPage;
    const totalPages = pagination.totalPages;

    if(!filtered.length) {
        count.textContent = '0 alumnos';
        if(pageInfo) pageInfo.textContent = 'Página 1 de 1';
        list.innerHTML = '<p class="text-gray-500">No hay resultados.</p>';
        return;
    }

    count.textContent = `${filtered.length} alumnos`;
    if(pageInfo) pageInfo.textContent = `Página ${studentsPage} de ${totalPages}`;
    list.innerHTML = pageItems.map((student) => `
        <div class="border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-2">
            <div>
                <p class="font-semibold text-gray-800">${escapeHtml(student.name)}</p>
                <p class="text-xs text-gray-500">Clase: ${escapeHtml(getCategoryName(student.classroom || 'otros'))} · Profesor: ${escapeHtml(student.teacher || getTeacherNameById(student.teacher_id))}</p>
            </div>
            <button onclick="removeStudent('${escapeHtml(String(student.id))}')" class="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
        </div>
    `).join('');
}

async function persistStudent(newStudent) {
    if(!supabaseClient || !currentUser?.id) {
        const localStudent = {
            ...newStudent,
            id: Date.now(),
            teacher: newStudent.teacher_name || getTeacherNameById(newStudent.teacher_id)
        };
        students.unshift(localStudent);
        localStorage.setItem('educri_students', JSON.stringify(students));
        return;
    }

    const payload = {
        full_name: newStudent.name,
        class_category: newStudent.classroom,
        teacher_id: newStudent.teacher_id || null,
        created_by: currentUser.id
    };

    const { data, error } = await supabaseClient
        .from('students')
        .insert(payload)
        .select('id,full_name,class_category,teacher_id')
        .single();

    if(error) throw error;

    students.unshift({
        id: data.id,
        name: data.full_name,
        classroom: data.class_category,
        teacher_id: data.teacher_id,
        teacher: data.teacher_id ? getTeacherNameById(data.teacher_id) : 'Sin asignar'
    });
    localStorage.setItem('educri_students', JSON.stringify(students));
}

async function persistDeleteStudent(studentId) {
    if(!supabaseClient || !currentUser?.id) {
        students = students.filter((s) => String(s.id) !== String(studentId));
        localStorage.setItem('educri_students', JSON.stringify(students));
        return;
    }

    const { error } = await supabaseClient
        .from('students')
        .update({ deleted_at: new Date().toISOString(), deleted_by: currentUser.id })
        .eq('id', studentId);

    if(error) throw error;

    students = students.filter((s) => String(s.id) !== String(studentId));
    localStorage.setItem('educri_students', JSON.stringify(students));
}

function addStudent(e) {
    e.preventDefault();
    const form = e.target;
    const newStudent = {
        name: String(form.studentName.value || '').trim(),
        classroom: String(form.studentClass.value || '').trim(),
        teacher_id: String(form.studentTeacherId.value || '').trim(),
        teacher_name: getTeacherNameById(form.studentTeacherId.value)
    };

    if(!newStudent.name || !newStudent.classroom || !newStudent.teacher_id) {
        showToast('Completa todos los datos del alumno.', 'warning');
        return;
    }

    persistStudent(newStudent)
        .then(() => {
            form.reset();
            renderStudentsList();
            showToast('Alumno añadido correctamente.', 'success');
        })
        .catch((error) => {
            console.error('No se pudo guardar el alumno', error);
            showToast(getDataErrorMessage(error, 'No se pudo guardar el alumno.'), 'error');
        });
}

function removeStudent(studentId) {
    persistDeleteStudent(studentId)
        .then(() => {
            renderStudentsList();
        })
        .catch((error) => {
            console.error('No se pudo eliminar el alumno', error);
            showToast(getDataErrorMessage(error, 'No se pudo eliminar el alumno.'), 'error');
        });
}

function setStudentsSearch(value) {
    studentsSearch = String(value || '');
    studentsPage = 1;
    renderStudentsList();
}

function changeStudentsPage(delta) {
    const totalPages = Math.max(1, Math.ceil(studentsTotalCount / studentsPageSize));
    const newPage = Math.min(totalPages, Math.max(1, studentsPage + Number(delta || 0)));
    if(newPage !== studentsPage) {
        loadStudentsFromStorage(newPage);
    }
}
