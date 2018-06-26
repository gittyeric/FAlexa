import { Cmd, CmdMatchSettings,
    Directive, ParamMap, CmdResponse, RunResponse} from './publicInterfaces';
import { RunnableCmd, DirectiveInterpretation, DirectiveInterpretations} from './moduleInterfaces';
import { trimd } from './sort';
import { filterFirstStopwords, txtToValidWords } from './text';
import { createClarificationResponse, defaultCmdDescription, createRepeatCmd } from './interactSkills';
import { cloneDeep } from 'lodash';

export type SyntaxInterpretation<P extends ParamMap> = DirectiveInterpretations<P>
export type SyntaxInterpretations<P extends ParamMap> = SyntaxInterpretation<P>[]

export interface CmdInterpretation<P extends ParamMap> {
    cmd: Cmd<P>,
    topInterpretations: SyntaxInterpretations<P>, // empty means cmd did not match
    minPenalty: number,
}

export type CmdInterpretations = CmdInterpretation<ParamMap>[]

function interpretDirective<P extends ParamMap>
(directive: Directive<P>, words: string[], paramMap: P, settings: CmdMatchSettings): DirectiveInterpretations<P> {
    const interpretAttempt = directive(words, cloneDeep(paramMap), settings.maxFuzzyFilterResults)

    // Don't let stopwords prevent directives from breaking
    if (interpretAttempt.length === 0) {
        const matchingStopwords = filterFirstStopwords(words, 1)
        if (matchingStopwords.length > 0) {
            const withoutStopwords = words.slice(matchingStopwords.length)
            return interpretDirective(directive, withoutStopwords, cloneDeep(paramMap), settings)
                .map((interpretation: DirectiveInterpretation<P>) => 
                    ({...interpretation, 
                        filterInterpretation: {
                            ...interpretation.filterInterpretation, 
                            // Add back the consumed stopword count
                            consumed: interpretation.filterInterpretation.consumed + matchingStopwords.length,
                        },
                    }))
        }
    }

    return trimd(interpretAttempt, settings.maxFuzzyDirectives)
}

const getSyntaxPenalty = <P extends ParamMap>(syntaxInterpretation: SyntaxInterpretation<P>) => {
    return syntaxInterpretation
        .reduce((pSum: number, interpretation: DirectiveInterpretation<P>) => 
            pSum + interpretation.filterInterpretation.penalty, 
        0)
}

// Takes an array of SyntaxInterpretations that are sorted by penalty and merges + sorts them
export function sortAndFlatten<P extends ParamMap>(sortedArrs: SyntaxInterpretations<P>[]): SyntaxInterpretations<P> {
    let mergeLen = 0
    const possibleArrs = sortedArrs.map((sorted: SyntaxInterpretations<P>) => {
        return sorted.filter((syntaxInterpretation: SyntaxInterpretation<P>) => 
            getSyntaxPenalty(syntaxInterpretation) !== Infinity)
        })
        .filter((sorted: SyntaxInterpretations<P>) => sorted.length > 0)
    const indexLens = possibleArrs.map((sorted: SyntaxInterpretations<P>) => {
        mergeLen += sorted.length
        return sorted.length
    })
    const curIndexes = new Array<number>(possibleArrs.length)
    for (let i = 0; i < possibleArrs.length; i++) {
        curIndexes[i] = 0
    }

    const merged = new Array<DirectiveInterpretations<P>>(mergeLen)

    for (let i = 0; i < mergeLen; i++) {
        let minArrIndex = -1
        let minPenalty = Infinity
        for (let s = 0; s < possibleArrs.length; s++) {
            const sCurIndex = curIndexes[s]
            if (sCurIndex < indexLens[s]) {
                const syntaxInterpretation: DirectiveInterpretations<P> = possibleArrs[s][sCurIndex]
                const syntaxPenalty = getSyntaxPenalty(syntaxInterpretation)
                if (syntaxPenalty < minPenalty) {
                    minPenalty = syntaxPenalty
                    minArrIndex = s
                }
            }
        }

        const minIndex = curIndexes[minArrIndex]
        merged[i] = possibleArrs[minArrIndex][minIndex]
        curIndexes[minArrIndex] += 1
    }
    return merged
}

