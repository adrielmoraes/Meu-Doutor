import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

interface PrescriptionData {
    doctorName: string;
    doctorCRM: string;
    patientName: string;
    medications: {
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
    }[];
    instructions?: string;
    date: Date;
}

export async function generatePrescriptionPDF(data: PrescriptionData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 12;
    let y = height - 50;

    // Header
    page.drawText(data.doctorName, { x: 50, y, size: 18, font: boldFont, color: rgb(0, 0, 0) });
    y -= 20;
    page.drawText(`CRM: ${data.doctorCRM}`, { x: 50, y, size: 12, font: font, color: rgb(0.3, 0.3, 0.3) });
    y -= 40;

    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 40;

    // Title
    page.drawText('RECEITUÁRIO MÉDICO', { x: width / 2 - 80, y, size: 16, font: boldFont, color: rgb(0, 0, 0) });
    y -= 40;

    // Patient
    page.drawText(`Paciente: ${data.patientName}`, { x: 50, y, size: 12, font: boldFont });
    y -= 30;

    // Medications
    for (const med of data.medications) {
        page.drawText(`• ${med.name} ${med.dosage}`, { x: 50, y, size: 12, font: boldFont });
        y -= 15;
        page.drawText(`  ${med.frequency}, durante ${med.duration}`, { x: 50, y, size: 12, font: font });
        y -= 15;
        if (med.instructions) {
            page.drawText(`  Nota: ${med.instructions}`, { x: 50, y, size: 10, font: font, color: rgb(0.4, 0.4, 0.4) });
            y -= 15;
        }
        y -= 10;
    }

    // Extra Instructions
    if (data.instructions) {
        y -= 20;
        page.drawText('Outras orientações:', { x: 50, y, size: 12, font: boldFont });
        y -= 20;
        const instructionsLines = data.instructions.split('\n');
        for (const line of instructionsLines) {
            page.drawText(line, { x: 50, y, size: 11, font: font });
            y -= 15;
        }
    }

    // Footer / Signature Placeholder
    y = 100;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 30;
    page.drawText(`Data: ${data.date.toLocaleDateString('pt-BR')}`, { x: 50, y, size: 10, font: font });

    // Signature Visual Placeholder (The actual signature is digital)
    page.drawText('Assinado Digitalmente', { x: width - 200, y, size: 10, font: font, color: rgb(0.5, 0.5, 0.5) });

    return await pdfDoc.save();
}
