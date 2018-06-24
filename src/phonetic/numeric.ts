import { wordsToNumbers } from 'words-to-numbers';
// import { stopwords } from '../stopwords';
import { isNumber } from 'util';

interface SynonymMap {
    [index: string]: string
}
const negativeSynonyms: SynonymMap = {negative: 'negative', minus: 'negative'}
const dotSynonyms: SynonymMap = {point: 'point', dot: 'point', period: 'point'}
const numberSynonyms: SynonymMap = {
    won: 'one',
    to: 'two', too: 'two',
    for: 'four', forth : 'fourth',
    ate: 'eight',
}
const numericSynonymMap: SynonymMap = { ...negativeSynonyms, ...dotSynonyms, ...numberSynonyms }
const numericStopwords: SynonymMap = {and: 'and'}

interface ParsedNumber {
    value: number, // The number parsed, or NaN if no number was found
    consumed: number, // How many words removed (or ignored) from input array to create this number
}

const createParsedNumber = (value: number, isNegative: boolean, consumed: number) => ({
    value: value * (isNegative ? -1 : 1),
    consumed, 
})

const subWordsToNumberWithMutationAndBeer = (words: string[]): ParsedNumber => {
    let isNegative = false
    let curNumber = 0
    let consumed = 0
    const numericPhrase: string[] = []
    
    for (const word of words) {
        consumed += 1
        const mappedWord = numericSynonymMap[word] === undefined ? word : numericSynonymMap[word]
        if (mappedWord === 'zero' && (consumed === 0 || curNumber === 0)) {
            continue
        }
        if (numericStopwords[word] !== undefined) {
            continue
        }
        if (negativeSynonyms[word] !== undefined && consumed === 0) {
            isNegative = true
            continue
        }
        
        numericPhrase.push(mappedWord)

        if (dotSynonyms[mappedWord] !== undefined && 
            consumed + 1 < words.length) {
            numericPhrase.push('point')
            continue
        }

        const newNumber = wordsToNumbers(numericPhrase.join(' '))
        if (!isNumber(newNumber) || newNumber < curNumber) {
            numericPhrase.pop()
            break
        }
        curNumber = newNumber
    }

    return createParsedNumber(curNumber, isNegative, consumed)
}

// Let's compare a tail-end recursion optimized (but with slower immutable copy)
// to the explicit loop version above!
const wordsToNumberRecurse = 
    (words: string[], 
    curNumber: number = NaN, numericPhrase: string[] = [], consumed: number = 0, isNegative: boolean = false): ParsedNumber => {
    
    if (words.length === 0) {
        return createParsedNumber(curNumber, isNegative, consumed)
    }

    const word: string = numericSynonymMap[words[0]] === undefined ? words[0] : numericSynonymMap[words[0]]

    if (word === 'zero' && (consumed === 0 || curNumber === 0)) {
        return wordsToNumberRecurse(words.slice(1), 0, numericPhrase, consumed + 1, isNegative)
    }
    if (numericStopwords[word] !== undefined) {
        return wordsToNumberRecurse(words.slice(1), curNumber, numericPhrase, consumed + 1, isNegative)
    }
    if (negativeSynonyms[word] !== undefined && consumed === 0) {
        return wordsToNumberRecurse(words.slice(1), curNumber, numericPhrase, consumed + 1, true)
    }
    if (dotSynonyms[word] !== undefined && consumed + 1 < words.length) {
        return wordsToNumberRecurse(words.slice(1), curNumber, [ ...numericPhrase, 'point'], consumed + 1, isNegative)
    }

    const newPhrase = [...numericPhrase, word]
    const newNumber = Number(wordsToNumbers(newPhrase.join(' ')))
    if (!isNumber(newNumber) || newNumber < curNumber) {
        return createParsedNumber(curNumber, isNegative, consumed)
    }
    return wordsToNumberRecurse(words.slice(1), newNumber, newPhrase, consumed + 1, isNegative)
}

export const wordsToParsedNumber = (words: string[]) => wordsToNumberRecurse(words)
// For testing purposes
export const wordsToParsedNumberImperative = (words: string[]) => subWordsToNumberWithMutationAndBeer(words)
