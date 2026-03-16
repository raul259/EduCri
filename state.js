// state.js — Estado global y configuración de Supabase

let currentUser = null;
const SUPABASE_URL = window.EDUCRI_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.EDUCRI_SUPABASE_ANON_KEY || '';
const hasSupabaseConfig = SUPABASE_URL.length > 0
    && SUPABASE_ANON_KEY.length > 0
    && typeof window.supabase !== 'undefined';
const supabaseClient = hasSupabaseConfig
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const DEFAULT_AULAS = [
    {
        id: 1,
        name: 'Corderitos',
        category: 'corderitos',
        teacher: 'Prof. Cordero',
        classroom: 'Sala C1',
        day: 'Lunes',
        time: '09:00',
        description: 'Clase base del grupo Corderitos',
        pdfName: 'temario_corderitos.pdf',
        pdfData: null,
        color: 'from-blue-500 to-cyan-400'
    },
    {
        id: 2,
        name: 'Soldaditos',
        category: 'soldaditos',
        teacher: 'Prof. Valiente',
        classroom: 'Sala S1',
        day: 'Miércoles',
        time: '14:00',
        description: 'Clase base del grupo Soldaditos',
        pdfName: 'temario_soldaditos.pdf',
        pdfData: null,
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 3,
        name: 'Vencedores',
        category: 'vencedores',
        teacher: 'Prof. Victoria',
        classroom: 'Sala V1',
        day: 'Viernes',
        time: '11:00',
        description: 'Clase base del grupo Vencedores',
        pdfName: 'temario_vencedores.pdf',
        pdfData: null,
        color: 'from-pink-500 to-orange-400'
    }
];

let aulas = [];
let attendance = safeParseJSON('educri_attendance', {});
let currentMonth = new Date();
let selectedDate = new Date();
let currentFilter = 'todas';
let authMode = 'login';
let currentRole = 'profesor';
let students = safeParseJSON('educri_students', []);
let moderatorAssignments = safeParseJSON('educri_assignments', []);
let teacherProfiles = safeParseJSON('educri_teacher_profiles', []);
let dismissedNotifications = safeParseJSON('educri_dismissed_notifications', []);
let currentAttendanceEntries = {};
let currentAttendanceStudents = [];
let studentsTotalCount = 0;
let studentsPage = 1;
let studentsPageSize = 6;
let studentsSearch = '';
let assignmentsPage = 1;
let assignmentsPageSize = 6;
let assignmentsSearch = '';
