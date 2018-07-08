import { ParamMap, Cmd } from '../../publicInterfaces';
import { createCmd, createCmdMatchSettings } from '../..';
import { Numeric, Var, Require, Any } from '../../syntax';

// Cmd run parameter types
export interface ConvertParams extends ParamMap { 
    amount: number, 
    inputUnit: string,
    outputUnit: string,
}

const convertWeightUnit = ({amount, inputUnit, outputUnit}: ConvertParams) => {
    let multiplier = 1

    if (inputUnit === 'gram') {
        if (outputUnit === 'oz') {
            multiplier = 0.035274
        }
        if (outputUnit === 'lb') {
            multiplier = 0.00220462
        }
    }
    if (inputUnit === 'oz') {
        if (outputUnit === 'gram') {
            multiplier = 28.3495
        }
        if (outputUnit === 'lb') {
            multiplier = 0.0625
        }
    }
    if (inputUnit === 'lb') {
        if (outputUnit === 'oz') {
            multiplier = 16
        }
        if (outputUnit === 'gram') {
            multiplier = 453.592
        }
    }

    return amount * multiplier
};

export interface TranslateMap {
    [index: string]: string
}
const toTrueUnit: TranslateMap = {
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
    g: 'gram', gram: 'gram', grams: 'gram', graham: 'gram', grahams: 'gram',
};
const spokenUnits = Object.keys(toTrueUnit)
const toVerbalMap: TranslateMap = {
    oz: 'ounces', lb: 'pounds', gram: 'grams',
}

const getConvertedOutputMessage = ({amount, inputUnit, outputUnit}: ConvertParams) => {
    const absParams = {
        amount,
        inputUnit: toTrueUnit[inputUnit],
        outputUnit: toTrueUnit[outputUnit],
    };
    const converted = convertWeightUnit(absParams).toFixed(2)

    return `${converted} ${toVerbalMap[absParams.outputUnit]} equal ${amount} ${toVerbalMap[absParams.inputUnit]}`
};

export const createConvertWeightCmd = (): Cmd<ConvertParams> => 
    createCmd([
            Require(Any(['convert'])),
            Var('amount', Numeric()),
            Var('inputUnit', Any(spokenUnits)),
            Var('outputUnit', Any(spokenUnits)),
        ], (params: ConvertParams) => ({
            outputMessage: getConvertedOutputMessage(params),
        }), (params: ConvertParams) => `convert to ${toVerbalMap[toTrueUnit[params.outputUnit]]}`, 
        createCmdMatchSettings(false, true),
    )
