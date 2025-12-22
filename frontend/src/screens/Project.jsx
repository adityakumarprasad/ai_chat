import React, { useState, useEffect, useRef } from "react";
import axios from "../config.js/axios";
import { useSearchParams } from "react-router-dom";
import { initializeSocket, sendMessage, recieveMessage } from "../config.js/socket";
import { useContext } from "react";
import { UserContext } from "../context/user.context.jsx";
import Markdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { WebContainer } from '@webcontainer/api';


const Project = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Data States
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [fileTree, setFileTree] = useState({}); // New State for File Tree
  const [currentFile, setCurrentFile] = useState(null);

  // WebContainer States
  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const [runProcess, setRunProcess] = useState(null);

  // Context & Params
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  const { user } = useContext(UserContext);
  const messageBoxRef = useRef(null);

  console.log("Project ID from URL:", projectId);
  console.log("Current user:", user);


  // webcontainer boot effect
  useEffect(() => {
    // Call this only once!
    async function boot() {
      const instance = await WebContainer.boot();
      setWebContainer(instance);
    }
    boot();
  }, []);

  useEffect(() => {
    if (!projectId || !user) {
      console.log("Missing projectId or user, skipping socket initialization");
      return;
    }

    console.log("Initializing socket for project:", projectId);
    initializeSocket(projectId);

    recieveMessage("project_message", (data) => {
      console.log("📨 Received project message:", data);
      setMessages((prev) => [...prev, {
        text: data.text,
        sender: data.sender,
        senderEmail: data.senderEmail || "Unknown",
        isOwn: false
      }]);
    });

    axios
      .get("/users/all")
      .then((response) => {
        setUsers(response.data.users);
        console.log("Fetched users:", response.data.users);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });

    return () => {
      console.log("Cleaning up socket connection");
    };
  }, [projectId, user?._id]);

  function scrollToBottom() {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }


  // ---------------- COLLABORATION HANDLERS ----------------
    const handleSelectUser = (id) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleAddUsersToProject = () => {
        if (!projectId) return;

        axios.put("/projects/add-user", { projectId, users: selectedUsers })
            .then((response) => {
                setIsModalOpen(false);
                setSelectedUsers([]);
            })
            .catch((error) => {
                console.error("Error adding users:", error);
            });
    };

    
  // Add this helper function outside of the component (or just above the send function)
  // function isValidJson(jsonString) {
  //   try {
  //     JSON.parse(jsonString);
  //     return true;
  //   } catch (e) {
  //     return false;
  //   }
  // }

  // Robust JSON extractor that handles Markdown, text wrappers, and mixed content
