require("dotenv").config();

const express = require('express');
const path = require('path');
const app = express();

const aiReponseRouter = require('./routes/ai_response');


// const hashingRouter = require('./routes/hashing');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// app.use('/', hashingRouter);
app.use('/', aiReponseRouter);

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});