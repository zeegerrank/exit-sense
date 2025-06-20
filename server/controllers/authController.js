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
const {
  createSession,
  getSessionByToken,
  rotateSessionToken,
  revokeSession,
} = require("../utils/sessionHelper");
const { throwWith } = require("../utils/throwWith");

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
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    // Deconstruct user object for session creation
    const { id: userId } = user;
    // Create new session into database
    const newSession = await createSession(userId, refreshToken);

    // Log the session creation process
    if (process.env.NODE_ENV !== "production") {
      const { user_id, created_at, expired_at, revoked } = newSession;
      console.log(
        "New session is created: ",
        user_id,
        created_at,
        expired_at,
        revoked
      );
    }

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
    const { accessToken, refreshToken: newRefreshToken } =
      await validateRefreshToken(token);

    // Validate refresh token with sessions table
    const validSession = await getSessionByToken(newRefreshToken);
    // Deconstruct object for token rotation process
    const { refresh_token: oldRefreshToken } = validSession;
    // Rotate refresh token
    const rotationResult = await rotateSessionToken(
      oldRefreshToken,
      newRefreshToken
    );
    // Log rotation result in development env only
    if (process.env.NODE_ENV !== "production") {
      console.log(rotationResult);
    }

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
    // Revoke session using refresh token
    const { refreshToken } = req.cookies;
    // Check if refresh token provided
    if (!refreshToken) {
      throwWith(400, "No refresh token provided");
    }
    const revokeResult = await revokeSession(refreshToken);
    // Log revoke result in development env only
    if (process.env.NODE_ENV !== "production") {
      console.log(revokeResult);
    }

    //1. Clear access and refresh token cookies
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    });

    res.clearCookie("refreshToken", {
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
