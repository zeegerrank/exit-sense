const dbConfig = require("../db/pool"); // Import the database configuration

exports.registerUserService = async (username, password, email) => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert the new user into the database
  const newUser = await dbConfig.query(
    "INSERT INTO users (username,password,email) VALUES ($1,$2,$3) RETURNING id, username, email",
    [username, hashedPassword, email]
  );

  return newUser.rows[0];
};
