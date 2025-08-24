// This script is used to seed the database with initial data.
// It is intended to be run from the command line.
// Usage: `npm run db:seed`

import { seedDatabase } from './src/lib/seed';

// We need to suppress the "no-floating-promises" rule here because
// this is a top-level script and we want it to run asynchronously without
// being part of a larger promise chain. The `then` and `catch` blocks
// handle the asynchronous nature of the `seedDatabase` function appropriately.
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
    console.log('🌱 Iniciando o processo de seeding do banco de dados...');
    try {
        await seedDatabase();
        console.log('✅ Banco de dados populado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao popular o banco de dados:', error);
        process.exit(1);
    }
})();
