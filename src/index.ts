import * as speech from './io/speech';
import * as recognition from './io/recognition';
import * as notes from './phonetic/examples/note/cmd';
import * as timers from './phonetic/examples/timer/cmd';
import * as calculator from './phonetic/examples/calculator/cmd';
import * as weightConverter from './phonetic/examples/weightConverter/cmd';

export * from './falexa';
export * from './phonetic'
export const Speech = speech
export const Recognition = recognition

export const Examples = {
    Timers: timers,
    Notes: notes,
    Calculator: calculator,
    WeightConverter: weightConverter,
}
