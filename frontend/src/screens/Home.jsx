import { useState } from "react";
import React from "react";
import { Link, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../config.js/axios";

export default function Home() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Creating project:", { projectName });

    axios.post('/projects/create', { name: projectName })
      .then(response => {
        console.log('Project created successfully:', response.data);
        setProjectName("");
        setIsOpen(false);
        navigate(`/project?id=${response.data.project._id}`);
      })
      .catch(error => {
        console.error('There was an error creating the project!', error);
      });
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-blue-900 to-blue-950 flex items-center justify-center p-4">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 hover:scale-105"
      >
        <Link className="w-5 h-5" />
        <span>Open Project</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-blue-900 rounded-2xl shadow-2xl border border-blue-500/30 p-8">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Create New Project
              </h2>
              <p className="text-gray-400 text-sm">
                Enter your project details below
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label
                  htmlFor="projectName"
                  className="block text-sm font-medium text-blue-300 mb-2"
                >
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-4 py-3 bg-black/50 border border-blue-500/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              >
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}