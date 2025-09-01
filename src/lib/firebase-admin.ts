
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
            throw new Error("A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida. Por favor, adicione-a ao seu arquivo .env.");
        }
        
        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson);
        } catch (e) {
            throw new Error("Falha ao analisar FIREBASE_SERVICE_ACCOUNT_KEY. Verifique se é um JSON válido. Copie o conteúdo completo do arquivo de chave de serviço.");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        console.log('[Firebase Admin] App Firebase Admin inicializado com sucesso.');
        adminDb = admin.firestore();

    } catch (error: any) {
        console.error('[Firebase Admin] Falha ao inicializar o app Firebase Admin. Detalhes:', error.message);
        throw new Error("A inicialização do Firebase Admin falhou: " + error.message);
    }
    
    return adminDb;
};

export const getAdminDb = () => {
    return adminDb || initializeFirebaseAdmin();
};
