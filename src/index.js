import * as speech from './io/speech';
import * as recognition from './io/recognition';
import * as notes from './examples/note/cmd';
import * as timers from './examples/timer/cmd';

export const Speech = speech
export const Recognition = recognition

export { falexa } from './falexa';
export { newInterpretter } from './phonetic/interpretter'
export * from './phonetic'

export const Examples = {
    Timers: timers,
    Notes: notes,
}
