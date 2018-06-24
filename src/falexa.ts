import { newInterpretter } from './phonetic/interpretter'
import { ParamMap, Cmd } from '.';

type Speaker = (toSay: string) => void
type SentencesHandler = (sentencePossibilities: string[]) => void

// Something that generates an array of possible sentence interpretations,
// generally intended for the browser's SpeechRecognition instance
export interface SentenceSource {
    start(): void,
    stop(): void,
    startListening(): void,
    stopListening(): void,
}

// tslint:disable-next-line:no-any no-unsafe-any no-require-imports
const defaultSpeaker = (<() => Speaker>require('./io/speech').defaultSpeaker)
const newRecognizerFactory =
    // tslint:disable-next-line:no-require-imports no-unsafe-any no-any
    (<(source: SentenceSource) => (handler: SentencesHandler) => SentenceSource> require('./io/recognition').newRecognizerFactory)
// tslint:disable-next-line:no-require-imports no-any no-unsafe-any
const getDefaultRecognition = (<() => SentenceSource> require('./io/recognition').getDefaultRecognition);

export interface FAlexa {
    speak(toSay: string): void,
    hear(sentencePossibilities: string[]): string,
    startListening(): void,
    stopListening(): void,
}

export const createFalexa = (cmds: Cmd<ParamMap>[],
    speaker: (toSay: string) => void,
    // tslint:disable-next-line:no-any
    sentenceSource: SentenceSource,
    debugLogger: (msg: string) => void): FAlexa => {

    // Setup interpretter
    let interpretter = newInterpretter(cmds)

    // Setup voice recognition
    const sentenceHandler: SentencesHandler = (sentencePossibilities: string[]) => {
        debugLogger(`Heard '${sentencePossibilities[0]}'`)
        interpretter = interpretter.interpret(sentencePossibilities[0])
        debugLogger(`"${interpretter.getOutputMessage()}"`)
        speaker(interpretter.getOutputMessage())
    }
    const recognizer = newRecognizerFactory(sentenceSource)(sentenceHandler)

    return {
        speak(toSay: string): void {
            debugLogger(`"${toSay}"`)
            speaker(toSay)
        },
        hear(sentences: string[]): string {
            sentenceHandler(sentences)
            return interpretter.getOutputMessage()
        },
        startListening(): void {
            recognizer.start()
        },
        stopListening(): void {
            recognizer.stop()
        },
    }
}

export const falexa = (cmds: Cmd<ParamMap>[]): FAlexa => {
    return createFalexa(cmds, defaultSpeaker(), getDefaultRecognition(), console.log)
}
