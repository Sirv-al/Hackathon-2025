const { GoogleGenAI } = require("@google/genai");

class GeminiModel {
    constructor() {
        this.geminiAI = new GoogleGenAI({});
    }

    async generateContent(prompt, ws) {
        try {
            const result = await this.geminiAI.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: prompt
            });

            for await (const chunk of result) {
                const textChunk = chunk.text;
                ws.send(JSON.stringify({ text: textChunk}));
            }

            ws.send(JSON.stringify({ event: 'end', data: 'done' }));
        } catch (err) {
            console.error("Gemini error:", err);
            ws.send(JSON.stringify({ error: err.message}));
        } finally {
            ws.close();
        }
    }
}

module.exports = { GeminiModel };