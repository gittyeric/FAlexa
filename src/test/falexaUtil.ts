import { FAlexa, createFalexa } from '../falexa';
import { Cmd, ParamMap } from '../phonetic';

export const createMockSpeaker: () => (toSay: string) => void = () => {
    return (): void => {}
}

export const createMockFalexa: (cmds: Cmd<ParamMap>[]) => FAlexa = (cmds: Cmd<ParamMap>[]) => {
    return createFalexa(cmds, createMockSpeaker(), () => {})
}
