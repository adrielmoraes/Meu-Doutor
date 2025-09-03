/**
 * Adaptador para o Firebase Admin
 * Contém funções para inicialização e acesso ao Firestore
 */

const admin = require('firebase-admin');

let adminDb = null;

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
        
        // Log para depuração - Parte 1: Verificando se a string está presente
        console.log('[Firebase Admin] Conteúdo da FIREBASE_SERVICE_ACCOUNT_KEY (string):', serviceAccountJson ? 'Definido (tamanho: ' + serviceAccountJson.length + ')' : 'Não definido');

        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountJson);
            // Log para depuração - Parte 2: Verificando se o JSON foi parseado com sucesso
            console.log('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY (objeto parseado):', serviceAccount ? 'Objeto JSON válido' : 'Falha ao parsear');
            // Log para depuração - Parte 3: Detalhes do objeto serviceAccount (sem a chave privada)
            const { private_key, ...saWithoutKey } = serviceAccount; // Omitindo a chave privada por segurança
            console.log('[Firebase Admin] Detalhes da Conta de Serviço:', saWithoutKey);

        } catch (e) {
            console.error('[Firebase Admin] Erro ao analisar FIREBASE_SERVICE_ACCOUNT_KEY. Detalhes:', e);
            throw new Error("Falha ao analisar FIREBASE_SERVICE_ACCOUNT_KEY. Verifique se é um JSON válido. Copie o conteúdo completo do arquivo de chave de serviço.");
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        console.log('[Firebase Admin] App Firebase Admin inicializado com sucesso.');
        adminDb = admin.firestore();

    } catch (error) {
        console.error('[Firebase Admin] Falha ao inicializar o app Firebase Admin. Detalhes:', error.message);
        throw new Error("A inicialização do Firebase Admin falhou: " + error.message);
    }
    
    return adminDb;
};

function getAdminDb() {
    return initializeFirebaseAdmin();
}

module.exports = { getAdminDb };