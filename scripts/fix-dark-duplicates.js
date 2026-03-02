const fs = require('fs');
const files = [
    'src/components/doctor/doctor-dashboard-improved.tsx',
    'src/app/doctor/patients/page.tsx',
    'src/components/doctor/patient-detail-view.tsx',
    'src/components/doctor/prescription-modal.tsx',
    'src/components/doctor/schedule-calendar-manager.tsx',
    'src/app/doctor/history/page.tsx',
    'src/app/doctor/profile/page.tsx',
    'src/app/doctor/schedule/page.tsx',
];

let total = 0;
for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    const before = content;
    // Remove duplicated dark: classes like "dark:text-slate-400 dark:text-slate-500"
    content = content.replace(/dark:text-slate-\d+ dark:text-slate-\d+/g, function (m) {
        return m.split(' ')[0]; // keep first dark: occurrence
    });
    content = content.replace(/dark:bg-slate-\d+ dark:bg-slate-\d+/g, function (m) {
        return m.split(' ')[0];
    });
    if (content !== before) {
        fs.writeFileSync(f, content, 'utf8');
        console.log('Fixed: ' + f);
        total++;
    }
}
console.log('Total fixed: ' + total + ' files');
