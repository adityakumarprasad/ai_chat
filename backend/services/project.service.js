import mongoose from "mongoose";
import Project from "../models/project.model";
import { ExpressValidator } from "express-validator";
export async function createProject(name, userId) {
  if(!name) {
    throw new Error('Project name is required');
  } 
  if(!userId) {
    throw new Error('User ID is required to create a project');
  } 
  let project;
  try {
    project = await Project.create({ name, users: [userId] });
  }
  catch(err) {
    throw new Error('Error creating project: ' + err.message);
  }
  return project;
}
export async function getProjectsByUserId(userId) {
  if(!userId) {
    throw new Error('User ID is required to fetch projects');
  }
  let projects;
  try {
    projects = await Project.find({ users: userId });
  }
  catch(err) {
    throw new Error('Error fetching projects: ' + err.message);
  }
  return projects;
}
export async function addUserToProject(projectId, userId, users) {
  if(!projectId) {
    throw new Error('Project ID is required');
  } 
  if(!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error('Invalid Project ID');
  }
  if(!userId) {
    throw new Error('User ID is required to add to project');
  }
  if(!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid User ID');
  }
  const project = await Project.findOne({_id: projectId , users: users});  
  console.log(project)
  if(!project) {
    throw new Error('user is not valid to add members ');
  } 
  const updatedProject = await Project.findOneAndUpdate(
    {
      _id: projectId },
       {
      $addToSet: {
        users: {
          $each: users
        }
      }
    },
    { new: true }
  )
  
  return updatedProject;
}

export async function getProjectByProjectId(projectId) {
  if(!projectId) {
    throw new Error('Project ID is required');
  } 
  if(!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error('Invalid Project ID');
  } 
  const project = await Project.findOne({_id: projectId}).populate('users')
  return project;
}
