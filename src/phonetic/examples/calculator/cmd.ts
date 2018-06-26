import { ParamMap, Cmd } from '../../publicInterfaces';
import { createCmd, createCmdMatchSettings } from '../..';
import { Numeric, Var, Require, Any } from '../../syntax';

// Cmd run parameter types
export interface CalcParams extends ParamMap { 
    arg1: number, 
    arg2: number,
}

// --------------------- Note Commands ------------------------------------

export const createAddCmd = (): Cmd<CalcParams> => 
    createCmd([
            Require(Any(['add'])),
            Var('arg1', Numeric()),
            Require(Any(['and', 'to', 'with', 'plus'])),
            Var('arg2', Numeric()),
        ], ({arg1, arg2}: CalcParams) => ({
            outputMessage: `${arg1 + arg2}`,
        }), () => 'add', createCmdMatchSettings(false, true),
    )

export const createMultiplyCmd = (): Cmd<CalcParams> => 
    createCmd([
            Require(Any(['multiply'])),
            Var('arg1', Numeric()),
            Require(Any(['and', 'to', 'with', 'times'])),
            Var('arg2', Numeric()),
        ], ({arg1, arg2}: CalcParams) => ({
            outputMessage: `${arg1 * arg2}`,
        }), () => 'multiply', createCmdMatchSettings(false, true),
    )

export const createDivideCmd = (): Cmd<CalcParams> => 
    createCmd([
            Require(Any(['divide'])),
            Var('arg1', Numeric()),
            Require(Any(['and', 'to', 'with', 'by'])),
            Var('arg2', Numeric()),
        ], ({arg1, arg2}: CalcParams) => ({
            outputMessage: `${arg1 * arg2}`,
        }), () => 'divide', createCmdMatchSettings(false, true),
    )

export const createSubtractCmd = (): Cmd<CalcParams> => 
    createCmd([
            Require(Any(['subtract'])),
            Var('arg1', Numeric()),
            Require(Any(['and', 'to', 'with', 'by', 'minus'])),
            Var('arg2', Numeric()),
        ], ({arg1, arg2}: CalcParams) => ({
            outputMessage: `${arg1 - arg2}`,
        }), () => 'multiply', createCmdMatchSettings(false, true),
    )

export const createCalculatorCmds = (): Cmd<CalcParams>[] => [
    createAddCmd(),
    createSubtractCmd(),
    createMultiplyCmd(),
    createDivideCmd(),
]
