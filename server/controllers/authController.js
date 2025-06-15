const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dbConfig = require("../db/pool"); // Import the database configuration
const {
  signAccessToken,
  signRefreshToken,
  validateRefreshToken,
} = require("../utils/jwtHelper");
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
    // Validate the login input
    await validateLoginInput(req.body);

    // Get the user from the database
    const userResult = await dbConfig.query(
      "SELECT id, username, password, email FROM users WHERE username = $1",
      [username]
    );
    const user = userResult.rows[0];

    // Create a JWT token
    const AccessToken = signAccessToken(user);
    const RefreshToken = signRefreshToken(user);

    return res
      .cookie("accessToken", AccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 3600 * 1000,
      })
      .cookie("refreshToken", RefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 7 * 24 * 3600 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    // 1. Extract refresh token from cookie or header
    const token = req.cookies.refreshToken;

    // 2. Verify and decode refresh token
    // 3. Check if user still exists / refresh token is still valid
    // 4. Sign and return new access token
    const { accessToken, refreshToken } = await validateRefreshToken(token);

    // 5. Return accessToken
    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 3600 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None",
        maxAge: 7 * 24 * 3600 * 1000,
      })
      .status(200)
      .json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    //1. Clear access and refresh token cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });

    res.clearCookie("refreshCookie", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });

    //2. Successful return
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(error.status || 500).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };
