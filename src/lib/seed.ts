
/**
 * @fileoverview
 * This file contains the logic for seeding the Firestore database with initial data.
 * It's designed to be run from the command line via the `npm run db:seed` script.
 */
import 'dotenv/config'; // Make sure to load environment variables
import { getAdminDb } from './firebase-admin'; // Use admin SDK for seeding
import { Patient, Doctor, Exam, Appointment } from '@/types';
import { format, addDays, differenceInYears } from 'date-fns';
import bcrypt from 'bcrypt';

const calculateAge = (birthDate: string | Date): number => {
    return differenceInYears(new Date(), new Date(birthDate));
}

const PATIENTS = [
    {
      id: '1',
      data: {
        name: 'Carlos Silva',
        birthDate: '1966-05-20',
        age: calculateAge('1966-05-20'),
        gender: 'Masculino',
        cpf: '123.456.789-00',
        phone: '(11) 98765-4321',
        email: 'carlos.silva@example.com',
        lastVisit: format(new Date(), 'dd/MM/yyyy'),
        status: 'Requer Validação',
        avatar: 'https://placehold.co/128x128.png',
        avatarHint: 'man portrait',
        conversationHistory: `Usuário: Bom dia, não me sinto bem. Tenho tido dores no peito e falta de ar quando subo escadas.\nModelo: Entendo, Carlos. Lamento ouvir isso. Há quanto tempo você sente esses sintomas?\nUsuário: Cerca de duas semanas.`,
        reportedSymptoms: 'Dores no peito e falta de ar.',
        examResults: 'Troponina: 0.8 ng/mL (Ref: <0.4), Raio-X do tórax: Leve cardiomegalia e atelectasia basal.',
        doctorNotes: '',
      },
      auth: {
          password: 'password123',
      }
    },
    {
        id: '2',
        data: {
            name: 'Mariana Oliveira',
            birthDate: '1990-11-15',
            age: calculateAge('1990-11-15'),
            gender: 'Feminino',
            cpf: '987.654.321-00',
            phone: '(21) 91234-5678',
            email: 'mariana.oliveira@example.com',
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
            finalExplanation: 'Olá, Mariana. A Dra. Ana analisou seu caso e concluiu que você está com Enxaqueca Crônica. Isso explica as dores de cabeça fortes e frequentes. Ela prescreveu um medicamento chamado Sumatriptano para você tomar assim que sentir uma crise começando, para aliviar a dor. Além disso, é importante que você comece a anotar quando as dores acontecem e o que você estava fazendo, para tentarmos descobrir o que pode estar causando as crises. Evitar muito café e situações de estresse também pode ajudar bastante. Fique tranquila, é uma condição comum e com o tratamento certo, você terá uma ótima qualidade de vida.',
            finalExplanationAudioUri: '', // Intentionally left blank, will be generated on demand
        },
        auth: {
            password: 'password123'
        }
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

const DOCTORS = [
    {
        id: '1',
        data: {
            name: 'Dra. Ana Costa',
            specialty: 'Cardiologista',
            online: true,
            avatar: 'https://placehold.co/128x128.png',
            avatarHint: 'woman portrait',
            email: 'ana.costa@med.ai',
            level: 3,
            xp: 250,
            xpToNextLevel: 500,
            validations: 25,
            badges: [
                { name: 'Primeira Validação', icon: 'Award', description: 'Validou seu primeiro caso.' },
                { name: 'Maratonista', icon: 'Star', description: 'Validou 10+ casos em um dia.' },
            ]
        },
        auth: {
            password: 'password123',
        }
    },
    {
        id: '2',
        data: {
            name: 'Dr. Bruno Lima',
            specialty: 'Neurologista',
            online: false,
            avatar: 'https://placehold.co/128x128.png',
            avatarHint: 'man portrait',
            email: 'bruno.lima@med.ai',
            level: 2,
            xp: 120,
            xpToNextLevel: 250,
            validations: 12,
            badges: [
                { name: 'Primeira Validação', icon: 'Award', description: 'Validou seu primeiro caso.' }
            ]
        },
        auth: {
            password: 'password123'
        }
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

async function seedCollection(
    collectionName: string,
    authCollectionName: string,
    data: { id: string, data: any, auth: { password?: string } }[],
    subCollections?: { [key: string]: { data: any[], collectionName: string } }
) {
    const adminDb = getAdminDb();

    const collectionRef = adminDb.collection(collectionName);
    const authCollectionRef = adminDb.collection(authCollectionName);

    for (const item of data) {
        const docRef = collectionRef.doc(item.id);
        const authDocRef = authCollectionRef.doc(item.id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            console.log(`  -> Adicionando documento ${item.id} em ${collectionName}...`);
            await docRef.set(item.data);
            
            if (item.auth.password) {
                 console.log(`  -> Criando credencial para ${item.id} em ${authCollectionName}...`);
                 const hashedPassword = await bcrypt.hash(item.auth.password, 10);
                 await authDocRef.set({ password: hashedPassword });
            }

            if (subCollections && subCollections[item.id]) {
                 const sub = subCollections[item.id];
                 console.log(`    -> Adicionando subcoleção ${sub.collectionName} para ${collectionName}/${item.id}`);
                 
                 const subColRef = adminDb.collection(`${collectionName}/${item.id}/${sub.collectionName}`);
                 for (const subItem of sub.data) {
                    await subColRef.add(subItem);
                 }
            }

        } else {
            console.log(`  - Documento ${item.id} já existe em ${collectionName}. Pulando.`);
        }
    }
}

async function seedAppointments() {
     const adminDb = getAdminDb();
    const collectionRef = adminDb.collection('appointments');
    const snapshot = await collectionRef.get();
    if (snapshot.empty) {
        console.log('  -> Populando agendamentos...');
        for(const appointment of APPOINTMENTS) {
            await collectionRef.add(appointment);
        }
    } else {
        console.log('  - Agendamentos já existem. Pulando.');
    }
}

export async function seedDatabase() {
    console.log('Iniciando o seeding para a coleção de pacientes...');
    await seedCollection('patients', 'patientAuth', PATIENTS, {
        '1': { collectionName: 'exams', data: EXAMS_FOR_PATIENT_1 }
    });

    console.log('\nIniciando o seeding para a coleção de médicos...');
    await seedCollection('doctors', 'doctorAuth', DOCTORS);

    console.log('\nIniciando o seeding para a coleção de agendamentos...');
    await seedAppointments();
}
