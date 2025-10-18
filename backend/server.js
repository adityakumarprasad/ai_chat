
import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import app from './app.js'
import connect from './db/db.js' 
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import mongoose from 'mongoose';
import Project from './models/project.model.js'
import cors from "cors"

connect()

const server = http.createServer(app)

const io = new Server(server, { 
  cors: { 
    origin: "*", // Adjust this to your frontend's origin
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.use( async (socket, next) => {
  try {
    const projectId = socket.handshake.query.projectId;
    if(projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid Project ID"));
    }
    if(!projectId) {
      return next(new Error("Project ID is required"));
    }
    socket.project = await Project.findById(projectId);
    if(!socket.project) {
      return next(new Error("Project not found"));
    }
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: token missing"));
    }

    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user) {
      return next(new Error("Authentication error: invalid token"));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.log("Socket.IO auth error:", error);
    next(new Error("Authentication failed"));
  }
});

io.on("connection",(socket)=>{
  console.log("connected to socket.io")
  socket.join(socket.project._id.toString());
  socket.on("project_message", (data) => {

      console.log("Received project message:", data);
    io.to(socket.project._id.toString()).emit("project_message", data);

  });
  socket.on("event" , (data)=>{
    console.log(data)
  })

  
  socket.on("disconnect",()=>{
    console.log("disconnected from socket.io")
  })
})

const PORT = process.env.PORT || 5000


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})