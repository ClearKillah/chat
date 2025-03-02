import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { findChatPartner } from '../services/api';
import { findPartner, onEvent } from '../services/socket';

const SearchScreen = ({ user }) => {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  
  // Reset search state when component loads
  useEffect(() => {
    // If user already has a chat partner, navigate to chat screen
    if (user && user.currentChatPartnerId) {
      navigate('/chat');
    }
  }, [user, navigate]);
  
  // Listen for socket events
  useEffect(() => {
    // Listen for partner found event
    const unsubscribePartnerFound = onEvent('partner-found', (data) => {
      console.log('Partner found:', data);
      navigate('/chat');
    });
    
    // Listen for socket errors
    const unsubscribeError = onEvent('error', (data) => {
      setError(data.message || 'An error occurred');
      setSearching(false);
    });
    
    return () => {
      // Cleanup listeners
      unsubscribePartnerFound();
      unsubscribeError();
    };
  }, [navigate]);
  
  // Start searching for a partner
  const handleStartSearch = async () => {
    setError('');
    setSearching(true);
    
    try {
      // Call API to start searching
      await findChatPartner(user.telegramId);
      
      // Also emit socket event to find partner
      findPartner();
    } catch (error) {
      console.error('Start search error:', error);
      setError(error.response?.data?.message || 'Failed to start search. Please try again.');
      setSearching(false);
    }
  };
  
  return (
    <div className="search-screen">
      <h2>Anonymous Chat</h2>
      <p>Find someone to chat with anonymously</p>
      
      {error && <div className="error-message">{error}</div>}
      
      {searching ? (
        <>
          <div className="loader"></div>
          <div className="search-status">Looking for a chat partner...</div>
          <button 
            className="btn btn-secondary"
            onClick={() => setSearching(false)}
          >
            Cancel
          </button>
        </>
      ) : (
        <button 
          className="btn"
          onClick={handleStartSearch}
        >
          Find a chat partner
        </button>
      )}
      
      <div className="user-profile">
        <h3>Your Profile</h3>
        <p><strong>Nickname:</strong> {user.nickname}</p>
        <p><strong>Age:</strong> {user.age}</p>
        <p><strong>Gender:</strong> {user.gender}</p>
        {user.interests && user.interests.length > 0 && (
          <p><strong>Interests:</strong> {user.interests.join(', ')}</p>
        )}
      </div>
    </div>
  );
};

export default SearchScreen; 