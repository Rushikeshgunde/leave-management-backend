const express = require('express');
const app = express();
const cors = require('cors');


// Middleware
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const port = 8000;

// test api endpoint
app.get('/test', (req, res) => {
    res.json({ message: "Backend is running 🚀" });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});