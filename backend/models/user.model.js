
import connectDB from "../db/db.js"; 
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

userSchema.statics.hashPassword = async function(password) {
 
  return await bcrypt.hash(password, 10);
}

userSchema.methods.isPasswordMatch = async function(password) {
  return await bcrypt.compare(password, this.password);
}
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { _id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}


const User = mongoose.model("User", userSchema);
export default User;