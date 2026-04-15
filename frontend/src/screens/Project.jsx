import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "../config.js/axios";
import { useSearchParams } from "react-router-dom";
import { initializeSocket, sendMessage, receiveMessage } from "../config.js/socket";
import { UserContext } from "../context/user.context.jsx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { WebContainer } from "@webcontainer/api";

const Project = () => {
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);

  const [webContainer, setWebContainer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState("");
  const [runProcess, setRunProcess] = useState(null);

  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("id");
  const { user } = useContext(UserContext);
  const messageBoxRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      if (!webContainer) {
        try {
          const instance = await WebContainer.boot();
          if (isMounted) {
            setWebContainer(instance);

            instance.on("server-ready", (port, url) => {
              console.log("Server Ready at:", url);
              setIframeUrl(url);
              setIsRunning(false);
            });
          }
        } catch (error) {
          console.warn("WebContainer boot warning:", error);
        }
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!projectId || !user) return;

    initializeSocket(projectId);

    receiveMessage("project_message", (data) => {
      setMessages((prev) => [...prev, { ...data, isOwn: false }]);
      scrollToBottom();
    });

    axios
      .get("/users/all")
      .then((res) => setUsers(res.data.users))
      .catch(console.error);
  }, [projectId, user]);

  function scrollToBottom() {
    if (messageBoxRef.current) {
      messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
    }
  }

  const handleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleAddUsersToProject = () => {
    if (!projectId) return;
    axios
      .put("/projects/add-user", { projectId, users: selectedUsers })
      .then(() => {
        setIsModalOpen(false);
        setSelectedUsers([]);
      })
      .catch(console.error);
  };

  function extractJson(str) {
    try {
      const match = str.match(/```json([\s\S]*?)```/);
      if (match && match[1]) return JSON.parse(match[1].trim());
      const firstOpen = str.indexOf("{");
      const lastClose = str.lastIndexOf("}");
      if (firstOpen !== -1 && lastClose !== -1) {
        return JSON.parse(str.substring(firstOpen, lastClose + 1));
      }
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function send() {
    if (!currentMessage.trim()) return;

    const newMessage = {
      text: currentMessage,
      sender: user._id,
      senderEmail: user.email,
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setCurrentMessage("");
    scrollToBottom();

    if (newMessage.text.toLowerCase().includes("@ai")) {
      setIsAiLoading(true);
      const prompt = newMessage.text.replace(/@ai/gi, "").trim();

      axios
        .get("/ai/get-result", { params: { prompt } })
        .then(async (response) => {
          const parsedData = extractJson(response.data.response);

          if (parsedData) {
            if (parsedData.fileTree) {
              setFileTree(parsedData.fileTree);
            }
            if (webContainer && parsedData.fileTree) {
              await webContainer.mount(parsedData.fileTree);
            }
          } else {
            setMessages((prev) => [
              ...prev,
              {
                text: response.data.response,
                sender: "AI",
                senderEmail: "AI",
                isOwn: false,
                isAi: true,
              },
            ]);
          }
        })
        .catch(console.error)
        .finally(() => setIsAiLoading(false));
    } else {
      sendMessage("project_message", newMessage);
    }
  }

  async function runProject() {
    if (!webContainer) return;

    setIsRunning(true);
    setIframeUrl("");

    if (runProcess) runProcess.kill();

    const stripAnsi = (str) =>
      str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

    const logToTerminal = (data) => {
      const cleanData = stripAnsi(data);
      if (cleanData.trim()) console.log("[Terminal]:", cleanData);
    };

    try {
      await webContainer.mount(fileTree);

      console.log("Installing root dependencies...");
      const installProcess = await webContainer.spawn("npm", ["install"]);
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            logToTerminal(data);
          },
        })
      );
      if ((await installProcess.exit) !== 0) throw new Error("Root installation failed");

      console.log("Installing client dependencies...");
      const installClient = await webContainer.spawn("npm", ["install", "--prefix", "client"]);
      installClient.output.pipeTo(
        new WritableStream({
          write(data) {
            logToTerminal(data);
          },
        })
      );
      if ((await installClient.exit) !== 0) throw new Error("Client installation failed");

      console.log("Installing server dependencies...");
      const installServer = await webContainer.spawn("npm", ["install", "--prefix", "server"]);
      installServer.output.pipeTo(
        new WritableStream({
          write(data) {
            logToTerminal(data);
          },
        })
      );
      if ((await installServer.exit) !== 0) throw new Error("Server installation failed");

      console.log("Starting project...");
      const startProcess = await webContainer.spawn("npm", ["start"]);
      startProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            logToTerminal(data);
          },
        })
      );
      setRunProcess(startProcess);
    } catch (error) {
      console.error("Error running project:", error);
      logToTerminal(`Error: ${error.message}`);
      setIsRunning(false);
    }
  }

  const handleFileClick = (name, content) => setCurrentFile({ name, content });

  const renderFileTree = (tree, path = "") =>
    Object.keys(tree).map((fileName) => {
      const node = tree[fileName];
      const currentPath = path ? `${path}/${fileName}` : fileName;

      if (node.directory) {
        return (
          <div key={currentPath} className="pl-4">
            <div className="flex items-center gap-2 font-medium text-gray-400">
              <i className="ri-folder-line text-yellow-500"></i>
              <span>{fileName}</span>
            </div>
            {renderFileTree(node.directory, currentPath)}
          </div>
        );
      }

      return (
        <div
          key={currentPath}
          onClick={() => handleFileClick(fileName, node.file.contents)}
          className="flex cursor-pointer items-center gap-2 rounded-sm pl-6 text-gray-300 transition hover:bg-gray-800 hover:text-blue-400"
        >
          <i className="ri-file-code-line text-blue-400"></i>
          <span>{fileName}</span>
        </div>
      );
    });

  return (
    <main className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_25%),linear-gradient(160deg,#020617_0%,#061428_40%,#020617_100%)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 shadow-[0_0_35px_rgba(34,211,238,0.3)] ring-1 ring-cyan-300/30">
              <i className="ri-bubble-chart-line text-2xl text-cyan-300 app-float"></i>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-cyan-200/70">Project Space</p>
              <h1 className="text-2xl font-black tracking-[0.2em] text-white">Collab-Ai</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active Project</p>
            <p className="max-w-[220px] truncate text-sm text-cyan-100">{projectId || "No project selected"}</p>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-152px)] w-full px-2 py-2 sm:px-4 sm:py-4">
        <section className="relative z-10 flex w-1/4 flex-col rounded-l-3xl border-r border-gray-800 bg-gray-900">
          <header className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
            <button onClick={() => setIsModalOpen(true)}>
              <i className="ri-add-large-fill text-blue-400"></i>
            </button>
            <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}>
              <i className="ri-group-fill text-blue-400"></i>
            </button>
          </header>
          <div ref={messageBoxRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[90%] break-words rounded-lg p-2 ${msg.isOwn ? "ml-auto bg-blue-600" : "bg-gray-800"}`}
              >
                <small className="mb-1 block text-xs text-gray-400">{msg.senderEmail}</small>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-2 text-sm text-blue-400">
                <i className="ri-loader-4-line animate-spin"></i> Generating...
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-gray-700 bg-gray-800 p-2">
            <input
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 rounded bg-gray-700 p-2 text-white outline-none"
              placeholder="Type @ai..."
            />
            <button onClick={send} className="rounded bg-blue-600 p-2">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </section>

        <section className="flex w-2/5 flex-col border-r border-gray-800 bg-gray-950">
          <header className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
            <span className="font-bold text-gray-300">Editor</span>
            <button
              onClick={runProject}
              disabled={isRunning}
              className={`flex items-center gap-2 rounded-sm px-4 py-1 text-sm font-semibold transition ${isRunning ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-500"}`}
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
          <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 overflow-y-auto border-r border-gray-800 p-2">
              <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500">FILES</div>
              {Object.keys(fileTree).length > 0 ? (
                renderFileTree(fileTree)
              ) : (
                <div className="mt-10 text-center text-sm text-gray-500">No files</div>
              )}
            </div>
            <div className="w-2/3 overflow-auto bg-gray-950">
              {currentFile ? (
                <SyntaxHighlighter
                  language="javascript"
                  style={dracula}
                  customStyle={{ margin: 0, height: "100%", fontSize: "13px" }}
                  showLineNumbers={true}
                >
                  {currentFile.content}
                </SyntaxHighlighter>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-600">
                  Select a file
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="flex h-full w-[35%] flex-col overflow-hidden rounded-r-3xl bg-white">
          <header className="flex items-center border-b border-gray-300 bg-gray-100 px-4 py-2">
            <span className="text-sm font-bold text-gray-700">Preview</span>
          </header>
          <div className="relative flex flex-1 items-center justify-center">
            {iframeUrl && !isRunning ? (
              <iframe src={iframeUrl} className="h-full w-full border-none" title="Preview" />
            ) : (
              <div className="text-center text-gray-400">
                {isRunning ? (
                  <p>
                    <i className="ri-loader-2-line animate-spin text-4xl text-blue-500"></i>
                    <br />
                    Starting server...
                  </p>
                ) : (
                  <p>
                    <i className="ri-terminal-box-line text-4xl"></i>
                    <br />
                    Click Run
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {isSidePanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-start" onClick={() => setIsSidePanelOpen(false)}>
          <div className="h-full w-64 bg-gray-800 p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Members</h2>
            {users.map((u) => (
              <div key={u._id} className="cursor-pointer rounded p-2 hover:bg-gray-700">
                {u.email}
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setIsModalOpen(false)}>
          <div
            className="w-96 rounded-lg border border-gray-700 bg-gray-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-semibold text-blue-400">Add User</h3>
            <div className="mb-4 max-h-60 overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => handleSelectUser(u._id)}
                  className={`flex cursor-pointer justify-between rounded p-3 ${selectedUsers.includes(u._id) ? "bg-blue-600" : "bg-gray-800"}`}
                >
                  {u.email} {selectedUsers.includes(u._id) && "Selected"}
                </div>
              ))}
            </div>
            <button
              onClick={handleAddUsersToProject}
              className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Add Selected
            </button>
          </div>
        </div>
      )}

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-3 px-4 py-4 text-center text-sm text-slate-300 sm:px-6 md:flex-row md:text-left">
          <div>
            <p className="text-base font-semibold tracking-[0.25em] text-cyan-200">Collab-Ai</p>
            <p className="text-slate-400">Collaborate live, preview instantly, build confidently.</p>
          </div>
          <p className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-4 py-2 text-cyan-100 shadow-[0_0_25px_rgba(34,211,238,0.12)]">
            2026 rights reversed
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Project;
