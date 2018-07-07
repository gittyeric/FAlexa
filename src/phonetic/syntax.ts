import {
    Filter, Directive,
    ParamMap, VarType, ParamValue
} from './publicInterfaces';
import { FilterInterpretation, FilterInterpretations, DirectiveInterpretation, DirectiveInterpretations } from './moduleInterfaces';
import { matchWordsToPhrase, phoneticPhraseDistance } from './text';
import { wordsToParsedNumber } from './numeric';
import { isNullOrUndefined, isNumber } from 'util';
import { trimf } from './sort';
import { cloneDeep, flatten } from 'lodash';

// Don't filter anything
const passThruFilter: Filter =
    (filteredInput: FilterInterpretations) => filteredInput

// Grabs a phrase of fixed word count
const phraseFilter = (wordCount: number, preFilter: Filter): Filter =>
    (filteredInput: FilterInterpretations): FilterInterpretations => {
        return preFilter(filteredInput).map((fInput: FilterInterpretation) => ({
            ...fInput,
            words: fInput.words.splice(wordCount),
            consumed: fInput.consumed + wordCount,
        }))
    }

// Grabs all words up to a given stop word
const stopPhraseFilter = (stopPhrases: string[], includeStopword: boolean, preFilter: Filter): Filter =>
    (filteredInput: FilterInterpretations): FilterInterpretations => {
        const possibleInterpretations: FilterInterpretations = []
        preFilter(filteredInput).forEach((interpretation: FilterInterpretation) => {
            let stopSeen = false
            const fuzzyStopMatches: FilterInterpretations = []
            for (let w = 1; w < interpretation.words.length && !stopSeen; w++) {
                for (let s = 0; s < stopPhrases.length && !stopSeen; s++) {
                    const stopPhrase = stopPhrases[s]
                    const stopPhraseWords = stopPhrase.split(' ')
                    const stopMatch = matchWordsToPhrase(interpretation.words.slice(w), stopPhrase)
                    const includedStopwords: string[] = includeStopword ? stopPhraseWords : []
                    const selectedWords = interpretation.words.slice(0, w)
                    const distance = phoneticPhraseDistance(stopMatch.join(' '), stopPhrase)
                    const newInterpretation = {
                        ...interpretation,
                        words: [...selectedWords, ...includedStopwords],
                        consumed: interpretation.consumed + selectedWords.length + stopMatch.length,
                        penalty: interpretation.penalty + distance,
                    }

                    // If exact match is hit, only assume the exact match
                    if (distance === 0) {
                        possibleInterpretations.push(newInterpretation)
                        stopSeen = true
                        break
                    }

                    fuzzyStopMatches.push(newInterpretation)
                }
            }
            if (!stopSeen) {
                possibleInterpretations.push(...fuzzyStopMatches)
            }
        })

        return trimf(possibleInterpretations)
    }

const remainingPhraseFilter = (preFilter: Filter): Filter =>
    (filtered: FilterInterpretations): FilterInterpretations => {
        return preFilter(filtered).map((interpretation: FilterInterpretation) => ({
            ...interpretation,
            consumed: interpretation.words.length + interpretation.consumed,
        }))
    }

// ------ Boolean stuff -----------
interface FilterInterpretationMap {
    [index: string]: FilterInterpretation,
}
const filterInterpretationToKey = (interpretation: FilterInterpretation): string => {
    return `${interpretation.varType},${interpretation.consumed},${interpretation.words.join(' ')}`
}
const filterInterpretationsToMap = (interpretations: FilterInterpretations): FilterInterpretationMap => {
    const interpretationMap: FilterInterpretationMap = {}
    interpretations.forEach((interpretation: FilterInterpretation) => {
        const key = filterInterpretationToKey(interpretation)
        const curKeyPenalty = interpretationMap[key] === undefined ? Infinity : interpretationMap[key].penalty
        if (interpretation.penalty < curKeyPenalty) {
            interpretationMap[key] = interpretation
        }
    })
    return interpretationMap
}

