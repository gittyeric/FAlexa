import { createConvertWeightCmd } from '../../../../src/phonetic/examples/weightConverter/cmd';
import { newInterpretter } from '../../../../src/phonetic/interpretter';

const interpretter = newInterpretter([createConvertWeightCmd()])

describe('weightConverter', () => {
    it('should convert', () => {
        const interpretation = interpretter.interpret(
            'convert one pound to ounces')
        expect(interpretation.getOutputMessage()).
            toContain('16 ounces blah')
    })
})
