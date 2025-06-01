import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMicrophone, FaStop, FaRobot } from 'react-icons/fa';
import axios from 'axios';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [conversation, setConversation] = useState([
    { role: 'assistant', content: 'Hello! How can I assist you today?' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationContext, setConversationContext] = useState('');
  const recognitionRef = useRef(null);
  const conversationEndRef = useRef(null);
  const navigate = useNavigate();

  // Handle navigation commands
  const handleNavigation = async (command) => {
    console.log('Received command:', command);
    if (!command || typeof command !== 'string') {
      console.error('Invalid command:', command);
      return null;
    }
    
    const normalizedCommand = command.toLowerCase().trim();
    console.log('Normalized command:', normalizedCommand);
    
    let route = null;
    let response = null;

    if (normalizedCommand.includes('home') || normalizedCommand.includes('main')) {
      route = '/';
      response = 'Taking you to the home page.';
    } else if (normalizedCommand.includes('speech to text') || normalizedCommand.includes('speech-to-text')) {
      route = '/speech-to-text';
      response = 'Opening the Speech to Text tool.';
    } else if (normalizedCommand.includes('text to speech') || normalizedCommand.includes('text-to-speech')) {
      route = '/text-to-speech';
      response = 'Opening the Text to Speech tool.';
    } else if (normalizedCommand.includes('voice assistant') || normalizedCommand.includes('assistant')) {
      route = '/voice-assistant';
      response = 'You\'re already in the Voice Assistant!';
    }
    
    if (route) {
      console.log('Navigation detected. Route:', route, 'Response:', response);
      // Add a small delay to ensure the message is displayed before navigation
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Navigating to:', route);
      navigate(route);
      return response;
    } else {
      console.log('No navigation route matched for command:', command);
    }
    
    return null;
  };

  // Initialize speech recognition
  useEffect(() => {
    let isMounted = true;
    
    const initSpeechRecognition = () => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error('Speech recognition not supported in this browser');
          return null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          if (isMounted) {
            console.log('Speech recognition started');
            setIsListening(true);
          }
        };

        recognition.onend = () => {
          if (isMounted) {
            console.log('Speech recognition ended');
            setIsListening(false);
          }
        };

        recognition.onresult = handleSpeechResult;
        recognition.onerror = handleSpeechError;
        
        return recognition;
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        return null;
      }
    };
    
    recognitionRef.current = initSpeechRecognition();
    
    return () => {
      isMounted = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  const handleSpeechResult = async (event) => {
    console.log('Speech recognition result received');
    try {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      console.log('Transcript:', transcript);

      if (!transcript.trim()) {
        console.log('Empty transcript received');
        return;
      }

      const userMessage = { role: 'user', content: transcript };
      setConversation(prev => [...prev, userMessage]);
      
      // Check for navigation commands first
      const navigationResponse = await handleNavigation(transcript);
      if (navigationResponse) {
        const assistantMessage = { role: 'assistant', content: navigationResponse };
        setConversation(prev => [...prev, assistantMessage]);
        speak(navigationResponse);
        return;
      }
      
      // If not a navigation command, process as regular conversation
      setConversationContext(prev => 
        prev ? `${prev} ${transcript}` : transcript
      );
      
      await getAIResponse(transcript);
      
    } catch (error) {
      console.error('Error processing speech result:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.',
        isError: true
      };
      setConversation(prev => [...prev, errorMessage]);
    }
  };
  
  const handleSpeechError = (event) => {
    console.error('Speech recognition error:', event.error, 'Event:', event);
    setIsListening(false);
    
    let errorMessage = 'An error occurred with speech recognition.';
    if (event.error === 'not-allowed') {
      errorMessage = 'Please allow microphone access to use voice commands.';
    } else if (event.error === 'audio-capture') {
      errorMessage = 'No microphone was found. Please ensure a microphone is connected.';
    }
    
    setConversation(prev => [...prev, {
      role: 'assistant',
      content: errorMessage,
      isError: true
    }]);
  };



  const getAIResponse = async (userInput) => {
    try {
      setIsProcessing(true);
      
      // Prepare conversation history with context
      const messages = [
        {
          role: 'system',
          content: `You are a helpful assistant. Keep responses concise and natural. 
                  The user said: "${userInput}" 
                  Previous context: ${conversationContext || 'No previous context'}`
        },
        ...conversation.slice(-4).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Call the backend API with credentials
      const response = await axios({
        method: 'post',
        url: 'http://127.0.0.1:8001/api/chat/',  // Updated port to 8001
        data: { messages },
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        validateStatus: (status) => status < 500  // Don't reject on 4xx status codes
      });

      if (response.status === 200 && response.data.message) {
        const aiMessage = { 
          role: 'assistant', 
          content: response.data.message,
          timestamp: new Date().toISOString()
        };
        
        // Update conversation with AI response
        setConversation(prev => [...prev, aiMessage]);
        
        // Update conversation context with AI response
        setConversationContext(prev => 
          prev ? `${prev} ${aiMessage.content}` : aiMessage.content
        );
        
        // Convert AI response to speech
        speak(aiMessage.content);
      } else {
        throw new Error(response.data.error || 'Failed to get response from server');
      }
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: error.message || 'Sorry, I encountered an error. Please try again.',
        isError: true
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: 'Voice recognition is not available in your browser.',
        isError: true
      }]);
      return;
    }

    try {
      if (isListening) {
        console.log('Stopping speech recognition');
        recognitionRef.current.stop();
      } else {
        console.log('Starting speech recognition');
        await recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      const errorMessage = error.message.includes('not-allowed')
        ? 'Please allow microphone access in your browser settings.'
        : 'Error accessing microphone. Please try again.';
      
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: errorMessage,
        isError: true
      }]);
      setIsListening(false);
    }
  };

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  return (
    <div className="voice-assistant">
      <div className="conversation-container">
        {conversation.length === 0 ? (
          <div className="welcome-message">
            <FaRobot className="robot-icon" />
            <p>Hi there! How can I help you today?</p>
          </div>
        ) : (
          conversation.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={conversationEndRef} />
      </div>
      
      <div className="controls">
        <button 
          onClick={toggleListening} 
          className={`mic-button ${isListening ? 'listening' : ''}`}
          disabled={isProcessing}
        >
          {isListening ? <FaStop /> : <FaMicrophone />}
          {isListening ? ' Stop' : ' Speak'}
        </button>
        {isProcessing && <div className="processing-indicator">Processing...</div>}
      </div>
    </div>
  );
};

export default VoiceAssistant;