const mergeInterpretationMaps = (map1: FilterInterpretationMap, map2: FilterInterpretationMap): FilterInterpretationMap => {
    const merged: FilterInterpretationMap = {}
    const allKeys = [...Object.keys(map1), ...Object.keys(map2)]
    for (const key of allKeys) {
        if (map1[key] !== undefined && map2[key] !== undefined) {
            merged[key] = {
                ...map1[key],
                penalty: Math.min(map1[key].penalty, map2[key].penalty),
            }
        }
        else {
            merged[key] = map1[key] === undefined ? map2[key] : map1[key]
        }
    }
    return merged
}

const intersectInterpretationMaps = (map1: FilterInterpretationMap, map2: FilterInterpretationMap): FilterInterpretationMap => {
    const intersected: FilterInterpretationMap = {}
    for (const key of Object.keys(map1)) {
        if (map2[key] !== undefined) {
            intersected[key] = {
                ...map1[key],
                penalty: (map1[key].penalty + map2[key].penalty),
            }
        }
    }
    return intersected
}

// merge all filters' results together and trim by penalty
const orFilter = (filters: Filter[]): Filter =>
    (filtered: FilterInterpretations): FilterInterpretations => {
        let mergeList: FilterInterpretationMap = {}
        const allResults = filters.map((filterI: Filter) => filterI(filtered))
        allResults.forEach((result: FilterInterpretations) => {
            mergeList = mergeInterpretationMaps(mergeList, filterInterpretationsToMap(result))
        })
        return trimf(Object.keys(mergeList).map((key: string) => mergeList[key]))
    }

// merge together only the FilterInterpretations that are equal by matching
// words and type, as well as number of input words consumed
const andFilter = (filters: Filter[]): Filter =>
    (filtered: FilterInterpretations): FilterInterpretations => {
        let candidateInterpretations = {}
        const allResults = filters.map((filterI: Filter) => filterI(filtered))
        allResults.forEach((result: FilterInterpretations, i: number) => {
            if (i === 0) {
                candidateInterpretations = filterInterpretationsToMap(result)
            }
            else {
                candidateInterpretations = intersectInterpretationMaps(
                    candidateInterpretations,
                    filterInterpretationsToMap(result))
            }
        })

        return trimf(flatten(allResults))
    }

// TO DO: fix the consequences of this guy's existence
/* const mapper = (phraseToReplacementMap: PhraseMap, preFilter: Filter): Filter =>
    (filtered: FilterInterpretations): FilterInterpretations => {
        return preFilter(filtered).map((interpretation: FilterInterpretation) => {
            const { words } = interpretation
            const mapped = replaceWords(phraseToReplacementMap, words)
            return {
                ...interpretation,
                words: mapped,
                consumed: interpretation.consumed + (words.length - mapped.length),
            }
        });
    } */

const anyFilter = (phraseWhitelist: string[], preFilter: Filter) =>
    (filteredInput: FilterInterpretations): FilterInterpretations => {
        return trimf(flatten(preFilter(filteredInput).map((interpretation: FilterInterpretation): FilterInterpretations => {
            return phraseWhitelist.map((allowed: string) => {
                const matchedWords = matchWordsToPhrase(interpretation.words, allowed)
                const phrasePenalty = phoneticPhraseDistance(allowed, matchedWords.join(' '))
                const allowedWords = allowed.split(' ')

                return {
                    ...interpretation,
                    words: allowedWords,
                    consumed: interpretation.consumed + matchedWords.length,
                    penalty: phrasePenalty + interpretation.penalty,
                }
            })
        })))
    };

const lazyAnyFilter = (phraseWhitelistGenerator: () => string[], preFilter: Filter) =>
    (filteredInput: FilterInterpretations): FilterInterpretations => {
        return anyFilter(phraseWhitelistGenerator(), preFilter)(filteredInput)
    }

const blacklistWordCount = (phraseBlacklist: string[]): number => {
    if (phraseBlacklist.length === 0) {
        throw new Error('Cannot pass empty list to None')
    }
    const wordCount = phraseBlacklist[0].split(' ').length
    phraseBlacklist.map((p: string) => {
        if (p.split(' ').length !== wordCount) {
            throw new Error('None\'s blacklisted phrases must all have equal word counts');
        }
    })
    return wordCount
}

