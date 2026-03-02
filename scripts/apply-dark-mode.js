/**
 * Script para aplicar classes dark: em todos os arquivos do dashboard do médico.
 * Executa substituições inteligentes respeitando o contexto das classes Tailwind.
 */
const fs = require('fs');
const path = require('path');

const FILES = [
    'src/app/doctor/page.tsx',
    'src/app/doctor/layout.tsx',
    'src/app/doctor/patients/page.tsx',
    'src/app/doctor/patients/[id]/page.tsx',
    'src/app/doctor/history/page.tsx',
    'src/app/doctor/profile/page.tsx',
    'src/app/doctor/schedule/page.tsx',
    'src/components/doctor/doctor-dashboard-improved.tsx',
    'src/components/doctor/patient-detail-view.tsx',
    'src/components/doctor/patient-timeline.tsx',
    'src/components/doctor/online-status-toggle.tsx',
    'src/components/doctor/prescription-modal.tsx',
    'src/components/doctor/soap-evolution-modal.tsx',
    'src/components/doctor/manage-availability.tsx',
    'src/components/doctor/schedule-calendar-manager.tsx',
    'src/components/doctor/diagnosis-macros.tsx',
    'src/components/doctor/patient-safety-bar.tsx',
    'src/components/layout/doctor-sidebar.tsx',
];

