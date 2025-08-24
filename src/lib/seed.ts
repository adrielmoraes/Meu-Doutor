/**
 * @fileoverview
 * This file contains the logic for seeding the Firestore database with initial data.
 * It's designed to be run from the command line via the `npm run db:seed` script.
 */
import 'dotenv/config'; // Make sure to load environment variables
import { db } from './firebase-admin'; // Use admin SDK for seeding
import { Patient, Doctor, Exam, Appointment } from '@/types';
import { format, addDays } from 'date-fns';

const PATIENTS: Omit<Patient, 'id'>[] = [
    {
      name: 'Carlos Silva',
      age: 58,
      gender: 'Masculino',
      lastVisit: format(new Date(), 'dd/MM/yyyy'),
      status: 'Requer Validação',
      avatar: 'https://placehold.co/128x128.png',
      avatarHint: 'man portrait',
      conversationHistory: `Usuário: Bom dia, não me sinto bem. Tenho tido dores no peito e falta de ar quando subo escadas.\nModelo: Entendo, Carlos. Lamento ouvir isso. Há quanto tempo você sente esses sintomas?\nUsuário: Cerca de duas semanas.`,
      reportedSymptoms: 'Dores no peito e falta de ar.',
      examResults: 'Troponina: 0.8 ng/mL (Ref: <0.4), Raio-X do tórax: Leve cardiomegalia e atelectasia basal.',
      doctorNotes: '',
    },
    {
        name: 'Mariana Oliveira',
        age: 34,
        gender: 'Feminino',
        lastVisit: format(addDays(new Date(), -5), 'dd/MM/yyyy'),
        status: 'Validado',
        avatar: 'https://placehold.co/128x128.png',
        avatarHint: 'woman portrait',
        conversationHistory: `Usuário: Olá, tenho tido muitas dores de cabeça ultimamente, quase todos os dias.\nModelo: Olá Mariana. Sinto muito por isso. Você poderia descrever a dor? É pulsante, em um lado da cabeça?`,
        reportedSymptoms: 'Dores de cabeça frequentes e sensibilidade à luz.',
        examResults: 'Nenhum exame de imagem recente. Pressão arterial: 120/80 mmHg.',
        doctorNotes: `Diagnóstico Final: Enxaqueca Crônica.\n\nPrescrição:\n- Sumatriptano 50mg, tomar no início da crise.\n- Recomenda-se acompanhamento neurológico e diário de enxaqueca.\n- Evitar gatilhos comuns como cafeína em excesso e estresse.`,
        preventiveAlerts: ['Oportunidade para gerenciamento de estresse.', 'Risco de abuso de analgésicos.'],
        healthGoals: [
            { title: 'Reduzir Frequência das Crises', description: 'Monitorar e identificar gatilhos para diminuir a ocorrência de enxaquecas.', progress: 15 },
            { title: 'Melhorar Higiene do Sono', description: 'Dormir de 7 a 8 horas por noite para reduzir a probabilidade de crises.', progress: 40 },
        ],
    },
];

const EXAMS_FOR_PATIENT_1: Omit<Exam, 'id' | 'date'>[] = [
    {
        type: 'Exame de Sangue (Cardíaco)',
        result: 'Níveis de troponina elevados, sugerindo possível dano cardíaco.',
        icon: 'Droplets',
        preliminaryDiagnosis: 'Possível Síndrome Coronariana Aguda. Níveis de troponina estão acima do normal.',
        explanation: 'A troponina é uma proteína que é liberada no sangue quando o músculo do coração é danificado. Seus níveis estão um pouco elevados, o que precisa ser investigado por um cardiologista para descartar qualquer problema cardíaco mais sério.',
        results: [
            { name: 'Troponina I', value: '0.8 ng/mL', reference: '< 0.4 ng/mL' },
            { name: 'CK-MB', value: '4.5 ng/mL', reference: '< 5.0 ng/mL' },
        ]
    },
    {
        type: 'Raio-X do Tórax',
        result: 'Leve aumento da área cardíaca (cardiomegalia).',
        icon: 'Bone',
        preliminaryDiagnosis: 'Cardiomegalia leve detectada. Recomenda-se ecocardiograma para avaliação.',
        explanation: 'O Raio-X mostra que seu coração está um pouco maior do que o normal. Isso pode acontecer por várias razões, como pressão alta. É um achado que justifica uma investigação mais aprofundada com outros exames, como um ecocardiograma, para entender melhor a causa.',
    }
];

const DOCTORS: Omit<Doctor, 'id'>[] = [
    {
        name: 'Dra. Ana Costa',
        specialty: 'Cardiologista',
        online: true,
        avatar: 'https://placehold.co/128x128.png',
        avatarHint: 'woman portrait',
        level: 3,
        xp: 250,
        xpToNextLevel: 500,
        validations: 25,
        badges: [
            { name: 'Primeira Validação', icon: 'Award', description: 'Validou seu primeiro caso.' },
            { name: 'Maratonista', icon: 'Star', description: 'Validou 10+ casos em um dia.' },
        ]
    },
    {
        name: 'Dr. Bruno Lima',
        specialty: 'Neurologista',
        online: false,
        avatar: 'https://placehold.co/128x128.png',
        avatarHint: 'man portrait',
        level: 2,
        xp: 120,
        xpToNextLevel: 250,
        validations: 12,
        badges: [
            { name: 'Primeira Validação', icon: 'Award', description: 'Validou seu primeiro caso.' }
        ]
    }
];

const APPOINTMENTS: Omit<Appointment, 'id'>[] = [
    {
        patientId: '2',
        patientName: 'Mariana Oliveira',
        patientAvatar: 'https://placehold.co/128x128.png',
        doctorId: '1',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        type: 'Consulta de Acompanhamento',
        status: 'Agendada',
    },
    {
        patientId: '1',
        patientName: 'Carlos Silva',
        patientAvatar: 'https://placehold.co/128x128.png',
        doctorId: '1',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '14:00',
        type: 'Consulta de Rotina',
        status: 'Agendada',
    },
];

async function seedCollection<T extends { id: string }>(
    collectionName: string,
    data: Omit<T, 'id'>[],
    subCollections?: { [key: string]: { data: any[], collectionName: string } }
) {
    const collectionRef = db.collection(collectionName);
    let idCounter = 1;

    for (const item of data) {
        const docId = String(idCounter++);
        const docRef = collectionRef.doc(docId);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            console.log(`  -> Adicionando documento ${docId} em ${collectionName}...`);
            await docRef.set(item);

            if (subCollections && subCollections[docId]) {
                 const sub = subCollections[docId];
                 console.log(`    -> Adicionando subcoleção ${sub.collectionName} para ${collectionName}/${docId}`);
                 await seedCollection(`${collectionName}/${docId}/${sub.collectionName}`, sub.data);
            }

        } else {
            console.log(`  - Documento ${docId} já existe em ${collectionName}. Pulando.`);
        }
    }
}

export async function seedDatabase() {
    console.log('Iniciando o seeding para a coleção de pacientes...');
    await seedCollection<Patient>('patients', PATIENTS, {
        '1': { collectionName: 'exams', data: EXAMS_FOR_PATIENT_1 }
    });

    console.log('\nIniciando o seeding para a coleção de médicos...');
    await seedCollection<Doctor>('doctors', DOCTORS);

    console.log('\nIniciando o seeding para a coleção de agendamentos...');
    await seedCollection<Appointment>('appointments', APPOINTMENTS);
}
