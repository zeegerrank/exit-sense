const jwt = require("jsonwebtoken");
const dbConfig = require("../db/pool");
const { throwWith } = require("./throwWith");

exports.signAccessToken = (user) => {
  // 1. Deconstruct user entity
  const { id, username } = user;

  // 2. Sign access token
  const token = jwt.sign(
    { userId: id, username: username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h", // Token expiration time
    }
  );

  // 3. Return Signed Access Token
  return token;
};
exports.signRefreshToken = (user) => {
  // 1. Get user id by deconstruct entity
  const { id } = user;

  // 2. Sign refresh token
  const token = jwt.sign({ userId: id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d", // Token expiration time
  });

  // 3. Return Signed Refresh Token
  return token;
};

exports.validateRefreshToken = async (token) => {
  // 1. Verify and decode received token
  const decodedData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  // 2. Get user id and find it in database
  const { userId } = decodedData;
  const userResult = await dbConfig.query(
    "SELECT id, username FROM users WHERE id = $1",
    [userId]
  );

  // 3. Throw error if not found
  if (userResult.rowCount === 0) {
    throwWith(404, "User not found");
  }
  const user = userResult.rows[0];

  // 4. Re-create access and refresh token
  const accessToken = exports.signAccessToken(user);
  const refreshToken = exports.signRefreshToken(user);

  // 5. Return access and refresh token
  return { accessToken, refreshToken };
};
