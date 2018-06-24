import { Var, Numeric, Any, Require } from '../../../src/phonetic';
import { newInterpretter } from '../../../src/phonetic/interpretter';
import { assertEqualCmd } from '../../../src/test/phonetic/cmdUtil';

describe('raw number interpretation', () => {

    it('Should match single numbers', () => {
        const assertCmd = assertEqualCmd(
            [Require(Any(['assert'])), Var('numVal1', Numeric())], { numVal1: 1 })

        const interpretter = newInterpretter([assertCmd])
        interpretter.interpret('assert 1')
    })

    it('Should match multi-digit numbers', () => {
        const assertCmd = assertEqualCmd(
            [Require(Any(['assert'])), Var('numVal1', Numeric())], { numVal1: 9876 })

        const interpretter = newInterpretter([assertCmd])
        interpretter.interpret('assert 9876')
    })

    it('Should match floating point numbers', () => {
        const assertCmd = assertEqualCmd(
            [Require(Any(['assert'])), Var('numVal1', Numeric())], { numVal1: 3.14 })

        const interpretter = newInterpretter([assertCmd])
        interpretter.interpret('assert 3.14')
    })

})

describe('spoken number interpretation', () => {

    it('Should match single numbers', () => {
        const assertCmd = assertEqualCmd(
            [Require(Any(['assert'])), Var('numVal1', Numeric())], { numVal1: 1 })

        const interpretter = newInterpretter([assertCmd])
        interpretter.interpret('assert one')
    })

    it('Should match multi-digit numbers', () => {
        const assertCmd = assertEqualCmd(
            [Require(Any(['assert'])), Var('numVal1', Numeric())], { numVal1: 9876 })

        const interpretter = newInterpretter([assertCmd])
        interpretter.interpret('assert nine-thousand eight-hundred seventy six')
    })

    it('Should match floating point numbers', () => {
        const assertCmd = assertEqualCmd(
            [Require(Any(['assert'])), Var('numVal1', Numeric())], { numVal1: 3.14 })

        const interpretter = newInterpretter([assertCmd])
        interpretter.interpret('assert three point one four')
    })

})
