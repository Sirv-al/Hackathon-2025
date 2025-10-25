// require("dotenv").config();
// const express = require('express');
// const path = require('path');
// const app = express();

// const aiReponseRouter = require('./routes/ai_response');

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'dist'))); // Serve built Vite files
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', aiReponseRouter);

// // Routes - Serve the built index.html
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

// // // Handle client-side routing (if using SPA routing)
// // app.get('/*', (req, res) => {
// //     res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// // });

// const PORT = process.env.PORT || 8080;
// const server = app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}/`);
// });