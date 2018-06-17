import { newNotes, newLogger } from '../../../src/phonetic/examples/note/skills';
import { createNoteCmds, createLogCmds } from '../../../src/phonetic/examples/note/cmd';
import { newInterpretter } from '../../../src/phonetic/interpretter';
import { ParamMap, Cmd } from '../../../src/phonetic/publicInterfaces';

const createNotesAndLoggerCmds = (): Cmd<ParamMap>[] => {
    const logger = newLogger()
    const notes = newNotes()

    return [...createNoteCmds(notes), ...createLogCmds(logger)]
}

const cmds = createNotesAndLoggerCmds()
const interpretter = newInterpretter(cmds)

describe('notes', () => {
    it('should save, recall and list', () => {
        const interpretation = interpretter.interpret(
            'save note kitty with hello kitten world!')
        expect(interpretation.getOutputMessage()).
            toEqual('save note kitty done')

        const readInterpretation = interpretter.interpret(
            'read note kitty')
        expect(readInterpretation.getOutputMessage()).
            toEqual('hello kitten world')

        const listInterpretation = interpretter.interpret(
            'list notes')
        expect(listInterpretation.getOutputMessage()).
            toContain('kitty')
    })
})

describe('logs', () => {
    it('should support pushing and popping to logger', () => {
        const interpretation = interpretter.interpret(
            'log i like turtles')
        expect(interpretation.getOutputMessage()).
            toEqual('log message done')

        const listInterpretation = interpretation.interpret(
            'list logs')
        expect(listInterpretation.getOutputMessage()).
            toContain('like turtles')

        const popInterpretation = interpretation.interpret(
            'clear log')
        expect(popInterpretation.getOutputMessage()).
            toContain('like turtles')

        const doublePop = interpretation.interpret(
            'clear log')
        expect(doublePop.getOutputMessage()).
            toEqual('')
    })
})
