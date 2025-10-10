import { validationResult } from "express-validator";
import Project from "../models/project.model.js";  // ✅ Fixed: Changed from projectModel
import userModel from "../models/user.model.js";
import * as projectService from "../services/project.service.js";

export const createProject = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const {name} = req.body;
    const loggedInUser = await userModel.findOne({email: req.user.email});
    
    if(!loggedInUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const project = await projectService.createProject(name, loggedInUser._id);
    res.status(201).json({ message: 'Project created successfully', project });
  }
  catch(err) { 
    res.status(500).json({ message: err.message });
  }
}

export const getProjectsByUserId = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const loggedInUser = await userModel.findOne({email: req.user.email});
    
    if(!loggedInUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const projects = await projectService.getProjectsByUserId(loggedInUser._id);
    res.status(200).json({ message: 'Projects fetched successfully', projects });
  }
  catch(err) {
    res.status(500).json({ message: err.message });
  } 
}

export const addUserToProject = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { projectId, users } = req.body;
    const loggedInUser = await userModel.findOne({email: req.user.email});
    
    if(!loggedInUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const project = await projectService.addUserToProject(projectId, loggedInUser._id, users);
    res.status(200).json({ message: 'User added to project successfully', project });
  }
  catch(err) {
    res.status(500).json({ message: err.message });
  }
}

export const getAllProjectsByProjectId = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { projectId } = req.params;
    // ✅ Fixed: Pass projectId directly, not as an object
    const project = await projectService.getProjectByProjectId(projectId);
    res.status(200).json({ message: 'Project fetched successfully', project });
  }
  catch(err) {
    res.status(500).json({ message: err.message });
  }
}