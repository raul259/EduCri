// profile-ui.js — Perfil del Profesor

function getTeacherProfileFromMetadata(user = currentUser) {
    const metadata = user?.user_metadata || {};
    return {
        full_name: String(metadata.full_name || '').trim(),
        birth_date: String(metadata.birth_date || '').trim(),
        phone: String(metadata.phone || '').trim(),
        has_cds: Boolean(metadata.has_cds),
        received_holy_spirit: Boolean(metadata.received_holy_spirit),
        teaching_experience: String(metadata.teaching_experience || '').trim()
    };
}

function renderTeacherProfileForm() {
    const profile = getTeacherProfileFromMetadata();
    const fullNameInput = document.getElementById('profileFullName');
    const birthDateInput = document.getElementById('profileBirthDate');
    const phoneInput = document.getElementById('profilePhone');
    const hasCdsInput = document.getElementById('profileHasCds');
    const holySpiritInput = document.getElementById('profileHolySpirit');
    const experienceInput = document.getElementById('profileExperience');

    if(fullNameInput) fullNameInput.value = profile.full_name;
    if(birthDateInput) birthDateInput.value = profile.birth_date;
    if(phoneInput) phoneInput.value = profile.phone;
    if(hasCdsInput) hasCdsInput.checked = profile.has_cds;
    if(holySpiritInput) holySpiritInput.checked = profile.received_holy_spirit;
    if(experienceInput) experienceInput.value = profile.teaching_experience;
}

function updateHeaderProfileDisplay() {
    const profile = getTeacherProfileFromMetadata();
    const name = profile.full_name || currentUser?.email || 'Usuario';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;

    const desktopName = document.getElementById('desktopUserName');
    const desktopRole = document.getElementById('desktopUserRole');
    const desktopAvatar = document.getElementById('desktopUserAvatar');

    if(desktopName) desktopName.textContent = name;
    if(desktopRole) desktopRole.textContent = currentRole === 'moderador' ? 'Moderador' : 'Profesor';
    if(desktopAvatar) desktopAvatar.src = avatarUrl;
}

async function saveTeacherProfile(e) {
    e.preventDefault();
    if(!currentUser) {
        showToast('Debes iniciar sesión para editar tu perfil.', 'warning');
        return;
    }

    const fullName = document.getElementById('profileFullName')?.value.trim() || '';
    const birthDate = document.getElementById('profileBirthDate')?.value || '';
    const phone = document.getElementById('profilePhone')?.value.trim() || '';
    const hasCds = Boolean(document.getElementById('profileHasCds')?.checked);
    const receivedHolySpirit = Boolean(document.getElementById('profileHolySpirit')?.checked);
    const teachingExperience = document.getElementById('profileExperience')?.value.trim() || '';

    if(fullName.length < 6) {
        showToast('Completa tu nombre y apellidos.', 'warning');
        return;
    }
    if(!birthDate) {
        showToast('Completa tu fecha de nacimiento.', 'warning');
        return;
    }
    if(!hasMinimumAge(birthDate, 18)) {
        showToast('El perfil requiere mayoría de edad (18+).', 'warning');
        return;
    }
    if(!isValidE164Phone(phone)) {
        showToast('Usa teléfono en formato E.164 (ej: +34600111222).', 'warning');
        return;
    }
    if(teachingExperience.length < 10) {
        showToast('Describe tu experiencia previa para la enseñanza.', 'warning');
        return;
    }

    const profileData = {
        ...currentUser.user_metadata,
        role: currentRole,
        full_name: fullName,
        birth_date: birthDate,
        phone,
        has_cds: hasCds,
        received_holy_spirit: receivedHolySpirit,
        teaching_experience: teachingExperience
    };

    if(!supabaseClient) {
        currentUser = { ...currentUser, user_metadata: profileData };
        updateHeaderProfileDisplay();
        renderTeacherProfileForm();
        showToast('Perfil guardado en modo local.', 'success');
        return;
    }

    const { data, error } = await supabaseClient.auth.updateUser({ data: profileData });
    if(error) {
        console.error('Error actualizando perfil', error);
        showToast(getDataErrorMessage(error, 'No se pudo actualizar el perfil.'), 'error');
        return;
    }

    currentUser = data.user || { ...currentUser, user_metadata: profileData };
    updateHeaderProfileDisplay();
    renderTeacherProfileForm();
    showToast('Perfil actualizado correctamente.', 'success');
}
