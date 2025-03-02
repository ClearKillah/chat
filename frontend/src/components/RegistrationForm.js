import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const RegistrationForm = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegram();
  
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    gender: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.nickname || !formData.age || !formData.gender) {
      setError('All fields are required');
      return;
    }
    
    if (isNaN(formData.age) || parseInt(formData.age) < 13 || parseInt(formData.age) > 100) {
      setError('Age must be a number between 13 and 100');
      return;
    }
    
    // Clear any existing errors
    setError('');
    setLoading(true);
    
    try {
      // Get Telegram user ID
      if (!telegramUser || !telegramUser.id) {
        throw new Error('Telegram user not available');
      }
      
      // Register user
      const userData = {
        telegramId: telegramUser.id.toString(),
        nickname: formData.nickname,
        age: parseInt(formData.age),
        gender: formData.gender,
        interests: []
      };
      
      const response = await registerUser(userData);
      
      // Registration successful
      onRegistrationComplete(response.user);
      
      // Navigate to interests selection
      navigate('/interests');
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle already registered user
      if (error.response?.status === 409) {
        // User already exists, use the returned user data
        onRegistrationComplete(error.response.data.user);
        navigate('/search');
        return;
      }
      
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h2>Create your profile</h2>
      <p>Enter your details to start chatting anonymously</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nickname">Nickname</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            placeholder="Enter a nickname"
            maxLength={20}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter your age"
            min={13}
            max={100}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          className="btn" 
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm; 