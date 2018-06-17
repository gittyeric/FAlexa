import { FilterInterpretations, FilterInterpretation, DirectiveInterpretation } from './moduleInterfaces';
    import { ParamMap } from './publicInterfaces';

// Sort and trim results from based on penalty
interface Penalizable {
    penalty: number,
    maxResults: number,
}
type ToPenalizable<INPUT> = (convertable: INPUT) => Penalizable

export function trim<P>(filtered: P[], convert: ToPenalizable<P>): P[] {
    const possible = filtered.filter((interpretation: P) =>
        convert(interpretation).penalty !== Infinity)
    if (possible.length > 1) {
        const trimmed = possible
        trimmed.sort((a: P, b: P) => {
            const ap = convert(a)
            const bp = convert(b)
            return ap.penalty === bp.penalty ? 0 :
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
