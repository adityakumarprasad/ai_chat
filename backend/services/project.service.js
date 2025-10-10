import mongoose from "mongoose";
import Project from "../models/project.model.js";

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
  
  // ✅ Fixed: Check if the logged-in user is part of the project
  const project = await Project.findOne({_id: projectId, users: userId});  
  console.log(project);
  
  if(!project) {
    throw new Error('User is not authorized to add members to this project');
  } 
  
  const updatedProject = await Project.findOneAndUpdate(
    { _id: projectId },
    {
      $addToSet: {
        users: {
          $each: users
        }
      }
    },
    { new: true }
  ).populate('users');  // ✅ Added populate to return full user details
  
  return updatedProject;
}

export async function getProjectByProjectId(projectId) {
  // ✅ Fixed: Accept projectId as a string parameter
  if(!projectId) {
    throw new Error('Project ID is required');
  } 
  if(!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error('Invalid Project ID');
  } 
  const project = await Project.findOne({_id: projectId}).populate('users');
  
  if(!project) {
    throw new Error('Project not found');
  }
  
  return project;
}