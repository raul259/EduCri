// classes-ui.js — Gestión de Aulas (UI y persistencia)

function mapDbClassToUi(row) {
    return {
        id: Number(row.id),
        name: String(row.name || '').trim(),
        category: String(row.category || 'otros').trim(),
        teacher: String(row.teacher || '').trim(),
        classroom: String(row.classroom || '').trim(),
        day: String(row.day || '').trim(),
        time: String(row.time || '').trim(),
        description: String(row.description || '').trim(),
        pdfName: String(row.pdf_name || 'temario.pdf').trim(),
        pdfUrl: String(row.pdf_url || '').trim(),
        color: String(row.color || 'from-blue-500 to-cyan-400').trim()
    };
}

function mapUiClassToDb(aula) {
    return {
        user_id: currentUser?.id || null,
        name: aula.name,
        category: aula.category,
        teacher: aula.teacher,
        classroom: aula.classroom,
        day: aula.day,
        time: aula.time,
        description: aula.description,
        pdf_name: aula.pdfName,
        pdf_url: aula.pdfUrl || null,
        color: aula.color
    };
}

async function loadAulasFromStorage() {
    if(!supabaseClient || !currentUser?.id) {
        aulas = safeParseJSON('educri_aulas', DEFAULT_AULAS);
        return;
    }

    const { data, error } = await supabaseClient
        .from('classes')
        .select('id,name,category,teacher,classroom,day,time,description,pdf_name,pdf_url,color')
        .eq('user_id', currentUser.id)
        .order('id', { ascending: true });

    if(error) {
        console.error('Error cargando aulas desde Supabase', error);
        aulas = safeParseJSON('educri_aulas', DEFAULT_AULAS);
        showToast('No se pudieron cargar aulas desde Supabase. Se usa respaldo local.', 'warning');
        return;
    }

    aulas = Array.isArray(data) ? data.map(mapDbClassToUi) : [];
    if(aulas.length === 0) {
        const seedPayload = DEFAULT_AULAS.map((aula) => mapUiClassToDb(aula));
        const { data: seededRows, error: seedError } = await supabaseClient
            .from('classes')
            .insert(seedPayload)
            .select('id,name,category,teacher,classroom,day,time,description,pdf_name,pdf_url,color');

        if(seedError) {
            console.error('Error sembrando aulas base', seedError);
            aulas = [...DEFAULT_AULAS];
            return;
        }

        aulas = Array.isArray(seededRows) ? seededRows.map(mapDbClassToUi) : [...DEFAULT_AULAS];
    }
}

async function persistNewClass(newClass) {
    if(!supabaseClient || !currentUser?.id) {
        aulas.push(newClass);
        localStorage.setItem('educri_aulas', JSON.stringify(aulas));
        return;
    }

    const { data, error } = await supabaseClient
        .from('classes')
        .insert(mapUiClassToDb(newClass))
        .select('id,name,category,teacher,classroom,day,time,description,pdf_name,pdf_url,color')
        .single();

    if(error) throw error;
    aulas.push(mapDbClassToUi(data));
}

async function persistDeleteClass(id) {
    if(!supabaseClient || !currentUser?.id) {
        aulas = aulas.filter((a) => a.id !== id);
        localStorage.setItem('educri_aulas', JSON.stringify(aulas));
        return;
    }

    const { error } = await supabaseClient
        .from('classes')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

    if(error) throw error;
    aulas = aulas.filter((a) => a.id !== id);
}

