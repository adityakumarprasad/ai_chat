import * as userService from "../services/user.service.js";
import User from "../models/user.model.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";

// Create User
export const createUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await userService.createUser(req.body.email, req.body.password);
    const token = user.generateAuthToken();

    delete user._doc.password;

    res.cookie("token", token, {
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login User
export const loginUserController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    const isMatch = await user.isPasswordMatch(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = user.generateAuthToken();
    delete user._doc.password;

    res.cookie("token", token, {
  
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Profile
export const profileController = (req, res) => {
  res.status(200).json({
    message: "User profile",
    user: req.user,
  });
};

// Logout
export const logoutController = (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    redisClient.set(token, "blacklisted", "EX", 3600 * 24);

    res.clearCookie("token");

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Users
export const getAllUsersController = async (req, res) => {
  try {
    const loggedInUser = await User.findOne({ email: req.user.email });
    const users = await userService.getAllUsers(loggedInUser._id);

    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
