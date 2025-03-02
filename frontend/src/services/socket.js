import { io } from 'socket.io-client';

let socket;

// Event callbacks
const eventCallbacks = {
  'partner-found': [],
  'receive-message': [],
  'chat-ended': [],
  'partner-online': [],
  'partner-offline': [],
  'error': []
};

// Initialize Socket.io
const initSocket = (telegramId) => {
  // Create socket connection if it doesn't exist
  if (!socket) {
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';
    socket = io(SOCKET_URL);
    
    // Register event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Authenticate with the server
      socket.emit('authenticate', { telegramId });
    });
    
    socket.on('authenticated', (data) => {
      console.log('Socket authenticated', data);
    });
    
    socket.on('partner-found', (data) => {
      triggerCallbacks('partner-found', data);
    });
    
    socket.on('receive-message', (data) => {
      triggerCallbacks('receive-message', data);
    });
    
    socket.on('message-sent', (data) => {
      // You can handle confirmation here if needed
    });
    
    socket.on('chat-ended', (data) => {
      triggerCallbacks('chat-ended', data);
    });
    
    socket.on('partner-online', (data) => {
      triggerCallbacks('partner-online', data);
    });
    
    socket.on('partner-offline', (data) => {
      triggerCallbacks('partner-offline', data);
    });
    
    socket.on('error', (data) => {
      console.error('Socket error:', data);
      triggerCallbacks('error', data);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  } else {
    // If socket exists but we need to re-authenticate
    socket.emit('authenticate', { telegramId });
  }
  
  return socket;
};

// Find a chat partner
const findPartner = () => {
  if (socket) {
    socket.emit('find-partner');
  }
};

// Join a specific chat
const joinChat = (chatId) => {
  if (socket) {
    socket.emit('join-chat', { chatId });
  }
};

// Send a message
const sendMessage = (content) => {
  if (socket) {
    socket.emit('send-message', { content });
  }
};

// End the current chat
const endChat = () => {
  if (socket) {
    socket.emit('end-chat');
  }
};

// Register event callbacks
const onEvent = (event, callback) => {
  if (eventCallbacks[event]) {
    eventCallbacks[event].push(callback);
    return () => {
      // Return function to unregister
      const index = eventCallbacks[event].indexOf(callback);
      if (index !== -1) {
        eventCallbacks[event].splice(index, 1);
      }
    };
  }
  return () => {};
};

// Trigger all registered callbacks for an event
const triggerCallbacks = (event, data) => {
  if (eventCallbacks[event]) {
    eventCallbacks[event].forEach(callback => callback(data));
  }
};

// Disconnect socket
const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export {
  initSocket,
  findPartner,
  joinChat,
  sendMessage,
  endChat,
  onEvent,
  disconnect
}; 