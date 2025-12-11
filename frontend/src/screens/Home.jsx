import { useState, useEffect } from "react";
import React from "react";
import { Link, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../config.js/axios";

export default function Home() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = () => {
    axios.get('/projects/all')
      .then(response => {
        console.log('Projects fetched:', response.data);
        setProjects(response.data.projects);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Creating project:", { projectName });

    axios.post('/projects/create', { name: projectName })
      .then(response => {
        console.log('Project created successfully:', response.data);
        setProjectName("");
        setIsOpen(false);
        // Refresh project list
        fetchProjects();
        // Navigate to the new project
        navigate(`/project?id=${response.data.project._id}`);
      })
      .catch(error => {
        console.error('There was an error creating the project!', error);
      });
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project?id=${projectId}`);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-black via-blue-900 to-blue-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-black via-blue-900 to-blue-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          My Projects
        </h1>

        {/* Create New Project Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Link className="w-5 h-5" />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl mb-4">No projects yet</p>
            <p className="text-sm">Create your first project to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => handleProjectClick(project._id)}
                className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 border border-blue-500/30 hover:border-blue-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <i className="ri-folder-line text-2xl text-white"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg truncate">
                      {project.name}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <i className="ri-team-line"></i>
                  <span>{project.users?.length || 0} members</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
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