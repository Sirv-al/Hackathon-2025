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
    });

    // --- GAME LOGIC SETUP ---
    const aiDisabled = true;

    // DOM elements
    const diceContainer = document.getElementById("dice-container");
    const diceReason = document.getElementById("dice-reason");
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

    function updateLog(text, speaker = "System") {
        const entry = document.createElement("p");
        entry.innerHTML = `<strong>${speaker}:</strong> ${text}`;
        gameLogEl.appendChild(entry);
        gameLogEl.scrollTop = gameLogEl.scrollHeight;
    }

    function toggleControls(isRolling) {
        isWaitingForRoll = isRolling;
        diceContainer.style.display = isRolling ? "block" : "none";
        playerTextInput.disabled = isRolling;
        playerInputForm.querySelector("button").disabled = isRolling;
        if (!isRolling) playerTextInput.focus();
    }

    async function handlePlayerInput(e) {
        e.preventDefault();
        const inputText = playerTextInput.value.trim();
        if (!inputText || isWaitingForRoll) return;

        speechBubbleEl.innerHTML = `<p><strong>You:</strong> ${inputText}</p>`;
        playerTextInput.value = "";

        await sendToAI("/player_action", {
            player_text: inputText,
            current_stats: playerData
        });
    }

    async function handleDiceRoll() {
        if (!isWaitingForRoll) return;
        const roll = Math.floor(Math.random() * 20) + 1;
        const reason = diceReason.textContent;
        updateLog(`You rolled a ${roll} for "${reason}".`, "System");
        await sendToAI("/dice_roll", roll);
    }

    async function handleMapSelection() {
        const selectedMap = mapSelect.value;
        const mapText = mapSelect.options[mapSelect.selectedIndex].text;
        speechBubbleEl.innerHTML = `<p><strong>You:</strong> I want to travel to the ${mapText}.</p>`;

        // Update map immediately
        if (cleanupMapScene) cleanupMapScene();
        cleanupMapScene = initMapScene(mapContainerId, selectedMap.toLowerCase());

        await sendToAI("/player_action", {
            player_text: `I want to travel to the ${mapText}.`,
            current_stats: playerData,
            map_selection: selectedMap
        });
    }

    async function sendToAI(endpoint, payload) {
        if (aiDisabled) return;
        try {
            const res = await fetch('/ai_response', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint, payload })
            });
            const data = await res.json();
            updateUI(data.text);
        } catch (err) {
            console.error("AI error:", err);
        }
    }

    function updateUI(responseData) {
        avatarResponseEl.innerHTML = `<p><strong>Game Master:</strong> ${responseData}</p>`;
    }

    function initGame() {
        if (!loadPlayerData()) {
            window.location.href = "index.html";
            return;
        }
        updateStatsPanel();
        playerInputForm.addEventListener("submit", handlePlayerInput);
        rollD20Button.addEventListener("click", handleDiceRoll);
        loadButton.addEventListener("click", handleMapSelection);
    }

    initGame();
});
