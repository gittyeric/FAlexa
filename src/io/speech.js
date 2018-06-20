const synth = window.speechSynthesis;

const speak = (synth, txt, { voice, pitch, rate }) => {
    if (synth.speaking) {
        synth.cancel();
    }
    var utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = voice;
    utterThis.pitch = pitch;
    utterThis.rate = rate;
    synth.speak(utterThis);
};

export const getDefaultVoice = () => {
    const voices = synth.getVoices();
    return synth.getVoices()[0] // voices.length - 1];
}

export const speakerFactory = (voice, pitch, rate) =>
    (txt) =>
        speak(synth, txt, { voice, pitch, rate });

export const defaultSpeaker = () =>
    speakerFactory(getDefaultVoice(), 1.8, 1);