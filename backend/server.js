import 'dotenv/config';
import http from 'http'
import app from './app.js'
import connect from './db/db.js' 
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import mongoose from 'mongoose';
import Project from './models/project.model.js'
import { createRedisClient } from './services/redis.service.js';
import { createFallbackRedisClient } from './config/services.js';
import { getEnvConfig } from './config/env.js';

const env = getEnvConfig();

const server = http.createServer(app)

const io = new Server(server, { 
  cors: { 
    origin: env.clientUrls,
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
    socket.broadcast.to(socket.project._id.toString()).emit("project_message", data);

  });
  socket.on("event" , (data)=>{
    console.log(data)
  })

  
  socket.on("disconnect",()=>{
    console.log("disconnected from socket.io")
  })
})

async function bootstrap() {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  await connect(env.mongoUri);

  const redisClient = createRedisClient(env.redisUrl);
  if (redisClient) {
    await redisClient.connect();
    app.locals.redisClient = redisClient;
  } else {
    console.warn("REDIS_URL is not configured. Falling back to in-memory token blacklist.");
    app.locals.redisClient = createFallbackRedisClient();
  }

  server.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Server bootstrap failed:", error);
  process.exit(1);
});
