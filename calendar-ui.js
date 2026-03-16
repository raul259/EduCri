// calendar-ui.js — Calendario académico (UI)

function renderMainCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    document.getElementById('calendarMonthYear').textContent =
        new Date(year, month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendar = document.getElementById('mainCalendar');
    calendar.innerHTML = '';

    // Días vacíos
    for(let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'bg-white h-24 p-2';
        calendar.appendChild(empty);
    }

    // Días del mes
    for(let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayElement = document.createElement('div');
        dayElement.className = 'bg-white h-24 p-2 border-t border-l border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors relative calendar-day';

        const isToday = date.toDateString() === new Date().toDateString();
        const hasEvent = checkEventsForDate(date);

        if(isToday) {
            dayElement.classList.add('bg-blue-50', 'font-bold');
        }

        if(hasEvent) {
            dayElement.classList.add('has-event');
        }

        dayElement.innerHTML = `
            <span class="${isToday ? 'w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center' : ''}">${day}</span>
        `;

        dayElement.onclick = () => selectDate(date);
        calendar.appendChild(dayElement);
    }
}

function renderMiniCalendar() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const calendar = document.getElementById('miniCalendar');
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

    calendar.innerHTML = days.map(d =>
        `<div class="text-gray-400 font-semibold py-2">${d}</div>`
    ).join('');

    for(let i = 0; i < firstDay; i++) {
        calendar.innerHTML += '<div></div>';
    }

    for(let day = 1; day <= daysInMonth; day++) {
        const isToday = day === now.getDate();
        calendar.innerHTML += `
            <div class="${isToday ? 'bg-gradient-to-br from-blue-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto shadow-md' : 'text-gray-700 py-1'}">
                ${day}
            </div>
        `;
    }
}

function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderMainCalendar();
}

function selectDate(date) {
    selectedDate = date;
    document.getElementById('selectedDate').textContent = date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Mostrar eventos del día
    const events = getEventsForDate(date);
    const container = document.getElementById('dayEvents');

    if(events.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay eventos para este día</p>';
    } else {
        container.innerHTML = events.map(event => `
            <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <i class="fas fa-book"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800">${escapeHtml(event.name)}</h4>
                    <p class="text-sm text-gray-500">${escapeHtml(event.time)} - ${escapeHtml(event.classroom)}</p>
                </div>
            </div>
        `).join('');
    }
}

function checkEventsForDate(date) {
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    return aulas.some(a => a.day.toLowerCase() === dayName.toLowerCase());
}

function getEventsForDate(date) {
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    return aulas.filter(a => a.day.toLowerCase() === dayName.toLowerCase());
}
