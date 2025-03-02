import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChatHistory, skipChatPartner, endChat } from '../services/api';
import { joinChat, sendMessage, endChat as socketEndChat, onEvent } from '../services/socket';
import { useTelegram } from '../hooks/useTelegram';

const ChatScreen = ({ user }) => {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [partnerOnline, setPartnerOnline] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Load chat history and set up chat when component mounts
  useEffect(() => {
    if (!user || !user.currentChatPartnerId) {
      navigate('/search');
      return;
    }
    
    // Generate chat ID
    const chatId = generateChatId(user.telegramId, user.currentChatPartnerId);
    
    // Join the chat room
    joinChat(chatId);
    
    // Load chat history
    loadChatHistory();
    
    // Disable Telegram Web App back button
    if (tg && tg.BackButton) {
      tg.BackButton.hide();
    }
  }, [user, navigate, tg]);
  
  // Listen for socket events
  useEffect(() => {
    // Listen for new messages
    const unsubscribeMessage = onEvent('receive-message', (data) => {
      addMessage({
        id: data.id,
        senderId: data.senderId,
        content: data.content,
        createdAt: data.createdAt,
        isReceived: true
      });
    });
    
    // Listen for sent message confirmation
    const unsubscribeSent = onEvent('message-sent', (data) => {
      // Optionally update message status
    });
    
    // Listen for chat ended
    const unsubscribeChatEnded = onEvent('chat-ended', (data) => {
      // Show notification
      setError(data.message || 'Chat has ended');
      
      // Navigate back to search
      setTimeout(() => {
        navigate('/search');
      }, 2000);
    });
    
    // Listen for partner online status
    const unsubscribePartnerOnline = onEvent('partner-online', () => {
      setPartnerOnline(true);
    });
    
    // Listen for partner offline status
    const unsubscribePartnerOffline = onEvent('partner-offline', () => {
      setPartnerOnline(false);
    });
    
    return () => {
      // Cleanup listeners
      unsubscribeMessage();
      unsubscribeSent();
      unsubscribeChatEnded();
      unsubscribePartnerOnline();
      unsubscribePartnerOffline();
    };
  }, [navigate]);
  
  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Generate a chat ID from two user IDs
  const generateChatId = (userId1, userId2) => {
    const sortedIds = [userId1, userId2].sort();
    return `${sortedIds[0]}_${sortedIds[1]}`;
  };
  
  // Load chat history
  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await getChatHistory(user.telegramId);
      
      if (response.messages) {
        // Format messages
        const formattedMessages = response.messages.map(msg => ({
          id: msg._id,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: msg.createdAt,
          isReceived: msg.senderId !== user.telegramId
        }));
        
        setMessages(formattedMessages);
      }
      
      // Set partner info
      setPartnerInfo({
        id: user.currentChatPartnerId,
        nickname: "Anonymous" // We don't know partner's nickname in anonymous chat
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Load chat history error:', error);
      setError('Failed to load chat history');
      setLoading(false);
    }
  };
  
  // Add a new message to the list
  const addMessage = (message) => {
    setMessages(prevMessages => {
      // Check if message already exists
      if (prevMessages.some(msg => msg.id === message.id)) {
        return prevMessages;
      }
      return [...prevMessages, message];
    });
  };
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Send message via socket
    sendMessage(messageInput.trim());
    
    // Clear input
    setMessageInput('');
  };
  
  // Handle keypress in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle skipping current partner
  const handleSkipPartner = async () => {
    try {
      await skipChatPartner(user.telegramId);
      navigate('/search');
    } catch (error) {
      console.error('Skip partner error:', error);
      setError('Failed to skip partner');
    }
  };
  
  // Handle ending the chat
  const handleEndChat = async () => {
    try {
      // End chat via API
      await endChat(user.telegramId);
      
      // Also emit socket event
      socketEndChat();
      
      navigate('/search');
    } catch (error) {
      console.error('End chat error:', error);
      setError('Failed to end chat');
    }
  };
  
  // Format timestamp for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }
  
  return (
    <div className="chat-screen">
      <div className="chat-header">
        <div className="chat-title">
          {partnerInfo ? `Chatting with Anonymous` : 'Chat'}
          {partnerOnline && <span className="online-status"> • Online</span>}
        </div>
        <div className="chat-actions">
          <button 
            className="btn btn-secondary"
            onClick={handleSkipPartner}
          >
            Skip
          </button>
          <button 
            className="btn btn-danger"
            onClick={handleEndChat}
          >
            End Chat
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Say hello to start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.isReceived ? 'received' : 'sent'}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-time">{formatTime(message.createdAt)}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        <textarea
          className="message-input"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
        />
        <button 
          className="btn send-button"
          onClick={handleSendMessage}
          disabled={!messageInput.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default ChatScreen; 