// Do a tree search over all possible directive interpretations of this syntax
// and return the best interpretations of syntaxes by least penalty
function interpretSyntax<P extends ParamMap>(syntax: Directive<P>[], words: string[], paramMap: P,
    settings: CmdMatchSettings, 
    directivesSoFar: DirectiveInterpretations<P>): SyntaxInterpretations<P> | null {
    
    if (syntax.length === 0) {
        const nextStopwords = filterFirstStopwords(words)

        // If there's no words left (besides stopwords), then all good!
        // throw it into the top results array and sort it out later.
        if ((words.length - nextStopwords.length) === 0) {
            return [directivesSoFar]
        }
        // Else if there's words left over from parsing, consider it an error (for now)
        //const penalty = words.reduce((sum: number, word: string): number => sum + word.length, 0)
        return null
    }

    const interpretNext = syntax[0]
    const directiveInterpretations = interpretDirective(interpretNext, words, cloneDeep(paramMap), settings)

    if (directiveInterpretations.length === 0) {
        return null
    }

    const remainingSyntax = syntax.slice(1)
    const nextDirectiveResults = 
        directiveInterpretations.map((interpretation: DirectiveInterpretation<P>) =>
            interpretSyntax(remainingSyntax, interpretation.remainingWords, cloneDeep(interpretation.runParams), settings, 
                [...directivesSoFar, interpretation]))
    
    const validInterpretations = 
        nextDirectiveResults.filter(
            (result: SyntaxInterpretations<P> | null) => result !== null) as SyntaxInterpretations<P>[]
    return sortAndFlatten(validInterpretations)
}

interface SeenParams { [index: string]: boolean }
function deduplicateSyntaxInterpretations<P extends ParamMap>
    (syntaxInterpretations: SyntaxInterpretations<P>): SyntaxInterpretations<P> {
        const seenParamMaps: SeenParams = {}
        return syntaxInterpretations.filter((interpretation: SyntaxInterpretation<P>) => {
            const paramSignature = JSON.stringify(interpretation[interpretation.length - 1].runParams)
            if (seenParamMaps[paramSignature] !== undefined) {
                return false
            }
            seenParamMaps[paramSignature] = true
            return true
        })
}

function interpretCmd<P extends ParamMap>(cmd: Cmd<P>, words: string[]): CmdInterpretation<P> {
    const interprettedSyntaxes: SyntaxInterpretations<P> | null = interpretSyntax(cmd.syntax, words, {} as P, cmd.matchSettings, [])
    let minPenalty = Infinity
    if (interprettedSyntaxes !== null) {
        minPenalty = 
        interprettedSyntaxes
            .map((possibleSyntax: DirectiveInterpretations<P>): number =>
                getSyntaxPenalty(possibleSyntax))
            .reduce((minSyntaxPenalty: number, syntaxPenalty: number): number => 
                    Math.min(minSyntaxPenalty, syntaxPenalty),
                Infinity)
    }
    
    return {
        minPenalty,
        topInterpretations: interprettedSyntaxes === null ? [] : 
            deduplicateSyntaxInterpretations(interprettedSyntaxes),
        cmd,
    }
}

function isCmdResponse(response: RunResponse): response is CmdResponse {
    return (<CmdResponse>response).outputMessage !== undefined;
}

function isCmdListResponse(response: RunResponse): response is Cmd<ParamMap>[] {
    return (<Cmd<ParamMap>[]>response).length !== undefined;
}

