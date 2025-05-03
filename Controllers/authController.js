const User = require("../Models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../configs/config");

const handleLogin = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  const foundUser = await User.findOne({ username: username }).exec();

  if (!foundUser) return res.sendStatus(401);
  const match = await bcrypt.compare(password, foundUser.password);
  if (match) {
    const roles = Object.values(foundUser.roles).filter(Boolean);
    const user_id = foundUser.user_id;
    const accessToken = jwt.sign(
      {
        UserInfo: {
          username: foundUser.username,
          roles: roles,
        },
      },
      config.accessTokenSecret,
      { expiresIn: "10s" }
    );

    const refreshToken = jwt.sign(
      { username: foundUser.username },
      config.refreshTokenSecret,
      { expiresIn: "1d" }
    );

    foundUser.refreshToken = refreshToken;
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ roles, user_id, accessToken });
  } else {
    res.sendStatus(401);
  }
};

module.exports = { handleLogin };
