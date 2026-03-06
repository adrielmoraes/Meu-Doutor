import fetch from 'node-fetch';

async function testTTS() {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = "gemini-2.5-pro-preview-tts";

    // First let's check what models exist
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsRes = await fetch(modelsUrl);
    const modelsData = await modelsRes.json();
    console.log("Available models:");
    modelsData.models.filter(m => m.name.includes("tts") || m.name.includes("audio")).forEach(m => console.log(m.name));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: "Hello world" }],
                },
            ],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Puck" },
                    },
                },
            },
        }),
    });

    if (!response.ok) {
        console.error("Failed:", response.status, await response.text());
    } else {
        console.log("Success! Audio returned.");
    }
}

testTTS().catch(console.error);
