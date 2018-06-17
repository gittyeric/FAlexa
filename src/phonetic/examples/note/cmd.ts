import { ParamMap, Cmd, RunResponse } from '../../publicInterfaces';
import { Any, Require, Var, StopPhrase, Numeric, Sentence, createCmd, 
    GetAny, Ignore, Option, createCmdMatchSettings } from '../..';
import { Log, Notes, Logger } from './skills';

// Cmd run parameter types
export interface SaveNoteParams extends ParamMap { 
    name: string, 
    note: string,
}
export interface NoteNameParam extends ParamMap {
    name: string,
}
export interface CountParam extends ParamMap {
    count: number,
}

// --------------------- Note Commands ------------------------------------

export const createSaveNoteCmd = (notes: Notes): Cmd<SaveNoteParams> => 
    createCmd([
        Require(Any(['save', 'take'])),
        Require(Any(['note', 'message'])),
        Var('name', StopPhrase(['with'])),
        Var('note', Sentence()),
    ],
    ({ name, note }: SaveNoteParams): RunResponse => {
        notes.saveNote(name, note)
        return undefined
    }, 
    ({ name }: SaveNoteParams) => 
        `save note ${name}`,
    )

export const createReadNoteCmd = (notes: Notes): Cmd<NoteNameParam> => 
    createCmd(
        [
            Require(Any(['get', 'read', 'play'])),
            Require(Any(['note', 'message'])),
            Var('name', GetAny(notes.noteNames)),
        ], 
        ({ name }: NoteNameParam): RunResponse => ({
            outputMessage: notes.getNote(name).note,
        }),
        ({ name }: NoteNameParam) => {
            return `read ${name}`
        },
    )

export const createReadNoteNamesCmd = (notes: Notes): Cmd<CountParam> => 
    createCmd(
    [
        Require(Any(['list'])), 
        Ignore(Any(['last', 'past', 'most recent'])), 
        Option('count', 20, Numeric()), 
        Require(Any(['notes', 'note'])),
    ],
    ({ count }: CountParam) => ({
        outputMessage: 'notes, ' + notes.noteNames().slice(0, count).join(', '),
    }),
    () => 'read note names',
    {
        ...createCmdMatchSettings(),
        autoRunIfFuzzy: true,
    },
)

export const createNoteCmds = (notes: Notes): Cmd<ParamMap>[] => [
    createSaveNoteCmd(notes),
    createReadNoteCmd(notes),
    createReadNoteNamesCmd(notes),
]

// ---------------------------- Log stack Commands --------------------------------

interface LogParams extends ParamMap{
    message: string,
}

export const createLogCmd = (logger: Logger): Cmd<LogParams> => {
    return createCmd([
        Ignore(Any(['add', 'push', 'append'])),
        Require(Any(['log'])),
        Ignore(Any(['note', 'message'])),
        Var('message', Sentence()),
    ],
    ({ message }: LogParams) => {
        logger.log(message)
        return undefined
    },
    () => 'log message',
    {...createCmdMatchSettings(), autoRunIfFuzzy: true })
}

const prevLogWhitelist = ['last', 'past', 'previous', 'most recent', 'recent']

export const createPopLogCmd = (logger: Logger): Cmd<ParamMap> => {
    return createCmd([
        Require(Any(['pop', 'remove', 'delete', 'clear'])),
        Ignore(Any(prevLogWhitelist)),
        Ignore(Any(['log'])),
    ],
    () => {
        const popped = logger.popLastLog()

        return {
            outputMessage: popped != null ? `cleared ${popped.note}` : '',
        }
    },
    () => {
        return 'clear last log entry'
    })
}

export const createListRecentLogsCmd = (logger: Logger): Cmd<CountParam> => {
    return createCmd([
        Require(Any(['list', 'read'])),
        Ignore(Any(prevLogWhitelist)),
        Option('count', 2, Numeric()),
        Require(Any(['log', 'logs'])),
    ],
    ({ count }: CountParam) => {
        const recentLogs = logger.recentLogs(count)
        const outputMessage = recentLogs.map((log: Log, i: number) => `${i + 1} ${log.note}`).join(', ')
        return {
            outputMessage,
        }
    },
    ({ count }: CountParam) => 
        `list ${count === 1 ? '' : count} recent logs`,
    {...createCmdMatchSettings(), autoRunIfFuzzy: true })
}

export const createLogCmds = (logger: Logger): Cmd<ParamMap>[] => [
    createLogCmd(logger),
    createPopLogCmd(logger),
    createListRecentLogsCmd(logger),
]
