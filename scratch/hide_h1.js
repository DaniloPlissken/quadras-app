const fs = require('fs');
const files = [
  'src/app/admin/reservas/page.tsx',
  'src/app/admin/agenda-semanal/page.tsx',
  'src/app/admin/quadras/page.tsx',
  'src/app/admin/times/page.tsx',
  'src/app/admin/calendario/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<h1 className="text-3xl font-bold text-slate-800">/g, '<h1 className="hidden md:block text-3xl font-bold text-slate-800">');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
