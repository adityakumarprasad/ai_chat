import express from "express";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/user.model.js";
import { createUser } from "../services/user.service.js";
import * as userController from "../controllers/user.controller.js";
const router = Router();
router.post('/register', 
  body('email').isEmail().withMessage('must be valid email format'),
  body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
  userController.createUserController
);

export default router;