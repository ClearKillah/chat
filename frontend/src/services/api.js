import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// User API calls
const registerUser = async (userData) => {
  try {
    const response = await api.post('/api/users/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/api/users/update-profile', userData);
    return response.data;
  } catch (error) {
    console.error('Profile update error:', error.response?.data || error.message);
    throw error;
  }
};

const getUserProfile = async (telegramId) => {
  try {
    const response = await api.get(`/api/users/profile/${telegramId}`);
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    throw error;
  }
};

// Chat API calls
const findChatPartner = async (telegramId) => {
  try {
    const response = await api.post('/api/chat/find', { telegramId });
    return response.data;
  } catch (error) {
    console.error('Find chat partner error:', error.response?.data || error.message);
    throw error;
  }
};

const skipChatPartner = async (telegramId) => {
  try {
    const response = await api.post('/api/chat/skip', { telegramId });
    return response.data;
  } catch (error) {
    console.error('Skip chat partner error:', error.response?.data || error.message);
    throw error;
  }
};

const endChat = async (telegramId) => {
  try {
    const response = await api.post('/api/chat/end', { telegramId });
    return response.data;
  } catch (error) {
    console.error('End chat error:', error.response?.data || error.message);
    throw error;
  }
};

const getChatHistory = async (telegramId) => {
  try {
    const response = await api.get(`/api/chat/history/${telegramId}`);
    return response.data;
  } catch (error) {
    console.error('Get chat history error:', error.response?.data || error.message);
    throw error;
  }
};

export {
  registerUser,
  updateUserProfile,
  getUserProfile,
  findChatPartner,
  skipChatPartner,
  endChat,
  getChatHistory
}; 