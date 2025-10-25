import { initMapScene } from './mapScene.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- MAP INITIALIZATION ---
    const mapSelect = document.getElementById('map-select');
    const loadButton = document.getElementById('map-submit-button');
    const mapContainerId = 'map-container';

    let cleanupMapScene = null;

    // Load default map on startup
    const defaultMap = 'medieval_town_two';
    mapSelect.value = defaultMap; // update dropdown to reflect it
    cleanupMapScene = initMapScene(mapContainerId, defaultMap);

    // Handle “Load Map” button
    loadButton.addEventListener('click', () => {
        const selectedMap = mapSelect.value.toLowerCase();
        if (cleanupMapScene) cleanupMapScene();
        cleanupMapScene = initMapScene(mapContainerId, selectedMap);
        handleMapSelection();
    });

    // --- GAME LOGIC SETUP ---
    const aiDisabled = false;

    // DOM elements
    const diceContainer = document.getElementById("dice-container");
    const rollD20Button = document.getElementById("roll-d20-button");
    const avatarResponseEl = document.getElementById("avatar-response");
    const gameLogEl = document.getElementById("game-log");
    const speechBubbleEl = document.getElementById("speech-bubble");
    const playerInputForm = document.getElementById("player-input-form");
    const playerTextInput = document.getElementById("player-text-input");

    const usernameEl = document.getElementById("player-username");
    const hpEl = document.getElementById("player-hp");
    const maxHpEl = document.getElementById("player-max-hp");
    const strEl = document.getElementById("player-str");
    const dexEl = document.getElementById("player-dex");
    const intEl = document.getElementById("player-int");

    // Game state
    let playerData = {};
    let isWaitingForRoll = false;

        /**
     * Initializes the game: loads player data, updates the UI,
     * adds event listeners, and makes the first call to the backend.
     */
    function initGame() {
        // Load player data from the previous page
        if (!loadPlayerData()) {
            // If data fails to load, send user back to creation page
            window.location.href = "index.html";
            return;
        }

        // Populate the stats panel
        updateStatsPanel();

        // Attach all event listeners
        playerInputForm.addEventListener("submit", handlePlayerInput);
        rollD20Button.addEventListener("click", handleDiceRoll);
        // mapSubmitButton.addEventListener("click", handleMapSelection);

        // Clear the log and speech bubble
        gameLogEl.innerHTML = "";
        speechBubbleEl.innerHTML = "";

        // Send the initial data to the backend to get the starting scene
        sendToAI("/start_game", { playerData });
    }
    // --- FUNCTIONS ---
    function loadPlayerData() {
        try {
            const data = localStorage.getItem("playerData");
            if (!data) return false;
            playerData = JSON.parse(data);
            return true;
        } catch (err) {
            console.error("Error loading player data", err);
            return false;
        }
    }

    function updateStatsPanel() {
        if (!playerData) return;
        usernameEl.textContent = playerData.username;
        hpEl.textContent = playerData.hp;
        maxHpEl.textContent = playerData.maxHp;
        strEl.textContent = playerData.stats.str;
        dexEl.textContent = playerData.stats.dex;
        intEl.textContent = playerData.stats.int;
    }

    /**
     * Updates the player's HP and saves to localStorage
     * @param {number} newHp - The new HP value
     */
    function updatePlayerHP(newHp) {
        // Ensure HP doesn't go below 0 or above max HP
        playerData.hp = Math.max(0, Math.min(newHp, playerData.maxHp));

        // Update the UI
        hpEl.textContent = playerData.hp;

        // Save updated player data to localStorage
        localStorage.setItem("playerData", JSON.stringify(playerData));

        // Log the HP change
        updateLog(`Your HP is now ${playerData.hp}/${playerData.maxHp}`, "System");

        // Check for death
        if (playerData.hp <= 0) {
            updateLog("You have been defeated! The adventure ends here.", "System");
            // Optionally disable further input or trigger game over sequence
        }
    }

    /**
     * Parses the AI response for HP commands and updates player HP accordingly
     * @param {string} responseText - The AI response text
     */
