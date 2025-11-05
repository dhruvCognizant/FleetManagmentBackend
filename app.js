const express = require('express');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());
// Sample route
app.get('/', (req, res) => {
    res.send('Hello, World!');
}
);
module.exports = app;