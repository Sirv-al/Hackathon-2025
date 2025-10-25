
// Wait for the HTML document to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Get All DOM Elements ---
    // Left Column
    const mapSelect = document.getElementById("map-select");
    const mapSubmitButton = document.getElementById("map-submit-button");
    const diceContainer = document.getElementById("dice-container");
    const diceReason = document.getElementById("dice-reason");
    const rollD20Button = document.getElementById("roll-d20-button");

    // Right Column
    const avatarResponseEl = document.getElementById("avatar-response");
    const gameLogEl = document.getElementById("game-log");
    const speechBubbleEl = document.getElementById("speech-bubble");
    const playerInputForm = document.getElementById("player-input-form");
    const playerTextInput = document.getElementById("player-text-input");

    // Stats Panel
    const usernameEl = document.getElementById("player-username");
    const hpEl = document.getElementById("player-hp");
    const maxHpEl = document.getElementById("player-max-hp");
    const strEl = document.getElementById("player-str");
    const dexEl = document.getElementById("player-dex");
    const intEl = document.getElementById("player-int");

    // --- 2. Game State Variables ---
    let playerData = {};
    let isWaitingForRoll = false;

    // --- 3. Core Functions ---

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
        mapSubmitButton.addEventListener("click", handleMapSelection);

        // Clear the log and speech bubble
        gameLogEl.innerHTML = "";
        speechBubbleEl.innerHTML = "";

        // Send the initial data to the backend to get the starting scene
        sendToBackend("/start_game", { playerData });
    }

    /**
     * Loads player data from localStorage into the `playerData` variable.
     * Returns true on success, false on failure.
     */
    function loadPlayerData() {
        try {
            const data = localStorage.getItem("playerData");
            if (!data) {
                console.error("No player data found.");
                return false;
            }
            playerData = JSON.parse(data);
            return true;
        } catch (error) {
            console.error("Failed to parse player data:", error);
            return false;
        }
    }

    /**
     * Updates the Stats Panel HTML with the current `playerData`.
     */
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
     * Adds a new entry to the main game log and auto-scrolls.
     * @param {string} text - The message to log.
     * @param {string} speaker - The person speaking (e.g., "Game Master", "You", "System").
     */
    function updateLog(text, speaker = "System") {
        const entry = document.createElement("p");
        entry.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        gameLogEl.appendChild(entry);

        // Auto-scroll to the bottom
        gameLogEl.scrollTop = gameLogEl.scrollHeight;
    }

    /**
     * Shows or hides the dice roller and enables/disables the text input.
     * @param {boolean} isRolling - True to show dice, false to show text input.
     */
    function toggleControls(isRolling) {
        isWaitingForRoll = isRolling;
        diceContainer.style.display = isRolling ? "block" : "none";
        playerTextInput.disabled = isRolling;
        playerInputForm.querySelector("button").disabled = isRolling;

        if (!isRolling) {
            playerTextInput.focus();
        }
    }

    // --- 4. Event Handlers ---

    /**
     * Called when the player submits the text input form.
     */
    async function handlePlayerInput(event) {
        event.preventDefault();
        const inputText = playerTextInput.value.trim();

        if (!inputText || isWaitingForRoll) {
            return;
        }

        // Display player's action in their speech bubble
        speechBubbleEl.innerHTML = `<p><strong>You:</strong> ${inputText}</p>`;

        // Log the player's action (optional, can be redundant)
        // updateLog(inputText, "You");

        // Clear the input box
        playerTextInput.value = "";

        // Send the action to the backend
        const payload = {
            player_text: inputText,
            current_stats: playerData
        };
        await sendToBackend("/player_action", payload);
    }

    /**
     * Called when the player clicks the "Roll d20" button.
     */
    async function handleDiceRoll() {
        if (!isWaitingForRoll) return;

        // Simulate a d20 roll
        const roll = Math.floor(Math.random() * 20) + 1;

        // Get the reason for the roll from the UI
        const reason = diceReason.textContent;

        // Display the roll in the log
        updateLog(`You rolled a ${roll} for "${reason}".`, "System");

        // Send the roll result to the backend
        const payload = {
            dice_roll_result: {
                reason: reason,
                roll: roll
            },
            current_stats: playerData
        };
        await sendToBackend("/player_action", payload);
    }

    /**
     * Called when the "Load Map" button is clicked.
     */
    async function handleMapSelection() {
        const selectedMap = mapSelect.value;
        const mapText = mapSelect.options[mapSelect.selectedIndex].text;

        // This is just another form of player action
        const payload = {
            player_text: `I want to travel to the ${mapText}.`,
            current_stats: playerData,
            map_selection: selectedMap // Send a structured key as well
        };

        // Update UI to show intent
        speechBubbleEl.innerHTML = `<p><strong>You:</strong> I want to travel to the ${mapText}.</p>`;

        await sendToBackend("/player_action", payload);
    }


    // --- 5. Backend Communication ---

    /**
     * The main function for sending data to the Python backend and getting a response.
     * @param {string} endpoint - The API endpoint (e.g., "/start_game").
     * @param {object} payload - The JSON data to send.
     */
    async function sendToBackend(endpoint, payload) {
       //onst responseData = await mockBackendResponse(endpoint, payload);
        payload = endpoint + "|" + payload
        const responseData = await wsAIResponse(payload);


        // Simulate network delay
        //await new Promise(resolve => setTimeout(resolve, 500));
        updateUI(responseData);
    }

    /**
     * This function receives the JSON response from the backend
     * and updates all the different parts of the UI.
     * @param {object} responseData - The JSON object from the AI.
     */
    function updateUI(responseData) {
        // 1. Update Avatar Response (Main narrative)
        if (responseData.avatar_response) {
            avatarResponseEl.innerHTML = `<p><strong>Game Master:</strong> ${responseData.avatar_response}</p>`;
        }

        // 2. Update Game Log (Secondary info)
        if (responseData.narrative) {
            updateLog(responseData.narrative, "Game Master");
        }

        // 3. Update Stats
        if (responseData.stats_update) {
            // Update the local playerData object
            Object.assign(playerData, responseData.stats_update);

            // Re-render the stats panel
            updateStatsPanel();
        }

        // 4. Handle Dice Roll Request
        if (responseData.dice_roll_request) {
            diceReason.textContent = responseData.dice_roll_request.reason;
            toggleControls(true); // Show dice
        } else {
            toggleControls(false); // Show text input
        }

        // 5. Handle Map Hook (for your three.js teammate)
        if (responseData.map_update) {
            console.log("Hook: Updating map to", responseData.map_update);
            // This is the "hook" for your teammate.
            // They need to create a function on the window called `myMap.moveTo`
            if (window.myMap && typeof window.myMap.moveTo === 'function') {
                window.myMap.moveTo(responseData.map_update.x, responseData.map_update.y);
            }
        }

        // 6. Handle Avatar Hook (for your three.js teammate)
        if (responseData.avatar_animation) {
             console.log("Hook: Playing avatar animation", responseData.avatar_animation);
            // This is the "hook" for your other teammate.
            if (window.myAvatar && typeof window.myAvatar.play === 'function') {
                window.myAvatar.play(responseData.avatar_animation);
            }
        }
    }

    // --- 6. Mock Backend Function (FOR TESTING) ---

    /**
     * A mock function to simulate the Python backend.
     * It returns a response object based on the player's action.
     * DELETE OR REPLACE THIS with the real fetch call above.
     */
    async function mockBackendResponse(endpoint, payload) {
        console.log("Sent to Mock Backend:", { endpoint, payload });

        // Welcome message
        if (endpoint === "/start_game") {
            return {
                avatar_response: `Welcome, ${playerData.username}! You awaken in a dark, damp cave. A faint light glows from a tunnel to your north. What do you do?`,
                narrative: "Your adventure begins.",
                stats_update: null,
                dice_roll_request: null,
                map_update: { x: 0, y: 0, location: "Starting Cave" }
            };
        }

        // Handle a dice roll result
        if (payload.dice_roll_result) {
            if (payload.dice_roll_result.roll > 10) {
                return {
                    avatar_response: `You rolled a ${payload.dice_roll_result.roll} and succeeded! The goblin is surprised and fumbles his weapon. It's your turn!`,
                    narrative: "You won the initiative roll.",
                    stats_update: null,
                    dice_roll_request: null
                };
            } else {
                return {
                    avatar_response: `You rolled a ${payload.dice_roll_result.roll} and failed... The goblin is too fast! It lunges at you, dealing 3 damage.`,
                    narrative: "You lost the initiative roll.",
                    stats_update: { hp: playerData.hp - 3 }, // Send new HP
                    dice_roll_request: null
                };
            }
        }

        // Handle text input
        const text = payload.player_text.toLowerCase();

        if (text.includes("map") || text.includes("travel")) {
             return {
                avatar_response: `You are traveling to the ${mapSelect.options[mapSelect.selectedIndex].text}... You arrive.`,
                narrative: "You have arrived at a new location.",
                map_update: { x: 1, y: 1, location: mapSelect.value }
            };
        }

        if (text.includes("look") || text.includes("north")) {
            return {
                avatar_response: "You walk north down the tunnel and see a goblin guarding a chest. He hasn't seen you yet.",
                narrative: "A new challenge appears!",
                dice_roll_request: {
                    reason: "Roll for Stealth (Dexterity)"
                }
            };
        }

        if (text.includes("attack")) {
            return {
                avatar_response: "You charge the goblin! It snarls and draws its rusty knife. You must roll for initiative!",
                narrative: "Combat has begun.",
                avatar_animation: "attack_ready",
                dice_roll_request: {
                    reason: "Roll for Initiative (Dexterity)"
                }
            };
        }

        // Default response
        return {
            avatar_response: `I don't understand "${text}". Try 'look around', 'attack', or 'travel'.`,
            narrative: null,
            stats_update: null,
            dice_roll_request: null
        };
    }

    // --- 7. Start the Game! ---
    initGame();
});
document.addEventListener("DOMContentLoaded", () => {

    // Left Column
    const mapSelect = document.getElementById("map-select");
    const mapSubmitButton = document.getElementById("map-submit-button");
    const diceContainer = document.getElementById("dice-container");
    const diceReason = document.getElementById("dice-reason");
    const rollD20Button = document.getElementById("roll-d20-button");

    // Right Column
    const avatarResponseEl = document.getElementById("avatar-response");
    const gameLogEl = document.getElementById("game-log");
    const speechBubbleEl = document.getElementById("speech-bubble");
    const playerInputForm = document.getElementById("player-input-form");
    const playerTextInput = document.getElementById("player-text-input");

    // Stats Panel
    const usernameEl = document.getElementById("player-username");
    const hpEl = document.getElementById("player-hp");
    const maxHpEl = document.getElementById("player-max-hp");
    const strEl = document.getElementById("player-str");
    const dexEl = document.getElementById("player-dex");
    const intEl = document.getElementById("player-int");

    // --- 2. Game State Variables ---
    let playerData = {};
    let isWaitingForRoll = false;


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
        mapSubmitButton.addEventListener("click", handleMapSelection);

        // Clear the log and speech bubble
        gameLogEl.innerHTML = "";
        speechBubbleEl.innerHTML = "";

        // Send the initial data to the backend to get the starting scene
        sendToBackend("/start_game", { playerData });
    }

    function loadPlayerData() {
        try {
            const data = localStorage.getItem("playerData");
            playerData = JSON.parse(data);
            return true;
        } catch (error) {
            console.error("ERROROR PLAYER DATA MESSED UP :", error);
            return false;
        }
    }

    /**
     * Updates the Stats Panel HTML with the current `playerData`.
     */
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
     * Adds a new entry to the main game log and auto-scrolls.
     * @param {string} text - The message to log.
     * @param {string} speaker - The person speaking (e.g., "Game Master", "You", "System").
     */
    function updateLog(text, speaker = "System") {
        const entry = document.createElement("p");
        entry.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        gameLogEl.appendChild(entry);

        // Auto-scroll to the bottom
        gameLogEl.scrollTop = gameLogEl.scrollHeight;
    }

    /**
     * Shows or hides the dice roller and enables/disables the text input.
     */
    function toggleControls(isRolling) {
        isWaitingForRoll = isRolling;
        diceContainer.style.display = isRolling ? "block" : "none";
        playerTextInput.disabled = isRolling;
        playerInputForm.querySelector("button").disabled = isRolling;

        if (!isRolling) {
            playerTextInput.focus();
        }
    }

    // --- 4. Event Handlers ---

    /**
     * Called when the player submits the text input form.
     */
    async function handlePlayerInput(event) {
        event.preventDefault();
        const inputText = playerTextInput.value.trim();

        if (!inputText || isWaitingForRoll) {
            return;
        }

        // Display player's action in their speech bubble
        speechBubbleEl.innerHTML = `<p><strong>You:</strong> ${inputText}</p>`;

        // Log the player's action (optional, can be redundant)
        // updateLog(inputText, "You");

        // Clear the input box
        playerTextInput.value = "";

        // Send the action to the backend
        const payload = {
            player_text: inputText,
            current_stats: playerData
        };
        await sendToBackend("/player_action", payload);
    }

    /**
     * Called when the player clicks the "Roll d20" button.
     */
    async function handleDiceRoll() {
        if (!isWaitingForRoll) return;

        // Simulate a d20 roll
        const roll = Math.floor(Math.random() * 20) + 1;

        // Get the reason for the roll from the UI
        const reason = diceReason.textContent;

        // Display the roll in the log
        updateLog(`You rolled a ${roll} for "${reason}".`, "System");

        // Send the roll result to the backend
        const payload = {
            dice_roll_result: {
                reason: reason,
                roll: roll
            },
            current_stats: playerData
        };
        await sendToBackend("/player_action", payload);
    }

    /**
     * Called when the "Load Map" button is clicked.
     */
    async function handleMapSelection() {
        const selectedMap = mapSelect.value;
        const mapText = mapSelect.options[mapSelect.selectedIndex].text;

        // This is just another form of player action
        const payload = {
            player_text: `I want to travel to the ${mapText}.`,
            current_stats: playerData,
            map_selection: selectedMap // Send a structured key as well
        };

        // Update UI to show intent
        speechBubbleEl.innerHTML = `<p><strong>You:</strong> I want to travel to the ${mapText}.</p>`;

        await sendToBackend("/player_action", payload);
    }


    // --- 5. Backend Communication ---

    /**
     * The main function for sending data to the Python backend and getting a response.
     * @param {string} endpoint - The API endpoint (e.g., "/start_game").
     * @param {object} payload - The JSON data to send.
     */
    async function sendToBackend(endpoint, payload) {

        // --- OPTION 2: Mock Backend (For testing without Python) ---
        // Comment this line out when you want to use the real backend
        //const responseData = await mockBackendResponse(endpoint, payload);
        const responseData = await

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        updateUI(responseData);
    }

    /**
     * This function receives the JSON response from the backend
     * and updates all the different parts of the UI.
     * @param {object} responseData - The JSON object from the AI.
     */
    function updateUI(responseData) {
        // 1. Update Avatar Response (Main narrative)
        if (responseData.avatar_response) {
            avatarResponseEl.innerHTML = `<p><strong>Game Master:</strong> ${responseData.avatar_response}</p>`;
        }

        // 2. Update Game Log (Secondary info)
        if (responseData.narrative) {
            updateLog(responseData.narrative, "Game Master");
        }

        // 3. Update Stats
        if (responseData.stats_update) {
            // Update the local playerData object
            Object.assign(playerData, responseData.stats_update);

            // Re-render the stats panel
            updateStatsPanel();
        }

        // 4. Handle Dice Roll Request
        if (responseData.dice_roll_request) {
            diceReason.textContent = responseData.dice_roll_request.reason;
            toggleControls(true); // Show dice
        } else {
            toggleControls(false); // Show text input
        }

        // 5. Handle Map Hook (for your three.js teammate)
        if (responseData.map_update) {
            console.log("Hook: Updating map to", responseData.map_update);
            // This is the "hook" for your teammate.
            // They need to create a function on the window called `myMap.moveTo`
            if (window.myMap && typeof window.myMap.moveTo === 'function') {
                window.myMap.moveTo(responseData.map_update.x, responseData.map_update.y);
            }
        }

        // 6. Handle Avatar Hook (for your three.js teammate)
        if (responseData.avatar_animation) {
             console.log("Hook: Playing avatar animation", responseData.avatar_animation);
            // This is the "hook" for your other teammate.
            if (window.myAvatar && typeof window.myAvatar.play === 'function') {
                window.myAvatar.play(responseData.avatar_animation);
            }
        }
    }

    // --- 6. Mock Backend Function (FOR TESTING) ---

    /**
     * A mock function to simulate the Python backend.
     * It returns a response object based on the player's action.
     * DELETE OR REPLACE THIS with the real fetch call above.
     */
    async function mockBackendResponse(endpoint, payload) {
        console.log("Sent to Mock Backend:", { endpoint, payload });

        // Welcome message
        if (endpoint === "/start_game") {
            return {
                avatar_response: `Welcome, ${playerData.username}! You awaken in a dark, damp cave. A faint light glows from a tunnel to your north. What do you do?`,
                narrative: "Your adventure begins.",
                stats_update: null,
                dice_roll_request: null,
                map_update: { x: 0, y: 0, location: "Starting Cave" }
            };
        }

        // Handle a dice roll result
        if (payload.dice_roll_result) {
            if (payload.dice_roll_result.roll > 10) {
                return {
                    avatar_response: `You rolled a ${payload.dice_roll_result.roll} and succeeded! The goblin is surprised and fumbles his weapon. It's your turn!`,
                    narrative: "You won the initiative roll.",
                    stats_update: null,
                    dice_roll_request: null
                };
            } else {
                return {
                    avatar_response: `You rolled a ${payload.dice_roll_result.roll} and failed... The goblin is too fast! It lunges at you, dealing 3 damage.`,
                    narrative: "You lost the initiative roll.",
                    stats_update: { hp: playerData.hp - 3 }, // Send new HP
                    dice_roll_request: null
                };
            }
        }

        // Handle text input
        const text = payload.player_text.toLowerCase();

        if (text.includes("map") || text.includes("travel")) {
             return {
                avatar_response: `You are traveling to the ${mapSelect.options[mapSelect.selectedIndex].text}... You arrive.`,
                narrative: "You have arrived at a new location.",
                map_update: { x: 1, y: 1, location: mapSelect.value }
            };
        }

        if (text.includes("look") || text.includes("north")) {
            return {
                avatar_response: "You walk north down the tunnel and see a goblin guarding a chest. He hasn't seen you yet.",
                narrative: "A new challenge appears!",
                dice_roll_request: {
                    reason: "Roll for Stealth (Dexterity)"
                }
            };
        }

        if (text.includes("attack")) {
            return {
                avatar_response: "You charge the goblin! It snarls and draws its rusty knife. You must roll for initiative!",
                narrative: "Combat has begun.",
                avatar_animation: "attack_ready",
                dice_roll_request: {
                    reason: "Roll for Initiative (Dexterity)"
                }
            };
        }

        // Default response
        return {
            avatar_response: `I don't understand "${text}". Try 'look around', 'attack', or 'travel'.`,
            narrative: null,
            stats_update: null,
            dice_roll_request: null
        };
    }

    // --- 7. Start the Game! ---
    initGame();
});