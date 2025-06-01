import React from "react";
import {BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Home from "./Pages/Home";
import TextToSpeech from "./Pages/TextToSpeech";
import SpeechToText from "./Pages/SpeechToText";
import VoiceAssistant from "./Components/VoiceAssistant";


function MyAccessApp() {
  return (
    <Router>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/text-to-speech" element={<TextToSpeech />} />
          <Route path="/speech-to-text" element={<SpeechToText />} />
          <Route path="/voice-assistant" element={<VoiceAssistant />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default MyAccessApp;
