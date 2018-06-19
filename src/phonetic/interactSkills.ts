import * as _ from 'lodash';
import { Var, Numeric, Require, Any } from './syntax';
import { createCmdMatchSettings, createCmd } from '.';
import { ParamMap, Cmd, RunResponse, CmdResponse } from './publicInterfaces';
import { RunnableCmd } from './moduleInterfaces';
import { isNullOrUndefined } from 'util';

type YesParams = ParamMap
type NoParams = ParamMap
interface NumericResponseParams extends ParamMap {
    response: number,
}

function paramNameToPhrase(paramName: string): string {
    const snaked: string = _.snakeCase(paramName)
    return snaked.split('_').join(' ')
}

export const defaultCmdDescription = (cmd: RunnableCmd<ParamMap>): string => {
    return !isNullOrUndefined(cmd.cmd.describe) ? 
        cmd.cmd.describe(cmd.runParams) : (
            'Run with ' +
            Object.keys(cmd.runParams)
                .map((paramName: string) => 
                    `${paramNameToPhrase(paramName)} as ${cmd.runParams[paramName]}`)
                .join(' ')
        )
}

export function createMultichoiceResponse(possibleCmds: RunnableCmd<ParamMap>[]): CmdResponse {
    const question = 'did you mean ' +
        possibleCmds.map((cmd: RunnableCmd<ParamMap>, ci: number) =>
            (`${ci}, ` + defaultCmdDescription(cmd))).join(' or ')
        + '?'

    const clarifyCmd = createCmd<NumericResponseParams>(
        [Var('response', Numeric(1, possibleCmds.length))],
        (a: NumericResponseParams): RunResponse => {
            const confirmed = possibleCmds[a.response - 1]
            return confirmed.cmd.runFunc(confirmed.runParams)
        },
        () => '',
        { ...createCmdMatchSettings(true) },
    )

    return {
        contextualCmds: [clarifyCmd],
        outputMessage: question,
    }
}

export function createClarifyResponse<P extends ParamMap>(possibleCmd: RunnableCmd<P>): CmdResponse {
    return {
        contextualCmds: [createYesCmd(possibleCmd), createNoCmd()],
        outputMessage: defaultCmdDescription(possibleCmd) + '?',
    }
}

export function createYesCmd(confirmedCmd: RunnableCmd<ParamMap>): Cmd<YesParams> {
    return createCmd(
        [Require(Any(['yes', 'yeah', 'yep', 'sure', 'okay']))],
        () => confirmedCmd.cmd.runFunc(confirmedCmd.runParams),
        () => defaultCmdDescription(confirmedCmd) + ' done',
        { ...createCmdMatchSettings(true) },
    )
}

export function createNoCmd(): Cmd<NoParams> {
    return createCmd(
        [Require(Any(['no', 'know', 'mow', 'moe', 'nah', 'nope', 'oh', 'reset', 'stop', 'cancel']))],
        () => ({ outputMessage: 'cancelled' }),
        () => 'cancelled',
        { ...createCmdMatchSettings(true) })
}

export function createClarificationResponse(possibleCmds: RunnableCmd<ParamMap>[]): CmdResponse {
    if (possibleCmds.length === 1) {
        return createClarifyResponse(possibleCmds[0])
    }
    return createMultichoiceResponse(possibleCmds)
}

/* export const createCmdListReadCmd = (cmds: Cmd<ParamMap>[]): Cmd<ParamMap> =>
    createCmd([
            Require(Any(['list commands', 'list command', 'read command', 'read commands'])),
        ],
        () => ({
            outputMessage: '',
        }),
        () => 'list commands',
        { ...createCmdMatchSettings(), autoRunIfFuzzy: true }
    ) */
