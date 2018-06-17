export const getDefaultRecognition = () => {
    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new RecognitionClass();

    // recognition.grammars = speechRecognitionList;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    return recognition;
}

// Returns a function that, when called during a user mouse/keyboard event, will start voice recognition
// incomingSentencesHandler will be called with an array of possible sentences whenever recognized
export const newRecognizerFactory = (recognition = getDefaultRecognition()) => {
    return (incomingSentencesHandler) => {
        const resultHandler = (event) => {
            // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
            // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
            // It has a getter so it can be accessed like an array
            // The first [0] returns the SpeechRecognitionResult at position 0.
            // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
            // These also have getters so they can be accessed like arrays.
            // The second [0] returns the SpeechRecognitionAlternative at position 0.
            // We then return the transcript property of the SpeechRecognitionAlternative object
            const sentences = [];
            for (const i in event.results[0]) {
                sentences.push(event.results[0][i].transcript);
            }
            incomingSentencesHandler(sentences.filter(s => !!s));
        }

        const startListening = () => {
            recognition.onresult = resultHandler
        }
        const stopListening = () => {
            recognition.onresult = () => false
        }
        const start = () => {
            startListening()
            recognition.start()
        }
        const stop = () => {
            stopListening()
            recognition.stop()
        }

        return {
            start, 
            stop, 
            startListening, 
            stopListening
        }
    }
};