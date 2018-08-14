import { newInterpretter } from './phonetic/interpretter'
import { ParamMap, Cmd } from '.';
import { Speaker, defaultSpeaker } from './io/speech';

type SentencesHandler = (sentencePossibilities: string[]) => void

// A cheap substitute for missing SpeechRecognition API type
// (should replace after support is added)
export interface Recognition {
    start(): void,
    stop(): void,
    abort(): void,
    onend(): void,
}

// Something that generates an array of possible sentence interpretations,
// generally intended to wrap the browser's SpeechRecognition instance
export interface SentenceSource {
    onend: (() => void),
    start(): void,
    stop(): void,
    abort(): void,
    onEnd(endHandler: () => void): void,
    isListening(): boolean,
}

// Forcibly typed io/recognition imports

const newRecognizerFactory =
    // tslint:disable-next-line:no-require-imports no-unsafe-any no-any
    (<(recognizer: Recognition) => (handler: SentencesHandler) => SentenceSource> require('./io/recognition').newRecognizerFactory)
// tslint:disable-next-line:no-require-imports no-any no-unsafe-any
const getDefaultRecognition = (<() => Recognition> require('./io/recognition').getDefaultRecognition);

export interface Unlistener {
    stop(): void,
    abort(): void,
    isListening(): void,
    onEnd(endHandler: () => void): void,
}
export interface FAlexa {
    speak(toSay: string): void,
    hear(sentencePossibilities: string[]): string,
    listen(recognition: Recognition | undefined): Unlistener,
    onListenStop(handler: () => void): void,
    offListenStop(handler: () => void): void,
}

// Programmatic & test-friendly constructor
export const createFalexa = (cmds: Cmd<ParamMap>[],
    speaker: (toSay: string) => void = console.log,
    debugLogger: (msg: string) => void = console.log): FAlexa => {

    // Setup interpretter & mutable state
    let interpretter = newInterpretter(cmds)
    let stopHandlers: (() => void)[] = []

    // Setup voice recognition
    const sentenceHandler: SentencesHandler = (sentencePossibilities: string[]) => {
        debugLogger(`HEARD: '${sentencePossibilities[0]}'`)
        interpretter = interpretter.interpret(sentencePossibilities[0])
        debugLogger(`SPEAK: "${interpretter.getOutputMessage()}"`)
        speaker(interpretter.getOutputMessage())
    }

    return {
        speak(toSay: string): void {
            debugLogger(`FORCE: "${toSay}"`)
            speaker(toSay)
        },
        hear(sentences: string[]): string {
            sentenceHandler(sentences)
            return interpretter.getOutputMessage()
        },
        listen(recognition: Recognition | undefined): Unlistener {
            // Setup recognition end master handler
            const validRecognition = recognition !== undefined ?
                recognition :
                getDefaultRecognition()
            validRecognition.onend = () => {
                stopHandlers.forEach((handler: () => void) => handler())
            }

            // Abort any existing recognition listening
            validRecognition.abort()

            const recognizer = newRecognizerFactory(validRecognition)(sentenceHandler)
            recognizer.start()
            return recognizer
        },
        onListenStop(handler: () => void): void {
            stopHandlers.push(handler)
        },
        offListenStop(handler: () => void): void {
            stopHandlers = stopHandlers.filter((h: () => void) => h !== handler)
        },
    }
}

// Web Frontend-friendly constructor
export const falexa = (
    cmds: Cmd<ParamMap>[], 
    speaker: Speaker = defaultSpeaker(),
    debugLogger: (msg: string) => void = console.log): FAlexa => {
    return createFalexa(cmds, speaker, debugLogger)
}
