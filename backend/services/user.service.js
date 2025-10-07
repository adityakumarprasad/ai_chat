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