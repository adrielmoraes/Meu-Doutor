

import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;

try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountJson) {
            throw new Error(
                "A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida."
            );
        }
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase Admin] App Firebase Admin inicializado com sucesso.');
    } else {
        console.log('[Firebase Admin] App Firebase Admin já inicializado.');
    }
    db = admin.firestore();
} catch (error: any) {
    console.error(
        '[Firebase Admin] Falha ao inicializar o app Firebase Admin. As operações de servidor podem não funcionar. Detalhes:',
        error.message
    );
    // Mantém `db` como `null` se a inicialização falhar.
    db = null;
}

export { db };
