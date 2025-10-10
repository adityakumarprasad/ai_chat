import User from '../models/user.model.js';
export async function createUser(email, password) {
 if(!email || !password) {
   throw new Error('Email and password are required');
 } 
 const hashedPassword = await User.hashPassword(password);
 const newUser = new User({ email, password: hashedPassword });
 await newUser.save();
 return newUser;
}

export const getAllUsers = async (excludeUserId) => {
  if(!excludeUserId) {
    throw new Error('User ID is required to fetch users');
  }
  const users = await User.find({ _id: { $ne: excludeUserId } }).select('-password');
  return users;
}