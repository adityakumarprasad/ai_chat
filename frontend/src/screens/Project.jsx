import React, { useState, useEffect } from "react";
import axios from "../config.js/axios";
import { data, useSearchParams } from "react-router-dom";
import { initializeSocket, sendMessage, recieveMessage } from "../config.js/socket";
import { useContext } from "react";

import { UserContext } from "../context/user.context.jsx";



const Project = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  const { user } = useContext(UserContext);


  console.log("Project ID from URL:", projectId);


  useEffect(() => {
    initializeSocket(projectId);
    recieveMessage("project_message", (data) => {
      console.log("Received project message:", data);
    });

    axios
      .get("/users/all")
      .then((response) => {
        setUsers(response.data.users);
        console.log(response.data.users);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, [projectId, user._id]);

  function send() {
    sendMessage("project_message", { text: message, sender: user._id });
    console.log(message)
    setMessage("");
  }
  // Toggle user selection
  const handleSelectUser = (id) => {
    let newSelected;
    if (selectedUsers.includes(id)) {
      newSelected = selectedUsers.filter((uid) => uid !== id);
    } else {
      newSelected = [...selectedUsers, id];
    }
    setSelectedUsers(newSelected);
    console.log("Selected Users:", newSelected);
  };

  const handleAddUsersToProject = () => {
    if (!projectId) {
      console.error("Project ID is missing. Cannot add users to project.");
      return;
    }

    axios
      .put("/projects/add-user", { projectId: projectId, users: selectedUsers })
      .then((response) => {
        console.log("Users added to project:", response.data);
        setIsModalOpen(false);
        setSelectedUsers([]);
      })
      .catch((error) => {
        console.error("Error adding users to project:", error);
      });
  };

  // ✅ Moved return HERE (outside handleAddUsersToProject)
  return (
    <main className="h-screen w-screen flex bg-black text-white relative">
      {/* Sidebar */}
      <section className="w-1/4 flex flex-col bg-gray-900 relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            <i className="ri-add-large-fill"></i> Add Collaborators
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            <i className="ri-team-line text-2xl"></i>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 flex flex-col p-2 space-y-2 message_box overflow-y-auto">
          <div className="incoming-message bg-gray-800 p-2 rounded w-3/4">
            <small className="text-gray-400">example@.com</small>
            <p className="mt-1">This is an incoming message.</p>
          </div>
          <div className="outcoming-message bg-blue-600 p-2 rounded w-3/4 ml-auto">
            <small className="text-gray-200">example@.com</small>
            <p className="mt-1">This is an outgoing message.</p>
          </div>
          <div className="incoming-message bg-gray-800 p-2 rounded w-3/4">
            <small className="text-gray-400">example@.com</small>
            <p className="mt-1">Another incoming message.</p>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex items-center p-2 border-t border-gray-700 bg-gray-800 input_area">
          <input
            type="text"
            placeholder="Enter message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 rounded-full px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={send} className="ml-2 bg-blue-600 hover:bg-blue-500 p-2 rounded-full transition">
            <i className="ri-send-plane-2-fill text-white"></i>
          </button>
        </div>
      </section>

      {/* Sliding Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 transform transition-transform duration-300 z-20 ${isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex justify-end p-4 border-b border-gray-700">
          <button
            onClick={() => setIsSidePanelOpen(false)}
            className="text-white hover:text-blue-400 transition"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="users-list p-4 space-y-2">
          {users.map((user) => (
            <div
              key={user._id}
              className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${selectedUsers.includes(user._id)
                ? "bg-blue-700"
                : "bg-gray-700 hover:bg-blue-600"
                }`}
              onClick={() => handleSelectUser(user._id)}
            >
              <i className="ri-user-2-line text-white"></i>
              <span className="text-white">{user.email}</span>
              {selectedUsers.includes(user._id) && (
                <i className="ri-check-line text-white ml-auto"></i>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Adding Collaborators */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
          <div className="bg-gray-900 rounded-lg w-96 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-400">
                Add Collaborators
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-blue-400 transition"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-64">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedUsers.includes(user._id)
                    ? "bg-blue-700"
                    : "bg-gray-700 hover:bg-blue-600"
                    }`}
                  onClick={() => handleSelectUser(user._id)}
                >
                  <span>{user.email}</span>
                  {selectedUsers.includes(user._id) && (
                    <i className="ri-check-line text-white"></i>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddUsersToProject} // ✅ fixed this
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition"
              >
                Add Users
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
