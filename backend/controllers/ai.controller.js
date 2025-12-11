import { generateContent } from "../services/gemini.service.js";
import { validationResult } from "express-validator";

export const generateGeminiResponse = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { prompt } = req.query; // or req.body if using POST
    const responseText = await generateContent(prompt);
    res.status(200).json({ response: responseText });
  } catch (err) {
    console.error("Controller Error:", err);
    res.status(500).json({ message: err.message });
  }
};
