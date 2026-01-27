import forge from 'node-forge';
import signpdf from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import { PDFDocument } from 'pdf-lib';

const BIRDID_API_URL = process.env.BIRDID_API_URL || 'https://cess.lab.vaultid.com.br';
const BIRDID_CLIENT_ID = process.env.BIRDID_CLIENT_ID;
const BIRDID_CLIENT_SECRET = process.env.BIRDID_CLIENT_SECRET;
const BIRDID_REDIRECT_URI = process.env.BIRDID_REDIRECT_URI || 'https://www.appmediai.com/api/prescriptions/sign/birdid/callback';

export interface SignatureResult {
    signedPdf: Uint8Array;
    transactionId?: string;
    signatureDate: Date;
}

export async function signWithA1(
    pdfBuffer: Buffer,
    pfxBuffer: Buffer,
    password: string
): Promise<SignatureResult> {
    const signer = new P12Signer(pfxBuffer, { passphrase: password });
    const signedPdf = await signpdf.sign(pdfBuffer, signer);

    return {
        signedPdf: signedPdf,
        signatureDate: new Date()
    };
}

export async function createBirdIdSignatureRequest(
    prescriptionId: string,
    pdfBuffer: Buffer
): Promise<{ tcn: string; authUrl: string }> {
    if (!BIRDID_CLIENT_ID || !BIRDID_CLIENT_SECRET) {
        throw new Error('Credenciais do BirdID não configuradas');
    }

    const credentials = Buffer.from(`${BIRDID_CLIENT_ID}:${BIRDID_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${BIRDID_API_URL}/signature-service`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`,
            'VCSchemaCfg': 'returnAccessToken=true;lifetime=2592000;autoRevoke=false'
        },
        body: JSON.stringify({
            certificate_alias: '',
            type: 'PDFSignature',
            hash_algorithm: 'SHA256',
            auto_fix_document: true,
            signature_settings: [{
                id: 'default',
                contact: '',
                location: 'Brasil',
                reason: 'Prescrição Médica Digital',
                visible_signature: true,
                visible_sign_x: 50,
                visible_sign_y: 50,
                visible_sign_width: 200,
                visible_sign_height: 50,
                visible_sign_page: 1
            }],
            documents_source: 'UPLOAD_REFERENCE'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[BirdID] Erro ao criar requisição de assinatura:', errorText);
        throw new Error(`Erro ao criar requisição BirdID: ${response.status}`);
    }

    const data = await response.json();
    const tcn = data.tcn;

    const uploadResponse = await fetch(`${BIRDID_API_URL}/file-transfer/${tcn}/eot/default`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/pdf'
        },
        body: new Uint8Array(pdfBuffer)
    });

    if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text();
        console.error('[BirdID] Erro ao enviar PDF:', uploadError);
        throw new Error(`Erro ao enviar documento: ${uploadResponse.status}`);
    }

    const oauthUrl = process.env.BIRDID_OAUTH_URL || 'https://api.birdid.com.br';
    const authUrl = new URL(`${oauthUrl}/oauth/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', BIRDID_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', BIRDID_REDIRECT_URI);
    authUrl.searchParams.append('scope', 'signature_session');
    authUrl.searchParams.append('state', `${prescriptionId}:${tcn}`);

    return { tcn, authUrl: authUrl.toString() };
}

export async function finalizeBirdIdSignature(
    tcn: string,
    authCode: string
): Promise<SignatureResult> {
    if (!BIRDID_CLIENT_ID || !BIRDID_CLIENT_SECRET) {
        throw new Error('Credenciais do BirdID não configuradas');
    }

    const credentials = Buffer.from(`${BIRDID_CLIENT_ID}:${BIRDID_CLIENT_SECRET}`).toString('base64');
    const oauthUrl = process.env.BIRDID_OAUTH_URL || 'https://api.birdid.com.br';

    const tokenResponse = await fetch(`${oauthUrl}/oauth/token`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: BIRDID_REDIRECT_URI
        })
    });

    if (!tokenResponse.ok) {
        const tokenError = await tokenResponse.text();
        console.error('[BirdID] Erro ao obter token:', tokenError);
        throw new Error('Falha ao obter token de acesso BirdID');
    }

    const { access_token } = await tokenResponse.json();

    const authorizeResponse = await fetch(`${BIRDID_API_URL}/signature-service/${tcn}/authorize`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!authorizeResponse.ok) {
        const authError = await authorizeResponse.text();
        console.error('[BirdID] Erro ao autorizar assinatura:', authError);
        throw new Error('Falha ao autorizar assinatura');
    }

    let status = 'PROCESSING';
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'PROCESSING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`${BIRDID_API_URL}/signature-service/${tcn}`, {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            status = statusData.status;
        }
        attempts++;
    }

    if (status !== 'COMPLETED' && status !== 'DONE') {
        throw new Error(`Assinatura não completada. Status: ${status}`);
    }

    const downloadResponse = await fetch(`${BIRDID_API_URL}/file-transfer/${tcn}/0`, {
        headers: {
            'Authorization': `Basic ${credentials}`
        }
    });

    if (!downloadResponse.ok) {
        throw new Error('Falha ao baixar documento assinado');
    }

    const signedPdfBuffer = await downloadResponse.arrayBuffer();

    return {
        signedPdf: new Uint8Array(signedPdfBuffer),
        transactionId: tcn,
        signatureDate: new Date()
    };
}

export async function fetchBirdIdAuthUrl(prescriptionId: string, pdfBuffer: Buffer): Promise<string> {
    const { authUrl } = await createBirdIdSignatureRequest(prescriptionId, pdfBuffer);
    return authUrl;
}

export async function fetchBryAuthUrl(prescriptionId: string): Promise<string> {
    console.warn('[DEPRECATED] fetchBryAuthUrl está obsoleta. Use fetchBirdIdAuthUrl.');
    throw new Error('Integração BRY foi substituída pelo BirdID. Atualize a implementação.');
}

export async function finalizeBrySignature(
    prescriptionId: string,
    authCode: string,
    pdfBuffer: Buffer
): Promise<SignatureResult> {
    console.warn('[DEPRECATED] finalizeBrySignature está obsoleta. Use finalizeBirdIdSignature.');
    throw new Error('Integração BRY foi substituída pelo BirdID. Atualize a implementação.');
}
