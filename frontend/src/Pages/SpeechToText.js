import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaMicrophone, FaStop, FaSave, FaTrash, FaLanguage } from 'react-icons/fa';
import { saveSpeechData } from '../utils/api';
import '../App.css';

const SpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const lyricsContainerRef = useRef(null);
  const lastFinalIndexRef = useRef(0);

  // Language options
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese' },
  ];

  useEffect(() => {
    // Check if the browser supports the Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language;

    // Handle results more efficiently
    recognitionRef.current.onresult = (event) => {
      const results = event.results;
      let newFinalText = '';
      let hasNewFinal = false;
      
      // Only process new results
      for (let i = lastFinalIndexRef.current; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal) {
          newFinalText += result[0].transcript + ' ';
          hasNewFinal = true;
        }
      }
      
      if (hasNewFinal) {
        transcriptRef.current += newFinalText;
        lastFinalIndexRef.current = results.length;
        
        // Batch state updates
        setTranscript(transcriptRef.current);
        
        // Use requestAnimationFrame for smoother UI updates
        requestAnimationFrame(() => {
          if (lyricsContainerRef.current) {
            const { scrollHeight, clientHeight } = lyricsContainerRef.current;
            lyricsContainerRef.current.scrollTo({
              top: scrollHeight,
              behavior: 'smooth'
            });
          }
        });
      }
    };

    // Handle errors
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access was denied. Please allow microphone access to use this feature.');
      }
      stopListening();
    };

    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = () => {
    if (!isListening) {
      // Batch state updates
      transcriptRef.current = '';
      lastFinalIndexRef.current = 0;
      setTranscript('');
      
      // Start recognition with a small delay to prevent UI jank
      setTimeout(() => {
        recognitionRef.current.start();
        setIsListening(true);
      }, 50);
    }
  };

  const stopListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      saveTranscript();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscript = useCallback(() => {
    transcriptRef.current = '';
    lastFinalIndexRef.current = 0;
    setTranscript('');
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      alert('Transcript copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy transcript to clipboard');
    }
  };

  const saveTranscript = async () => {
    if (!transcript.trim()) return;
    
    try {
      await saveSpeechData({
        text: transcript,
        timestamp: new Date().toISOString(),
        language: language
      });
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
    }
  };

  // Split transcript into lines for the lyrics display
  const transcriptLines = transcript.split(/[.!?]+/).filter(line => line.trim() !== '');

  if (!isSupported) {
    return (
      <div className="speech-to-text">
        <h2>Speech to Text</h2>
        <div className="error-message">
          <p>Sorry, your browser doesn't support the Web Speech API.</p>
          <p>Please try using Chrome, Edge, or Safari.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="speech-to-text-container">
      <div className="speech-controls">
        <h2>Speech to Text</h2>
        
        <div className="language-selector">
          <FaLanguage className="language-icon" />
          <select 
            value={language} 
            onChange={handleLanguageChange}
            disabled={isListening}
            className="language-dropdown"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button 
            onClick={toggleListening} 
            className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
          >
            {isListening ? <FaStop /> : <FaMicrophone />}
            {isListening ? ' Stop' : ' Start Listening'}
          </button>
          
          {transcript && (
            <>
              <button 
                onClick={copyToClipboard} 
                className="btn btn-secondary"
              >
                <FaSave /> Copy
              </button>
              <button 
                onClick={clearTranscript} 
                className="btn btn-outline"
                disabled={isListening}
              >
                <FaTrash /> Clear
              </button>
            </>
          )}
        </div>

        {isListening && (
          <div className="listening-indicator">
            <div className="pulse-animation"></div>
            <span>Listening...</span>
          </div>
        )}
      </div>

      <div className="transcript-display">
        <div className="lyrics-container">
          {transcript ? (
            <div className="lyrics-lines">
              {transcriptLines.map((line, index) => (
                <div 
                  key={index} 
                  className={`lyrics-line ${index === transcriptLines.length - 1 ? 'active' : ''}`}
                >
                  {line.trim()}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-transcript">
              <div className="mic-icon-container">
                <FaMicrophone className="mic-icon" />
              </div>
              <p>Start speaking to see your transcription</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeechToText;