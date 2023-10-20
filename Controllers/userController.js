const User = require("../Models/userModel");
const bcrypt = require("bcrypt");

const { v4: uuidv4 } = require("uuid");

const createUser = async (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  // check for duplicate usernames in the db
  const duplicateUser = await User.findOne({ username: username }).exec();
  if (duplicateUser) return res.sendStatus(409); //Conflict

  const duplicateEmail = await User.findOne({ email: email }).exec();
  if (duplicateEmail) return res.sendStatus(409); //Conflict

  try {
    //encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);

    //create and store the new user
    await User.create({
      username: username,
      user_id: uuidv4(),
      email: email,
      password: hashedPwd,
    });

    res.status(201).json({ success: `New user ${username} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllUsers = async (req, res, next) => {
  const user = await User.find();

  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  res.send(user);
};

const getUserById = async (req, res, next) => {
  const { user_id } = req.params;

  const user = await User.findOne({ user_id });

  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  res.send(user);
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
};