// This is an all-or-nothing filter, it won't penalize for sounding similar to blacklisted words
const noneFilter = (phraseBlacklist: string[], preFilter: Filter) => {
    const wordCount = blacklistWordCount(phraseBlacklist);

    return (filteredInput: FilterInterpretations): FilterInterpretations => {
        return trimf(preFilter(filteredInput).map((interpretation: FilterInterpretation) => {
            for (const disallowed of phraseBlacklist) {
                const matchedWords = matchWordsToPhrase(interpretation.words, disallowed)
                const distance = phoneticPhraseDistance(matchedWords.join(' '), disallowed)
                if (distance === 0) {
                    return {
                        ...interpretation,
                        words: [],
                        penalty: Infinity,
                    }
                }
            }

            const withRemovals = interpretation.words.slice(0, wordCount)
            return {
                ...interpretation,
                words: withRemovals,
                consumed: interpretation.consumed + wordCount,
            }
        }))
    }
}

const lazyNoneFilter = (phraseBlacklistGenerator: () => string[], preFilter: Filter) =>
    (filteredInput: FilterInterpretations): FilterInterpretations => {
        return noneFilter(phraseBlacklistGenerator(), preFilter)(filteredInput)
    }

const precisionFilter = (maxAllowablePenalty: number, preFilter: Filter) => {
    return (filteredInput: FilterInterpretations): FilterInterpretations => {
        return trimf(preFilter(filteredInput).filter((interpretation: FilterInterpretation) =>
            interpretation.penalty <= maxAllowablePenalty
        ))
    }
}

const numericFilter = (minNumber: number, maxNumber: number, preFilter: Filter): Filter =>
    (filteredInput: FilterInterpretations): FilterInterpretations => {
        return preFilter(filteredInput).map((interpretation: FilterInterpretation) => {
            const parsedNumber = wordsToParsedNumber(interpretation.words)

            if (isFinite(parsedNumber.value) &&
                parsedNumber.value >= minNumber &&
                parsedNumber.value <= maxNumber) {
                return {
                    ...interpretation,
                    words: [`${parsedNumber.value}`],
                    consumed: (interpretation.consumed + parsedNumber.consumed),
                    varType: VarType.Numeric,
                }
            } else {
                return {
                    ...interpretation,
                    varType: VarType.Numeric,
                    penalty: Infinity,
                    words: [],
                }
            }
        })
    }

const paramValue = (interpretation: FilterInterpretation): ParamValue =>
    interpretation.varType === VarType.Text ?
        interpretation.words.join(' ') :
        parseFloat(interpretation.words[0])

function updateParams<P extends ParamMap>(oldParams: P, name?: string, value?: ParamValue): P {
    if (name !== undefined) {
        return {
            ...(oldParams as object),
            [name]: value,
        } as P
    }
    return cloneDeep(oldParams)
}

// Require a filtered match to add to the run function's named parameter list
function varDirective<P extends ParamMap>(name: string | undefined, filter: Filter): Directive<P> {
    return (words: string[], runParams: P, maxFuzzyFilterResults: number): DirectiveInterpretations<P> => {
        const nullInterpretation: FilterInterpretation = {
            maxResults: maxFuzzyFilterResults,
            penalty: 0,
            words,
            consumed: 0,
            varType: VarType.Text,
        }

        const filteredInterpretations = trimf(filter([nullInterpretation]))

        return filteredInterpretations.map((interpretation: FilterInterpretation): DirectiveInterpretation<P> => {
            return {
                filterInterpretation: interpretation,
                runParams: updateParams(runParams, name, paramValue(interpretation)),
                remainingWords: words.slice(interpretation.consumed),
            }
        })
    }
}

// Don't require the Var to be set or to exist in txt
// Options must either match exactly and consume words,
// or match partially or not at all and consume nothing,
// yeilding the defaultVal value for the 'name'ed parameter
function optionDirective<P extends ParamMap>
    (name: string | undefined, defaultVal: ParamValue, filter: Filter): Directive<P> {
    const varType = !isNullOrUndefined(defaultVal) ?
        (isNumber(defaultVal) ? VarType.Numeric : VarType.Text) :
        VarType.Undefined

    // Return all possible var match interpretations plus the default interpretation
    return (words: string[], runParams: P, maxFuzzyFilterResults: number): DirectiveInterpretations<P> => [
        ...varDirective<P>(name, filter)(words, runParams, maxFuzzyFilterResults),
        // Default interpretation
        {
            filterInterpretation: {
                maxResults: maxFuzzyFilterResults,
                penalty: 0,
                varType,
                words: [],
                consumed: 0,
            },
            runParams: updateParams(runParams, name, defaultVal),
            remainingWords: words,
        },
    ]
}

