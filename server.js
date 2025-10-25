require("dotenv").config();

const express = require('express');
const path = require('path');
const app = express();

const WebSocket = require('ws');
const { GeminiModel } = require('./routes/ai_response');


// const hashingRouter = require('./routes/hashing');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// app.use('/', hashingRouter);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

// websocket for ai
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
    console.log('Client connected');
    
    ws.on('message', async function incoming(message) {
        const data = JSON.parse(message);

        model = new GeminiModel();

        await model.generateContent(data.text, ws);
    });

    ws.on('close', function () {
        console.log('Client disconnected');
    });

    ws.on('error', function (err) {
        console.error('WebSocket error:', err);
    });
});



