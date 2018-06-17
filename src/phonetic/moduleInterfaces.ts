import { ParamMap, VarType, Cmd } from './publicInterfaces';

export interface RunnableCmd <P extends ParamMap> {
    cmd: Cmd<P>,
    runParams: P,
}

export interface FilterInterpretation {
    varType: VarType,
    words: string[], // Targeted words that were allowed through filter
    consumed: number, // Number of words consumed from the previous words array
    penalty: number, // Infinity means not valid
    maxResults: number, // Max # partial matches allowed
}
export type FilterInterpretations = FilterInterpretation[]

export interface DirectiveInterpretation<P extends ParamMap> {
    filterInterpretation: FilterInterpretation,
    remainingWords: string[], // Words remaining after this directive has consumed from it
    runParams: P,
}
export type DirectiveInterpretations<P extends ParamMap> = DirectiveInterpretation<P>[]
