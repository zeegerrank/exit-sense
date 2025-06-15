const jwt = require("jsonwebtoken");

exports.signAccessToken = (user) => {
  const { id, username } = user;
  const token = jwt.sign(
    { userId: id, username: username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h", // Token expiration time
    }
  );

  return token;
};
