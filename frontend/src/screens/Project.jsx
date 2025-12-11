import React, { useState, useEffect } from "react";
import axios from "../config.js/axios";
import { useSearchParams } from "react-router-dom";
import { initializeSocket, sendMessage, recieveMessage } from "../config.js/socket";
import { useContext } from "react";
import { UserContext } from "../context/user.context.jsx";

const Project = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messages, setMessages] = useState([]); // ✅ Changed to messages array
  const [currentMessage, setCurrentMessage] = useState(""); // ✅ Separate input state
  const [users, setUsers] = useState([]);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  const { user } = useContext(UserContext);

  console.log("Project ID from URL:", projectId);
  console.log("Current user:", user);

  useEffect(() => {
    if (!projectId || !user) {
      console.log("Missing projectId or user, skipping socket initialization");
      return;
    }

    console.log("Initializing socket for project:", projectId);
    initializeSocket(projectId);

    // ✅ Listen for incoming messages
    recieveMessage("project_message", (data) => {
      console.log("📨 Received project message:", data);
      setMessages((prev) => [...prev, {
        text: data.text,
        sender: data.sender,
        senderEmail: data.senderEmail || "Unknown",
        isOwn: false
      }]);
    });

    // Fetch all users
    axios
      .get("/users/all")
      .then((response) => {
        setUsers(response.data.users);
        console.log("Fetched users:", response.data.users);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection");
    };
  }, [projectId, user?._id]); // ✅ Optional chaining to prevent errors

  function send() {
    if (!currentMessage.trim()) {
      console.log("Empty message, not sending");
      return;
    }

    console.log("📤 Sending message:", currentMessage);

    // Check if message is directed to AI
    if (currentMessage.toLowerCase().includes("@ai")) {
      // Extract the actual prompt (remove @ai mention)
      const prompt = currentMessage.replace(/@ai/gi, "").trim();

      // Send AI request
      axios
        .get("/ai/get-result", {
          params: { prompt: prompt }
        })
        .then((response) => {
          console.log("AI Response:", response.data);

          // Add AI response to messages
          setMessages((prev) => [
            ...prev,
            {
              text: response.data.result,
              sender: "AI",
              senderEmail: "AI Assistant",
              isOwn: false
            }
          ]);
        })
        .catch((error) => {
          console.error("AI request failed:", error);
          setMessages((prev) => [
            ...prev,
            {
              text: "Sorry, I couldn't process that request.",
              sender: "AI",
              senderEmail: "AI Assistant",
              isOwn: false
            }
          ]);
        });

      // Clear input
      setCurrentMessage("");
      return;
    }

    // Regular message (non-AI)
    const messageData = {
      text: currentMessage,
      sender: user._id,
      senderEmail: user.email
    };

    // Add to local messages immediately
    setMessages((prev) => [
      ...prev,
      {
        text: currentMessage,
        sender: user._id,
        senderEmail: user.email,
        isOwn: true
      }
    ]);

    sendMessage("project_message", messageData);
    setCurrentMessage("");
  }


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      send();
    }
  };

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
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded w-3/4 ${msg.isOwn
                  ? "bg-blue-600 ml-auto"
                  : "bg-gray-800"
                  }`}
              >
                <small className={msg.isOwn ? "text-gray-200" : "text-gray-400"}>
                  {msg.isOwn ? "You" : msg.senderEmail}
                </small>
                <p className="mt-1 break-words">{msg.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="flex items-center p-2 border-t border-gray-700 bg-gray-800 input_area">
          <input
            type="text"
            placeholder="Enter message"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyUp={handleKeyPress}
            className="flex-1 rounded-full px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={send}
            className="ml-2 bg-blue-600 hover:bg-blue-500 p-2 rounded-full transition"
          >
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
          {users.map((u) => (
            <div
              key={u._id}
              className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${selectedUsers.includes(u._id)
                ? "bg-blue-700"
                : "bg-gray-700 hover:bg-blue-600"
                }`}
              onClick={() => handleSelectUser(u._id)}
            >
              <i className="ri-user-2-line text-white"></i>
              <span className="text-white">{u.email}</span>
              {selectedUsers.includes(u._id) && (
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
              {users.map((u) => (
                <div
                  key={u._id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedUsers.includes(u._id)
                    ? "bg-blue-700"
                    : "bg-gray-700 hover:bg-blue-600"
                    }`}
                  onClick={() => handleSelectUser(u._id)}
                >
                  <span>{u.email}</span>
                  {selectedUsers.includes(u._id) && (
                    <i className="ri-check-line text-white"></i>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddUsersToProject}
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