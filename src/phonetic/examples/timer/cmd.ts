import { ParamMap, Cmd } from '../../publicInterfaces';
import { Require, Any, Var, Numeric, StopPhrase, Ignore, Exact, Sentence } from '../../syntax';
import { createCmdMatchSettings, createCmd } from '../..';

// tslint:disable-next-line:no-require-imports no-unsafe-any
export const startTimer = <(name: string, durationMs: number, alert: () => void) => void>(require('./skills').startTimer);
// tslint:disable-next-line:no-require-imports no-unsafe-any
export const stopTimer = <(name: string) => void>(require('./skills').stopTimer);
// tslint:disable-next-line:no-require-imports no-unsafe-any
const getSecsRemaining = <(name: string) => number>(require('./skills').getSecsRemaining);
// tslint:disable-next-line:no-require-imports no-unsafe-any
const getActiveTimerNames = <() => string[]>(require('./skills').getActiveTimerNames);

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

const getTimeInfoString = (name: string, useShorthand: boolean) => {
    const secsRemaining = getSecsRemaining(name)
        let unitMultiplier = 1
        let timeUnit = 'second'
        let round = Math.floor
        if (secsRemaining > 90) {
            unitMultiplier /= 60
            timeUnit = 'minute'
        }
        if (secsRemaining > 60 * 90) {
            unitMultiplier /= 60
            timeUnit = 'hour'
            round = (num: number) => parseFloat(num.toFixed(1))
        }
        const units = round(secsRemaining * unitMultiplier)
        if (useShorthand) {
            return `${name} ${units} ${timeUnit}${units === 1 ? '' : 's'}`
        }
        return `${units} ${timeUnit}${units === 1 ? '' : 's'} remaining for ${name}`
}

export const createStartTimerCmd = (alarm: (alertMsg: string) => void): Cmd<TimerStartParams> => {
    const syntax = [
        Require(Any(['start', 'set'])),
        Var('name', Exact(StopPhrase(timerNames))),
        Require(Any(['for'])),
        Var('duration', Numeric()),
        Var('timeUnit', Any(['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'our', 'ours'])),
    ]

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

export const createStopTimerCmd = (): Cmd<TimerNameParam> => 
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

export const createTimerInfoCmd = (): Cmd<TimerNameParam> => {
    const runFunc = ({ name }: TimerNameParam) => ({
        outputMessage: getTimeInfoString(name, false),
    })
    
    const describe = (params: TimerNameParam) => getTimeInfoString(params.name, true)

    return createCmd<TimerNameParam>([
        Require(Any(['get', 'give', 'how much'])),
        Require(Any([
            'time remaining', 'time remains', 'time is remaining',
            'time left', 'time is left'])),
        Ignore(Any(['for'])),
        Var('name', Sentence()),
    ], runFunc, describe, createCmdMatchSettings(false, true))
}

export const createTimerStatsCmd = (): Cmd<TimerNameParam> => {
    const runFunc = () => ({
        outputMessage: getActiveTimerNames().map((timerName: string) => 
            getTimeInfoString(timerName, true)).join(' '),
    })
    const describe = () => 
        `list timer stats`

    return createCmd<TimerNameParam>([
            Require(Any(['list', 'read', 'get'])),
            Var('name', Any(['timer stats', 'timer status', 'timers'])),
        ], runFunc, describe, createCmdMatchSettings(false, true),
    )
}

export const createTimerCmds = (alarm: (alertMsg: string) => void): Cmd<ParamMap>[] => [
    createStartTimerCmd(alarm),
    createStopTimerCmd(),
    createTimerInfoCmd(),
    createTimerStatsCmd(),
]
