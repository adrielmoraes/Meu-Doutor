
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb: FirebaseFirestore.Firestore | null = null;

const initializeFirebaseAdmin = () => {
  // Reutiliza a instância se já estiver inicializada
  if (getApps().length > 0) {
    if (!adminDb) adminDb = getFirestore();
    return adminDb;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error(
        'A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida. Por favor, adicione-a ao seu arquivo .env.'
      );
    }

    // Parse seguro da chave de serviço
    let parsed: any;
    try {
      parsed = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error(
        'Falha ao analisar FIREBASE_SERVICE_ACCOUNT_KEY. Verifique se é um JSON válido.'
      );
    }

    // Extrai campos necessários e normaliza a privateKey (\n -> quebra de linha real)
    const projectId = parsed.project_id || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = parsed.client_email || process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = (parsed.private_key || process.env.FIREBASE_PRIVATE_KEY) as string | undefined;

    // Normaliza a privateKey (\n -> quebra de linha real)
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      console.warn('[Firebase Admin] Credenciais explícitas ausentes. Tentando applicationDefault(). Configure FIREBASE_SERVICE_ACCOUNT_KEY ou GOOGLE_APPLICATION_CREDENTIALS.');
      initializeApp({
        credential: applicationDefault(),
      });
    }

    adminDb = getFirestore();
    return adminDb;
  } catch (error: any) {
    // Log controlado sem vazar chaves
    console.error('[Firebase Admin] Falha ao inicializar o app Firebase Admin. Detalhes:', error?.message || error);
    throw new Error('A inicialização do Firebase Admin falhou: ' + (error?.message || error));
  }
};

export const getAdminDb = () => {
  return adminDb || initializeFirebaseAdmin();
};
