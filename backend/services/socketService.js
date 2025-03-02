const User = require('../models/User');
const chatService = require('./chatService');

// Map of socket connections by user ID
const connections = new Map();
let io;

// Initialize Socket.io
const init = (socketIo) => {
  io = socketIo;
  
  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Handle user authentication
    socket.on('authenticate', async (data) => {
      try {
        const { telegramId } = data;
        
        if (!telegramId) {
          return socket.emit('error', { message: 'Telegram ID is required' });
        }
        
        const user = await User.findOne({ telegramId });
        if (!user) {
          return socket.emit('error', { message: 'User not found' });
        }
        
        // Store the connection
        connections.set(telegramId, socket.id);
        socket.telegramId = telegramId;
        
        // Update user's active status
        user.isActive = true;
        user.lastActive = new Date();
        await user.save();
        
        // Send acknowledgment
        socket.emit('authenticated', { user });
        
        console.log(`User ${user.nickname} (${telegramId}) authenticated`);
        
        // Join a chat room if the user is in a chat
        if (user.currentChatPartnerId) {
          const chatId = chatService.generateChatId(telegramId, user.currentChatPartnerId);
          socket.join(chatId);
          
          // Notify the partner that this user is online
          emitToUser(user.currentChatPartnerId, 'partner-online', {
            partnerId: telegramId
          });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });
    
    // Handle sending messages
    socket.on('send-message', async (data) => {
      try {
        const { content } = data;
        const telegramId = socket.telegramId;
        
        if (!telegramId) {
          return socket.emit('error', { message: 'You are not authenticated' });
        }
        
        if (!content || content.trim() === '') {
          return socket.emit('error', { message: 'Message cannot be empty' });
        }
        
        // Send the message
        const result = await chatService.sendMessage(telegramId, content);
        
        if (!result.success) {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle finding a chat partner
    socket.on('find-partner', async () => {
      try {
        const telegramId = socket.telegramId;
        
        if (!telegramId) {
          return socket.emit('error', { message: 'You are not authenticated' });
        }
        
        const user = await User.findOne({ telegramId });
        if (!user) {
          return socket.emit('error', { message: 'User not found' });
        }
        
        // Check if already in a chat
        if (user.currentChatPartnerId) {
          return socket.emit('error', { 
            message: 'You are already in a chat',
            partnerId: user.currentChatPartnerId
          });
        }
        
        // Update user status
        user.isSearching = true;
        user.lastActive = new Date();
        await user.save();
        
        // Find a match
        chatService.findChatPartner(user);
        
        // Notify the user that the search has started
        socket.emit('searching', { message: 'Looking for a chat partner' });
      } catch (error) {
        console.error('Find partner error:', error);
        socket.emit('error', { message: 'Failed to find partner' });
      }
    });
    
    // Handle ending a chat
    socket.on('end-chat', async () => {
      try {
        const telegramId = socket.telegramId;
        
        if (!telegramId) {
          return socket.emit('error', { message: 'You are not authenticated' });
        }
        
        // End the chat
        await chatService.endChat(telegramId);
      } catch (error) {
        console.error('End chat error:', error);
        socket.emit('error', { message: 'Failed to end chat' });
      }
    });
    
    // Handle joining a specific chat
    socket.on('join-chat', async (data) => {
      try {
        const { chatId } = data;
        const telegramId = socket.telegramId;
        
        if (!telegramId) {
          return socket.emit('error', { message: 'You are not authenticated' });
        }
        
        const user = await User.findOne({ telegramId });
        if (!user || !user.currentChatPartnerId) {
          return socket.emit('error', { message: 'You are not in a chat' });
        }
        
        // The expected chat ID
        const expectedChatId = chatService.generateChatId(telegramId, user.currentChatPartnerId);
        
        if (chatId !== expectedChatId) {
          return socket.emit('error', { message: 'Invalid chat ID' });
        }
        
        // Join the chat room
        socket.join(chatId);
        socket.emit('joined-chat', { chatId });
        
        console.log(`User ${user.nickname} (${telegramId}) joined chat ${chatId}`);
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const telegramId = socket.telegramId;
        
        if (telegramId) {
          // Remove the connection
          connections.delete(telegramId);
          
          // Update user's active status
          const user = await User.findOne({ telegramId });
          if (user) {
            user.isActive = false;
            user.lastActive = new Date();
            await user.save();
            
            // Notify the chat partner if in a chat
            if (user.currentChatPartnerId) {
              emitToUser(user.currentChatPartnerId, 'partner-offline', {
                partnerId: telegramId
              });
            }
          }
          
          console.log(`User ${telegramId} disconnected`);
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

// Emit an event to a specific user
const emitToUser = (telegramId, event, data) => {
  const socketId = connections.get(telegramId);
  
  if (socketId && io) {
    io.to(socketId).emit(event, data);
    return true;
  }
  
  return false;
};

// Emit an event to a chat room
const emitToChat = (chatId, event, data) => {
  if (io) {
    io.to(chatId).emit(event, data);
    return true;
  }
  
  return false;
};

module.exports = {
  init,
  emitToUser,
  emitToChat
}; 