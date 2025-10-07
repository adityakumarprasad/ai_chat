import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../config.js/axios";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/users/register', { email, password })
      .then(response => {
        console.log('Login successful:', response.data);


        navigate('/');
      })
      .catch(error => {
        console.error('There was an error logging in!', error);
        alert('Login failed. Please check your credentials and try again.');
      });
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-black to-blue-900 flex items-center justify-center">
      <div className="w-[400px] bg-gray-900 p-10 rounded-2xl shadow-2xl border border-gray-800">
        {/* Title */}
        <h2 className="text-3xl font-bold text-blue-500 text-center mb-8">
          Register
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
              className="w-full mt-2 px-4 py-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm text-gray-300">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              required
              className="w-full mt-2 px-4 py-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Register
          </button>
        </form>

        {/* Register Link */}
        <p className="mt-8 text-center text-gray-400">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-blue-500 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}