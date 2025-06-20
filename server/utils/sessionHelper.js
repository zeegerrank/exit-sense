const dbConfig = require("../db/pool");

// After login
exports.createSession = async (userId, refreshToken) => {
  const newSession = await dbConfig.query(
    `INSERT INTO sessions (user_id, refresh_token, created_at, expired_at, revoked) 
    VALUES ($1, $2, NOW(), NOW() + interval '7 days', false)`,
    [userId, refreshToken]
  );

  return newSession;
};

// After refresh
exports.getSessionByToken = async (token) => {
  const foundSession = await dbConfig.query(
    `SELECT * FROM sessions 
    WHERE refresh_token = $1 AND revoked = false AND expired_at > NOW()`,
    [token]
  );

  if (!foundSession || foundSession.rowCount === 0) {
    throw new Error(`Session not found or already revoked`);
  }

  const result = foundSession.rows[0];
  return result;
};

// After refresh token found
exports.rotateSessionToken = async (oldToken, newToken) => {
  const updatedResult = await dbConfig.query(
    ` UPDATE sessions
        SET refresh_token = $1, created_at = NOW(), expired_at = NOW() + interval '7 days', revoked = false
        WHERE refresh_token = $2 AND revoked = false`,
    [newToken, oldToken]
  );

  if (!foundSession || foundSession.rowCount === 0) {
    throw new Error(`Session not found or already revoked`);
  }

  return updatedResult;
};

// Logout
exports.revokeSession = async (token) => {
  const result = await dbConfig.query(
    `UPDATE sessions SET revoked = true WHERE refresh_token = $1`,
    [token]
  );
  return result;
};

// Abuse detected
exports.revokeAllSessionsByUserId = async (userId) => {
  const result = await dbConfig.query(
    `UPDATE sessions SET revoked = true WHERE user_id = $1`,
    [userId]
  );
  return result;
};
