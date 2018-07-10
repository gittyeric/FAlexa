import { SentenceSource, FAlexa, createFalexa } from '../falexa';
import { Cmd, ParamMap } from '../phonetic';

export const createMockSentenceSource: () => SentenceSource = () => {
    return {
        onend: () => undefined,
        start(): void {},
        stop(): void {},
        startListening(): void {},
        stopListening(): void {},
    }
}

export const createMockSpeaker: () => (toSay: string) => void = () => {
    return (): void => {}
}

export const createMockFalexa: (cmds: Cmd<ParamMap>[]) => FAlexa = (cmds: Cmd<ParamMap>[]) => {
    return createFalexa(cmds, createMockSpeaker(), createMockSentenceSource(), () => {})
}
