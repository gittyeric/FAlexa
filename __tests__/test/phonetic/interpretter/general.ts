import { Var, Any, Require, Sentence } from '../../../../src/phonetic/syntax';
import { newInterpretter } from '../../../../src/phonetic/interpretter';
import { createCmd } from '../../../../src/phonetic/index';
import { assertEqualCmd } from '../../../../src/test/phonetic/cmdUtil';

// Contains tests assurring general fuzzy guarantees

describe('input format', () => {
    const strAssertCmd = assertEqualCmd([
        Require(Any(['assert'])),
        Var('strVal1', Sentence())],
        { strVal1: 'the man went to the store' })
    const interpretter = newInterpretter([strAssertCmd])

    it('should ignore excess whitespace', () => {
        interpretter.interpret('assert the\nman\twent to  the\t\tstore')
    })
    it('should irrelavent characters as whitespace', () => {
        interpretter.interpret('assert the-man--went!@#$%^&*()to/the`store~-=_+?<>,[]\{}|')
    })
})

describe('fuzzy interpretation', () => {
    const strAssertCmd = assertEqualCmd([
        Require(Any(['for'])),
        Var('strVal1', Sentence())],
        { strVal1: 'hello world' })
    const interpretter = newInterpretter([strAssertCmd])

    it('should ignore stopwords when they break parsing', () => {
        interpretter.interpret('please run the for hello world')
    })
    it('should match if sounds just like command', () => {
        interpretter.interpret('four hello world')
    })
})

describe('strictness of interpretation', () => {
    const strAssertCmd = createCmd([
        Require(Any(['assert'])),
        Var('strVal1', Sentence()),
    ], () => ({ outputMessage: 'ran' }))
    const interpretter = newInterpretter([strAssertCmd])

    it('should not match if order does not match', () => {
        const interpretation = interpretter.interpret('walk then assert hello world')
        // Should get asked to confirm running since match wasn't exact
        expect(interpretation.getContextualCmds().length).toBeGreaterThan(1)

        const confirmedRun = interpretation.interpret('yes')
        expect(confirmedRun.getOutputMessage()).toEqual('ran')
    })
    it('should run after confirmation when it sounds similar', () => {
        const interpretation = interpretter.interpret('alert hello world')
        // Should get asked to confirm running since match wasn't exact
        expect(interpretation.getContextualCmds().length).toBeGreaterThan(1)

        const confirmedRun = interpretation.interpret('yes')
        expect(confirmedRun.getOutputMessage()).toEqual('ran')
    })
})

describe('Match Tie breaking', () => {
    const shortCmd = createCmd([
            Require(Any(['first'])),
            Var('v', Sentence()),
        ], 
        () => undefined,
        () => 'short',
    )
    const longCmd = createCmd([
            Require(Any(['first'])),
            Require(Any(['second'])),
            Var('v', Sentence()),
        ], 
        () => undefined,
        () => 'long',
    )
    const interpretter = newInterpretter([shortCmd, longCmd])

    it('Orders penalty ties by descending directive count', () => {
        const interpretted = interpretter.interpret('first second')
        const shortIndex = interpretted.getOutputMessage().indexOf('short')
        const longIndex = interpretted.getOutputMessage().indexOf('long')

        expect(longIndex).toBeGreaterThan(-1)
        expect(longIndex).toBeLessThan(shortIndex)
    })
})

describe('Built-in commands', () => {
    const strAssertCmd = createCmd([
        Require(Any(['assert'])),
        Var('strVal1', Sentence()),
    ], () => ({ outputMessage: 'ran' }))
    const interpretter = newInterpretter([strAssertCmd])

    it('repeats last spoken command', () => {
        const interpretted = interpretter.interpret('assert ran')
        const repeated = interpretted.interpret('repeat')

        expect(repeated.getOutputMessage()).toEqual(interpretted.getOutputMessage())
    })
})
