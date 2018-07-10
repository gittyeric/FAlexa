import { stopwords } from './stopwords';
import { PhraseMap } from './publicInterfaces';
import { isNullOrUndefined } from 'util';
//tslint:disable-next-line:no-require-imports
const metaphone = (<(phrase: string) => string>require('metaphone'))
//tslint:disable-next-line:no-require-imports
const leven = (<(phrase1: string, phrase2: string) => number>require('leven'))

//declare function levenstein(str1: string, str2: string): number
//declare function metaphone2(str1: string): string

// TO DO: Reduce to only producing first stopword match and it's caller
export const filterFirstStopwords = (words: string[], maxReturned: number = Infinity): string[] => {
    const matchedStopwords: string[] = []
    for (const word of words) {
        if (!isNullOrUndefined(stopwords.find((stopword: string) => stopword === word))) {
            matchedStopwords.push(word)
            if (matchedStopwords.length === maxReturned) {
                break
            }
        } else {
            break
        }
    }
    return matchedStopwords
}

export const trimFirstStopwords = (words: string[]) => 
    words.slice(filterFirstStopwords(words).length)

export const matchWordsToPhrase = (words: string[], phrase: string): string[] => {
    const wordCount = phrase.split(' ').length
    const matched: string[] = []
    for (let w = 0; w < wordCount && w < words.length; w++) {
        matched.push(words[w])
    }
    return matched
}

export const txtToValidWords = (txt: string) => {
    return txt
        .toLowerCase() // Spoken words can't induce capitalization (mostly)
        // Desperately try to convert certain characters into something meaningful.
        // Ideally this wouldn't be in the input to begin with
        .replace(/\+/g, ' plus ')
        .replace(/\-\s*([0-9]+)/g, ' negative $1')
        .replace(/\s\&\s/g, ' and ')
        .replace('=', ' equals ')
        .replace(/[^a-z0-9\. ]/g, ' ') // Nuke the rest!

        .split(' ')
        .map((word: string) => word.trim())
        .filter((word: string) => word.length > 0)
}

const phraseToPhonetic = (phrase: string) => {
    return phrase.split(' ')
        .map((word: string) => `${metaphone(word)}`)
        .join(' ')
}

export const phoneticPhraseDistance = (phrase1: string, phrase2: string): number => {
    const phonetics1 = phraseToPhonetic(phrase1)
    const phonetics2 = phraseToPhonetic(phrase2)

    // console.log(`${phrase1} vs ${phrase2}: ${phonetics1} vs ${phonetics2}`)
    return leven(phonetics1, phonetics2)
}

export const replaceWords = (phraseToReplacementMap: PhraseMap, words: string[]): string[] => {
    for (const phrase of Object.keys(phraseToReplacementMap)) {
        const matchedWords = matchWordsToPhrase(words, phrase)
        const distance = phoneticPhraseDistance(matchedWords.join(' '), phrase)

        if (distance === 0) {
            const replacement = phraseToReplacementMap[phrase].split(' ')
            return [...replacement, ...words.slice(matchedWords.length)]
        }
    }
    return words
}
