# **App Name**: MediAI

## Core Features:

- Exam Analysis: AI-powered analysis of uploaded medical exams (PDF, JPG, PNG). The analysis is performed by a system of AI agents: An orchestration agent will forward each uploaded file to an expert agent that specializes in the correct type of medical exam.
- AI Summary Tool: AI assistant to summarize a patient's interactions with the AI, including reported symptoms, conversation history, and questions.
- Diagnosis Tool: AI-generated preliminary diagnosis based on the analysis of the uploaded exams, including suggestions for next steps and further tests that may be needed. The preliminary diagnosis leverages a tool that reviews an existing database of medical knowledge to incorporate that information into its decision-making process.
- Patient UI: A card-based interface for patients, with intuitive access to video calls, exam history, and exam uploads.
- Doctor UI: A web-based interface for doctors, displaying patient lists, appointment schedules, and patient history, displayed in cards.
- Audio Playback: A 'Reproduce Audio' button which replays the AI's narration and explanation of the patient's diagnosis.
- Secure Upload: Secure file upload and storage, compliant with LGPD standards, including encryption in transit and at rest.

## Style Guidelines:

- Primary color: Deep sky blue (#3399FF) for a sense of trust and competence in medical advice.
- Background color: Very light blue (#F0F8FF). It is similar in hue to the primary color, but highly desaturated, and provides a clean, calm backdrop that is suitable to a healthcare setting.
- Accent color: A vivid shade of blue (#66B2FF). This accent helps call attention to key features of the UI.
- Body and headline font: 'Inter', a sans-serif font known for its modern, neutral appearance, suitable for both headlines and body text.
- Use clear, minimalist icons to represent different types of medical exams and actions within the app.
- Card-based design to promote a clean, intuitive, user-friendly interface for patients and doctors, facilitating navigation.
- Subtle transitions and animations to indicate loading states and provide feedback on user interactions.