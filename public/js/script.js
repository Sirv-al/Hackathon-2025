function wsAIResponse(userInput) {
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const wsUrl = isLocalHost ? `ws://${window.location.host}` : `wss://${window.location.host}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = function () {
            console.log("WebSocket connection opened");

            const dataToSend = JSON.stringify({ text: userInput });

            ws.send(dataToSend);
        };

        ws.onmessage = function (event) {
            const dataObj = JSON.parse(event.data);

            if (dataObj.error) {
                console.error("AI Error:", dataObj.error);
                alert("Error: " + dataObj.error);
                return;
            }

            if (dataObj.event === 'end') {
                console.log("AI stream ended");
                return;
            }

            document.getElementById('response').innerText += dataObj.text;
        };

        ws.onclose = function () {
            console.log("WebSocket connection closed");
        };

        ws.onerror = function (error) {
            console.error("WebSocket error:", error);
            alert("An error occurred while connecting to the server. Please try again.");
        };
}

document.getElementById('saveForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const userInput = event.target.request.value;
    document.getElementById('response').innerText = ''; // reset output
    try {
        wsAIResponse(userInput);
    } catch (error) {
        document.getElementById('response').innerText = `Error: ${error.message}`;
    }
});