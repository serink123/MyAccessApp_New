# MyAccessApp

MyAccessApp is a modern web application that provides speech-to-text and text-to-speech functionality, making digital content more accessible to everyone. The app features a clean, responsive interface built with React and styled with CSS.

## Live Demo

Check out the live demo: [https://myaccessapp-22681.web.app](https://myaccessapp-22681.web.app)

## Features

### 1. Speech to Text
- **Real-time Transcription**: Convert spoken words into text in real-time
- **Browser-Based**: Uses the Web Speech API for in-browser speech recognition
- **Modern UI**: Clean, intuitive interface with visual feedback during recording
- **Copy to Clipboard**: One-click copy functionality for transcribed text

### 2. Text to Speech
- **Natural Sounding Speech**: Converts written text into spoken words
- **Multiple Voices**: Choose from different voice options
- **Playback Controls**: Play, pause, and stop functionality
- **Responsive Design**: Works on both desktop and mobile devices

## Technical Implementation

### Frontend
- **React.js**: For building the user interface
- **React Router**: For navigation between different views
- **Web Speech API**: For speech recognition and synthesis
- **CSS Modules**: For scoped styling and theming
- **Responsive Design**: Mobile-first approach with media queries

### Backend
- **Node.js with Express**: API server
- **WebSocket**: For real-time communication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MyAccessApp.git
   cd MyAccessApp/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Deployment

The app is deployed using Firebase Hosting. To deploy:

```bash
# Build the app
npm run build

# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
firebase deploy
```
