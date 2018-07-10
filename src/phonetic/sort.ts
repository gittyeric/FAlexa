import { FilterInterpretations, FilterInterpretation, DirectiveInterpretation } from './moduleInterfaces';
    import { ParamMap } from './publicInterfaces';

// Sort and trim results from based on penalty
export interface Penalizable {
    penalty: number,
    maxResults: number,
    words: string[],
}
export type ToPenalizable<INPUT> = (convertable: INPUT) => Penalizable

export function trim<P>(filtered: P[], convert: ToPenalizable<P>): P[] {
    const possible = filtered.filter((interpretation: P) =>
        convert(interpretation).penalty !== Infinity)
    if (possible.length > 1) {
        const trimmed = possible
        trimmed.sort((a: P, b: P) => {
            const ap = convert(a)
            const bp = convert(b)

            // Sort by ascending penalty, break ties by descending word count
            return ap.penalty === bp.penalty ? 
                (ap.words.length === bp.words.length ? 0 : ap.words.length > bp.words.length ? -1 : 1) :
                (ap.penalty > bp.penalty ? 1 : -1)
        })
        trimmed.slice(0, convert(possible[0]).maxResults)
        return trimmed
    }
    return possible
}

export function trimf(filtered: FilterInterpretations) {
    return trim(filtered, (f: FilterInterpretation) => f)
}

export function trimd<P extends ParamMap>(filtered: DirectiveInterpretation<P>[], maxFuzzyDirectiveResults: number) {
    return trim(filtered, (d: DirectiveInterpretation<P>) => d.filterInterpretation)
        .slice(0, maxFuzzyDirectiveResults)
}
