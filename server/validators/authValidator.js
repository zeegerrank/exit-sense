const dbConfig = require("../db/pool"); // Import the database configuration

exports.validateRegisterInput = async (body) => {
  const { username, password, email } = body;

  // Check if username, password, and email are provided
  if (!username || !password || !email) {
    const error = new Error(
      "Registration require username, password and email"
    );
    error.status = 400;
    throw error;
  }

  // Check if the username is valid (at least 3 characters)
  if (username.length < 3) {
    const error = new Error("Username must be at least 3 characters long");
    error.status = 422;
    throw error;
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
    const error = new Error("Conflict for duplication");
    error.status = 409;
    throw error;
  }
};

exports.validateLoginInput = async (body) => {
  const { username, password } = body;
  // Check if username and password are provided
  if (!username || !password) {
    // return res
    //   .status(400)
    //   .json({ error: "Username and Password are required" });
    const error = new Error("Username and Password are required");
    error.status = 400;
    throw error;
  }

  // Check if the username exists
  const userResult = await dbConfig.query(
    "SELECT id, username, password, email FROM users WHERE username = $1",
    [username]
  );
  if (userResult.rowCount === 0) {
    // return res.status(404).json({ error: "Invalid credential" });
    const error = new Error("User not found");
    error.status = 400;
    throw error;
  }
  const user = userResult.rows[0];

  // Compare the provided password with the hashed password in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // return res.status(401).json({ error: "Invalid credential" });
    const error = new Error("Invalid credential");
    error.status = 401;
    throw error;
  }
};
