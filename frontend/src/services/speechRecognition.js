/**
 * Speech Recognition Service
 * Wrapper for the Web Speech API
 */

class SpeechRecognitionService {
  constructor() {
    this.recognition = null;
    this.isSupported = false;
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onStart = null;
    this.onEnd = null;
    
    this.initialize();
  }
  
  initialize() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition is not supported in this browser');
      this.isSupported = false;
      return;
    }
    
    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    
    // Configure recognition
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
    
    // Set up event handlers
    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;
      
      if (this.onResult) {
        this.onResult(transcript, isFinal);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      
      if (this.onError) {
        let message = 'An error occurred during speech recognition';
        
        switch (event.error) {
          case 'no-speech':
            message = 'No speech was detected. Please try again.';
            break;
          case 'audio-capture':
            message = 'No microphone was found or access was denied.';
            break;
          case 'not-allowed':
            message = 'Microphone access was denied. Please allow microphone access.';
            break;
          case 'network':
            message = 'A network error occurred.';
            break;
          case 'aborted':
            message = 'Speech recognition was aborted.';
            break;
        }
        
        this.onError(message, event.error);
      }
    };
    
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) {
        this.onStart();
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }
  
  /**
   * Start listening for speech
   */
  start() {
    if (!this.isSupported) {
      if (this.onError) {
        this.onError('Speech recognition is not supported in this browser', 'not-supported');
      }
      return false;
    }
    
    if (this.isListening) {
      return false;
    }
    
    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }
  
  /**
   * Stop listening for speech
   */
  stop() {
    if (!this.isSupported || !this.isListening) {
      return;
    }
    
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }
  
  /**
   * Abort speech recognition
   */
  abort() {
    if (!this.isSupported) {
      return;
    }
    
    try {
      this.recognition.abort();
    } catch (error) {
      console.error('Failed to abort speech recognition:', error);
    }
  }
  
  /**
   * Set the language for recognition
   * @param {string} lang - Language code (e.g., 'en-US', 'es-ES')
   */
  setLanguage(lang) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }
}

// Create a singleton instance
const speechRecognition = new SpeechRecognitionService();

export default speechRecognition;

