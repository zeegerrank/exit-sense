const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dbConfig = require("../db/pool"); // Import the database configuration
const { signAccessToken } = require("../utils/jwtHelper");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../validators/authValidator");
const { registerUserService } = require("../services/authService");

const registerUser = async (req, res) => {
  // Deconstructing the request body to get username, password, and email
  const { username, password, email } = req.body;
  try {
    //use Register Validator
    await validateRegisterInput(req.body);
    // use RegisterUser service
    const newUser = await registerUserService(username, password, email);

    // Respond with the newly created user
    return res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    await validateLoginInput(req.body);
    const userResult = await dbConfig.query(
      "SELECT id, username, password, email FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    // Create a JWT token
    const token = signAccessToken(user);

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
    console.error("Error:", error.message);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser };
