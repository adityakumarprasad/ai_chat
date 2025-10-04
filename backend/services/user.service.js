import User from '../models/user.model.js';
export async function createUser(email, password) {
 if(!email || !password) {
   throw new Error('Email and password are required');
 } 
 const hashedPassword = await User.hashPassword(password);
 const newUser = await new User({ email, password: hashedPassword });
 return newUser;
}