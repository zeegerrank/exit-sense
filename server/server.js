// index.js
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;
// Database connection
const dbConfig = require("./db/pool");

// Import middleware
const cookieParser = require("cookie-parser");

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes

// Check if the database is connected
app.get("/", async (req, res) => {
  try {
    const result = await dbConfig.query("SELECT NOW() AS current_time");
    const dbName = dbConfig.options.database;
    res.json({
      server: "OK",
      database: "OK",
      database_name: dbName,
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Importing routes
const authRoute = require("./routes/authRoute");

// Using routes
app.use("/api/auth", authRoute);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
