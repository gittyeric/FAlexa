export type Speaker = (toSay: string) => void

// tslint:disable-next-line:no-any
const getSynth: () => SpeechSynthesis = () => window !== undefined ? window.speechSynthesis : {} as SpeechSynthesis

// tslint:disable-next-line:no-any
const speak = (synthesis: SpeechSynthesis, txt: string, voice: SpeechSynthesisVoice, pitch: number, rate: number): void => {
    if (synthesis.speaking) {
        synthesis.cancel();
    }
    const utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = voice;
    utterThis.pitch = pitch;
    utterThis.rate = rate;
    synthesis.speak(utterThis);
};

export const getDefaultVoice = (): SpeechSynthesisVoice => {
    return getSynth().getVoices()[0] // voices.length - 1];
}

// tslint:disable-next-line:no-any
export const speakerFactory = (voice: SpeechSynthesisVoice, pitch: number, rate: number): Speaker =>
    (txt: string) =>
        speak(getSynth(), txt, voice, pitch, rate)

export const defaultSpeaker = (): Speaker =>
    speakerFactory(getDefaultVoice(), 1.8, 1)
