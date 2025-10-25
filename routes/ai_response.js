const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");

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
<<<<<<< HEAD

            const stream1 = await this.chat.sendMessageStream({
                message: "I have 2 dogs in my house",
            })

            for await (const chunk of stream1) {
                console.log(chunk.text);
                console.log("_".repeat(80));
            }

            const stream2 = await this.chat.sendMessageStream({
                message: "How many paws are in my house?",
            });

            for await (const chunk of stream2) {
                console.log(chunk.text);
                console.log("_".repeat(80));
            }

            const result = await this.geminiAI.models.generateContentStream({
=======
            const result = await this.geminiAI.models.generateContent({
>>>>>>> noWebSocket
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

const gemini = new GeminiModel();

router.post('/ai_response', async (req, res) => {
    try {
        const { text } = req.body;
        const output = await gemini.generateContent(text);
        res.json({ text: output });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;