function extractJson(str) {
    try {
        // 1. Try detecting markdown blocks first (most common)
        const match = str.match(/```json([\s\S]*?)```/);
        if (match && match[1]) {
            return JSON.parse(match[1].trim());
        }

        // 2. Fallback: Find the first '{' and last '}' (handles "Here is your code: { ... }")
        const firstOpen = str.indexOf("{");
        const lastClose = str.lastIndexOf("}");
        
        if (firstOpen !== -1 && lastClose !== -1) {
             const candidate = str.substring(firstOpen, lastClose + 1);
             return JSON.parse(candidate);
        }
        
        // 3. Last resort: Try parsing the whole string directly
        return JSON.parse(str);
    } catch (e) {
        return null; // Invalid JSON
    }
}

  function send() {
    if (!currentMessage.trim()) return;

    // Add User Message
    const newMessage = {
      text: currentMessage,
      sender: user._id,
      senderEmail: user.email,
      isOwn: true
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMessage]);
    setCurrentMessage("");
    scrollToBottom();

    // Check for AI Trigger
    if (newMessage.text.toLowerCase().includes("@ai")) {
      setIsAiLoading(true);
      const prompt = newMessage.text.replace(/@ai/gi, "").trim();

      axios.get("/ai/get-result", { params: { prompt } })
        .then(async (response) => {
          const aiData = response.data.response;
          // const cleanJson = aiData.replace(/```json/g, "").replace(/```/g, "").trim();

          // if (isValidJson(cleanJson)) {
          //   const parsedData = JSON.parse(cleanJson);

          //   // 1. Update File Tree State
          //   setFileTree(parsedData.fileTree);

          // 🛑 NEW: Use the robust extractor
                const parsedData = extractJson(aiData);

                if (parsedData) {
                    // ✅ SUCCESS: It is a valid Project JSON
                    
                    // 1. Update File Tree for UI
                    if (parsedData.fileTree) {
                        setFileTree(parsedData.fileTree);
                    }

            // 2. Mount Files (But DO NOT Run yet)
            if (webContainer && parsedData.fileTree) {
              await webContainer.mount(parsedData.fileTree);
              console.log("Files mounted to WebContainer");
            }
          } else {
            // Regular text response
            setMessages(prev => [...prev, {
              text: aiData,
              sender: "AI",
              senderEmail: "🤖 AI Assistant",
              isOwn: false,
              isAi: true
            }]);
          }
        })
        .catch(err => {
          console.error(err);
          setMessages(prev => [...prev, {
            text: "Error communicating with AI.",
            sender: "AI",
            senderEmail: "🤖 AI Assistant",
            isOwn: false,
            isAi: true
          }]);
        })
        .finally(() => {
          setIsAiLoading(false); // ALWAYS Reset loading state
        });
    } else {
      sendMessage("project_message", newMessage);
    }
  }

  async function runProject() {
        if (!webContainer) return;

        setIsRunning(true);
        setIframeUrl(""); // Reset preview while loading

        // Kill previous process
        if (runProcess) {
            runProcess.kill();
        }

        const terminalOutput = (data) => console.log("[Terminal]:", data);

        try {
            // 1. Install Dependencies
            const installProcess = await webContainer.spawn('npm', ['install']);
            installProcess.output.pipeTo(new WritableStream({ write: terminalOutput }));
            await installProcess.exit;

            // 2. Start Dev Server
            const startProcess = await webContainer.spawn('npm', ['start']);
            startProcess.output.pipeTo(new WritableStream({ write: terminalOutput }));
            setRunProcess(startProcess);

            // 3. Listen for server-ready
            webContainer.on('server-ready', (port, url) => {
                console.log("Server ready at:", url);
                setIframeUrl(url);
                setIsRunning(false); 
            });

        } catch (error) {
            console.error("Error running project:", error);
            setIsRunning(false);
        }
    }
  


  // Helper to Validate JSON
  function isValidJson(jsonString) {
    try { JSON.parse(jsonString); return true; }
    catch (e) { return false; }
  }

  const handleFileClick = (fileName, content) => {
    setCurrentFile({ name: fileName, content: content });
  };

  const renderFileTree = (tree, path = "") => {
    return Object.keys(tree).map((fileName) => {
      const node = tree[fileName];
      const currentPath = path ? `${path}/${fileName}` : fileName;

      if (node.directory) {
        return (
          <div key={currentPath} className="pl-4">
            <div className="flex items-center gap-2 text-gray-400 font-medium">
              <i className="ri-folder-line text-yellow-500"></i>
              <span>{fileName}</span>
            </div>
            {renderFileTree(node.directory, currentPath)}
          </div>
        );
      } else {
        // It's a file
        return (
          <div
            key={currentPath}
            onClick={() => handleFileClick(fileName, node.file.contents)}
            className="pl-6 flex items-center gap-2 cursor-pointer text-gray-300 hover:text-blue-400 hover:bg-gray-800 transition rounded-sm"
          >
            <i className="ri-file-code-line text-blue-400"></i>
            <span>{fileName}</span>
          </div>
        );
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      send();
    }
  };



return (
        <main className="h-screen w-screen flex bg-black text-white relative">
            
            {/* 1. CHAT SECTION (Left - 25%) */}
            <section className="w-1/4 flex flex-col bg-gray-900 border-r border-gray-800 relative z-10">
                <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
                    <button onClick={() => setIsModalOpen(true)} className="text-blue-400 hover:text-blue-300">
                        <i className="ri-add-large-fill"></i> Add User
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className="text-blue-400 hover:text-blue-300">
                         <i className="ri-group-fill"></i>
                    </button>
                </header>
                
                <div ref={messageBoxRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`p-2 rounded-lg max-w-[90%] break-words ${msg.isOwn ? "bg-blue-600 ml-auto" : "bg-gray-800"}`}>
                            <small className="text-xs text-gray-400 block mb-1">{msg.senderEmail}</small>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    ))}
                    {isAiLoading && (
                        <div className="flex items-center gap-2 text-blue-400 bg-gray-800 p-2 rounded-lg max-w-[75%]">
                             <i className="ri-loader-4-line animate-spin"></i>
                             <span className="text-sm">Generating code...</span>
                        </div>
                    )}
                </div>

                <div className="p-2 bg-gray-800 flex gap-2 border-t border-gray-700">
                    <input 
                        value={currentMessage} 
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && send()}
                        className="flex-1 bg-gray-700 p-2 rounded text-white outline-none focus:ring-1 focus:ring-blue-500" 
                        placeholder="Type @ai to generate..."
                    />
                    <button onClick={send} className="bg-blue-600 p-2 rounded hover:bg-blue-500 transition">
                        <i className="ri-send-plane-fill"></i>
                    </button>
                </div>
            </section>

            {/* 2. CODE EXPLORER (Middle - 40%) */}
            <section className="w-2/5 bg-gray-950 flex flex-col border-r border-gray-800">
                <header className="p-2 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-4">
                    <span className="font-bold text-gray-300">Editor</span>
                    <button 
                        onClick={runProject} 
                        disabled={isRunning}
                        className={`px-4 py-1 rounded-sm text-sm font-semibold transition flex items-center gap-2 ${
                            isRunning 
                            ? "bg-gray-600 cursor-not-allowed text-gray-300" 
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                    >
                        {isRunning ? (
                            <>
                                <i className="ri-loader-4-line animate-spin"></i> Running...
                            </>
                        ) : (
                            <>
                                <i className="ri-play-fill"></i> Run
                            </>
                        )}
                    </button>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* File Tree Sidebar */}
                    <div className="w-1/3 overflow-y-auto p-2 border-r border-gray-800">
                         <div className="font-semibold text-xs text-gray-500 mb-2 tracking-wider">FILES</div>
                        {Object.keys(fileTree).length > 0 ? renderFileTree(fileTree) : (
                            <div className="text-gray-500 text-sm text-center mt-10">No files</div>
                        )}
                    </div>

                    {/* Code Editor Area */}
                    <div className="w-2/3 overflow-auto bg-gray-950">
                        {currentFile ? (
                            <div className="h-full">
                                <div className="bg-gray-800 text-xs p-1 px-3 text-gray-300 border-b border-gray-700 sticky top-0">
                                    {currentFile.name}
                                </div>
                                <SyntaxHighlighter 
                                    language="javascript" 
                                    style={dracula}
                                    customStyle={{ margin: 0, height: '100%', fontSize: '13px' }}
                                    showLineNumbers={true}
                                >
                                    {currentFile.content}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                                Select a file to view code
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 3. PREVIEW (Right - 35%) */}
            <section className="w-[35%] bg-white flex flex-col h-full">
                 <header className="p-2 bg-gray-100 border-b border-gray-300 flex items-center px-4">
                    <span className="font-bold text-gray-700 text-sm">Browser Preview</span>
                </header>
                <div className="flex-1 bg-gray-50 flex items-center justify-center relative">
                    {iframeUrl && !isRunning ? (
                        <iframe src={iframeUrl} className="w-full h-full border-none" title="App Preview" />
                    ) : (
                         <div className="text-center text-gray-400">
                            {isRunning ? (
                                <div className="flex flex-col items-center gap-2">
                                    <i className="ri-loader-2-line animate-spin text-4xl text-blue-500"></i>
                                    <p>Installing dependencies & starting server...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <i className="ri-terminal-box-line text-4xl"></i>
                                    <p>Click "Run" to view output</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* 4. OVERLAYS: MODAL & SIDE PANEL */}
            
            {/* Sliding Side Panel (Collaborators List) */}
            <div className={`fixed top-0 left-0 h-full w-64 bg-gray-800 transform transition-transform duration-300 z-50 shadow-xl ${
                isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900">
                    <h2 className="text-lg font-semibold">Members</h2>
                    <button onClick={() => setIsSidePanelOpen(false)} className="text-gray-400 hover:text-white">
                        <i className="ri-close-line text-2xl"></i>
                    </button>
                </div>
                <div className="p-2 space-y-2">
                    {users.map(u => (
                         <div key={u._id} className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                                <i className="ri-user-fill"></i>
                            </div>
                            <span className="text-sm truncate">{u.email}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal (Add Collaborators) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-900 p-6 rounded-lg w-96 max-w-full border border-gray-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-blue-400">Add Collaborators</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <i className="ri-close-line text-2xl"></i>
                            </button>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {users.map(u => (
                                <div 
                                    key={u._id} 
                                    onClick={() => handleSelectUser(u._id)}
                                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition ${
                                        selectedUsers.includes(u._id) ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"
                                    }`}
                                >
                                    <span className="text-sm">{u.email}</span>
                                    {selectedUsers.includes(u._id) && <i className="ri-check-line text-white"></i>}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleAddUsersToProject}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition font-medium"
                            >
                                Add Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Project;