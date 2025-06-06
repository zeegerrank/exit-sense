// index.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (optional)
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello from Express!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
