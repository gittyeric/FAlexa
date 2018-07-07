import { Cmd, ParamMap, Directive, CmdMatchSettings, RunResponse } from './publicInterfaces';
import { Require, Any } from './syntax';

// Customize how syntax is matched
export const createCmdMatchSettings = (
    ignoreFuzzyMatches: boolean = false, // Only bother running or asking if perfect match
    autoRunIfFuzzy: boolean = false, // Is safe to auto-run if sole fuzzy match
    alwaysAsk: boolean = false, // Confirm running even if it seems to match perfect, good for dangerous operations

    maxFuzzyCmds: number = 2, // Max number of command syntax interpretations to offer if multiple match
    maxFuzzyDirectives: number = 3, // A higher number considers more directive interpretations and maybe better results
    maxFuzzyFilterResults: number = 25, // A higher number considers more fuzzy filter matches and maybe better results
): CmdMatchSettings => ({
    ignoreFuzzyMatches,
    autoRunIfFuzzy,
    alwaysAsk,

    maxFuzzyFilterResults,
    maxFuzzyDirectives,
    maxFuzzyCmds,
})

// Create a command to map a syntax interpretation to your Javascript function
export function createCmd<P extends ParamMap>(
    syntax: Directive<ParamMap>[], // The syntax to match for running your custom runFunc
    runFunc: (params: P) => RunResponse, // The function to run when syntax is matched
    describe?: (params: P) => string, // A description of the cmd for clarifying questions or statements
    matchSettings?: CmdMatchSettings, // Customizable settings for how to match the syntax to input text
): Cmd<P> {
    return ({
        syntax: syntax as Directive<P>[],
        runFunc,
        describe,
        matchSettings: matchSettings !== undefined ? matchSettings : createCmdMatchSettings(),
    })
}

// Add an activation word that all initial commands must begin with
export const addActivationWord = (activationWords: string[], cmds: Cmd<ParamMap>[]): Cmd<ParamMap>[] => {
    return cmds.map((cmd: Cmd<ParamMap>) => {
        const activatedSyntax = [Require(Any(activationWords)), ...cmd.syntax]
        return { ...cmd, syntax: activatedSyntax }
    })
}

export * from './syntax';
export * from './publicInterfaces';
export * from './text';
export { newInterpretter, Interpretter } from './interpretter';
