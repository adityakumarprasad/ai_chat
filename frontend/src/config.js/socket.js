import socket from 'socket.io-client';

const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let socketInstance = null;

export const initializeSocket = (projectId) => {
  if (!socketInstance) {
    socketInstance = socket(socketUrl, {
      auth: localStorage.getItem('token') ? { token: localStorage.getItem('token') } : {},
      query: { projectId },
      transports: ['websocket']
    });
  }
  return socketInstance;
}

export const receiveMessage = (eventname , cb) => {
  if (!socketInstance) return;
  socketInstance.on(eventname, cb);
}

export const sendMessage = (eventname , data) => {
  if (!socketInstance) return;
  socketInstance.emit(eventname, data);
}
