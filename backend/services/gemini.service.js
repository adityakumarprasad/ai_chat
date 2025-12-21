import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateContent(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `
              You are an expert MERN stack developer.
              
              IMPORTANT: You must NOT output Markdown or plain text explanations.
              You must output valid JSON ONLY.
              
              Your task is to create a project based on this prompt: "${prompt}"

              The JSON structure must be a valid WebContainer file tree:
              {
                "fileTree": {
                  "filename.ext": {
                    "file": { "contents": "code string here" }
                  },
                  "folderName": {
                    "directory": {
                      "innerFile.js": {
                        "file": { "contents": "code string here" }
                      }
                    }
                  }
                },
                "buildCommand": "npm install && npm run start" // suggestion
              }
              
              Ensure "package.json" includes a start script. 
              Do not include comments in the JSON.
              `,
            },
          ],
        },
      ],
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate response from Gemini API");
  }
}
