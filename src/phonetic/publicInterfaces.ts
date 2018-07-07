import { FilterInterpretations, DirectiveInterpretations } from './moduleInterfaces';

export interface Cmd<P extends ParamMap> {
    // The pattern to match before calling runFunc, see fields under Syntax object
    syntax: Directive<P>[],

    // Settings for how to match, you can generally ignore this
    matchSettings: CmdMatchSettings,

    // Returns a string to describe the cmd, used for either:
    // 1. Clarifying if there's ambiguity: "Set timer <name> for <number> seconds?".
    //    Defaults to "Run command with <var1>=<value1>, <var2>=<value2>..."
    // 2. Declaring that the command has run: "Set timer <name> for <number> seconds."
    //    Defaults to "Done" if not set
    describe?(params: P): string,

    // The function to run when cmd is invoked
    // P contains a map of variables parsed based on syntax: {var1Name: value1, var2Name: value2...}.
    // Optionally return a list of contextual commands that can only be
    // triggered immediately after this Cmd is triggered.  These take precedence over others.
    runFunc(params: P): RunResponse,
}

export interface CmdResponse {
    contextualCmds?: Cmd<ParamMap>[], // Cmds that are only available after this one runs
    outputMessage?: string, // The message to output after running
    laterResponse?: Promise<CmdResponse>, // Async-triggered overwriting of current response
}

export type RunResponse = undefined | CmdResponse | Cmd<ParamMap>[]

export interface CmdMatchSettings {
    
    // Limit the number of possibilities a single Filter can give
    maxFuzzyFilterResults: number,
    
    // Limit the number of possible directive interpretations per directive in a syntax
    maxFuzzyDirectives: number,
    
    // The max number of partial cmd matches allowed.  Because this
    // number dictates how many "Did you mean X, Y, Z...?" clarification
    // questions can be asked, it defaults to 2
    maxFuzzyCmds: number,

    // If this command is always safe to run, it will be run without confirmation
    // if this is the only fuzzily matched command. Defaults to false
    autoRunIfFuzzy: boolean,

    // Only run this command if it strictly matches the syntax perfectly.
    // Defaults to false
    ignoreFuzzyMatches: boolean,

    // Always ask to confirm running this regardless of match quality, 
    // useful for dangerous operations.
    // Defaults to false cuz we crazy like that
    alwaysAsk: boolean,
}

export type ParamValue = string | number | undefined
export interface ParamMap {
    [index: string]: ParamValue
}

// Syntax
export type Filter = (inputState: FilterInterpretations) => FilterInterpretations;
export type Directive<P extends ParamMap> = 
    (words: string[], runParams: P, maxFuzzyFilterResults: number)
        => DirectiveInterpretations<P>

export enum VarType {
    Undefined = 0,
    Numeric = 1,
    Text = 2,
}

export interface PhraseMap {
    [index: string]: string
}
