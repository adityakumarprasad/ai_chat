import socket from 'socket.io-client';



let socketInstance = null;

export const initializeSocket = (projectId) => {
  if (!socketInstance) {
    socketInstance = socket(import.meta.env.VITE_API_BASE_URL, {
      auth: localStorage.getItem('token') ? { token: localStorage.getItem('token') } : {},
      query: { projectId },
      transports: ['websocket']
    });
  }
  return socketInstance;
}

export const recieveMessage = (eventname , cb) => {
  if (!socketInstance) return;
  socketInstance.on(eventname, cb);
}

export const sendMessage = (eventname , data) => {
  if (!socketInstance) return;
  socketInstance.emit(eventname, data);
}