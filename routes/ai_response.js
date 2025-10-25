const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const { OpenAI } = require('openai');

const conversationHistory = new Map();

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

    async generateContent(messages) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: messages,
                max_tokens: 150,
                temperature: 0.8,
            });

            return response.choices[0].message.content;
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
        const { endpoint, payload } = req.body;

        console.log("🎮 Incoming AI Game Request:");
        console.log("  📍 Endpoint:", endpoint);
        console.log("  📦 Payload:", JSON.stringify(payload, null, 2));

        const promptParts = [];
        
        // Handle different endpoints with appropriate system messages
        if (endpoint === '/start_game') {
            promptParts.push({ 
                role: "system", 
                content: `You are an immersive game master starting a new text-based RPG adventure. Create an engaging opening scene that introduces the game world and sets up the first choice for the player. Max 50 words responses. You can ask the player to roll a dice, to succeed or fail based on their stats. Put this in the format of request-roll`
            });
            promptParts.push({ 
                role: "user", 
                content: `**New Player Character:**\n${formatPlayerData(payload.playerData)}` 
            });
        } else if (endpoint === '/player_action') {
            promptParts.push({ 
                role: "system", 
                content: `You are an immersive game master for a text-based RPG. Respond to the player's action by advancing the narrative naturally.` 
            });
            promptParts.push({ 
                role: "user", 
                content: `**Player Character:**\n${formatPlayerData(payload.current_stats)}` 
            });
            
            if (payload.player_text) {
                promptParts.push({ 
                    role: "user", 
                    content: `**Player Action:** "${payload.player_text}"` 
                });
            }
            
        } else {
            // Generic fallback for other endpoints
            promptParts.push({ 
                role: "system", 
                content: `You are an immersive game master for a text-based RPG. The player is interacting through: ${endpoint}` 
            });
            promptParts.push({ 
                role: "user", 
                content: `**Game Context:**\n${JSON.stringify(payload, null, 2)}` 
            });
        }

        // Add common elements that might exist in any payload
        if (payload.dice_roll_result) {
            promptParts.push({ 
                role: "user", 
                content: `**Game Mechanics:** Dice roll: ${payload.dice_roll_result.roll} (${payload.dice_roll_result.reason})` 
            });
        }

        if (payload.map_selection) {
            promptParts.push({ 
                role: "user", 
                content: `**Location:** ${payload.map_selection}` 
            });
        }

        // Format final prompt
        const fullPrompt = promptParts.map(p => 
            `## ${p.role.toUpperCase()} ##\n${p.content}`
        ).join("\n\n---\n\n");

        console.log("✨ Final Game Prompt:\n", fullPrompt);

        const output = await openAI.generateContent(fullPrompt);
        res.json({ text: output });
        
    } catch (err) {
        console.error("❌ AI Response Error:", err);
        res.status(500).json({ 
            error: "Game world temporarily unavailable",
            details: err.message 
        });
    }
});

// Improved helper function that handles different data structures
function formatPlayerData(playerData) {
    // Handle both payload structures
    const stats = playerData.stats || playerData;
    const username = playerData.username || 'Adventurer';
    const hp = playerData.hp !== undefined ? playerData.hp : 100;
    const maxHp = playerData.maxHp !== undefined ? playerData.maxHp : 100;

    return `
👤 **Character**: ${username}

💪 **Attributes**:
   Strength: ${stats.str}
   Dexterity: ${stats.dex}  
   Intelligence: ${stats.int}

❤️ **Health**: ${hp}/${maxHp}
`;
}

module.exports = router;