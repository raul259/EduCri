const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

const config = `window.__EDUCRI_CONFIG__ = {
  SUPABASE_URL: '${url}',
  SUPABASE_ANON_KEY: '${key}'
};\n`;

fs.writeFileSync('public/config.js', config);
console.log('config.js generado para producción');
