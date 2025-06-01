const API_BASE_URL = 'http://localhost:8000';

export const textToSpeech = async (text) => {
  console.log('Sending text to speech request:', { text });
  try {
    // First, make a POST request to get the audio
    const response = await fetch(`${API_BASE_URL}/text-to-speech/`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, audio/mpeg',
      },
      body: JSON.stringify({ text }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to convert text to speech: ${response.status} ${response.statusText}`);
    }

    // Get the audio blob from the response
    const audioBlob = await response.blob();
    console.log('Received audio blob:', audioBlob);
    
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Received empty audio data');
    }
    
    // Create a temporary URL for the blob
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('Created audio URL:', audioUrl);
    
    return audioUrl;
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    throw error;
  }
};

export const saveSpeechData = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/speechdata/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save speech data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving speech data:', error);
    throw error;
  }
};
