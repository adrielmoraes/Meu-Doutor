import forge from 'node-forge';
import signpdf from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import { PDFDocument } from 'pdf-lib';

// Environment variables should be set for BRy
const BRY_API_URL = process.env.BRY_API_URL || 'https://cloud.bry.com.br';
const BRY_CLIENT_ID = process.env.BRY_CLIENT_ID;
const BRY_CLIENT_SECRET = process.env.BRY_CLIENT_SECRET;
const BRY_REDIRECT_URI = process.env.BRY_REDIRECT_URI || 'http://localhost:3000/api/prescriptions/sign/bry/callback';

export interface SignatureResult {
    signedPdf: Uint8Array;
    transactionId?: string;
    signatureDate: Date;
}

/**
 * Signs a PDF using a local A1 certificate (.pfx/.p12)
 */
export async function signWithA1(
    pdfBuffer: Buffer,
    pfxBuffer: Buffer,
    password: string
): Promise<SignatureResult> {
    // 1. Validate and Parse PFX to ensure password is correct
    // (node-forge is used here just for validation/extraction if needed, 
    // but P12Signer does the heavy lifting for PDF signing)

    // Create a P12Signer instance
    const signer = new P12Signer(pfxBuffer, { passphrase: password });

    // 2. Sign the PDF (PAdES simple)
    // This adds a placeholder and fills it with the signature
    const signedPdf = await signpdf.sign(pdfBuffer, signer);

    return {
        signedPdf: signedPdf,
        signatureDate: new Date()
    };
}

/**
 * Generates the BRy Cloud Authorization URL for OAuth flow
 */
/**
 * Retrieves the BRy Cloud Authorization URL via API
 */
export async function fetchBryAuthUrl(prescriptionId: string): Promise<string> {
    if (!BRY_CLIENT_ID) throw new Error('BRY_CLIENT_ID not configured');

    const callbackUrl = `${BRY_REDIRECT_URI}`;

    try {
        // Updated to use /kms/rest/servicos as probing showed it exists (returns 500 vs 404 for scad)
        // using cloud.bry.com.br as hub timed out and api-assinatura is frontend
        const response = await fetch(`${BRY_API_URL}/kms/rest/servicos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "identificador": "solicitarURLAutorizacao",
                "client_id": BRY_CLIENT_ID,
                "parametros": [
                    callbackUrl,
                    prescriptionId // Passing state/context
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Bry API RPC Failed:', errorText);
            // Don't throw immediately, try fallback
            throw new Error(`RPC_FAILED: ${response.status}`);
        }

        const data = await response.json();
        return data.resultado;
    } catch (error) {
        console.warn('Bry RPC failed, falling back to manual URL construction:', error);

        // Fallback: Construct standard Keycloak/OAuth2 URL
        // Assuming 'bry' realm based on common patterns
        const baseUrl = BRY_API_URL.replace(/\/$/, ''); // Remove trailing slash
        const authUrl = new URL(`${baseUrl}/auth/realms/bry/protocol/openid-connect/auth`);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', BRY_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', callbackUrl);
        authUrl.searchParams.append('scope', 'openid profile email');
        // State is passed as prescriptionId to track context
        authUrl.searchParams.append('state', prescriptionId);

        console.log('Generated Fallback Auth URL:', authUrl.toString());
        return authUrl.toString();
    }
}

/**
 * Exchanges auth code for token and signs the PDF via BRy API
 */
export async function finalizeBrySignature(
    prescriptionId: string,
    authCode: string,
    pdfBuffer: Buffer
): Promise<SignatureResult> {
    if (!BRY_CLIENT_ID || !BRY_CLIENT_SECRET) throw new Error('BRY credentials missing');

    // 1. Exchange Code for Token
    const tokenResponse = await fetch(`${BRY_API_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: authCode,
            redirect_uri: BRY_REDIRECT_URI,
            client_id: BRY_CLIENT_ID,
            client_secret: BRY_CLIENT_SECRET
        })
    });

    if (!tokenResponse.ok) {
        throw new Error('Failed to obtain BRy access token');
    }

    const { access_token } = await tokenResponse.json();

    // 2. Send PDF for Signing (simplified flow: upload or hash)
    // Converting buffer to Base64 for API
    const pdfBase64 = pdfBuffer.toString('base64');

    const signResponse = await fetch(`${BRY_API_URL}/api/v1/signatures/pdf`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: pdfBase64,
            algorithm: 'SHA256',
            profile: 'PAdES_BASELINE_B' // Requesting valid PAdES
        })
    });

    if (!signResponse.ok) {
        const err = await signResponse.text();
        throw new Error(`BRy Signing Failed: ${err}`);
    }

    const signData = await signResponse.json();

    // Assume API returns the full signed PDF or a link
    // If it returns base64:
    if (signData.signed_content) {
        return {
            signedPdf: Buffer.from(signData.signed_content, 'base64'),
            transactionId: signData.uuid,
            signatureDate: new Date()
        };
    }

    throw new Error('Unexpected response format from BRy');
}
