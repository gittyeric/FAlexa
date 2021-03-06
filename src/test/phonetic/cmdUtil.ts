import { createCmd } from '../../../src/phonetic';
import { Cmd, Directive, ParamMap } from '../../../src/phonetic/publicInterfaces';

export interface MockCmdParams extends ParamMap {
    strVal1?: string,
    strVal2?: string,
    numVal1?: number,
    numVal2?: number,
}

export const assertEqualCmd = (syntax: Directive<ParamMap>[], expectedValues: MockCmdParams): Cmd<MockCmdParams> => {
    return createCmd(syntax, (params: MockCmdParams) => {
        expect(params).toEqual(expectedValues)
        return undefined
    })
}

export const asserterCmd = (syntax: Directive<ParamMap>[], asserter: (params: MockCmdParams) => void): Cmd<MockCmdParams> => {
    return createCmd(syntax, (params: MockCmdParams) => {
        asserter(params)
        return undefined
    })
}