function runCmd<P extends ParamMap>(cmd: Cmd<P>, runParams: P): CmdResponse {
    const runResponse = cmd.runFunc(runParams)
    
    if (runResponse !== undefined) {
        if (isCmdResponse(runResponse)) {
            return runResponse
        }
    
        if (isCmdListResponse(runResponse)) {
            return {
                outputMessage: defaultCmdDescription({ cmd, runParams }) + ' done',
                contextualCmds: runResponse,
            }
        }
    }

    return {
        contextualCmds: [],
        outputMessage: defaultCmdDescription({ cmd, runParams }) + ' done',
    }
}

function runTopCmdInterpretation<P extends ParamMap>(interpretation: CmdInterpretation<P>) {
    const runParams = cmdInterpretationToRunParams(interpretation.topInterpretations[0])
    return runCmd(interpretation.cmd, runParams)
}

function cmdInterpretationToRunParams<P extends ParamMap>(interpretation: DirectiveInterpretations<P>): P {
    return interpretation[interpretation.length - 1].runParams
}

const sortByDirectiveCount = (curInterpretations: CmdInterpretations): CmdInterpretations =>
    curInterpretations.sort( (interp1: CmdInterpretation<ParamMap>, interpr2: CmdInterpretation<ParamMap>) => 
        interp1.cmd.syntax.length > interpr2.cmd.syntax.length ? -1 : 1 )

function sortTiedCmds(interpretations: CmdInterpretations): CmdInterpretations {
    const sorted: CmdInterpretations = []
    let curPenalty = -1
    let curInterpretations: CmdInterpretations = []
    for (let i = 0; i < interpretations.length; i++) {
        const interpretation = interpretations[i]
        if (interpretation.minPenalty !== curPenalty) {
            curPenalty = interpretation.minPenalty
            sortByDirectiveCount(curInterpretations)
            sorted.push(...curInterpretations)
            curInterpretations = []
        }
        curInterpretations.push(interpretation)
    }

    if (curInterpretations.length > 0) {
        sortByDirectiveCount(curInterpretations)
        sorted.push(...curInterpretations)
    }

    return sorted
}

function topCmdInterpretationsToRunnables(interpretations: CmdInterpretations): RunnableCmd<ParamMap>[] {
    const sortedInterpretations = sortTiedCmds(interpretations)

    // If only 1 cmd type to run, pick between the top maxResults
    if (sortedInterpretations.length === 1) {
        // Return remaining interpretations
        return sortedInterpretations[0].topInterpretations.slice(0, sortedInterpretations[0].cmd.matchSettings.maxFuzzyCmds)
            .map((syntaxInterpretation: SyntaxInterpretation<ParamMap>) => ({
                cmd: sortedInterpretations[0].cmd,
                runParams: cmdInterpretationToRunParams(syntaxInterpretation),
            }))
    }

    // If multiple cmd types match, pick between the best of the top 2 cmd matches
    return sortedInterpretations.slice(0, 2).map((cmdInterpretation: CmdInterpretation<ParamMap>) => ({
        cmd: cmdInterpretation.cmd,
        runParams: cmdInterpretationToRunParams(cmdInterpretation.topInterpretations[0]),
    }))
}

const emptyCmdResponse: CmdResponse = {
    contextualCmds: [],
    outputMessage: '',
}

