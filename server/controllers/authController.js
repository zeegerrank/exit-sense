const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dbConfig = require("../db/pool"); // Import the database configuration

const registerUser = async (req, res) => {
  // Deconstructing the request body to get username, password, and email
  const { username, password, email } = req.body;

  // Check if username, password, and email are provided
  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ error: "Username, Password and Email are required" });
  }

  // Check if the username is valid (at least 3 characters)
  if (username.length < 3) {
    return res
      .status(400)
      .json({ error: "Username must be at least 3 characters long" });
  }

  // Check duplicate username and email
  try {
    const userExists = await dbConfig.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const emailExists = await dbConfig.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rowCount > 0 || emailExists.rowCount > 0) {
      return res.status(409).json({ error: "Conflict for duplication" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const newUser = await dbConfig.query(
      "INSERT INTO users (username,password,email) VALUES ($1,$2,$3) RETURNING id, username, email",
      [username, hashedPassword, email]
    );

    // Respond with the newly created user
    return res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  // Check if username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and Password are required" });
  }

  // Check if the username exists
  try {
    const userResult = await dbConfig.query(
      "SELECT id, username, password, email FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "Invalid credential" });
    }
    const user = userResult.rows[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credential" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // Token expiration time
      }
    );

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token, // Include the JWT token in the response
    });
  } catch (error) {
    console.error("Database query error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { registerUser, loginUser };
