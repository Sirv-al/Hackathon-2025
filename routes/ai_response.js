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
                max_tokens: 150, // change this to stop cutting off
                temperature: 0.8,
            });

            return {
                content: response.choices[0].message.content,
                message: response.choices[0].message // Store the assistant's response for memory
            };
        } catch (err) {
            console.error("OpenAI error:", err);
            throw new Error(err.message);
        }
    }
}

// Memory management functions
function getConversationHistory(playerId) {
    if (!conversationHistory.has(playerId)) {
        conversationHistory.set(playerId, []);
    }
    return conversationHistory.get(playerId);
}

function addToConversationHistory(playerId, role, content) {
    const history = getConversationHistory(playerId);
    history.push({ role, content });
    
    // Limit history to last 10 messages to prevent token overflow
    if (history.length > 10) {
        history.splice(0, history.length - 10);
    }
    
    conversationHistory.set(playerId, history);
}

function clearConversationHistory(playerId) {
    conversationHistory.set(playerId, []);
}

const openAI = new OpenAIClient();

router.post('/ai_response', async (req, res) => {
    try {
        const { endpoint, payload, playerId = 'default' } = req.body;

        console.log("🎮 Incoming AI Game Request:");
        console.log("  📍 Endpoint:", endpoint);
        console.log("  👤 Player ID:", playerId);
        console.log("  📦 Payload:", JSON.stringify(payload, null, 2));

        // Get conversation history for this player
        const history = getConversationHistory(playerId);
        const messages = [];
        
        // Add system message based on endpoint
        if (endpoint === '/start_game') {
            messages.push({ 
                role: "system", 
                content: `You are an immersive game master starting a new text-based RPG adventure. The player starts in a medievil town. Create an engaging opening scene that introduces the game world and sets up the first choice for the player. Max 50 words responses. Never roll yourself for the play, instead you can ask the player to roll a dice (strenght, dex, and int), setting the dc based on their respective stat. Put this in the format of request-roll. In combat you can damage the player by setting their HP, do this by doing {HP: NUM}. `
            });
            // Clear previous history when starting a new game
            clearConversationHistory(playerId);
        } else if (endpoint === '/player_action') {
            messages.push({ 
                role: "system", 
                content: `Respond to the player's action by advancing the narrative naturally (if they attack and fail, the enemy will attack back). If they want to do a specific action, get them to roll a d20 and give them success or failure and consequences based on their stats. To request a roll put in the format of request-roll. Remember the ongoing story and previous interactions.` 
            });
        } else if (endpoint === '/dice_roll') {
            messages.push({ 
                role: "system", 
                content: `You are an immersive game master for a text-based RPG. Interpret the dice roll in the context of the ongoing story, and show tell me how the result impacts the scenario.` 
            });
        } else if (endpoint === '/map-selection') {
            messages.push({ 
                role: "system", 
                content: `You are an immersive game master for a text-based RPG. Describe the new location. THe player encounters the enemy ahead of them, it's up to them how to start` 
            });
        } else {
            messages.push({ 
                role: "system", 
                content: `You are an immersive game master for a text-based RPG. The player is interacting through: ${endpoint}. Maintain consistency with previous interactions.` 
            });
        }

        // Add conversation history (excluding system messages)
        history.forEach(msg => {
            if (msg.role !== 'system') {
                messages.push(msg);
            }
        });

        // Add current context based on endpoint
        if (endpoint === '/start_game') {
            messages.push({ 
                role: "user", 
                content: `**New Player Character:**\n${formatPlayerData(payload.playerData)}` 
            });
        } else if (endpoint === '/player_action') {
            messages.push({ 
                role: "user", 
                content: `**Player Character:**\n${formatPlayerData(payload.current_stats)}\n**Player Action:** "${payload.player_text}"` 
            });
        } else if (endpoint === '/dice_roll') {
            messages.push({ 
                role: "user", 
                content: `**Game Mechanics:** Dice roll: ${payload}\n**Continue the story based on this roll:**` 
            });
        } else if (endpoint === '/map-selection') {
            messages.push({ 
                role: "user",
                content: `**Location:** ${payload}\n**Describe this new area in the ongoing adventure:**` 
            });
        } else {
            messages.push({ 
                role: "user", 
                content: `**Game Context:**\n${JSON.stringify(payload, null, 2)}` 
            });
        }

        console.log("✨ Final Game Messages:", JSON.stringify(messages, null, 2));
        console.log("📚 Conversation History Length:", history.length);

        const response = await openAI.generateContent(messages);
        
        // Store both the user message and assistant response in history
        if (endpoint !== '/start_game') { // Don't store start game in history
            addToConversationHistory(playerId, "user", messages[messages.length - 1].content);
        }
        addToConversationHistory(playerId, "assistant", response.content);
        
        res.json({ 
            text: response.content,
            memory: {
                historyLength: getConversationHistory(playerId).length,
                playerId: playerId
            }
        });
        
    } catch (err) {
        console.error("❌ AI Response Error:", err);
        res.status(500).json({ 
            error: "Game world temporarily unavailable",
            details: err.message 
        });
    }
});

// Add endpoint to clear memory (useful for debugging or restarting)
router.post('/clear_memory', (req, res) => {
    const { playerId = 'default' } = req.body;
    clearConversationHistory(playerId);
    res.json({ 
        message: `Memory cleared for player ${playerId}`,
        memorySize: conversationHistory.size
    });
});

// Add endpoint to get memory stats
router.get('/memory_stats', (req, res) => {
    const stats = {};
    conversationHistory.forEach((history, playerId) => {
        stats[playerId] = {
            messageCount: history.length,
            lastMessages: history.slice(-2) // Last 2 messages
        };
    });
    
    res.json({
        totalPlayers: conversationHistory.size,
        details: stats
    });
});

function formatPlayerData(playerData) {
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