import { wordsToNumberWithMutationAndBeer, wordsToNumberRecurse } from '../../src/phonetic/numeric';

const iterationsPerRun = 50000
const thirtyWords = [
    'one', 'trillion',
    'two', 'hundred', 'and', 'thirty', 'nine', 'billion',
    'one', 'hundred', 'eighty', 'seven', 'million',
    'five', 'hundred', 'thirty', 'three', 'thousand',
    'one', 'hundred', 'and', 'twenty', 'three',
    'point', 'one', 'five', 'six', 'three', 'one', 'two',
    'big', 'ones'] // 1,239,187,533,123
const sixWords = [
    'three', 'point', 'one', 'four', 'one', 'six', // 3.1416
]
const oneWord = ['one']

describe('Numeric Filter: Iterative vs Tail-Recursive Impl', () => {
    it('will run iterative impl faster when input size is small', () => {

        const startIterTime = (new Date()).getTime()
        for (let i = 0; i < iterationsPerRun; i++) {
            wordsToNumberWithMutationAndBeer(oneWord)
        }
        const iterativeMs = (new Date()).getTime() - startIterTime

        const startRecursiveTime = (new Date()).getTime()
        for (let i = 0; i < iterationsPerRun; i++) {
            wordsToNumberRecurse(oneWord)
        }
        const recursiveMs = (new Date()).getTime() - startRecursiveTime

        console.log(`Results: Iterative: ${iterativeMs}, Recursive: ${recursiveMs}`)
        expect(iterativeMs).toBeLessThan(recursiveMs)
    })
    it('will recursively win for n = 6', () => {

        const startIterTime = (new Date()).getTime()
        for (let i = 0; i < iterationsPerRun; i++) {
            wordsToNumberWithMutationAndBeer(sixWords)
        }0
        const iterativeMs = (new Date()).getTime() - startIterTime

        const startRecursiveTime = (new Date()).getTime()
        for (let i = 0; i < iterationsPerRun; i++) {
            wordsToNumberRecurse(sixWords)
        }
        const recursiveMs = (new Date()).getTime() - startRecursiveTime

        // Recursive starts to win out as the word count increases to words1.length !
        // Taking out words2 from the benchmark makes recursive a winner every time
        console.log(`Results: Iterative: ${iterativeMs}, Recursive: ${recursiveMs}`)
        expect(recursiveMs).toBeLessThan(iterativeMs)
    })
    it('will roughly even out at n = 30', () => {

        const startIterTime = (new Date()).getTime()
        for (let i = 0; i < iterationsPerRun; i++) {
            wordsToNumberWithMutationAndBeer(thirtyWords)
        }
        const iterativeMs = (new Date()).getTime() - startIterTime

        const startRecursiveTime = (new Date()).getTime()
        for (let i = 0; i < iterationsPerRun; i++) {
            wordsToNumberRecurse(thirtyWords)
        }
        const recursiveMs = (new Date()).getTime() - startRecursiveTime

        // Recursive starts to win out as the word count increases to words1.length !
        // Taking out words2 from the benchmark makes recursive a winner every time
        console.log(`Results: Iterative: ${iterativeMs}, Recursive: ${recursiveMs}`)
    })
})
