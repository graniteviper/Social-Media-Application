import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { OTPModel } from "../models/userModel.js";
import nodemailer from "nodemailer";

/* REGISTER USER */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      picturePath,
      friends,
      location,
      occupation,
    } = req.body;

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      picturePath,
      friends,
      location,
      occupation,
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* LOG IN USER */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ msg: "User does not exist!" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials." });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    delete user.password;
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendotp = async (req, res) => {
  try {
    const email = req.body.email;
    // console.log(email);
    const otp = generateOTP();
    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailDetails = {
      from: process.env.EMAIL,
      to: email,
      subject: "OTP for verification from OneWorld",
      text: `OTP for Authentication is ${otp}`,
    };
    mailTransporter.sendMail(mailDetails, async function (err, data) {
      if (err) {
        console.log("Error Occurs:", err);
        res.status(400).json({
          error: "Error occurred",
        });
      } else {
        console.log("Email sent successfully");
        const otpResponse = await OTPModel.create({
          email: email,
          otp: otp,
        });
        res.status(200).json({
          message: "OTP sent successfully.",
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const otp = req.body.otp;
    const email = req.body.email;
    // console.log(otp);
    // console.log(email);
    if (!otp || !email) {
      res.status(400).json({
        error: "Missing data",
      });
      return;
    }
    const otpObject = await OTPModel.findOne({
      email: email,
    });
    // console.log(otpObject);
    
    if (!otpObject) {
      res.status(400).json({
        message: "No OTP Found.",
      });
      return;
    }
    
    if (otpObject.otp === otp) {
      // console.log(true);
      res.status(200).json({
        message: "OTP verified.",
      });
      return;
    } else {
      // console.log(false);
      res.status(400).json({
        message: "OTP is invalid",
      });
      return;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    return;
  }
};

function generateOTP() {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}
