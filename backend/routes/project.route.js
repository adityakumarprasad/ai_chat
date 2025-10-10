import express from 'express';
import { body, param } from 'express-validator';
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as projectController from '../controllers/project.controller.js';
const router = express.Router();

router.post('/create',authMiddleware,body('name').isString().withMessage('Name is required')  ,projectController.createProject);


router.get('/all',authMiddleware,projectController.getProjectsByUserId);


router.put('/add-user',authMiddleware, body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array of strings').bail()
        .custom((users) => users.every(user => typeof user === 'string')).withMessage('Each user must be a string'),projectController.addUserToProject);

router.get('/get-project/:projectId',
  authMiddleware,
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  projectController.getAllProjectsByProjectId
);

export default router;