// auth-ui.js — Autenticación (UI)

function showLoginScreen() {
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
}

function setAuthMode(mode) {
    authMode = mode === 'register' ? 'register' : 'login';
    const submitBtn = document.getElementById('authSubmitBtn');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitchLink');
    const confirmWrap = document.getElementById('confirmPasswordWrap');
    const confirmInput = document.getElementById('confirmPasswordInput');
    const teacherFieldsWrap = document.getElementById('teacherRegisterFields');
    const registerFullName = document.getElementById('registerFullName');
    const registerBirthDate = document.getElementById('registerBirthDate');
    const registerPhone = document.getElementById('registerPhone');
    const registerExperience = document.getElementById('registerExperience');

    if(submitBtn) {
        submitBtn.textContent = authMode === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión';
    }

    if(confirmWrap && confirmInput) {
        if(authMode === 'register') {
            confirmWrap.classList.remove('hidden');
            confirmInput.required = true;
        } else {
            confirmWrap.classList.add('hidden');
            confirmInput.required = false;
            confirmInput.value = '';
        }
    }

    if(teacherFieldsWrap) {
        if(authMode === 'register') {
            teacherFieldsWrap.classList.remove('hidden');
            if(registerFullName) registerFullName.required = true;
            if(registerBirthDate) registerBirthDate.required = true;
            if(registerPhone) registerPhone.required = true;
            if(registerExperience) registerExperience.required = true;
        } else {
            teacherFieldsWrap.classList.add('hidden');
            if(registerFullName) registerFullName.required = false;
            if(registerBirthDate) registerBirthDate.required = false;
            if(registerPhone) registerPhone.required = false;
            if(registerExperience) registerExperience.required = false;
        }
    }

    if(switchText && switchLink) {
        if(authMode === 'register') {
            switchText.textContent = '¿Ya tienes cuenta?';
            switchLink.textContent = 'Inicia sesión';
        } else {
            switchText.textContent = '¿No tienes cuenta?';
            switchLink.textContent = 'Regístrate';
        }
    }
}

function toggleAuthMode(e) {
    if(e) e.preventDefault();
    setAuthMode(authMode === 'login' ? 'register' : 'login');
}

async function handleEmailLogin(e) {
    e.preventDefault();
    if(!supabaseClient) {
        showToast('Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY.', 'error');
        return;
    }

    const form = e.target;
    const email = form.querySelector('#emailInput').value.trim().toLowerCase();
    const password = form.querySelector('#passwordInput').value;
    const confirmPassword = form.querySelector('#confirmPasswordInput')?.value || '';

    if(!isValidEmail(email)) {
        showToast('Ingresa un correo válido.', 'warning');
        return;
    }

    const suggestedEmail = getEmailTypoSuggestion(email);
    if(suggestedEmail) {
        showToast(`Revisa tu correo. ¿Quisiste escribir ${suggestedEmail}?`, 'warning');
        return;
    }

    if(authMode === 'register') {
        const fullName = form.querySelector('#registerFullName')?.value.trim() || '';
        const birthDate = form.querySelector('#registerBirthDate')?.value || '';
        const phone = form.querySelector('#registerPhone')?.value.trim() || '';
        const hasCds = Boolean(form.querySelector('#registerHasCds')?.checked);
        const receivedHolySpirit = Boolean(form.querySelector('#registerHolySpirit')?.checked);
        const teachingExperience = form.querySelector('#registerExperience')?.value.trim() || '';

        if(fullName.length < 6) {
            showToast('Escribe nombre completo con apellidos.', 'warning');
            return;
        }
        if(!birthDate) {
            showToast('Selecciona tu fecha de nacimiento.', 'warning');
            return;
        }
        if(!hasMinimumAge(birthDate, 18)) {
            showToast('Debes ser mayor de 18 años para registrarte.', 'warning');
            return;
        }
        if(!isValidE164Phone(phone)) {
            showToast('El teléfono debe estar en formato internacional E.164 (ej: +34600111222).', 'warning');
            return;
        }
        if(teachingExperience.length < 10) {
            showToast('Describe tu experiencia previa para la enseñanza.', 'warning');
            return;
        }

        if(password.length < 8) {
            showToast('La contraseña debe tener al menos 8 caracteres.', 'warning');
            return;
        }
        if(!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            showToast('La contraseña debe incluir mayúscula, minúscula y número.', 'warning');
            return;
        }
        if(password !== confirmPassword) {
            showToast('Las contraseñas no coinciden.', 'warning');
            return;
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'profesor',
                    full_name: fullName,
                    birth_date: birthDate,
                    phone,
                    has_cds: hasCds,
                    received_holy_spirit: receivedHolySpirit,
                    teaching_experience: teachingExperience
                }
            }
        });
        if(error) {
            console.error('Error en registro por email', error);
            showToast(getAuthErrorMessage(error, 'register'), 'error');
            return;
        }

        if(data.session?.user) {
            currentUser = data.session.user;
            completeLogin();
            await loadAulasFromStorage();
            await loadTeacherProfilesFromStorage();
            await loadStudentsFromStorage();
            await loadModeratorAssignmentsFromStorage();
            refreshUIData();
            setupRealtimeSubscriptions();
            return;
        }

        showToast('Cuenta creada. Revisa tu correo para confirmar.', 'success');
        e.target.reset();
        setAuthMode('login');
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if(error) {
        console.error('Error en login por email', error);
        showToast(getAuthErrorMessage(error, 'login'), 'error');
        return;
    }

    currentUser = data.user;
    completeLogin();
    await loadAulasFromStorage();
    await loadTeacherProfilesFromStorage();
    await loadStudentsFromStorage();
    await loadModeratorAssignmentsFromStorage();
    refreshUIData();
    setupRealtimeSubscriptions();
}

function completeLogin(showWelcome = true) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    const userInfo = document.getElementById('userInfo');
    userInfo.textContent = '';
    refreshRoleAccessUI();

    const nameEl = document.createElement('p');
    nameEl.className = 'font-semibold text-white';
    nameEl.textContent = currentUser?.user_metadata?.full_name || currentUser?.email || 'Usuario';

    const emailEl = document.createElement('p');
    emailEl.className = 'text-xs text-gray-400';
    emailEl.textContent = currentUser?.email || '';

    userInfo.appendChild(nameEl);
    userInfo.appendChild(emailEl);
    updateHeaderProfileDisplay();
    renderTeacherProfileForm();
    renderStudentsList();
    renderTeacherApprovals();
    renderAssignmentsList();
    renderAttendanceByTeacher();
    if(showWelcome) showToast('Bienvenido a EduCri.', 'success');
}

async function logout() {
    if(confirm('Deseas cerrar sesion?')) {
        if(supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        location.reload();
    }
}
