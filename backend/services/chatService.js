const User = require('../models/User');
const Message = require('../models/Message');
const socketService = require('./socketService');

// Queue of users looking for a chat partner
const searchQueue = [];

// Generate a unique chat ID from two user IDs
const generateChatId = (userId1, userId2) => {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Find a chat partner for a user
const findChatPartner = async (user) => {
  // Check if user is already in the queue
  const queueIndex = searchQueue.findIndex(u => u.telegramId === user.telegramId);
  if (queueIndex !== -1) {
    // User is already in queue, remove and re-add to refresh position
    searchQueue.splice(queueIndex, 1);
  }
  
  // Add user to the search queue
  searchQueue.push(user);
  
  // Process the queue to find matches
  processQueue();
};

// Process the queue to match users
const processQueue = async () => {
  // Need at least 2 users to make a match
  if (searchQueue.length < 2) {
    return;
  }
  
  // Get the first user in the queue
  const user1 = searchQueue.shift();
  
  // Try to find a match from the remaining users
  for (let i = 0; i < searchQueue.length; i++) {
    const user2 = searchQueue[i];
    
    // Make sure both users are still searching and active
    const freshUser1 = await User.findOne({ telegramId: user1.telegramId });
    const freshUser2 = await User.findOne({ telegramId: user2.telegramId });
    
    if (!freshUser1 || !freshUser2 || 
        !freshUser1.isSearching || !freshUser2.isSearching ||
        freshUser1.currentChatPartnerId || freshUser2.currentChatPartnerId) {
      // One of the users is no longer available, remove from queue and continue
      searchQueue.splice(i, 1);
      i--;
      continue;
    }
    
    // We found a match, create the chat
    searchQueue.splice(i, 1);
    createChat(freshUser1, freshUser2);
    return;
  }
  
  // If we reached here, no match was found for user1, put them back in the queue
  searchQueue.push(user1);
};

// Create a chat between two users
const createChat = async (user1, user2) => {
  try {
    // Update both users
    user1.isSearching = false;
    user1.currentChatPartnerId = user2.telegramId;
    await user1.save();
    
    user2.isSearching = false;
    user2.currentChatPartnerId = user1.telegramId;
    await user2.save();
    
    // Generate chat ID
    const chatId = generateChatId(user1.telegramId, user2.telegramId);
    
    // Notify both users that a partner was found
    socketService.emitToUser(user1.telegramId, 'partner-found', {
      partnerId: user2.telegramId,
      partnerNickname: user2.nickname,
      chatId
    });
    
    socketService.emitToUser(user2.telegramId, 'partner-found', {
      partnerId: user1.telegramId,
      partnerNickname: user1.nickname,
      chatId
    });
    
    console.log(`Created chat between ${user1.nickname} and ${user2.nickname}`);
  } catch (error) {
    console.error('Error creating chat:', error);
  }
};

// End a chat for a user
const endChat = async (telegramId) => {
  try {
    // Get the user
    const user = await User.findOne({ telegramId });
    if (!user || !user.currentChatPartnerId) {
      return;
    }
    
    const partnerId = user.currentChatPartnerId;
    
    // Get the partner
    const partner = await User.findOne({ telegramId: partnerId });
    
    // Update user
    user.currentChatPartnerId = null;
    user.isSearching = false;
    await user.save();
    
    // Update partner if they exist
    if (partner) {
      partner.currentChatPartnerId = null;
      partner.isSearching = false;
      await partner.save();
      
      // Notify partner that chat ended
      socketService.emitToUser(partnerId, 'chat-ended', {
        message: 'Your chat partner has left the conversation'
      });
    }
    
    // Notify user that chat ended
    socketService.emitToUser(telegramId, 'chat-ended', {
      message: 'You have left the conversation'
    });
    
    console.log(`Ended chat between ${telegramId} and ${partnerId}`);
  } catch (error) {
    console.error('Error ending chat:', error);
  }
};

// Send a message in a chat
const sendMessage = async (senderId, content) => {
  try {
    // Get the sender
    const sender = await User.findOne({ telegramId: senderId });
    if (!sender || !sender.currentChatPartnerId) {
      return { success: false, message: 'You are not in a chat' };
    }
    
    const receiverId = sender.currentChatPartnerId;
    
    // Generate chat ID
    const chatId = generateChatId(senderId, receiverId);
    
    // Create and save the message
    const message = new Message({
      senderId,
      receiverId,
      content,
      chatId
    });
    
    await message.save();
    
    // Emit the message to both users
    const messageData = {
      id: message._id,
      senderId,
      content,
      createdAt: message.createdAt
    };
    
    socketService.emitToUser(receiverId, 'receive-message', messageData);
    socketService.emitToUser(senderId, 'message-sent', messageData);
    
    return { success: true, message: messageData };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, message: 'Failed to send message' };
  }
};

module.exports = {
  generateChatId,
  findChatPartner,
  createChat,
  endChat,
  sendMessage,
  processQueue
}; 