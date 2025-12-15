import { GoogleGenAI } from "@google/genai";

export async function generateContent(prompt) {
    // Initialize inside the function to ensure process.env is loaded
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `
                            You are an expert MERN stack developer with 10+ years of experience.
                            Always write modular, scalable, maintainable code with clear comments.
                            Handle all errors, follow best practices, and never break existing functionality.

                            Task:
                            ${prompt}
                            `,
                        },
                    ],
                },
            ],
        });

        // ✅ Correct access for @google/genai SDK
        return response.text; 
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate response from Gemini API");
    }
}