// Substituições de pares: [antes, depois]
// A ordem importa: mais específicas primeiro para evitar substituições duplas
const REPLACEMENTS = [
    // ─── Backgrounds principais ─────────────────────────────────────────────────
    [/\bbg-white\b(?! dark:)/g, 'bg-white dark:bg-slate-900'],
    [/\bbg-slate-50\b(?! dark:)/g, 'bg-slate-50 dark:bg-slate-950'],
    [/\bbg-slate-100\b(?! dark:)/g, 'bg-slate-100 dark:bg-slate-800'],
    [/\bbg-slate-200\b(?! dark:)/g, 'bg-slate-200 dark:bg-slate-700'],
    [/\bbg-gray-50\b(?! dark:)/g, 'bg-gray-50 dark:bg-gray-900'],
    [/\bbg-gray-100\b(?! dark:)/g, 'bg-gray-100 dark:bg-gray-800'],

    // ─── Textos ────────────────────────────────────────────────────────────────
    [/\btext-slate-900\b(?! dark:)/g, 'text-slate-900 dark:text-slate-50'],
    [/\btext-slate-800\b(?! dark:)/g, 'text-slate-800 dark:text-slate-100'],
    [/\btext-slate-700\b(?! dark:)/g, 'text-slate-700 dark:text-slate-200'],
    [/\btext-slate-600\b(?! dark:)/g, 'text-slate-600 dark:text-slate-300'],
    [/\btext-slate-500\b(?! dark:)/g, 'text-slate-500 dark:text-slate-400'],
    [/\btext-slate-400\b(?! dark:)/g, 'text-slate-400 dark:text-slate-500'],
    [/\btext-gray-900\b(?! dark:)/g, 'text-gray-900 dark:text-gray-50'],
    [/\btext-gray-800\b(?! dark:)/g, 'text-gray-800 dark:text-gray-100'],
    [/\btext-gray-600\b(?! dark:)/g, 'text-gray-600 dark:text-gray-300'],
    [/\btext-gray-500\b(?! dark:)/g, 'text-gray-500 dark:text-gray-400'],

    // ─── Bordas ────────────────────────────────────────────────────────────────
    [/\bborder-slate-100\b(?! dark:)/g, 'border-slate-100 dark:border-slate-800'],
    [/\bborder-slate-200\b(?! dark:)/g, 'border-slate-200 dark:border-slate-700'],
    [/\bborder-slate-300\b(?! dark:)/g, 'border-slate-300 dark:border-slate-600'],
    [/\bborder-gray-100\b(?! dark:)/g, 'border-gray-100 dark:border-gray-800'],
    [/\bborder-gray-200\b(?! dark:)/g, 'border-gray-200 dark:border-gray-700'],

    // ─── Rings ─────────────────────────────────────────────────────────────────
    [/\bring-slate-200\b(?! dark:)/g, 'ring-slate-200 dark:ring-slate-700'],
    [/\bring-slate-100\b(?! dark:)/g, 'ring-slate-100 dark:ring-slate-800'],

    // ─── Dividers/Separators ───────────────────────────────────────────────────
    [/\bdivide-slate-100\b(?! dark:)/g, 'divide-slate-100 dark:divide-slate-800'],
    [/\bdivide-slate-200\b(?! dark:)/g, 'divide-slate-200 dark:divide-slate-700'],

    // ─── Hover states ──────────────────────────────────────────────────────────
    [/\bhover:bg-slate-50\b(?! dark:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800'],
    [/\bhover:bg-slate-100\b(?! dark:)/g, 'hover:bg-slate-100 dark:hover:bg-slate-700'],
    [/\bhover:bg-gray-50\b(?! dark:)/g, 'hover:bg-gray-50 dark:hover:bg-gray-800'],
    [/\bhover:text-slate-900\b(?! dark:)/g, 'hover:text-slate-900 dark:hover:text-slate-50'],
    [/\bhover:text-slate-700\b(?! dark:)/g, 'hover:text-slate-700 dark:hover:text-slate-200'],

    // ─── Badges / Pill backgrounds especiais ───────────────────────────────────
    [/\bbg-slate-50\/80\b(?! dark:)/g, 'bg-slate-50/80 dark:bg-slate-800/80'],
    [/\bbg-white\/90\b(?! dark:)/g, 'bg-white/90 dark:bg-slate-900/90'],
    [/\bbg-white\/80\b(?! dark:)/g, 'bg-white/80 dark:bg-slate-900/80'],
    [/\bbg-white\/60\b(?! dark:)/g, 'bg-white/60 dark:bg-slate-900/60'],

    // ─── Placeholders ──────────────────────────────────────────────────────────
    [/\bplaceholder:text-slate-400\b(?! dark:)/g, 'placeholder:text-slate-400 dark:placeholder:text-slate-500'],

    // ─── Specific component colors ─────────────────────────────────────────────
    [/\bbg-amber-50\b(?! dark:)/g, 'bg-amber-50 dark:bg-amber-950\/30'],
    [/\bbg-red-50\b(?! dark:)/g, 'bg-red-50 dark:bg-red-950\/30'],
    [/\bbg-green-50\b(?! dark:)/g, 'bg-green-50 dark:bg-green-950\/30'],
    [/\bbg-blue-50\b(?! dark:)/g, 'bg-blue-50 dark:bg-blue-950\/30'],
    [/\bbg-purple-50\b(?! dark:)/g, 'bg-purple-50 dark:bg-purple-950\/30'],
    [/\bbg-orange-50\b(?! dark:)/g, 'bg-orange-50 dark:bg-orange-950\/30'],
    [/\bbg-teal-50\b(?! dark:)/g, 'bg-teal-50 dark:bg-teal-950\/30'],
    [/\bbg-cyan-50\b(?! dark:)/g, 'bg-cyan-50 dark:bg-cyan-950\/30'],
    [/\bborder-amber-200\b(?! dark:)/g, 'border-amber-200 dark:border-amber-800'],
    [/\bborder-red-200\b(?! dark:)/g, 'border-red-200 dark:border-red-800'],
    [/\bborder-green-200\b(?! dark:)/g, 'border-green-200 dark:border-green-800'],
    [/\bborder-blue-200\b(?! dark:)/g, 'border-blue-200 dark:border-blue-800'],

    // ─── Input bordas ──────────────────────────────────────────────────────────
    [/\bborder-input\b(?! dark:)/g, 'border-input dark:border-slate-700'],
];

let totalChanges = 0;

for (const relPath of FILES) {
    const fullPath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) {
        console.log(`[SKIP] ${relPath} (não encontrado)`);
        continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let fileChanges = 0;

    for (const [pattern, replacement] of REPLACEMENTS) {
        const before = content;
        content = content.replace(pattern, replacement);
        if (content !== before) {
            const matches = (before.match(pattern) || []).length;
            fileChanges += matches;
        }
    }

    if (fileChanges > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[OK] ${relPath} — ${fileChanges} substituição(ões)`);
        totalChanges += fileChanges;
    } else {
        console.log(`[--] ${relPath} — sem alterações`);
    }
}

console.log(`\n✅ Total: ${totalChanges} substituições em ${FILES.length} arquivos processados.`);
