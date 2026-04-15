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
      <div className="min-h-[calc(100vh-158px)] w-full bg-transparent flex items-center justify-center px-4 py-16">
        <div className="text-white text-xl">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-158px)] w-full flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl"></div>
      <div className="w-full max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.5em] text-cyan-200/70">AI Collaboration Workspace</p>
          <h1 className="app-glow text-5xl font-black text-white md:text-6xl">
            Collab-Ai
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            Real-time teamwork, AI-assisted project scaffolding, and a smoother launchpad for your next build.
          </p>
        </div>

        {/* Create New Project Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-6 py-3 text-white shadow-[0_0_30px_rgba(34,211,238,0.18)] transition-all duration-300 hover:scale-105 hover:bg-cyan-300/20"
          >
            <Link className="w-5 h-5" />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 text-center text-gray-300 backdrop-blur-xl">
            <p className="text-xl mb-4">No projects yet</p>
            <p className="text-sm">Create your first project to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project._id}
                onClick={() => handleProjectClick(project._id)}
                className="rounded-[1.75rem] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(12,74,110,0.62))] p-6 cursor-pointer backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-300/45 hover:shadow-[0_18px_60px_rgba(34,211,238,0.15)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-200/20">
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
          <div className="relative w-full max-w-md rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(160deg,rgba(2,6,23,0.98),rgba(8,47,73,0.95))] p-8 shadow-2xl shadow-cyan-950/40">
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
