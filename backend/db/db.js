import mongoose from "mongoose";
function connectDB() {
  mongoose.connect(process.env.MONGODB_KEY ).then(() => {
    console.log("MongoDB connected");
  }).catch((err) => {
    console.log("MongoDB connection error: ", err);
  });
}

export default connectDB;