function renderAulas() {
    const grid = document.getElementById('aulasGrid');
    const filtered = currentFilter === 'todas'
        ? aulas
        : aulas.filter(a => a.category === currentFilter);

    grid.innerHTML = filtered.map(aula => {
        const safeId = Number(aula.id);
        if(!Number.isFinite(safeId)) return '';

        const safeName = escapeHtml(aula.name);
        const safeTeacher = escapeHtml(aula.teacher);
        const safeClassroom = escapeHtml(aula.classroom);
        const safeDay = escapeHtml(aula.day);
        const safeTime = escapeHtml(aula.time);
        const safeCategory = escapeHtml(getCategoryName(aula.category));
        const safeColor = typeof aula.color === 'string' && /^from-[a-z0-9-]+\s+to-[a-z0-9-]+$/i.test(aula.color)
            ? aula.color
            : 'from-blue-500 to-cyan-400';

        return `
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover border border-gray-100">
            <div class="h-32 bg-gradient-to-r ${safeColor} p-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10"></div>
                <div class="relative z-10">
                    <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium mb-2">
                        ${safeCategory}
                    </span>
                    <h3 class="font-display text-xl font-bold text-white leading-tight">${safeName}</h3>
                </div>
            </div>
            <div class="p-6">
                <div class="space-y-3 mb-4">
                    <div class="flex items-center gap-3 text-gray-600">
                        <i class="fas fa-user-tie w-5 text-blue-500"></i>
                        <span class="text-sm">${safeTeacher}</span>
                    </div>
                    <div class="flex items-center gap-3 text-gray-600">
                        <i class="fas fa-door-open w-5 text-purple-500"></i>
                        <span class="text-sm">${safeClassroom}</span>
                    </div>
                    <div class="flex items-center gap-3 text-gray-600">
                        <i class="fas fa-clock w-5 text-pink-500"></i>
                        <span class="text-sm">${safeDay}, ${safeTime}</span>
                    </div>
                </div>

                <div class="flex gap-2 mt-4">
                    <button onclick="viewSyllabus(${safeId})" class="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <i class="fas fa-file-pdf"></i> Ver Temario
                    </button>
                    <button onclick="deleteClass(${safeId})" class="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    document.getElementById('totalAulas').textContent = aulas.length;
    const aulasBadge = document.getElementById('sidebarAulasCount');
    if(aulasBadge) aulasBadge.textContent = String(aulas.length);
}

function filterAulas(category, triggerEl = null) {
    currentFilter = category;

    // Actualizar botones
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    if(triggerEl) {
        triggerEl.classList.remove('bg-gray-200', 'text-gray-700');
        triggerEl.classList.add('active', 'bg-blue-600', 'text-white');
    } else {
        const fallbackButton = document.querySelector(`.category-btn[onclick*="'${category}'"]`);
        if(fallbackButton) {
            fallbackButton.classList.remove('bg-gray-200', 'text-gray-700');
            fallbackButton.classList.add('active', 'bg-blue-600', 'text-white');
        }
    }

    renderAulas();
}

function openAddClassModal() {
    const modal = document.getElementById('addClassModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    trapFocus(modal);
}

function closeAddClassModal() {
    const modal = document.getElementById('addClassModal');
    releaseFocus(modal);
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('pdfFileName').textContent = 'Ningún archivo seleccionado';
}

// Manejo de PDFs
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if(files.length > 0 && files[0].type === 'application/pdf') {
        processPDF(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if(file) processPDF(file);
}

async function processPDF(file) {
    document.getElementById('pdfFileName').textContent = file.name + ' (subiendo...)';
    window.currentPDF = file;
    window.currentPDFUrl = null;

    if(!supabaseClient || !currentUser?.id) {
        document.getElementById('pdfFileName').textContent = file.name;
        return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${currentUser.id}/${Date.now()}_${safeName}`;

    const { error } = await supabaseClient.storage
        .from('syllabi')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' });

    if(error) {
        console.error('Error subiendo PDF', error);
        document.getElementById('pdfFileName').textContent = file.name + ' (error al subir)';
        showToast('No se pudo subir el PDF a Storage.', 'warning');
        return;
    }

    const { data: urlData } = supabaseClient.storage.from('syllabi').getPublicUrl(path);
    window.currentPDFUrl = urlData?.publicUrl || null;
    document.getElementById('pdfFileName').textContent = file.name + ' ✓';
}

async function saveNewClass(e) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const colors = [
        "from-blue-500 to-cyan-400",
        "from-purple-500 to-pink-500",
        "from-pink-500 to-orange-400",
        "from-green-500 to-teal-400",
        "from-yellow-500 to-red-500"
    ];

    const newClass = {
        id: Date.now(),
        name: String(formData.get('className') || '').trim(),
        category: String(formData.get('category') || '').trim(),
        teacher: String(formData.get('teacher') || '').trim(),
        classroom: String(formData.get('classroom') || '').trim(),
        day: String(formData.get('day') || '').trim(),
        time: String(formData.get('time') || '').trim(),
        description: String(formData.get('description') || '').trim(),
        pdfName: window.currentPDF ? window.currentPDF.name : 'temario.pdf',
        pdfUrl: window.currentPDFUrl || null,
        color: colors[Math.floor(Math.random() * colors.length)]
    };

    try {
        await persistNewClass(newClass);
    } catch (error) {
        console.error('No se pudo guardar la clase', error);
        showToast(getDataErrorMessage(error, 'No se pudo guardar la clase.'), 'error');
        return;
    }

    renderAulas();
    renderUpcomingClasses();
    populateClassSelect();
    closeAddClassModal();
    e.target.reset();
    window.currentPDF = null;
    window.currentPDFUrl = null;

    showToast('Clase añadida correctamente.', 'success');
}

async function deleteClass(id) {
    if(confirm('Eliminar esta clase?')) {
        try {
            await persistDeleteClass(id);
        } catch (error) {
            console.error('No se pudo eliminar la clase', error);
            showToast(getDataErrorMessage(error, 'No se pudo eliminar la clase.'), 'error');
            return;
        }
        renderAulas();
        renderUpcomingClasses();
        populateClassSelect();
        showToast('Clase eliminada.', 'info');
    }
}

function viewSyllabus(id) {
    const aula = aulas.find(a => a.id === id);
    if(!aula) { showToast('No se encontró la clase.', 'warning'); return; }

    document.getElementById('syllabusTitle').textContent = aula.name;
    document.getElementById('syllabusSubtitle').textContent = `Prof. ${aula.teacher} - ${aula.classroom}`;

    const viewer = document.getElementById('pdfViewer');
    const downloadBtn = document.getElementById('downloadPdfBtn');

    if(aula.pdfUrl) {
        downloadBtn.href = aula.pdfUrl;
        downloadBtn.download = aula.pdfName || 'temario.pdf';
        downloadBtn.classList.remove('opacity-50', 'pointer-events-none');
        viewer.innerHTML = `<iframe src="${aula.pdfUrl}" class="w-full min-h-[600px] rounded-lg" title="Temario PDF"></iframe>`;
    } else {
        downloadBtn.href = '#';
        downloadBtn.classList.add('opacity-50', 'pointer-events-none');
        viewer.innerHTML = `
            <div id="pdfPlaceholder" class="text-center p-8">
                <i class="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
                <p class="text-gray-600">Vista previa del PDF</p>
                <p class="text-sm text-gray-400 mt-2">${escapeHtml(aula.pdfName || 'temario.pdf')}</p>
                <p class="text-xs text-gray-400 mt-1">Edita la clase y sube un PDF para activar la vista previa.</p>
            </div>`;
    }

    const vsModal = document.getElementById('viewSyllabusModal');
    vsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    trapFocus(vsModal);
}

function closeViewSyllabusModal() {
    const modal = document.getElementById('viewSyllabusModal');
    releaseFocus(modal);
    modal.classList.remove('active');
    document.body.style.overflow = '';
}
