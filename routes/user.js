import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = express.Router();

// Signup Endpoint
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

// Login Endpoint
router.post("/signin", async (req, res) => {
  const { userEmail, userPassword } = req.body;

  const user = await User.findOne({ userEmail });
  if (!user) {
    return res.json({ staus: false, message: "User not found" });
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

// Forgot Password Endpoint
router.post("/forgot-password", async (req, res) => {
  const { userEmail } = req.body;
  try {
    const user = await User.findOne({ userEmail });

    if (!user) {
      res.json({ status: false, message: "User not found" });
    }

    const token = jwt.sign({ id: user._id }, process.env.KEY, {
      expiresIn: "5m",
    });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "122suraj0@gmail.com",
        pass: "kwad pyco jmtm voam",
      },
    });

    const mailOptions = {
      from: "122suraj0@gmail.com",
      to: userEmail,
      subject: "Reset your password for AI recruitment platform",
      text: `http://localhost:3000/reset-password/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.json({ message: "Error sending an email" });
      } else {
        return res.json({ status: true, message: "Email sent" });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

// Reset Password Endpoint
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { userPassword } = req.body;

  try {
    const decoded = await jwt.verify(token, process.env.KEY);
    const id = decoded.id;
    const hashPassword = await bcrypt.hash(userPassword, 10);
    await User.findByIdAndUpdate({ _id: id }, { userPassword: hashPassword });
    return res.json({ status: true, message: "Password Updated" });
  } catch (error) {
    return res.json({
      status: false,
      message: "Token expired, please send another mail to reset password",
    });
  }
});

// Verify User
const verifyUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.json({ status: false, message: "Token not found" });
    }
    const decoded = await jwt.verify(token, process.env.KEY);
    next();
  } catch (error) {
    console.log(error);
  }
};
router.get("/verify", verifyUser, (req, res) => {
  return res.json({ status: true, message: "Authorized" });
});

// Logout

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ status: true });
});

export { router as UserRouter };
