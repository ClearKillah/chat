const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const chatService = require('../services/chatService');

// Start looking for a chat partner
router.post('/find', async (req, res) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID is required' });
    }
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already in a chat
    if (user.currentChatPartnerId) {
      return res.status(400).json({ 
        message: 'You are already in a chat',
        partnerId: user.currentChatPartnerId
      });
    }
    
    // Update user status
    user.isSearching = true;
    user.lastActive = new Date();
    await user.save();
    
    // Find a match asynchronously
    chatService.findChatPartner(user);
    
    res.json({ message: 'Looking for a chat partner', status: 'searching' });
  } catch (error) {
    console.error('Chat find error:', error);
    res.status(500).json({ message: 'Failed to find chat partner', error: error.message });
  }
});

// Skip the current chat partner and find a new one
router.post('/skip', async (req, res) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID is required' });
    }
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if already in a chat
    if (!user.currentChatPartnerId) {
      return res.status(400).json({ message: 'You are not in a chat' });
    }
    
    // End the current chat
    await chatService.endChat(user.telegramId);
    
    // Start looking for a new partner
    user.isSearching = true;
    await user.save();
    
    // Find a match asynchronously
    chatService.findChatPartner(user);
    
    res.json({ message: 'Skipped previous partner and looking for a new one', status: 'searching' });
  } catch (error) {
    console.error('Chat skip error:', error);
    res.status(500).json({ message: 'Failed to skip chat partner', error: error.message });
  }
});

// End the current chat
router.post('/end', async (req, res) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID is required' });
    }
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if in a chat
    if (!user.currentChatPartnerId) {
      return res.status(400).json({ message: 'You are not in a chat' });
    }
    
    // End the current chat
    await chatService.endChat(user.telegramId);
    
    res.json({ message: 'Chat ended successfully' });
  } catch (error) {
    console.error('Chat end error:', error);
    res.status(500).json({ message: 'Failed to end chat', error: error.message });
  }
});

// Get chat history with current partner
router.get('/history/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.currentChatPartnerId) {
      return res.status(400).json({ message: 'You are not in a chat' });
    }
    
    // Generate chat ID
    const chatId = chatService.generateChatId(telegramId, user.currentChatPartnerId);
    
    // Get messages for this chat
    const messages = await Message.find({ chatId })
                                 .sort({ createdAt: 1 })
                                 .lean();
    
    res.json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Failed to get chat history', error: error.message });
  }
});

module.exports = router; 