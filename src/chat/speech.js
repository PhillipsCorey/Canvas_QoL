const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

class SpeechService {
  constructor() {
    if (!SpeechRecognition) {
      console.error("SpeechRecognition NOT supported");
      throw new Error("SpeechRecognition not supported");
    }

    console.log("SpeechRecognition supported");

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.onTranscriptCallback = null;

    this.fullTranscript = "";
    this.lastIndex = 0;
    this.listening = false;

    this.recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    this.sessionTranscript = ""; // add to constructor

    this.recognition.onend = () => {
      if (this.listening) {
        this.sessionTranscript = this.fullTranscript; // save before restart
        this.recognition.start();
      }
    };

    this.recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      this.fullTranscript = this.sessionTranscript + finalText;
      const displayText = this.fullTranscript + interimText;

      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(displayText);
      }
    };


  }

  start() {
    console.log("Calling recognition.start()");
    this.listening = true;
    this.lastIndex = 0;
    this.recognition.start();
  }

  stop() {
    console.log("Calling recognition.stop()");
    this.listening = false;
    this.recognition.stop();
  }

  onTranscript(callback) {
    this.onTranscriptCallback = callback;
  }

  resetTranscript() {
    this.fullTranscript = "";
    this.sessionTranscript = "";
  }

  getTranscript() {
    return this.fullTranscript;
  }
}

export default SpeechService;