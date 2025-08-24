
import * as admin from 'firebase-admin';

let serviceAccount: admin.ServiceAccount | undefined;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const parsedJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    // Ensure the parsed object has the necessary properties before assigning
    if (parsedJson.project_id && parsedJson.private_key && parsedJson.client_email) {
      serviceAccount = parsedJson;
    } else {
      throw new Error("O JSON da conta de serviço não contém as propriedades necessárias (project_id, private_key, client_email).");
    }
  }
} catch (error) {
  console.error(
    '[Firebase Admin] Erro ao processar a FIREBASE_SERVICE_ACCOUNT_KEY. Certifique-se de que a variável de ambiente contém um JSON válido. Detalhes:',
    error
  );
  serviceAccount = undefined;
}


if (!admin.apps.length && serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("[Firebase Admin] Falha ao inicializar o app Firebase Admin:", error)
    }
} else if (!serviceAccount) {
    console.warn("[Firebase Admin] A conta de serviço não foi carregada ou é inválida. As operações de administrador não funcionarão.");
}

export const db = admin.apps.length ? admin.firestore() : null;
