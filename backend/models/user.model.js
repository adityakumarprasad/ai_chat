
import connectDB from "../db/db.js"; 
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
connectDB();
const userSchema = new mongoose.Schema({
  email: {  
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 5,
    maxLength: 50,
    lowercase: true,
  },
  password: { 
    type: String,
    required: true,
    select: false,
  },    
})

userSchema.static.hashPassword = async function(password) {
 
  return await bcrypt.hash(password, 10);
}

userSchema.method.isPasswordMatch = async function(password) {
  return await bcrypt.compare(password, hashPassword);
}

userSchema.method.generateAuthToken = function() {
  return  jwt.sign(
    { _id: this._id, email: this.email }, process.env.JWT_SECRET)  
  }

const User = mongoose.model("User", userSchema);
export default User;