const interpretCmds = (cmds: Cmd<ParamMap>[], words: string[]): CmdResponse => {
    const interpretationsByCmd: CmdInterpretations = cmds.map((cmd: Cmd<ParamMap>) => interpretCmd(cmd, words))

    const exactInterpretationsByCmd = interpretationsByCmd.filter(
        (interpretation: CmdInterpretation<ParamMap>) => 
            interpretation.minPenalty === 0)
        .map((cmdInterpretation: CmdInterpretation<ParamMap>) => ({
            ...cmdInterpretation,
            topInterpretations: cmdInterpretation.topInterpretations.filter((syntax: SyntaxInterpretation<ParamMap>) => 
                getSyntaxPenalty(syntax) === 0),
        }))

    const topExactMatches = topCmdInterpretationsToRunnables(exactInterpretationsByCmd)
    // If exactly 1 match
    if (topExactMatches.length === 1 && !exactInterpretationsByCmd[0].cmd.matchSettings.alwaysAsk) {
        return runTopCmdInterpretation(exactInterpretationsByCmd[0])
    }
    // If 0 or more cmds matched perfectly, clarify what to run
    if (topExactMatches.length > 0) {
        topExactMatches.forEach((m: RunnableCmd<ParamMap>) => {
            console.log(JSON.stringify(m.runParams))
        })
        return createClarificationResponse(topExactMatches)
    }

    // No exact matches, Do fuzzy matching for enabled cmds
    const fuzzyInterpretations = interpretationsByCmd.filter(
        (cmdInterpretation: CmdInterpretation<ParamMap>) => 
            !cmdInterpretation.cmd.matchSettings.ignoreFuzzyMatches && cmdInterpretation.minPenalty < Infinity)
    const topFuzzyMatches = topCmdInterpretationsToRunnables(fuzzyInterpretations)

    // If only 1 type of cmd matched, auto-run if enabled
    if (fuzzyInterpretations.length === 1 && fuzzyInterpretations[0].cmd.matchSettings.autoRunIfFuzzy) {
        return runTopCmdInterpretation(fuzzyInterpretations[0])
    }

    if (topFuzzyMatches.length > 0) {
        return createClarificationResponse(topFuzzyMatches)
    }

    return emptyCmdResponse
}

const interpretPrioritizedCmds = (priorityCmds: Cmd<ParamMap>[], cmds: Cmd<ParamMap>[], txt: string) => {
    const words = txtToValidWords(txt)
    const exactPriorityCmds = priorityCmds.map((cmd: Cmd<ParamMap>): Cmd<ParamMap> => 
        ({...cmd, 
            matchSettings: {...cmd.matchSettings, ignoreFuzzyMatches: true },
        }))

    const exactPrioritizedResults = interpretCmds(exactPriorityCmds, words)
    if (exactPrioritizedResults === emptyCmdResponse) {
        return interpretCmds([...priorityCmds, ...cmds], words)
    }
    return exactPrioritizedResults
}

export interface Interpretter {
    getOutputMessage(): string,
    getContextualCmds(): Cmd<ParamMap>[],
    interpret(txt: string): Interpretter,
}

const getOutputMessage = (interpretation?: CmdResponse): string => {
    if (interpretation === undefined) {
        return ''
    }
    return interpretation.outputMessage === undefined ? '' : interpretation.outputMessage
}

const createDefaultPrioritizedCmds = (lastInterpretation: CmdResponse): Cmd<ParamMap>[] => {
    return [
        createRepeatCmd(getOutputMessage(lastInterpretation)),
    ]
}

const _newInterpretter = (
    cmds: Cmd<ParamMap>[], 
    prioritizedCmds: Cmd<ParamMap>[] = [], 
    interpretation?: CmdResponse): Interpretter => ({

        getOutputMessage(): string {
            return getOutputMessage(interpretation)
        },

        getContextualCmds(): Cmd<ParamMap>[] { return [...prioritizedCmds] },

        interpret(txt: string): Interpretter {
            const nextInterpretation = interpretPrioritizedCmds(prioritizedCmds, cmds, txt)
            const nextContextualCmds = [
                ...(nextInterpretation.contextualCmds === undefined ? [] : nextInterpretation.contextualCmds),
                ...createDefaultPrioritizedCmds(nextInterpretation),
            ]
            return _newInterpretter(
                cmds,
                nextContextualCmds,
                nextInterpretation,
            )
        },
    })

export const newInterpretter = (cmds: Cmd<ParamMap>[]): Interpretter => _newInterpretter(cmds)
