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

    async generateContent(prompt, ws) {
        try {

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