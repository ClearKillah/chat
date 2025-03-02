const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to validate user input
const validateUserInput = (req, res, next) => {
  const { nickname, age, gender } = req.body;
  
  if (!nickname || nickname.trim() === '') {
    return res.status(400).json({ message: 'Nickname is required' });
  }
  
  if (!age || isNaN(age) || age < 13 || age > 100) {
    return res.status(400).json({ message: 'Valid age between 13 and 100 is required' });
  }
  
  if (!gender || !['male', 'female', 'other'].includes(gender)) {
    return res.status(400).json({ message: 'Gender must be male, female, or other' });
  }
  
  next();
};

// Register a new user
router.post('/register', validateUserInput, async (req, res) => {
  try {
    const { telegramId, nickname, age, gender, interests } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID is required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ telegramId });
    if (existingUser) {
      return res.status(409).json({ message: 'User already registered', user: existingUser });
    }
    
    // Create new user
    const user = new User({
      telegramId,
      nickname,
      age,
      gender,
      interests: interests || [],
      isActive: true,
      lastActive: new Date()
    });
    
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Update user profile
router.put('/update-profile', validateUserInput, async (req, res) => {
  try {
    const { telegramId, nickname, age, gender, interests } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ message: 'Telegram ID is required' });
    }
    
    // Find user to update
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    user.nickname = nickname;
    user.age = age;
    user.gender = gender;
    
    if (interests && Array.isArray(interests)) {
      if (interests.length > 5) {
        return res.status(400).json({ message: 'Maximum 5 interests allowed' });
      }
      user.interests = interests;
    }
    
    user.lastActive = new Date();
    
    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
});

// Get user profile
router.get('/profile/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
});

module.exports = router; 