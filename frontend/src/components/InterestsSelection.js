import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile } from '../services/api';

// Predefined list of interests
const INTERESTS = [
  'Музыка', 'Кино', 'Спорт', 'Искусство', 'Технологии', 
  'Игры', 'Путешествия', 'Кулинария', 'Литература', 'Наука', 
  'Мода', 'Фитнес', 'Животные', 'Природа', 'Бизнес'
];

const InterestsSelection = ({ user, onComplete }) => {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState(user.interests || []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      // Remove interest if already selected
      setSelectedInterests(selectedInterests.filter(item => item !== interest));
    } else {
      // Add interest if not selected and limit to 5
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        setError('You can select a maximum of 5 interests');
        // Clear error after 3 seconds
        setTimeout(() => setError(''), 3000);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Update user profile with selected interests
      const userData = {
        telegramId: user.telegramId,
        nickname: user.nickname,
        age: user.age,
        gender: user.gender,
        interests: selectedInterests
      };
      
      const response = await updateUserProfile(userData);
      
      // Update complete
      onComplete(response.user);
      
      // Navigate to search screen
      navigate('/search');
    } catch (error) {
      console.error('Update interests error:', error);
      setError(error.response?.data?.message || 'Failed to update interests. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSkip = () => {
    navigate('/search');
  };
  
  return (
    <div className="interests-container">
      <h2>Select your interests</h2>
      <p>Choose up to 5 topics you're interested in</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="interests-list">
        {INTERESTS.map((interest) => (
          <div
            key={interest}
            className={`interest-item ${selectedInterests.includes(interest) ? 'selected' : ''}`}
            onClick={() => toggleInterest(interest)}
          >
            {interest}
          </div>
        ))}
      </div>
      
      <div className="selected-count">
        {selectedInterests.length} of 5 selected
      </div>
      
      <div className="form-actions">
        <button 
          className="btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Interests'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={handleSkip}
          disabled={loading}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default InterestsSelection; 