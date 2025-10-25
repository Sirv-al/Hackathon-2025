const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require('openai');

class GeminiModel {
    constructor() {
        this.geminiAI = new GoogleGenAI({});
        this.chat = this.geminiAI.chats.create({
            model: "gemini-2.5-flash",
            history: [
                {
                    role: "user",
                    parts: [ { text: "Hello "}],
                },
                {
                    role: "model",
                    parts: [ { text: "Great to meet you" }],
                },
            ],
        });
    }

    async generateContent(prompt) {
        try {
            const result = await this.geminiAI.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            // You may need to adapt this depending on actual API response structure
            return result.text || 'No text returned.';
        } catch (err) {
            console.error("Gemini error:", err);
            throw new Error(err.message);
        }
    } 
}

class OpenAIClient {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async generateContent(prompt) {
        try {
            const response = await this.openai.responses.create({
                model: "gpt-5-nano",
                input: prompt,
                store: true,
            });

            return response.output_text;
        } catch (err) {
            console.error("OpenAI error:", err);
            throw new Error(err.message);
        }
    }
}

// const gemini = new GeminiModel();
const openAI = new OpenAIClient();

router.post('/ai_response', async (req, res) => {
    try {
        const { text } = req.body;
        const output = await openAI.generateContent(text);
        res.json({ text: output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;