// ------------------------ Directives ---------------------------------------------

// Require a filtered subset of the input sentence and store it as 'name'
// in the named parameter list that'll be used to invoke the command's run function
export const Var = (name: string, filter: Filter) => varDirective(name, filter)

// Same as Var, but a match is not required for the command to run
// If the filter returns no match, don't consume any input words and move on
export const Option = (name: string, defaultVal: string | number | undefined, filter: Filter) => 
    optionDirective(name, defaultVal, filter)

// Similar to Var, but does not add the filtered value to the named parameter list
export const Require = (filter: Filter) => varDirective(undefined, filter)

// Similar to Option, but does not add the filtered value to the named parameter list
export const Ignore = (filter: Filter) => optionDirective(undefined, undefined, filter)

// ------------------------- Phrase or Word Filters ------------------------------------

// Match a phrase of specific word length
export const Phrase = (wordCount: number, filter: Filter = passThruFilter) => phraseFilter(wordCount, filter)

// Match next 1 word from remaining words
export const Word = (filter: Filter = passThruFilter) => Phrase(1, filter)

// Match a phrase by stopword. The match will exclude the stopword by default.
// Often good to use an Exact filter after this to avoid fuzzily overmatching
export const StopPhrase = (stopwords: string[], includeStopword: boolean = false, filter: Filter = passThruFilter) =>
    stopPhraseFilter(stopwords, includeStopword, filter)

// Match all remaining words to the end of input
// You should REALLY consider NOT using this since it may overmatch,
// Use only with ignoreFuzzy or using Exact filters before this filter
export const Sentence = (filter: Filter = passThruFilter) => remainingPhraseFilter(filter)

// ---------------------------- Boolean Filters -----------------------------------------

// Give back interpretations that match any of the filters.
// Assume the minimum penalty across each words / VarType duplicate interpretation
export const Or = (filters: Filter[]) => orFilter(filters)

// Give back only the interpretations that match words across all filters, and assume the worst penalty
// over all the filtered outputs across each interpretation
export const And = (filters: Filter[]) => andFilter(filters)

// ----------------------------- String & Numeric filters --------------------------------

// Match any phrases or words and pass them along
export const Any = (whitelist: string[], filter: Filter = passThruFilter) => anyFilter(whitelist, filter)

// Same as Any but dynamically generate the whitelist
export const GetAny = (whitelistGenerator: () => string[], filter: Filter = passThruFilter) => lazyAnyFilter(whitelistGenerator, filter)

// Only match phrases or words that are NOT in the blacklist. All blacklist entries must have the same word count!
// For multi-length word lists, use multiple Nones.
// The blacklist[0]'s word length will be consumed from the input senetence if filter matches
export const None = (blacklist: string[], filter: Filter = passThruFilter) => noneFilter(blacklist, filter)

// Same as None but dynamically generate the blacklist
export const GetNone = (blacklistGenerator: () => string[], filter: Filter = passThruFilter) => lazyNoneFilter(blacklistGenerator, filter)

// Exact results only
export const Exact = (preFilter: Filter) => precisionFilter(0, preFilter)

// Allow only results at or above a certain probability
export const Threshold = (maxAllowablePenalty: number, preFilter: Filter) =>
    precisionFilter(maxAllowablePenalty, preFilter)

// Match any number including decimals like 3.14
// It will appear as a Number type in your command's runFunc
export const Numeric = (min: number = Number.MIN_VALUE, max: number = Number.MAX_VALUE, filter: Filter = passThruFilter) => 
    numericFilter(min, max, filter)

// --- TO DO: Transformers, handle in your runFunc manually for now!
//export const Map = (phraseTranslator: PhraseMap, filter: Filter = passThruFilter) => mapper(phraseTranslator, filter)