function parseHPCommands(responseText) {
    const hpRegex = /HP:\s*(\d+)/gi;
    const damageRegex1 = /(\d+)\/100/gi;  // X/100 pattern
    const damageRegex2 = /(\d+)\s*POINTS?\s*OF\s*DMG/gi;  // X POINTS OF DMG pattern

    let match;
    let hpUpdated = false;

    // Original HP parsing
    while ((match = hpRegex.exec(responseText)) !== null) {
        const newHp = parseInt(match[1]);
        if (!isNaN(newHp)) {
            updatePlayerHP(newHp);
            hpUpdated = true;
        }
    }

    // X/100 pattern
    while ((match = damageRegex1.exec(responseText)) !== null) {
        const damage = parseInt(match[1]);
        if (!isNaN(damage)) {
            // Assuming this represents current HP out of 100 max
            updatePlayerHP(damage);
            hpUpdated = true;
        }
    }

    // X POINTS OF DMG pattern
    while ((match = damageRegex2.exec(responseText)) !== null) {
        const damage = parseInt(match[1]);
        if (!isNaN(damage)) {
            const currentHP = playerData.hp;
            const newHp = Math.max(0, currentHP - damage);
            updatePlayerHP(newHp);
            hpUpdated = true;
        }
    }

    return hpUpdated;
}

    function updateLog(text, speaker = "System") {
        const entry = document.createElement("p");
        entry.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        gameLogEl.appendChild(entry);
        gameLogEl.scrollTop = gameLogEl.scrollHeight;
    }

    function toggleControls(isRolling) {
        isWaitingForRoll = isRolling;
        diceContainer.style.display = isRolling ? "block" : "none";

    }

    async function handlePlayerInput(e) {
        e.preventDefault();
        const inputText = playerTextInput.value.trim();

        speechBubbleEl.innerHTML = `<p><strong>You:</strong> ${inputText}</p>`;
        playerTextInput.value = "";

        await sendToAI("/player_action", {
            player_text: inputText,
            current_stats: playerData
        });
    }

    async function handleDiceRoll() {
        // Simulate a d20 roll
        const roll = Math.floor(Math.random() * 20) + 1;

        // Get the reason for the roll from the UI
        toggleControls(true)
        // Display the roll in the log
        updateLog(`You rolled a ${roll}".`, "System");

        // Send the roll result to the backend
        const payload = {
            dice_roll_result: roll,
            current_stats: playerData
        };
        await sendToAI("/dice_roll", roll);

        document.getElementById("dice-container").style.display = "none";
    }

    async function handleMapSelection() {
        const selectedMap = mapSelect.value;
        const mapText = mapSelect.options[mapSelect.selectedIndex].text;

        // Update map immediately
        if (cleanupMapScene) cleanupMapScene();
        cleanupMapScene = initMapScene(mapContainerId, selectedMap.toLowerCase());

        // This is just another form of player action

        if (selectedMap == "x") {
            const enemy = "x"
        } else if (selectedMap == "y") {
            const enemy = "y"
        } else if (selectedMap == "z") {
            const enemy = "z"
        } else {
            const enemy = "Human"
        }

        const payload = selectedMap + " Enemy: " + enemy;

        // Update UI to show intent
        speechBubbleEl.innerHTML = `<p><strong>You:</strong> I want to travel to the ${mapText}.</p>`;

        await sendToAI("/map-selection", payload);
    }

    async function sendToAI(endpoint, payload) {
        if (aiDisabled) {
            return
        }

        console.log("Sent");
        try {
            const res = await fetch('/ai_response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint,
                    payload: payload
                })
            });
            const data = await res.json();
            updateUI(data.text);

            if (data.text.toUpperCase().includes("REQUEST-ROLL") || data.text.toUpperCase().includes("D20") || data.text.toUpperCase().includes("ROLL RESULT") || data.text.toUpperCase().includes("ROLL-RESULT") || data.text.toUpperCase().includes("DC") || data.text.toUpperCase().includes("ROLL")) {
                document.getElementById("dice-container").style.display = "block";
                // isWaitingForRoll = true;
                // handleDiceRoll();
            } else if (data.text.toUpperCase().includes("HP: ") || data.text.toUpperCase().includes("Health: ") || data.text.toUpperCase().includes("POINTS OF DAMAGE") || data.text.toUpperCase().includes("HEALTH") || data.text.toUpperCase().includes("/100")) {
                // Parse and handle HP commands
                parseHPCommands(data.text);
            }
        } catch (err) {
            console.error("AI error:", err);
        }
    }

    function updateUI(responseData) {
        // First, parse and handle any HP commands
        const hadHPCommand = parseHPCommands(responseData);

        // If there were HP commands, remove them from the displayed text for cleaner output
        let displayText = responseData;
        if (hadHPCommand) {
            displayText = responseData.replace(/HP:\s*\d+/gi, '').trim();
            // If removing HP command leaves empty text, use a fallback
            if (!displayText) {
                displayText = "Your health has been updated.";
            }
        }

        // Clear previous content and set up streaming
        avatarResponseEl.innerHTML = '<p><strong>Game Master:</strong> </p>';
        const textContainer = avatarResponseEl.querySelector('p');

        // Stream the text character by character
        let index = 0;
        const streamText = () => {
            if (index < displayText.length) {
                // Add next character (or small chunk)
                textContainer.innerHTML = `<strong>Game Master:</strong> ${displayText.substring(0, index + 1)}`;
                index++;

                // Random delay to simulate natural typing speed
                const delay = Math.random() * 10 + 10; // 25-75ms between characters
                setTimeout(streamText, delay);
            }
        };

        // Start streaming after a brief pause
        setTimeout(streamText, 100);
    }



    initGame();
});
