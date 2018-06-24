import { createNoteCmds, newNotes } from '../src/phonetic/examples/note/cmd';
import { createMockFalexa } from '../src/test/falexaUtil';
import { createCmd, Require, Any } from '../src';

const notes = newNotes()
const cmds = [...createNoteCmds(notes)]

describe('FAlexa', () => {
    it('should accept multiple commands', () => {
        const falexa = createMockFalexa(cmds)
        expect(
            falexa.hear(['save note a with 1']),
        ).toContain('done')
        expect(
            falexa.hear(['save note b with 2']),
        ).toContain('done')

        expect(
            falexa.hear(['read note a']))
            .toEqual('1')
        expect(
            falexa.hear(['read note b']))
            .toEqual('2')
    })

    it('should handle ambiguity by picked number', () => {
        let calledSave: boolean = false
        let calledSanity: boolean = false

        const similarCmds = [
            createCmd([Require(Any(['save']))], () => { 
                calledSave = true
                return undefined
            }, () => 'save'),
            createCmd([Require(Any(['sanity']))], () => {
                calledSanity = true
                return undefined
            }, () => 'sanity'),
        ]
        const falexa = createMockFalexa(similarCmds)

        const hearSame = falexa.hear(['same'])
        expect(hearSame).toContain('save')
        expect(hearSame).toContain('sanity')
        console.log(hearSame)

        falexa.hear(['1'])
        expect(calledSanity).toEqual(false)
        expect(calledSave).toEqual(true)
    })
})
