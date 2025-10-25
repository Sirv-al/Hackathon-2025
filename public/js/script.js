document.getElementById('saveForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const userInput = event.target.request.value;
    document.getElementById('response').innerText = ''; // reset output
    
    
    // call ai_response ai function then set response (id) to the returned value
    const responseElement = document.getElementById('response');
    responseElement.innerHTML = 'Generating...';

    try {
        const res = await fetch('/ai_response', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: userInput })
        });

        if (!res.ok) {
            throw new Error('AI request failed');
        }

        const data = await res.json();
        responseElement.innerText = data.text || 'No response from AI';
    } catch (err) {
        console.error(err);
        responseElement.innerText = "Error: " + err.message;
    }
});