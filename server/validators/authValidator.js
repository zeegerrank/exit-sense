const dbConfig = require("../db/pool"); // Import the database configuration
const { throwWith } = require("../utils/throwWith");
const bcrypt = require("bcrypt");

exports.validateRegisterInput = async (body) => {
  const { username, password, email } = body;

  // Check if username, password, and email are provided
  if (!username || !password || !email) {
    // const error = new Error(
    //   "Registration require username, password and email"
    // );
    // error.status = 400;
    // throw error;
    throwWith(400, "Registration require username, password and email");
  }

  // Check if the username is valid (at least 3 characters)
  if (username.length < 3) {
    // const error = new Error("Username must be at least 3 characters long");
    // error.status = 422;
    // throw error;
    throwWith(422, "Username must be at least 3 characters long");
  }

  // Check duplicate username and email
  const userExists = await dbConfig.query(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );

  const emailExists = await dbConfig.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (userExists.rowCount > 0 || emailExists.rowCount > 0) {
    // const error = new Error("Conflict for duplication");
    // error.status = 409;
    // throw error;
    throwWith(409, "Conflict for duplication");
  }
};

exports.validateLoginInput = async (body) => {
  const { username, password } = body;
  // Check if username and password are provided
  if (!username || !password) {
    // return res
    //   .status(400)
    //   .json({ error: "Username and Password are required" });
    // const error = new Error("Username and Password are required");
    // error.status = 400;
    // throw error;
    throwWith(400, "Username and Password are required");
  }

  // Check if the username exists
  const userResult = await dbConfig.query(
    "SELECT id, username, password, email FROM users WHERE username = $1",
    [username]
  );
  if (userResult.rowCount === 0) {
    // return res.status(404).json({ error: "Invalid credential" });
    // const error = new Error("User not found");
    // error.status = 404;
    // throw error;
    throwWith(404, "User not found");
  }
  const user = userResult.rows[0];

  // Compare the provided password with the hashed password in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // return res.status(401).json({ error: "Invalid credential" });
    // const error = new Error("Invalid credential");
    // error.status = 401;
    // throw error;
    throwWith(401, "Invalid credential");
  }
};
