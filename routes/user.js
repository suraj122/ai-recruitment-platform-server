import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { userName, userEmail, userPassword } = req.body;
  const user = await User.findOne({ userEmail });

  if (user) {
    return res.json({ message: "User already exists" });
  }

  const hashPassword = await bcrypt.hash(userPassword, 10);

  const newUser = new User({
    userName,
    userEmail,
    userPassword: hashPassword,
  });

  await newUser.save();
  return res.json({ status: true, message: "You are now registered" });
});

router.post("/signin", async (req, res) => {
  const { userEmail, userPassword } = req.body;

  const user = await User.findOne({ userEmail });
  if (!user) {
    return res.json({ message: "User not found" });
  }

  const validPassword = await bcrypt.compare(userPassword, user.userPassword);

  if (!validPassword) {
    return res.json({ message: "Password is incorrect" });
  }

  const token = jwt.sign({ username: user.userName }, process.env.key, {
    expiresIn: "1h",
  });
  res.cookie("token", token, { httpOnly: true, maxAge: 360000 });
  return res.json({ status: true, message: "Login successfull" });
});

export { router as UserRouter };
