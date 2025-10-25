// Wait for the HTML document to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {

    // Find the character creation form by its ID
    const characterForm = document.getElementById("character-form");

    // Add an event listener that triggers when the form is submitted (button click)
    characterForm.addEventListener("submit", (event) => {

        // --- 1. Prevent Default Action ---
        // Stop the form from submitting and reloading the page
        event.preventDefault();

        // --- 2. Get Form Values ---
        // Get the values from each input field by their ID
        const username = document.getElementById("username").value;
        const strength = parseInt(document.getElementById("strength").value, 10);
        const dexterity = parseInt(document.getElementById("dexterity").value, 10);
        const intelligence = parseInt(document.getElementById("intelligence").value, 10);

        // --- 3. Create Player Data Object ---
        // Assemble all the stats into a single object
        const playerData = {
            username: username,
            stats: {
                str: strength,
                dex: dexterity,
                int: intelligence
            },
            hp: 100,
            maxHp: 100 // Set maxHp to the starting HP
        };

        // --- 4. Save to localStorage ---
        // Convert the object into a JSON string and save it in the browser's storage.
        // This is how we pass the data to the next page.
        try {
            localStorage.setItem("playerData", JSON.stringify(playerData));

            // --- 5. Redirect to Game Page ---
            // If saving was successful, send the user to game.html
            window.location.href = "game.html";

        } catch (error) {
            console.error("Could not save player data to localStorage:", error);
            alert("Error: Could not start the game. Please ensure cookies/localStorage are enabled.");
        }
    });
});