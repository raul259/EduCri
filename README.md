# EduCri

EduCri es una app web para gestión educativa con control por roles:
- `profesor`: dashboard, asistencia, notificaciones, perfil
- `moderador`: todo lo de profesor + validación de profesores, gestión de alumnos y tareas

## Stack Tecnológico
- HTML/CSS/JS (sin framework)
- Supabase (Auth + Postgres + RLS)
- Vercel (hosting estático)

## Estructura del Proyecto
- `educri.html`: interfaz principal + lógica de integración
- `supabase_schema.sql`: esquema de BD, políticas RLS, triggers y vista auxiliar
- `auth.js`: utilidades/validaciones de autenticación
- `moderator.js`: utilidades de filtrado/paginación
- `attendance.js`: utilidades de asistencia
- `tests/`: tests mínimos de lógica (`node:test`)
- `config.js.example`: plantilla de configuración (no subir claves reales)

## Configuración Local
1. Copia la plantilla:
   - `config.js.example` -> `config.js`
2. Completa valores reales en `config.js`:
```js
window.__EDUCRI_CONFIG__ = {
  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'TU_SUPABASE_ANON_KEY'
};
```
3. Ejecuta un servidor estático:
```bash
npx serve .
```
4. Abre la URL que muestre el servidor (por ejemplo `http://localhost:3000`).

## Configuración de Supabase
1. Abre Supabase SQL Editor.
2. Ejecuta completo `supabase_schema.sql`.
3. En configuración de URLs de Auth:
   - Agrega URL local: `http://localhost:3000/*` (o tu URL de desarrollo)
   - Luego agrega la URL de Vercel

## Convertir un Usuario en `moderador`
Ejecuta en SQL Editor (reemplaza correo):
```sql
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"moderador"}'::jsonb
where lower(email) = lower('tu_correo@ejemplo.com');
```
Después cierra sesión y vuelve a entrar para refrescar claims del JWT.

## Tests
Ejecutar tests mínimos:
```bash
node --test tests/educri-logic.test.mjs
```

## Despliegue en Vercel
1. Asegúrate de que `config.js` **no esté versionado** (`.gitignore` ya lo ignora).
2. Haz commit de los archivos del proyecto.
3. Despliega en Vercel.
4. En Supabase Auth URL settings:
   - `Site URL`: `https://tu-app.vercel.app`
   - `Redirect URLs`: `https://tu-app.vercel.app/*`


## Funcionalidades Actuales
- Registro de profesor con validaciones:
  - nombre completo, fecha de nacimiento, teléfono E.164, CDS, checkbox Espíritu Santo, experiencia docente
- Panel moderador:
  - aprobar/rechazar profesores
  - añadir alumnos
  - asignar tareas a profesores
  - ver resumen de asistencia por profesor
- Asistencia y tareas conectadas a Supabase
- Notificaciones dinámicas con datos reales
