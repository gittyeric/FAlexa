let _defaultRecognition = null;
const getDefaultRecognition = () => {
    if (_defaultRecognition) {
        return _defaultRecognition;
    }

    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new RecognitionClass();

    // recognition.grammars = speechRecognitionList;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    _defaultRecognition = recognition;
    return recognition;
}

// Returns a function that, when called during a user mouse/keyboard event, will start voice recognition
// incomingSentencesHandler will be called with an array of possible sentences whenever recognized
const newRecognizerFactory = (recognition = getDefaultRecognition()) => {
    let isListening = false
    return (incomingSentencesHandler) => {
        let endListeningHandler = () => {}
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
            const curIndex = event.results.length - 1;
            for (const i in event.results[curIndex]) {
                sentences.push(event.results[curIndex][i].transcript);
                console.log(`Got ${event.results[curIndex][i].transcript}`)
            }
            incomingSentencesHandler(sentences.filter(s => !!s));
        }
        recognition.onend = () => {
            isListening = false
            endListeningHandler();
        }

        const start = () => {
            isListening = true
            recognition.onresult = resultHandler
            recognition.start()
        }
        const stop = () => {
            if (isListening) {
                recognition.stop()
            }

            isListening = false
            // recognition.onresult = () => false
        }
        const abort = () => {
            recognition.onresult = () => false
            if (isListening){
                recognition.abort()
            }
            stop()
        }

        return {
            start, 
            stop, 
            abort,
            isListening: () => isListening,
            onEnd: (endHandler) => {
                endListeningHandler = endHandler
            },
        }
    }
}

module.exports = {
    getDefaultRecognition,
    newRecognizerFactory,
};
