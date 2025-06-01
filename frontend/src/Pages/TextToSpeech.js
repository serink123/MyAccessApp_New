import React, { useState, useEffect } from 'react';
import '../App.css';
import { textToSpeech, saveSpeechData } from '../utils/api';

const TextToSpeech = () => {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceOptions, setVoiceOptions] = useState([]);
  
  // Debug log
  console.log('Current voices:', voiceOptions, 'Selected:', selectedVoice);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('Available system voices:', voices);
      
      if (voices.length > 0) {
        // Get all English voices
        const englishVoices = voices.filter(voice => 
          voice.lang.startsWith('en-') || voice.lang.startsWith('en_')
        );
        
        console.log('English voices:', englishVoices);
        
        // Create options for each voice
        const options = [];
        const seen = new Set();
        
        // Add all available English voices
        englishVoices.forEach((voice, index) => {
          const voiceKey = `${voice.name}-${voice.lang}`;
          if (!seen.has(voiceKey)) {
            seen.add(voiceKey);
            options.push({
              id: voiceKey,
              name: `${voice.name} (${voice.lang})`,
              voice: voice
            });
          }
        });
        
        // If no voices found, show a message
        if (options.length === 0) {
          console.warn('No English voices found');
          options.push({
            id: 'default',
            name: 'Default Voice',
            voice: null
          });
        }
        
        setVoiceOptions(options);
        
        // Set initial selection if not already set
        if (!selectedVoice && options.length > 0) {
          setSelectedVoice(options[0].id);
        }
      }
    };

    // Initial load
    loadVoices();
    
    // Set up listener for when voices change
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Cleanup
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice]);

  const speak = async () => {
    if (!text.trim()) return;
    
    try {
      setIsSpeaking(true);
      
      // Use the Web Speech API directly for better voice control
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice if one is selected
      if (selectedVoice) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoiceObj = voices.find(v => 
          `${v.name}-${v.lang}` === selectedVoice
        );
        
        if (selectedVoiceObj) {
          utterance.voice = selectedVoiceObj;
          console.log('Using voice:', selectedVoiceObj.name, selectedVoiceObj.lang);
        }
      }
      
      // Set speech properties
      utterance.volume = volume;
      utterance.rate = rate;
      utterance.pitch = pitch;
      
      // Set up event handlers
      utterance.onstart = () => {
        console.log('Speech started');
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setIsSpeaking(false);
        alert('Error: ' + event.error);
      };
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
      // Save the speech data to the backend (don't await this)
      saveSpeechData({
        text: text,
        timestamp: new Date().toISOString(),
        voice: selectedVoice || 'default',
        rate: rate,
        pitch: pitch,
        volume: volume
      }).catch(saveError => {
        console.error('Error saving speech data:', saveError);
        // Don't fail the whole operation if saving fails
      });
      
    } catch (error) {
      console.error('Error in speak:', error);
      setIsSpeaking(false);
      alert('Failed to speak text: ' + error.message);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleVoiceChange = (e) => {
    console.log('Voice changed to:', e.target.value);
    setSelectedVoice(e.target.value);
  };

  return (
    <div className="text-to-speech">
      <h1>Text to Speech</h1>
      <p className="subtitle">Convert your text into natural-sounding speech</p>
      
      <div className="transcript-container">
        <textarea
          id="text-to-speak"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste your text here..."
          rows={8}
        />
      </div>

      <div className="language-selector">
        <h3 className="language-heading">Select Voice</h3>
        <select 
          className="language-dropdown"
          value={selectedVoice}
          onChange={handleVoiceChange}
          disabled={isSpeaking}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minWidth: '200px'
          }}
        >
          {voiceOptions.length > 0 ? (
            voiceOptions.map(option => (
              <option 
                key={option.id} 
                value={String(option.id)}
              >
                {option.name}
              </option>
            ))
          ) : (
            <option value="">Loading voices...</option>
          )}
        </select>
      </div>

      <div className="controls">
        <div className="control-group">
          <label htmlFor="pitch">Pitch: {pitch.toFixed(1)}</label>
          <input
            type="range"
            id="pitch"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            disabled={isSpeaking}
          />
        </div>

        <div className="control-group">
          <label htmlFor="rate">Speed: {rate.toFixed(1)}</label>
          <input
            type="range"
            id="rate"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            disabled={isSpeaking}
          />
        </div>

        <div className="control-group">
          <label htmlFor="volume">Volume: {Math.round(volume * 100)}%</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            disabled={isSpeaking}
          />
        </div>
      </div>

      <div className="button-group">
        {!isSpeaking ? (
          <button 
            onClick={speak} 
            className="btn primary"
            disabled={!text.trim()}
          >
            <span role="img" aria-hidden="true">🔊</span> {isSpeaking ? 'Speaking...' : 'Speak'}
          </button>
        ) : (
          <button 
            onClick={stopSpeaking} 
            className="btn secondary"
          >
            <span role="img" aria-hidden="true">⏹️</span> Stop
          </button>
        )}
        <button 
          onClick={() => setText('')} 
          className="btn outline"
          disabled={!text || isSpeaking}
        >
          <span role="img" aria-hidden="true">🗑️</span> Clear
        </button>
      </div>
    </div>
  );
};

export default TextToSpeech;