import { ExpressValidator, validationResult } from "express-validator";
import projectModel from "../models/project.model";
import userModel from "../models/user.model"
import * as projectService from "../services/project.service"

export const createProject = async (req ,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try{
  const {name} = req.body;
  const loggedInUserId = await userModel.findOne({email: req.user.email});
  const project = await projectService.createProject(name, loggedInUserId._id);
  res.status(201).json({ message: 'Project created successfully', project });
  }
  catch(err){ 
    res.status(500).json({ message: err.message });
  }
}

export const getProjectsByUserId = async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try{
    const loggedInUserId = await userModel.findOne({email: req.user.email});
    const projects = await projectService.getProjectsByUserId(loggedInUserId._id);
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
  try{
    const { projectId, users } = req.body;
    const loggedInUserId = await userModel.findOne({email: req.user.email});
    const project = await projectService.addUserToProject(projectId, loggedInUserId._id, users);
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
  try{
    const { projectId } = req.params;
    const project = await projectService.getProjectByProjectId({projectId});
    res.status(200).json({ message: 'Project fetched successfully', project });
  }
  catch(err) {
    res.status(500).json({ message: err.message });
  }
}