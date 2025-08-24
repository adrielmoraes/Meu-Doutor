import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
} catch (error) {
  console.error(
    '[Firebase Admin] Erro ao processar a FIREBASE_SERVICE_ACCOUNT_KEY. Certifique-se de que a variável de ambiente contém um JSON válido. Detalhes:',
    error
  );
  serviceAccount = undefined;
}


if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    console.warn("[Firebase Admin] A conta de serviço não foi inicializada. As operações de administrador não funcionarão.");
  }
}

export const db = admin.apps.length ? admin.firestore() : null;
