
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage'; // Importar apenas getStorage

let adminDb: FirebaseFirestore.Firestore | null = null;
let adminAuth: any | null = null;
let adminStorage: any | null = null;

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    if (!adminDb) adminDb = getFirestore();
    if (!adminAuth) adminAuth = getAuth();
    if (!adminStorage) adminStorage = getStorage();
    return adminDb;
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountJson) {
      throw new Error(
        'A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida. Por favor, adicione-a ao seu arquivo .env.'
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error(
        'Falha ao analisar FIREBASE_SERVICE_ACCOUNT_KEY. Verifique se é um JSON válido.'
      );
    }

    const projectId = parsed.project_id || process.env.FIREBASE_PROJECT_ID;
    const clientEmail = parsed.client_email || process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = (parsed.private_key || process.env.FIREBASE_PRIVATE_KEY) as string | undefined;

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    if (clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      console.warn('[Firebase Admin] Credenciais explícitas ausentes. Tentando applicationDefault(). Configure FIREBASE_SERVICE_ACCOUNT_KEY ou GOOGLE_APPLICATION_CREDENTIALS.');
      initializeApp({
        credential: applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    adminDb = getFirestore();
    adminAuth = getAuth();
    adminStorage = getStorage();
    return adminDb;
  } catch (error: any) {
    console.error('[Firebase Admin] Falha ao inicializar o app Firebase Admin. Detalhes:', error?.message || error);
    throw new Error('A inicialização do Firebase Admin falhou: ' + (error?.message || error));
  }
};

export const getAdminDb = () => {
  return adminDb || initializeFirebaseAdmin();
};

export const getAdminAuth = () => {
  initializeFirebaseAdmin(); 
  return adminAuth;
};

export const getAdminStorage = () => {
    initializeFirebaseAdmin();
    return adminStorage;
};

export const uploadFileToStorage = async (fileBuffer: Buffer, filePath: string, contentType: string): Promise<string> => {
    initializeFirebaseAdmin();
    const bucket = getStorage().bucket(); // CORREÇÃO: Chamar getStorage().bucket()
    const file = bucket.file(filePath);

    await file.save(fileBuffer, {
        metadata: { contentType },
        public: true,
        predefinedAcl: 'publicRead',
    });

    return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
};
