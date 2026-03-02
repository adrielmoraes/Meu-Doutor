/**
 * Script para ajustes finais: corrige elementos sem dark: no dashboard do médico.
 */
const fs = require('fs');

const files = [
    'src/components/doctor/doctor-dashboard-improved.tsx',
    'src/app/doctor/patients/page.tsx',
    'src/components/doctor/patient-detail-view.tsx',
    'src/app/doctor/history/page.tsx',
    'src/app/doctor/profile/page.tsx',
    'src/app/doctor/schedule/page.tsx',
    'src/components/doctor/prescription-modal.tsx',
    'src/components/doctor/schedule-calendar-manager.tsx',
];

const fixes = [
    // divide-y sem dark:
    [/\bdivide-slate-50\b(?! dark:)/g, 'divide-slate-50 dark:divide-slate-800'],
    [/\bdivide-slate-100\b(?! dark:)/g, 'divide-slate-100 dark:divide-slate-800'],
    // verde/emerald e outras cores sem dark:
    [/\bbg-emerald-50\/20\b(?! dark:)/g, 'bg-emerald-50/20 dark:bg-emerald-950/10'],
    [/\bbg-emerald-50\b(?! dark:)/g, 'bg-emerald-50 dark:bg-emerald-950\/30'],
    [/\bbg-violet-50\b(?! dark:)/g, 'bg-violet-50 dark:bg-violet-950\/30'],
    [/\bbg-indigo-50\b(?! dark:)/g, 'bg-indigo-50 dark:bg-indigo-950\/30'],
    [/\bbg-rose-50\b(?! dark:)/g, 'bg-rose-50 dark:bg-rose-950\/30'],
    [/\bbg-yellow-50\b(?! dark:)/g, 'bg-yellow-50 dark:bg-yellow-950\/30'],
    // hover states para atividade recente
    [/\bhover:bg-slate-50 dark:hover:bg-slate-800\b(?! dark:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800'],
    // text colors específicos que podem ter ficado
    [/\btext-slate-300\b(?! dark:)(?![\/])/g, 'text-slate-300 dark:text-slate-600'],
    // bg-slate-950\/50 checks
    [/\bhover:bg-slate-50 dark:bg-slate-950\/50\b/g, 'hover:bg-slate-50 dark:hover:bg-slate-800/50'],
];

let total = 0;
for (const f of files) {
    if (!require('fs').existsSync(f)) { console.log('SKIP: ' + f); continue; }
    let content = fs.readFileSync(f, 'utf8');
    const before = content;
    for (const [pat, rep] of fixes) {
        content = content.replace(pat, rep);
    }
    if (content !== before) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed: ' + f);
        total++;
    }
}
console.log('Done: ' + total + ' files');
