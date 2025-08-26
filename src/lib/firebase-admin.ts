
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | null = null;

const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        if (adminDb) {
            return adminDb;
        }
        adminDb = admin.firestore();
        return adminDb;
    }

    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountJson) {
            throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.");
        }
        
        // Verifique se o JSON não está vazio ou malformado
        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson);
        } catch (e) {
            throw new Error("Falha ao analisar FIREBASE_SERVICE_ACCOUNT_KEY. Verifique se é um JSON válido.");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        console.log('[Firebase Admin] App Firebase Admin inicializado com sucesso.');
        adminDb = admin.firestore();

    } catch (error: any) {
        console.error('[Firebase Admin] Falha ao inicializar o app Firebase Admin. Detalhes:', error.message);
        // Lançar o erro impede que a aplicação continue em um estado quebrado.
        throw new Error("A inicialização do Firebase Admin falhou: " + error.message);
    }
    
    return adminDb;
};

// Esta é a função que será importada por outros arquivos do servidor.
// Ela garante que a inicialização tenha ocorrido antes de retornar o db.
export const getAdminDb = () => {
    return adminDb || initializeFirebaseAdmin();
};
