import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import InterestsSelection from './components/InterestsSelection';
import SearchScreen from './components/SearchScreen';
import ChatScreen from './components/ChatScreen';
import { initSocket } from './services/socket';
import { useTelegram } from './hooks/useTelegram';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tg, user: telegramUser } = useTelegram();

  useEffect(() => {
    // Initialize Telegram WebApp
    tg.ready();

    // Check if user is already registered
    const checkRegistration = async () => {
      try {
        if (telegramUser && telegramUser.id) {
          const response = await fetch(`/api/users/profile/${telegramUser.id}`);
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            
            // Initialize socket
            initSocket(data.user.telegramId);
          }
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRegistration();
  }, [tg, telegramUser]);

  // Update user state when registration is complete
  const handleRegistrationComplete = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/search" />
              ) : (
                <RegistrationForm onRegistrationComplete={handleRegistrationComplete} />
              )
            }
          />
          <Route
            path="/interests"
            element={
              user ? (
                <InterestsSelection user={user} onComplete={handleRegistrationComplete} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/search"
            element={
              user ? <SearchScreen user={user} /> : <Navigate to="/" />
            }
          />
          <Route
            path="/chat"
            element={
              user && user.currentChatPartnerId ? (
                <ChatScreen user={user} />
              ) : (
                <Navigate to="/search" />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App; 