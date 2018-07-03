import {
    startTimer,
    stopTimer,
} from './skills';

import { Var, Require, Any, StopPhrase, Numeric, Exact } from '../../syntax';
import { Cmd, ParamMap } from '../../publicInterfaces';
import { createCmd } from '../../';

// Export Skills
export { startTimer, stopTimer } from './skills';

// Convert time unit synonyms
interface TimeUnitTranslater { [index: string]: string }
const timeUnitTranslator = {
    seconds: 'second', 
    minutes: 'minute', 
    hours: 'hour', 
    our: 'hour', 
    ours: 'hour',
} as TimeUnitTranslater

// Cmd run parameter types
interface TimerStartParams extends ParamMap { 
    name: string, 
    duration: number, 
    timeUnit: string
}
interface TimerNameParam extends ParamMap {
    name: string,
}

const timerNames = ['time', 'timer', 'alarm', 'clock']

const createStartTimerCmd = (alarm: (alertMsg: string) => void): Cmd<TimerStartParams> => {
    const syntax = [
        Require(Any(['start', 'set'])),
        Var('name', Exact(StopPhrase(timerNames))),
        Require(Any(['for'])),
        Var('duration', Numeric()),
        Var('timeUnit', Any(['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'our', 'ours'])),
    ];

    const runFunc = ({ name, duration, timeUnit }: TimerStartParams) => {
        let multiplier = 1000
        const unit: string = timeUnitTranslator[timeUnit] !== undefined ? timeUnitTranslator[timeUnit] : timeUnit
        if (unit.startsWith('min')) {
            multiplier *= 60
        }
        if (unit.startsWith('hour')) {
            multiplier *= 60 * 60
        }
        startTimer(name, duration * multiplier, 
            () => alarm(`timer ${name} ready, ${name}`) );
        return undefined
    }

    const describe = ({ name, duration, timeUnit }: TimerStartParams) => 
        `${name} for ${duration} ${timeUnit}`

    return createCmd(syntax, runFunc, describe)
}

const createStopTimerCmd = (): Cmd<TimerNameParam> => 
    createCmd<TimerNameParam>([
            Require(Any(['stop', 'end'])),
            Var('name', Exact(StopPhrase(timerNames))),
        ], 
        ({ name }: TimerNameParam): undefined => {
            stopTimer(name)
            return undefined
        },
        ({ name }: TimerNameParam) => 
            `${name} stopped`,
    )

export const createTimerCmds = (alarm: (alertMsg: string) => void): Cmd<ParamMap>[] => [
    createStartTimerCmd(alarm),
    createStopTimerCmd(),
]
