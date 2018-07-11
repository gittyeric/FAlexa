(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Falexa = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Falexa = require("./index");
module.exports = Falexa;

},{"./index":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var interpretter_1 = require("./phonetic/interpretter");
var defaultSpeaker = require('./io/speech').defaultSpeaker;
var newRecognizerFactory = require('./io/recognition').newRecognizerFactory;
var getDefaultRecognition = require('./io/recognition').getDefaultRecognition;
exports.createFalexa = function (cmds, speaker, sentenceSource, debugLogger) {
    var interpretter = interpretter_1.newInterpretter(cmds);
    var stopHandlers = [];
    sentenceSource.onend = function () {
        stopHandlers.forEach(function (handler) { return handler(); });
    };
    var sentenceHandler = function (sentencePossibilities) {
        debugLogger("Heard '" + sentencePossibilities[0] + "'");
        interpretter = interpretter.interpret(sentencePossibilities[0]);
        debugLogger("\"" + interpretter.getOutputMessage() + "\"");
        speaker(interpretter.getOutputMessage());
    };
    var recognizer = newRecognizerFactory(sentenceSource)(sentenceHandler);
    return {
        speak: function (toSay) {
            debugLogger("\"" + toSay + "\"");
            speaker(toSay);
        },
        hear: function (sentences) {
            sentenceHandler(sentences);
            return interpretter.getOutputMessage();
        },
        startListening: function () {
            recognizer.start();
        },
        stopListening: function () {
            recognizer.stop();
        },
        onListenStop: function (handler) {
            stopHandlers.push(handler);
        },
        offListenStop: function (handler) {
            stopHandlers = stopHandlers.filter(function (h) { return h !== handler; });
        },
    };
};
exports.falexa = function (cmds, speaker) {
    if (speaker === void 0) { speaker = defaultSpeaker(); }
    return exports.createFalexa(cmds, speaker, getDefaultRecognition(), console.log);
};

},{"./io/recognition":4,"./io/speech":5,"./phonetic/interpretter":14}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var speech = require("./io/speech");
var recognition = require("./io/recognition");
var notes = require("./phonetic/examples/note/cmd");
var timers = require("./phonetic/examples/timer/cmd");
var calculator = require("./phonetic/examples/calculator/cmd");
var weightConverter = require("./phonetic/examples/weightConverter/cmd");
tslib_1.__exportStar(require("./falexa"), exports);
tslib_1.__exportStar(require("./phonetic"), exports);
exports.Speech = speech;
exports.Recognition = recognition;
exports.Examples = {
    Timers: timers,
    Notes: notes,
    Calculator: calculator,
    WeightConverter: weightConverter,
};

},{"./falexa":2,"./io/recognition":4,"./io/speech":5,"./phonetic":12,"./phonetic/examples/calculator/cmd":6,"./phonetic/examples/note/cmd":7,"./phonetic/examples/timer/cmd":9,"./phonetic/examples/weightConverter/cmd":11,"tslib":94}],4:[function(require,module,exports){
"use strict";
var getDefaultRecognition = function () {
    var RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = new RecognitionClass();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;
    return recognition;
};
var newRecognizerFactory = function (recognition) {
    if (recognition === void 0) { recognition = getDefaultRecognition(); }
    return function (incomingSentencesHandler) {
        var resultHandler = function (event) {
            var sentences = [];
            var curIndex = event.results.length - 1;
            for (var i in event.results[curIndex]) {
                sentences.push(event.results[curIndex][i].transcript);
                console.log("Got " + event.results[curIndex][i].transcript);
            }
            incomingSentencesHandler(sentences.filter(function (s) { return !!s; }));
        };
        var startListening = function () {
            recognition.onresult = resultHandler;
        };
        var stopListening = function () {
            recognition.onresult = function () { return false; };
        };
        var start = function () {
            startListening();
            recognition.start();
        };
        var stop = function () {
            stopListening();
            recognition.stop();
        };
        return {
            start: start,
            stop: stop,
            startListening: startListening,
            stopListening: stopListening
        };
    };
};
module.exports = {
    getDefaultRecognition: getDefaultRecognition,
    newRecognizerFactory: newRecognizerFactory,
};

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getSynth = function () { return window !== undefined ? window.speechSynthesis : {}; };
var speak = function (synthesis, txt, voice, pitch, rate) {
    if (synthesis.speaking) {
        synthesis.cancel();
    }
    var utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.voice = voice;
    utterThis.pitch = pitch;
    utterThis.rate = rate;
    synthesis.speak(utterThis);
};
exports.getDefaultVoice = function () {
    return getSynth().getVoices()[0];
};
exports.speakerFactory = function (voice, pitch, rate) {
    return function (txt) {
        return speak(getSynth(), txt, voice, pitch, rate);
    };
};
exports.defaultSpeaker = function () {
    return exports.speakerFactory(exports.getDefaultVoice(), 1.8, 1);
};

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../..");
var syntax_1 = require("../../syntax");
exports.createAddCmd = function () {
    return __1.createCmd([
        syntax_1.Require(syntax_1.Exact(syntax_1.Any(['add', 'ad']))),
        syntax_1.Var('arg1', syntax_1.Numeric()),
        syntax_1.Require(syntax_1.Any(['and', 'to', 'with', 'plus'])),
        syntax_1.Var('arg2', syntax_1.Numeric()),
    ], function (_a) {
        var arg1 = _a.arg1, arg2 = _a.arg2;
        return ({
            outputMessage: "" + (arg1 + arg2),
        });
    }, function () { return 'add'; }, __1.createCmdMatchSettings(false, true));
};
exports.createMultiplyCmd = function () {
    return __1.createCmd([
        syntax_1.Require(syntax_1.Any(['multiply', 'multiple'])),
        syntax_1.Var('arg1', syntax_1.Numeric()),
        syntax_1.Require(syntax_1.Any(['and', 'with', 'times'])),
        syntax_1.Var('arg2', syntax_1.Numeric()),
    ], function (_a) {
        var arg1 = _a.arg1, arg2 = _a.arg2;
        return ({
            outputMessage: "" + arg1 * arg2,
        });
    }, function () { return 'multiply'; }, __1.createCmdMatchSettings(false, true));
};
exports.createDivideCmd = function () {
    return __1.createCmd([
        syntax_1.Require(syntax_1.Exact(syntax_1.Any(['divide']))),
        syntax_1.Var('arg1', syntax_1.Numeric()),
        syntax_1.Require(syntax_1.Any(['and', 'to', 'with', 'by'])),
        syntax_1.Var('arg2', syntax_1.Numeric()),
    ], function (_a) {
        var arg1 = _a.arg1, arg2 = _a.arg2;
        return ({
            outputMessage: "" + arg1 / arg2,
        });
    }, function () { return 'divide'; }, __1.createCmdMatchSettings(false, true));
};
exports.createSubtractCmd = function () {
    return __1.createCmd([
        syntax_1.Require(syntax_1.Exact(syntax_1.Any(['subtract', 'sub track']))),
        syntax_1.Var('arg1', syntax_1.Numeric()),
        syntax_1.Require(syntax_1.Any(['and', 'to', 'with', 'from', 'by', 'minus'])),
        syntax_1.Var('arg2', syntax_1.Numeric()),
    ], function (_a) {
        var arg1 = _a.arg1, arg2 = _a.arg2;
        return ({
            outputMessage: "" + (arg1 - arg2),
        });
    }, function () { return 'subtract'; }, __1.createCmdMatchSettings(false, true));
};
exports.createCalculatorCmds = function () { return [
    exports.createAddCmd(),
    exports.createSubtractCmd(),
    exports.createMultiplyCmd(),
    exports.createDivideCmd(),
]; };

},{"../..":12,"../../syntax":19}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var __1 = require("../..");
var syntax_1 = require("../../syntax");
tslib_1.__exportStar(require("./skills"), exports);
exports.createSaveNoteCmd = function (notes) {
    return __1.createCmd([
        __1.Require(__1.Any(['save', 'take'])),
        __1.Require(syntax_1.Exact(__1.Any(['note', 'message']))),
        __1.Var('name', __1.StopPhrase(['with'])),
        __1.Var('note', __1.Sentence()),
    ], function (_a) {
        var name = _a.name, note = _a.note;
        notes.saveNote(name, note);
        return undefined;
    }, function (_a) {
        var name = _a.name;
        return "save note " + name;
    });
};
exports.createReadNoteCmd = function (notes) {
    return __1.createCmd([
        __1.Require(__1.Any(['get', 'read', 'play'])),
        __1.Require(syntax_1.Exact(__1.Any(['note', 'message']))),
        __1.Var('name', __1.GetAny(notes.noteNames)),
    ], function (_a) {
        var name = _a.name;
        return ({
            outputMessage: notes.getNote(name).note,
        });
    }, function (_a) {
        var name = _a.name;
        return "read " + name;
    });
};
exports.createReadNoteNamesCmd = function (notes) {
    return __1.createCmd([
        __1.Require(__1.Any(['list'])),
        __1.Ignore(__1.Any(['last', 'past', 'most recent'])),
        __1.Option('count', 20, __1.Numeric()),
        __1.Require(syntax_1.Exact(__1.Any(['notes', 'note']))),
    ], function (_a) {
        var count = _a.count;
        return ({
            outputMessage: 'notes, ' + notes.noteNames().slice(0, count).join(', '),
        });
    }, function () { return 'read note names'; }, tslib_1.__assign({}, __1.createCmdMatchSettings(), { autoRunIfFuzzy: true }));
};
exports.createNoteCmds = function (notes) { return [
    exports.createSaveNoteCmd(notes),
    exports.createReadNoteCmd(notes),
    exports.createReadNoteNamesCmd(notes),
]; };
exports.createLogCmd = function (logger) {
    return __1.createCmd([
        __1.Ignore(__1.Any(['add', 'push', 'append'])),
        __1.Require(syntax_1.Exact(__1.Any(['log']))),
        __1.Ignore(__1.Any(['note', 'message'])),
        __1.Var('message', __1.Sentence()),
    ], function (_a) {
        var message = _a.message;
        logger.log(message);
        return undefined;
    }, function () { return 'log message'; }, tslib_1.__assign({}, __1.createCmdMatchSettings(), { autoRunIfFuzzy: true }));
};
var prevLogWhitelist = ['last', 'past', 'previous', 'most recent', 'recent'];
exports.createPopLogCmd = function (logger) {
    return __1.createCmd([
        __1.Require(__1.Any(['pop', 'remove', 'delete', 'clear'])),
        __1.Ignore(__1.Any(prevLogWhitelist)),
        __1.Ignore(syntax_1.Exact(__1.Any(['log']))),
    ], function () {
        var popped = logger.popLastLog();
        return {
            outputMessage: popped != null ? "cleared " + popped.note : '',
        };
    }, function () {
        return 'clear last log entry';
    });
};
exports.createListRecentLogsCmd = function (logger) {
    return __1.createCmd([
        __1.Require(__1.Any(['list', 'read'])),
        __1.Ignore(__1.Any(prevLogWhitelist)),
        __1.Option('count', 2, __1.Numeric()),
        __1.Require(syntax_1.Exact(__1.Any(['log', 'logs']))),
    ], function (_a) {
        var count = _a.count;
        var recentLogs = logger.recentLogs(count);
        var outputMessage = recentLogs.map(function (log, i) { return i + 1 + " " + log.note; }).join(', ');
        return {
            outputMessage: outputMessage,
        };
    }, function (_a) {
        var count = _a.count;
        return "list " + (count === 1 ? '' : count) + " recent logs";
    }, tslib_1.__assign({}, __1.createCmdMatchSettings(), { autoRunIfFuzzy: true }));
};
exports.createLogCmds = function (logger) { return [
    exports.createLogCmd(logger),
    exports.createPopLogCmd(logger),
    exports.createListRecentLogsCmd(logger),
]; };

},{"../..":12,"../../syntax":19,"./skills":8,"tslib":94}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newLogger = function () {
    var logs = [];
    var log = function (note) {
        logs.push({
            date: new Date(),
            note: note,
        });
    };
    var recentLogs = function (count) {
        return logs.slice(Math.max(0, logs.length - count))
            .reverse();
    };
    var popLastLog = function () {
        return logs.pop();
    };
    return {
        log: log,
        recentLogs: recentLogs,
        popLastLog: popLastLog,
    };
};
exports.newNotes = function () {
    var notes = {};
    var noteKeys = [];
    var saveNote = function (name, note) {
        notes[name] = {
            name: name,
            date: new Date(),
            note: note,
        };
        noteKeys = Object.keys(notes);
    };
    var getNote = function (name) { return notes[name]; };
    var noteNames = function () { return noteKeys; };
    return {
        saveNote: saveNote,
        getNote: getNote,
        noteNames: noteNames,
    };
};

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syntax_1 = require("../../syntax");
var __1 = require("../..");
exports.startTimer = (require('./skills').startTimer);
exports.stopTimer = (require('./skills').stopTimer);
var getSecsRemaining = (require('./skills').getSecsRemaining);
var getActiveTimerNames = (require('./skills').getActiveTimerNames);
var timeUnitTranslator = {
    seconds: 'second',
    minutes: 'minute',
    hours: 'hour',
    our: 'hour',
    ours: 'hour',
};
var timerNames = ['time', 'timer', 'alarm', 'clock'];
var getTimeInfoString = function (name, useShorthand) {
    var secsRemaining = getSecsRemaining(name);
    var unitMultiplier = 1;
    var timeUnit = 'second';
    var round = Math.floor;
    if (secsRemaining > 90) {
        unitMultiplier /= 60;
        timeUnit = 'minute';
    }
    if (secsRemaining > 60 * 90) {
        unitMultiplier /= 60;
        timeUnit = 'hour';
        round = function (num) { return parseFloat(num.toFixed(1)); };
    }
    var units = round(secsRemaining * unitMultiplier);
    if (useShorthand) {
        return name + " " + units + " " + timeUnit + (units === 1 ? '' : 's');
    }
    return units + " " + timeUnit + (units === 1 ? '' : 's') + " remaining for " + name;
};
exports.createStartTimerCmd = function (alarm) {
    var syntax = [
        syntax_1.Require(syntax_1.Any(['start', 'set'])),
        syntax_1.Var('name', syntax_1.Exact(syntax_1.StopPhrase(timerNames))),
        syntax_1.Require(syntax_1.Any(['for'])),
        syntax_1.Var('duration', syntax_1.Numeric()),
        syntax_1.Var('timeUnit', syntax_1.Any(['second', 'seconds', 'minute', 'minutes', 'hour', 'hours', 'our', 'ours'])),
    ];
    var runFunc = function (_a) {
        var name = _a.name, duration = _a.duration, timeUnit = _a.timeUnit;
        var multiplier = 1000;
        var unit = timeUnitTranslator[timeUnit] !== undefined ? timeUnitTranslator[timeUnit] : timeUnit;
        if (unit.startsWith('min')) {
            multiplier *= 60;
        }
        if (unit.startsWith('hour')) {
            multiplier *= 60 * 60;
        }
        exports.startTimer(name, duration * multiplier, function () { return alarm("timer " + name + " ready, " + name); });
        return undefined;
    };
    var describe = function (_a) {
        var name = _a.name, duration = _a.duration, timeUnit = _a.timeUnit;
        return name + " for " + duration + " " + timeUnit;
    };
    return __1.createCmd(syntax, runFunc, describe);
};
exports.createStopTimerCmd = function () {
    return __1.createCmd([
        syntax_1.Require(syntax_1.Any(['stop', 'end'])),
        syntax_1.Var('name', syntax_1.Exact(syntax_1.StopPhrase(timerNames))),
    ], function (_a) {
        var name = _a.name;
        exports.stopTimer(name);
        return undefined;
    }, function (_a) {
        var name = _a.name;
        return name + " stopped";
    });
};
exports.createTimerInfoCmd = function () {
    var runFunc = function (_a) {
        var name = _a.name;
        return ({
            outputMessage: getTimeInfoString(name, false),
        });
    };
    var describe = function (params) { return getTimeInfoString(params.name, true); };
    return __1.createCmd([
        syntax_1.Require(syntax_1.Any(['get', 'give', 'how much'])),
        syntax_1.Require(syntax_1.Any([
            'time remaining', 'time remains', 'time is remaining',
            'time left', 'time is left'
        ])),
        syntax_1.Ignore(syntax_1.Any(['for'])),
        syntax_1.Var('name', syntax_1.Sentence()),
    ], runFunc, describe, __1.createCmdMatchSettings(false, true));
};
exports.createTimerStatsCmd = function () {
    var runFunc = function () { return ({
        outputMessage: getActiveTimerNames().map(function (timerName) {
            return getTimeInfoString(timerName, true);
        }).join(' '),
    }); };
    var describe = function () {
        return "list timer stats";
    };
    return __1.createCmd([
        syntax_1.Require(syntax_1.Any(['list', 'read', 'get'])),
        syntax_1.Var('name', syntax_1.Any(['timer stats', 'timer status', 'timers'])),
    ], runFunc, describe, __1.createCmdMatchSettings(false, true));
};
exports.createTimerCmds = function (alarm) { return [
    exports.createStartTimerCmd(alarm),
    exports.createStopTimerCmd(),
    exports.createTimerInfoCmd(),
    exports.createTimerStatsCmd(),
]; };

},{"../..":12,"../../syntax":19,"./skills":10}],10:[function(require,module,exports){
"use strict";
var timers = {};
var ensureStopped = function (name) {
    var timer = timers[name];
    if (timer) {
        clearTimeout(timer.ref);
        delete timers[name];
    }
    return timer;
};
var startTimer = function (name, millis, callbackFunc) {
    ensureStopped(name);
    var now = (new Date()).getTime();
    var timer = {
        ref: setTimeout(callbackFunc, millis),
        started: now,
        ending: (now + millis),
    };
    timers[name] = timer;
};
var stopTimer = function (name) {
    ensureStopped(name);
};
var getSecsRemaining = function (name) {
    var timer = timers[name];
    if (!timer) {
        return Number.NaN;
    }
    return (timer.ending - (new Date()).getTime()) / 1000;
};
var getActiveTimerNames = function () {
    return Object.keys(timers);
};
module.exports = {
    startTimer: startTimer,
    stopTimer: stopTimer,
    getSecsRemaining: getSecsRemaining,
    getActiveTimerNames: getActiveTimerNames,
};

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("../..");
var syntax_1 = require("../../syntax");
var convertWeightUnit = function (_a) {
    var amount = _a.amount, inputUnit = _a.inputUnit, outputUnit = _a.outputUnit;
    var multiplier = 1;
    if (inputUnit === 'gram') {
        if (outputUnit === 'oz') {
            multiplier = 0.035274;
        }
        if (outputUnit === 'lb') {
            multiplier = 0.00220462;
        }
    }
    if (inputUnit === 'oz') {
        if (outputUnit === 'gram') {
            multiplier = 28.3495;
        }
        if (outputUnit === 'lb') {
            multiplier = 0.0625;
        }
    }
    if (inputUnit === 'lb') {
        if (outputUnit === 'oz') {
            multiplier = 16;
        }
        if (outputUnit === 'gram') {
            multiplier = 453.592;
        }
    }
    return amount * multiplier;
};
var toTrueUnit = {
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
    g: 'gram', gram: 'gram', grams: 'gram', graham: 'gram', grahams: 'gram',
};
var spokenUnits = Object.keys(toTrueUnit);
var toVerbalMap = {
    oz: 'ounces', lb: 'pounds', gram: 'grams',
};
var getConvertedOutputMessage = function (_a) {
    var amount = _a.amount, inputUnit = _a.inputUnit, outputUnit = _a.outputUnit;
    var absParams = {
        amount: amount,
        inputUnit: toTrueUnit[inputUnit],
        outputUnit: toTrueUnit[outputUnit],
    };
    var converted = convertWeightUnit(absParams).toFixed(2)
        .replace(/\.(\d)0/, '.$1')
        .replace('.0', '');
    return converted + " " + toVerbalMap[absParams.outputUnit] + " equal " + amount + " " + toVerbalMap[absParams.inputUnit];
};
exports.createConvertWeightCmd = function () {
    return __1.createCmd([
        syntax_1.Require(syntax_1.Any(['convert'])),
        syntax_1.Var('amount', syntax_1.Numeric()),
        syntax_1.Var('inputUnit', syntax_1.Any(spokenUnits)),
        syntax_1.Var('outputUnit', syntax_1.Any(spokenUnits)),
    ], function (params) { return ({
        outputMessage: getConvertedOutputMessage(params),
    }); }, function (params) { return "convert to " + toVerbalMap[toTrueUnit[params.outputUnit]]; }, __1.createCmdMatchSettings(false, true));
};

},{"../..":12,"../../syntax":19}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var syntax_1 = require("./syntax");
exports.createCmdMatchSettings = function (ignoreFuzzyMatches, autoRunIfFuzzy, alwaysAsk, maxFuzzyCmds, maxFuzzyDirectives, maxFuzzyFilterResults, trimPrefixStopwords) {
    if (ignoreFuzzyMatches === void 0) { ignoreFuzzyMatches = false; }
    if (autoRunIfFuzzy === void 0) { autoRunIfFuzzy = false; }
    if (alwaysAsk === void 0) { alwaysAsk = false; }
    if (maxFuzzyCmds === void 0) { maxFuzzyCmds = 2; }
    if (maxFuzzyDirectives === void 0) { maxFuzzyDirectives = 16; }
    if (maxFuzzyFilterResults === void 0) { maxFuzzyFilterResults = 32; }
    if (trimPrefixStopwords === void 0) { trimPrefixStopwords = false; }
    return ({
        ignoreFuzzyMatches: ignoreFuzzyMatches,
        autoRunIfFuzzy: autoRunIfFuzzy,
        alwaysAsk: alwaysAsk,
        maxFuzzyFilterResults: maxFuzzyFilterResults,
        maxFuzzyDirectives: maxFuzzyDirectives,
        maxFuzzyCmds: maxFuzzyCmds,
        trimPrefixStopwords: trimPrefixStopwords,
    });
};
function createCmd(syntax, runFunc, describe, matchSettings) {
    return ({
        syntax: syntax,
        runFunc: runFunc,
        describe: describe,
        matchSettings: matchSettings !== undefined ? matchSettings : exports.createCmdMatchSettings(),
    });
}
exports.createCmd = createCmd;
exports.addActivationWord = function (activationWords, cmds) {
    return cmds.map(function (cmd) {
        var activatedSyntax = [syntax_1.Require(syntax_1.Any(activationWords))].concat(cmd.syntax);
        return tslib_1.__assign({}, cmd, { syntax: activatedSyntax });
    });
};
tslib_1.__exportStar(require("./syntax"), exports);
tslib_1.__exportStar(require("./publicInterfaces"), exports);
tslib_1.__exportStar(require("./text"), exports);
var interpretter_1 = require("./interpretter");
exports.newInterpretter = interpretter_1.newInterpretter;

},{"./interpretter":14,"./publicInterfaces":16,"./syntax":19,"./text":20,"tslib":94}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var _ = require("lodash");
var syntax_1 = require("./syntax");
var _1 = require(".");
var util_1 = require("util");
function paramNameToPhrase(paramName) {
    var snaked = _.snakeCase(paramName);
    return snaked.split('_').join(' ');
}
exports.defaultCmdDescription = function (cmd) {
    return !util_1.isNullOrUndefined(cmd.cmd.describe) ?
        cmd.cmd.describe(cmd.runParams) : ('Run with ' +
        Object.keys(cmd.runParams)
            .map(function (paramName) {
            return paramNameToPhrase(paramName) + " as " + cmd.runParams[paramName];
        })
            .join(' '));
};
function createMultichoiceResponse(possibleCmds) {
    var question = 'did you mean ' +
        possibleCmds.map(function (cmd, ci) {
            return (ci + 1 + ", " + exports.defaultCmdDescription(cmd));
        }).join(' or ')
        + '?';
    var clarifyCmd = _1.createCmd([syntax_1.Var('response', syntax_1.Numeric(1, possibleCmds.length))], function (a) {
        var confirmed = possibleCmds[a.response - 1];
        return confirmed.cmd.runFunc(confirmed.runParams);
    }, function () { return ''; }, tslib_1.__assign({}, _1.createCmdMatchSettings(true)));
    return {
        contextualCmds: [clarifyCmd],
        outputMessage: question,
    };
}
exports.createMultichoiceResponse = createMultichoiceResponse;
function createClarifyResponse(possibleCmd) {
    return {
        contextualCmds: [createYesCmd(possibleCmd), createNoCmd()],
        outputMessage: exports.defaultCmdDescription(possibleCmd) + '?',
    };
}
exports.createClarifyResponse = createClarifyResponse;
function createYesCmd(confirmedCmd) {
    return _1.createCmd([syntax_1.Require(syntax_1.Any(['yes', 'yeah', 'yep', 'sure', 'okay']))], function () { return confirmedCmd.cmd.runFunc(confirmedCmd.runParams); }, function () { return exports.defaultCmdDescription(confirmedCmd) + ' done'; }, tslib_1.__assign({}, _1.createCmdMatchSettings(true)));
}
exports.createYesCmd = createYesCmd;
function createNoCmd() {
    return _1.createCmd([syntax_1.Require(syntax_1.Any(['no', 'know', 'mow', 'moe', 'nah', 'nope', 'oh', 'reset', 'stop', 'cancel']))], function () { return ({ outputMessage: 'cancelled' }); }, function () { return 'cancelled'; }, tslib_1.__assign({}, _1.createCmdMatchSettings(true)));
}
exports.createNoCmd = createNoCmd;
function createClarificationResponse(possibleCmds) {
    if (possibleCmds.length === 1) {
        return createClarifyResponse(possibleCmds[0]);
    }
    return createMultichoiceResponse(possibleCmds);
}
exports.createClarificationResponse = createClarificationResponse;
function createRepeatCmd(outputMessage) {
    return _1.createCmd([
        syntax_1.Require(syntax_1.Any(['repeat', 'what'])),
    ], function () { return ({ outputMessage: outputMessage }); }, undefined, _1.createCmdMatchSettings(true));
}
exports.createRepeatCmd = createRepeatCmd;

},{".":12,"./syntax":19,"lodash":91,"tslib":94,"util":96}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var sort_1 = require("./sort");
var text_1 = require("./text");
var interactSkills_1 = require("./interactSkills");
var lodash_1 = require("lodash");
var stopwords_1 = require("./stopwords");
var util_1 = require("util");
function interpretDirective(directive, words, paramMap, settings) {
    var interpretAttempt = directive(words, lodash_1.cloneDeep(paramMap), settings.maxFuzzyFilterResults);
    if (words.length > 1 && stopwords_1.stopwords.indexOf(words[0]) >= 0) {
        return sort_1.trimd(interpretAttempt.concat(interpretDirective(directive, words.slice(1), lodash_1.cloneDeep(paramMap), settings)
            .map(function (interpretation) {
            return (tslib_1.__assign({}, interpretation, { filterInterpretation: tslib_1.__assign({}, interpretation.filterInterpretation, { consumed: interpretation.filterInterpretation.consumed + 1 }) }));
        })), settings.maxFuzzyDirectives);
    }
    return sort_1.trimd(interpretAttempt, settings.maxFuzzyDirectives);
}
var getSyntaxPenalty = function (syntaxInterpretation) {
    return syntaxInterpretation
        .reduce(function (pSum, interpretation) {
        return pSum + interpretation.filterInterpretation.penalty;
    }, 0);
};
function sortAndFlatten(sortedArrs) {
    var mergeLen = 0;
    var possibleArrs = sortedArrs.map(function (sorted) {
        return sorted.filter(function (syntaxInterpretation) {
            return getSyntaxPenalty(syntaxInterpretation) !== Infinity;
        });
    })
        .filter(function (sorted) { return sorted.length > 0; });
    var indexLens = possibleArrs.map(function (sorted) {
        mergeLen += sorted.length;
        return sorted.length;
    });
    var curIndexes = new Array(possibleArrs.length);
    for (var i = 0; i < possibleArrs.length; i++) {
        curIndexes[i] = 0;
    }
    var merged = new Array(mergeLen);
    for (var i = 0; i < mergeLen; i++) {
        var minArrIndex = -1;
        var minPenalty = Infinity;
        for (var s = 0; s < possibleArrs.length; s++) {
            var sCurIndex = curIndexes[s];
            if (sCurIndex < indexLens[s]) {
                var syntaxInterpretation = possibleArrs[s][sCurIndex];
                var syntaxPenalty = getSyntaxPenalty(syntaxInterpretation);
                if (syntaxPenalty < minPenalty) {
                    minPenalty = syntaxPenalty;
                    minArrIndex = s;
                }
            }
        }
        var minIndex = curIndexes[minArrIndex];
        merged[i] = possibleArrs[minArrIndex][minIndex];
        curIndexes[minArrIndex] += 1;
    }
    return merged;
}
exports.sortAndFlatten = sortAndFlatten;
function interpretSyntax(syntax, words, paramMap, settings, directivesSoFar) {
    if (syntax.length === 0) {
        var nextStopwords = text_1.filterFirstStopwords(words);
        if ((words.length - nextStopwords.length) === 0) {
            return [directivesSoFar];
        }
        return null;
    }
    var interpretNext = syntax[0];
    var directiveInterpretations = interpretDirective(interpretNext, words, lodash_1.cloneDeep(paramMap), settings);
    if (directiveInterpretations.length === 0) {
        return null;
    }
    var remainingSyntax = syntax.slice(1);
    var nextDirectiveResults = directiveInterpretations.map(function (interpretation) {
        return interpretSyntax(remainingSyntax, interpretation.remainingWords, lodash_1.cloneDeep(interpretation.runParams), settings, directivesSoFar.concat([interpretation]));
    });
    var validInterpretations = nextDirectiveResults.filter(function (result) { return result !== null; });
    return sortAndFlatten(validInterpretations);
}
var paramAsString = function (param) { return util_1.isString(param) ? param : undefined; };
var getParamsFromSyntax = function (interpretation) {
    return interpretation[interpretation.length - 1].runParams;
};
var getWordsCount = function (paramMap) {
    return Object.keys(paramMap)
        .map(function (name) { return paramAsString(paramMap[name]); })
        .filter(function (paramStr) { return util_1.isString(paramStr); })
        .map(function (paramStr) { return paramStr.split(' ').length; })
        .reduce(function (total, wordCount) { return total + wordCount; }, 0);
};
function deduplicateSyntaxInterpretations(syntaxInterpretations, trimPrefixStopwords) {
    var seenParamMaps = {};
    var seenNonStopwordHashes = {};
    syntaxInterpretations.filter(function (interpretation) {
        var paramSignature = JSON.stringify(getParamsFromSyntax(interpretation));
        var exists = seenParamMaps[paramSignature] !== undefined;
        seenParamMaps[paramSignature] = interpretation;
        return !exists;
    })
        .forEach(function (interpretation) {
        var params = getParamsFromSyntax(interpretation);
        var stopAgnosticSignature = JSON.stringify(Object.keys(params)
            .map(function (paramName) { return paramAsString(params[paramName]); })
            .map(function (paramStr) { return util_1.isString(paramStr) ? paramStr : ''; })
            .map(function (paramStr) { return text_1.trimFirstStopwords(paramStr.split(' ')); }));
        var existing = seenNonStopwordHashes[stopAgnosticSignature];
        var overwriteExisting = existing === undefined ||
            (trimPrefixStopwords && getWordsCount(getParamsFromSyntax(existing)) > getWordsCount(params));
        if (overwriteExisting) {
            seenNonStopwordHashes[stopAgnosticSignature] = interpretation;
        }
    });
    return Object.keys(seenNonStopwordHashes).map(function (hash) { return seenNonStopwordHashes[hash]; });
}
function interpretCmd(cmd, words) {
    var interprettedSyntaxes = interpretSyntax(cmd.syntax, words, {}, cmd.matchSettings, []);
    var minPenalty = Infinity;
    if (interprettedSyntaxes !== null) {
        minPenalty =
            interprettedSyntaxes
                .map(function (possibleSyntax) {
                return getSyntaxPenalty(possibleSyntax);
            })
                .reduce(function (minSyntaxPenalty, syntaxPenalty) {
                return Math.min(minSyntaxPenalty, syntaxPenalty);
            }, Infinity);
    }
    return {
        minPenalty: minPenalty,
        topInterpretations: interprettedSyntaxes === null ? [] :
            deduplicateSyntaxInterpretations(interprettedSyntaxes, cmd.matchSettings.trimPrefixStopwords),
        cmd: cmd,
    };
}
var emptyCmdResponse = {
    contextualCmds: [],
    outputMessage: '',
};
function isCmdResponse(response) {
    return response.outputMessage !== undefined;
}
function isCmdListResponse(response) {
    return response.length !== undefined;
}
function runCmd(cmd, runParams) {
    var runResponse = cmd.runFunc(runParams);
    if (runResponse !== undefined) {
        if (isCmdResponse(runResponse)) {
            return runResponse;
        }
        else if (isCmdListResponse(runResponse)) {
            return {
                outputMessage: interactSkills_1.defaultCmdDescription({ cmd: cmd, runParams: runParams }) + ' done',
                contextualCmds: runResponse,
            };
        }
    }
    return {
        contextualCmds: [],
        outputMessage: interactSkills_1.defaultCmdDescription({ cmd: cmd, runParams: runParams }) + ' done',
    };
}
function runTopCmdInterpretation(interpretation) {
    var runParams = cmdInterpretationToRunParams(interpretation.topInterpretations[0]);
    return runCmd(interpretation.cmd, runParams);
}
function cmdInterpretationToRunParams(interpretation) {
    return interpretation[interpretation.length - 1].runParams;
}
var sortByDirectiveCount = function (curInterpretations) {
    return curInterpretations.sort(function (interp1, interpr2) {
        return interp1.cmd.syntax.length > interpr2.cmd.syntax.length ? -1 : 1;
    });
};
function sortTiedCmds(interpretations) {
    var sorted = [];
    var curPenalty = -1;
    var curInterpretations = [];
    for (var i = 0; i < interpretations.length; i++) {
        var interpretation = interpretations[i];
        if (interpretation.minPenalty !== curPenalty) {
            curPenalty = interpretation.minPenalty;
            sortByDirectiveCount(curInterpretations);
            sorted.push.apply(sorted, curInterpretations);
            curInterpretations = [];
        }
        curInterpretations.push(interpretation);
    }
    if (curInterpretations.length > 0) {
        sortByDirectiveCount(curInterpretations);
        sorted.push.apply(sorted, curInterpretations);
    }
    return sorted;
}
function topCmdInterpretationsToRunnables(interpretations) {
    var sortedInterpretations = sortTiedCmds(interpretations);
    if (sortedInterpretations.length === 1) {
        return sortedInterpretations[0].topInterpretations.slice(0, sortedInterpretations[0].cmd.matchSettings.maxFuzzyCmds)
            .map(function (syntaxInterpretation) { return ({
            cmd: sortedInterpretations[0].cmd,
            runParams: cmdInterpretationToRunParams(syntaxInterpretation),
        }); });
    }
    return sortedInterpretations.slice(0, 2).map(function (cmdInterpretation) { return ({
        cmd: cmdInterpretation.cmd,
        runParams: cmdInterpretationToRunParams(cmdInterpretation.topInterpretations[0]),
    }); });
}
var interpretCmds = function (cmds, words) {
    var interpretationsByCmd = cmds.map(function (cmd) { return interpretCmd(cmd, words); });
    var exactInterpretationsByCmd = interpretationsByCmd.filter(function (interpretation) {
        return interpretation.minPenalty === 0;
    })
        .map(function (cmdInterpretation) { return (tslib_1.__assign({}, cmdInterpretation, { topInterpretations: cmdInterpretation.topInterpretations.filter(function (syntax) {
            return getSyntaxPenalty(syntax) === 0;
        }) })); });
    var topExactMatches = topCmdInterpretationsToRunnables(exactInterpretationsByCmd);
    if (topExactMatches.length === 1 && !exactInterpretationsByCmd[0].cmd.matchSettings.alwaysAsk) {
        return runTopCmdInterpretation(exactInterpretationsByCmd[0]);
    }
    if (topExactMatches.length > 0) {
        topExactMatches.forEach(function (m) {
            console.log(JSON.stringify(m.runParams));
        });
        return tslib_1.__assign({}, interactSkills_1.createClarificationResponse(topExactMatches));
    }
    var fuzzyInterpretations = interpretationsByCmd.filter(function (cmdInterpretation) {
        return !cmdInterpretation.cmd.matchSettings.ignoreFuzzyMatches && cmdInterpretation.minPenalty < Infinity;
    });
    var topFuzzyMatches = topCmdInterpretationsToRunnables(fuzzyInterpretations);
    if (fuzzyInterpretations.length === 1 && fuzzyInterpretations[0].cmd.matchSettings.autoRunIfFuzzy) {
        return runTopCmdInterpretation(fuzzyInterpretations[0]);
    }
    if (topFuzzyMatches.length > 0) {
        return interactSkills_1.createClarificationResponse(topFuzzyMatches);
    }
    return emptyCmdResponse;
};
var interpretAllCmds = function (priorityCmds, cmds, txt) {
    var words = text_1.txtToValidWords(txt);
    var exactPriorityCmds = priorityCmds.map(function (cmd) {
        return (tslib_1.__assign({}, cmd, { matchSettings: tslib_1.__assign({}, cmd.matchSettings, { ignoreFuzzyMatches: true }) }));
    });
    var exactPrioritizedResults = interpretCmds(exactPriorityCmds, words);
    if (exactPrioritizedResults === emptyCmdResponse) {
        return interpretCmds(priorityCmds.concat(cmds), words);
    }
    return exactPrioritizedResults;
};
var getOutputMessage = function (interpretation) {
    if (interpretation === undefined) {
        return '';
    }
    return interpretation.outputMessage === undefined ? '' : interpretation.outputMessage;
};
var createDefaultPrioritizedCmds = function (lastInterpretation) {
    return [
        interactSkills_1.createRepeatCmd(getOutputMessage(lastInterpretation)),
    ];
};
var _newInterpretter = function (cmds, prioritizedCmds, interpretation) {
    if (prioritizedCmds === void 0) { prioritizedCmds = []; }
    var curPrioritizedCmds = prioritizedCmds;
    var curInterpretation = interpretation;
    var bindFutureResponse = function (asyncResponse) {
        if (asyncResponse.laterResponse !== undefined) {
            asyncResponse.laterResponse.then(function (response) {
                curInterpretation = response;
                if (response.contextualCmds !== undefined) {
                    curPrioritizedCmds = response.contextualCmds;
                }
                else {
                    curPrioritizedCmds = [];
                }
                bindFutureResponse(response);
            })
                .catch(function () { });
        }
    };
    if (curInterpretation !== undefined) {
        bindFutureResponse(curInterpretation);
    }
    return {
        getOutputMessage: function () {
            return getOutputMessage(curInterpretation);
        },
        getContextualCmds: function () { return curPrioritizedCmds.slice(); },
        interpret: function (txt) {
            var nextInterpretation = interpretAllCmds(curPrioritizedCmds, cmds, txt);
            var nextContextualCmds = (nextInterpretation.contextualCmds === undefined ? [] : nextInterpretation.contextualCmds).concat(createDefaultPrioritizedCmds(nextInterpretation));
            return _newInterpretter(cmds, nextContextualCmds, nextInterpretation);
        },
    };
};
exports.newInterpretter = function (cmds) { return _newInterpretter(cmds); };

},{"./interactSkills":13,"./sort":17,"./stopwords":18,"./text":20,"lodash":91,"tslib":94,"util":96}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var words_to_numbers_1 = require("words-to-numbers");
var util_1 = require("util");
var negativeSynonyms = { negative: 'negative', minus: 'negative' };
var dotSynonyms = { point: 'point', dot: 'point', period: 'point' };
var numberSynonyms = {
    won: 'one',
    to: 'two', too: 'two',
    for: 'four', forth: 'fourth',
    ate: 'eight',
};
var numericSynonymMap = tslib_1.__assign({}, negativeSynonyms, dotSynonyms, numberSynonyms);
var numericStopwords = { and: 'and' };
var createParsedNumber = function (value, isNegative, consumed) { return ({
    value: value * (isNegative ? -1 : 1),
    consumed: consumed,
}); };
exports.wordsToNumberWithMutationAndBeer = function (words) {
    var isNegative = false;
    var curNumber = 0;
    var consumed = 0;
    var numericPhrase = [];
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var word = words_1[_i];
        consumed += 1;
        var mappedWord = numericSynonymMap[word] === undefined ? word : numericSynonymMap[word];
        if (mappedWord === 'zero' && (consumed === 0 || curNumber === 0)) {
            continue;
        }
        if (numericStopwords[word] !== undefined) {
            continue;
        }
        if (negativeSynonyms[word] !== undefined && consumed === 0) {
            isNegative = true;
            continue;
        }
        numericPhrase.push(mappedWord);
        if (dotSynonyms[mappedWord] !== undefined &&
            consumed + 1 < words.length) {
            numericPhrase.push('point');
            continue;
        }
        var newNumber = words_to_numbers_1.wordsToNumbers(numericPhrase.join(' '));
        if (!util_1.isNumber(newNumber) || !isFinite(newNumber) || newNumber < curNumber) {
            numericPhrase.pop();
            break;
        }
        curNumber = newNumber;
    }
    return createParsedNumber(curNumber, isNegative, consumed);
};
exports.wordsToNumberRecurse = function (words, curNumber, numericPhrase, consumed, isNegative) {
    if (curNumber === void 0) { curNumber = NaN; }
    if (numericPhrase === void 0) { numericPhrase = []; }
    if (consumed === void 0) { consumed = 0; }
    if (isNegative === void 0) { isNegative = false; }
    if (words.length === 0) {
        return createParsedNumber(curNumber, isNegative, consumed);
    }
    var word = numericSynonymMap[words[0]] === undefined ? words[0] : numericSynonymMap[words[0]];
    if (word === 'zero' && (consumed === 0 || curNumber === 0)) {
        return exports.wordsToNumberRecurse(words.slice(1), 0, numericPhrase, consumed + 1, isNegative);
    }
    if (numericStopwords[word] !== undefined) {
        return exports.wordsToNumberRecurse(words.slice(1), curNumber, numericPhrase, consumed + 1, isNegative);
    }
    if (negativeSynonyms[word] !== undefined && consumed === 0) {
        return exports.wordsToNumberRecurse(words.slice(1), curNumber, numericPhrase, consumed + 1, true);
    }
    if (dotSynonyms[word] !== undefined && consumed + 1 < words.length) {
        return exports.wordsToNumberRecurse(words.slice(1), curNumber, numericPhrase.concat(['point']), consumed + 1, isNegative);
    }
    var newNumericPhrase = numericPhrase.concat([word]);
    var newNumber = Number(words_to_numbers_1.wordsToNumbers(newNumericPhrase.join(' ')));
    if (!util_1.isNumber(newNumber) || !isFinite(newNumber) || newNumber < curNumber) {
        return createParsedNumber(curNumber, isNegative, consumed);
    }
    return exports.wordsToNumberRecurse(words.slice(1), newNumber, newNumericPhrase, consumed + 1, isNegative);
};
exports.wordsToParsedNumber = function (words) { return exports.wordsToNumberRecurse(words); };
exports.wordsToParsedNumberImperative = function (words) { return exports.wordsToNumberWithMutationAndBeer(words); };

},{"tslib":94,"util":96,"words-to-numbers":103}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var VarType;
(function (VarType) {
    VarType[VarType["Undefined"] = 0] = "Undefined";
    VarType[VarType["Numeric"] = 1] = "Numeric";
    VarType[VarType["Text"] = 2] = "Text";
})(VarType = exports.VarType || (exports.VarType = {}));

},{}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function trim(filtered, convert) {
    var possible = filtered.filter(function (interpretation) {
        return convert(interpretation).penalty !== Infinity;
    });
    if (possible.length > 1) {
        var trimmed = possible;
        trimmed.sort(function (a, b) {
            var ap = convert(a);
            var bp = convert(b);
            return ap.penalty === bp.penalty ?
                (ap.words.length === bp.words.length ? 0 : ap.words.length > bp.words.length ? -1 : 1) :
                (ap.penalty > bp.penalty ? 1 : -1);
        });
        trimmed.slice(0, convert(possible[0]).maxResults);
        return trimmed;
    }
    return possible;
}
exports.trim = trim;
function trimf(filtered) {
    return trim(filtered, function (f) { return f; });
}
exports.trimf = trimf;
function trimd(filtered, maxFuzzyDirectiveResults) {
    return trim(filtered, function (d) { return d.filterInterpretation; })
        .slice(0, maxFuzzyDirectiveResults);
}
exports.trimd = trimd;

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopwords = ["'ll", "'tis", "'twas", "'ve", "a's", "able", "ableabout", "about", "above", "abroad", "abst", "accordance", "according", "accordingly", "across", "act", "actually", "ad", "added", "adj", "adopted", "ae", "af", "affected", "affecting", "affects", "after", "afterwards", "ag", "again", "against", "ago", "ah", "ahead", "ai", "ain't", "aint", "al", "allows", "almost", "alone", "along", "alongside", "already", "also", "although", "always", "am", "amid", "amidst", "among", "amongst", "amoungst", "an", "and", "another", "any", "anybody", "anyhow", "anymore", "anyone", "anything", "anyway", "anyways", "anywhere", "ao", "apart", "apparently", "appear", "appreciate", "appropriate", "approximately", "aq", "ar", "are", "aren", "aren't", "arent", "arise", "around", "arpa", "as", "aside", "asked", "asking", "asks", "associated", "at", "au", "auth", "available", "aw", "away", "awfully", "az", "ba", "back", "backed", "backing", "backs", "backward", "backwards", "bb", "bd", "be", "became", "because", "become", "becomes", "becoming", "been", "beforehand", "began", "beginnings", "begins", "behind", "being", "beings", "believe", "below", "beside", "besides", "best", "better", "between", "beyond", "bf", "bg", "bh", "bi", "bill", "biol", "bj", "bm", "bn", "bo", "br", "brief", "briefly", "bs", "bt", "but", "bv", "bw", "by", "bz", "c'mon", "c's", "ca", "came", "can", "can't", "cannot", "cant", "cc", "cd", "certain", "certainly", "cf", "cg", "ch", "ci", "ck", "cl", "clearly", "click", "cm", "cmon", "cn", "co", "co.", "com", "come", "comes", "con", "concerning", "consequently", "consider", "considering", "contain", "containing", "contains", "corresponding", "could", "could've", "couldn", "couldn't", "couldnt", "course", "cr", "cs", "cu", "currently", "cv", "cx", "cy", "cz", "dare", "daren't", "darent", "date", "de", "dear", "definitely", "described", "despite", "detail", "did", "didn", "didn't", "didnt", "differ", "different", "differently", "directly", "dj", "dk", "dm", "do", "does", "doesn", "doesn't", "doesnt", "doing", "don", "don't", "dont", "doubtful", "downed", "downing", "downs", "downwards", "due", "during", "dz", "each", "early", "ec", "ed", "edu", "ee", "effect", "eg", "eh", "either", "else", "elsewhere", "enough", "entirely", "er", "es", "especially", "et", "et-al", "etc", "even", "evenly", "ever", "evermore", "every", "everybody", "everyone", "everything", "everywhere", "ex", "exactly", "except", "fairly", "far", "farther", "felt", "few", "fewer", "ff", "fi", "fify", "fix", "fj", "fk", "fm", "fo", "followed", "following", "follows", "forever", "formerly", "forth", "forward", "found", "fr", "free", "from", "front", "full", "fully", "further", "furthered", "furthering", "furthermore", "furthers", "ga", "gave", "gb", "gd", "ge", "general", "generally", "get", "gets", "getting", "gf", "gg", "gh", "gi", "give", "given", "gives", "giving", "gl", "gm", "gmt", "gn", "go", "goes", "going", "gone", "good", "goods", "got", "gotten", "gov", "gp", "gq", "gr", "great", "greater", "greatest", "greetings", "group", "grouped", "grouping", "groups", "gs", "gt", "gu", "gw", "gy", "had", "hadn't", "hadnt", "half", "happens", "hardly", "has", "hasn", "hasn't", "hasnt", "have", "haven", "haven't", "havent", "having", "he", "he'd", "he'll", "he's", "hed", "hell", "hello", "help", "hence", "her", "here", "here's", "hereafter", "hereby", "herein", "heres", "hereupon", "hers", "herself", "herse”", "hes", "hi", "hid", "high", "higher", "highest", "him", "himself", "himse”", "his", "hither", "hk", "hm", "hn", "home", "hopefully", "how", "how'd", "how'll", "how's", "howbeit", "however", "hr", "ht", "hu", "i'd", "i'll", "i'm", "i've", "i.e.", "id", "ie", "if", "ignored", "ii", "il", "ill", "im", "immediate", "immediately", "importance", "important", "in", "inasmuch", "inc", "inc.", "indeed", "index", "indicate", "indicated", "indicates", "inner", "inside", "insofar", "instead", "int", "interest", "interested", "interesting", "interests", "into", "inward", "io", "iq", "ir", "is", "isn", "isn't", "isnt", "it", "it'd", "it'll", "it's", "itd", "itll", "its", "itself", "itse”", "ive", "je", "jm", "jo", "join", "jp", "just", "ke", "keep", "keeps", "kept", "keys", "kg", "kh", "ki", "kind", "km", "kn", "knew", "know", "known", "knows", "kp", "kr", "kw", "ky", "kz", "la", "large", "largely", "last", "lately", "later", "latest", "latter", "latterly", "lb", "lc", "lest", "let", "let's", "lets", "li", "like", "liked", "likely", "likewise", "line", "little", "lk", "ll", "long", "longer", "longest", "look", "looking", "looks", "low", "lower", "lr", "ls", "lt", "ltd", "lu", "lv", "ly", "ma", "made", "mainly", "make", "makes", "making", "many", "may", "maybe", "mayn't", "maynt", "mc", "md", "me", "mean", "means", "meantime", "meanwhile", "merely", "mg", "mh", "might", "might've", "mightn't", "mightnt", "mine", "mk", "ml", "mm", "mn", "mo", "more", "moreover", "move", "mp", "mq", "mr", "mrs", "ms", "msie", "mt", "mu", "much", "mug", "must", "must've", "mustn't", "mustnt", "mv", "mw", "mx", "my", "myself", "myse”", "mz", "na", "namely", "nay", "nc", "nd", "ne", "near", "nearly", "necessarily", "necessary", "need", "needed", "needing", "needn't", "neednt", "needs", "neither", "never", "neverf", "neverless", "nevertheless", "nf", "ng", "ni", "nl", "nobody", "non", "none", "nonetheless", "noone", "nor", "normally", "nos", "not", "noted", "nothing", "notwithstanding", "novel", "now", "nowhere", "np", "nr", "nu", "nz", "obtain", "obtained", "obviously", "of", "off", "often", "oh", "old", "older", "oldest", "om", "omitted", "on", "only", "onto", "or", "ord", "order", "ordered", "ordering", "orders", "org", "other", "others", "otherwise", "ought", "oughtn't", "oughtnt", "our", "ours", "ourselves", "out", "outside", "over", "overall", "owing", "own", "pa", "part", "parted", "particular", "particularly", "parting", "parts", "pe", "per", "perhaps", "pf", "pg", "ph", "pk", "pl", "please", "pmid", "pn", "poorly", "possible", "possibly", "potentially", "pp", "pr", "predominantly", "present", "presented", "presenting", "presents", "presumably", "previously", "primarily", "probably", "promptly", "proud", "provided", "provides", "pt", "put", "puts", "pw", "py", "qa", "que", "quickly", "quite", "qv", "ran", "rather", "rd", "re", "readily", "really", "reasonably", "ref", "refs", "regarding", "regardless", "regards", "related", "relatively", "reserved", "respectively", "resulted", "resulting", "right", "ring", "ro", "round", "ru", "run", "rw", "sa", "same", "saw", "sb", "sc", "sd", "se", "section", "seem", "seemed", "seeming", "seems", "self", "selves", "sensible", "sent", "serious", "seriously", "sg", "sh", "shall", "shan't", "shant", "she", "she'd", "she'll", "she's", "shed", "shell", "shes", "should", "should've", "shouldn", "shouldn't", "shouldnt", "showed", "showing", "shown", "showns", "shows", "si", "significant", "significantly", "similar", "similarly", "since", "sincere", "site", "sj", "sk", "sl", "slightly", "sm", "sn", "so", "some", "somebody", "someday", "somehow", "someone", "somethan", "something", "sometime", "sometimes", "somewhat", "somewhere", "soon", "sorry", "specifically", "specified", "specify", "specifying", "sr", "st", "still", "strongly", "su", "sub", "substantially", "successfully", "such", "sufficiently", "suggest", "sup", "sure", "sv", "sy", "system", "sz", "t's", "take", "taken", "taking", "tc", "td", "tell", "tends", "tf", "tg", "th", "than", "thank", "thanks", "thanx", "that", "that'll", "that's", "that've", "thatll", "thats", "thatve", "the", "their", "theirs", "them", "themselves", "then", "thence", "there", "there'd", "there'll", "there're", "there's", "there've", "thereafter", "thereby", "thered", "therefore", "therein", "therell", "thereof", "therere", "theres", "thereto", "thereupon", "thereve", "these", "they", "they'd", "they'll", "they're", "they've", "theyd", "theyll", "theyre", "theyve", "thing", "things", "think", "thinks", "this", "thorough", "thoroughly", "those", "thou", "though", "thoughh", "throug", "through", "throughout", "thru", "thus", "til", "till", "tip", "tis", "tj", "tk", "tm", "tn", "to", "together", "too", "toward", "towards", "tp", "tr", "tried", "tries", "truly", "try", "trying", "ts", "tt", "turn", "turned", "turning", "turns", "tv", "tw", "twas", "tz", "ua", "ug", "uk", "um", "un", "under", "underneath", "undoing", "unfortunately", "unless", "unlike", "unlikely", "until", "unto", "up", "upon", "ups", "upwards", "us", "use", "used", "useful", "usefully", "usefulness", "uses", "using", "usually", "uucp", "uy", "uz", "va", "various", "vc", "ve", "versus", "very", "vg", "vi", "via", "viz", "vn", "vol", "vols", "vs", "vu", "want", "wanted", "wanting", "wants", "was", "wasn", "wasn't", "wasnt", "way", "ways", "we", "we'd", "we'll", "we're", "we've", "well", "wells", "went", "were", "weren", "weren't", "werent", "weve", "wf", "what", "what'd", "what'll", "what's", "what've", "whatever", "whatll", "whats", "whatve", "when", "when'd", "when'll", "when's", "whence", "whenever", "where", "where'd", "where'll", "where's", "whereafter", "whereas", "whereby", "wherein", "wheres", "whereupon", "wherever", "whether", "which", "whichever", "while", "whilst", "whim", "whither", "who", "who'd", "who'll", "who's", "whod", "whoever", "whole", "wholl", "whom", "whomever", "whos", "whose", "why", "why'd", "why'll", "why's", "widely", "width", "will", "willing", "wish", "with", "within", "without", "won", "won't", "wonder", "wont", "would", "would've", "wouldn", "wouldn't", "wouldnt", "ws", "ye", "yet", "you", "you'd", "you'll", "you're", "you've", "youd", "youll", "your", "youre", "yours", "yourself", "yourselves", "youve", "yt", "yu", "za", "zm", "zr"];

},{}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var publicInterfaces_1 = require("./publicInterfaces");
var text_1 = require("./text");
var numeric_1 = require("./numeric");
var util_1 = require("util");
var sort_1 = require("./sort");
var lodash_1 = require("lodash");
var passThruFilter = function (filteredInput) { return filteredInput; };
var phraseFilter = function (wordCount, preFilter) {
    return function (filteredInput) {
        return preFilter(filteredInput).map(function (fInput) { return (tslib_1.__assign({}, fInput, { words: fInput.words.splice(wordCount), consumed: fInput.consumed + wordCount })); });
    };
};
var stopPhraseFilter = function (stopPhrases, includeStopword, preFilter) {
    return function (filteredInput) {
        var possibleInterpretations = [];
        preFilter(filteredInput).forEach(function (interpretation) {
            var stopSeen = false;
            var fuzzyStopMatches = [];
            for (var w = 1; w < interpretation.words.length && !stopSeen; w++) {
                for (var s = 0; s < stopPhrases.length && !stopSeen; s++) {
                    var stopPhrase = stopPhrases[s];
                    var stopPhraseWords = stopPhrase.split(' ');
                    var stopMatch = text_1.matchWordsToPhrase(interpretation.words.slice(w), stopPhrase);
                    var includedStopwords = includeStopword ? stopPhraseWords : [];
                    var selectedWords = interpretation.words.slice(0, w);
                    var distance = text_1.phoneticPhraseDistance(stopMatch.join(' '), stopPhrase);
                    var newInterpretation = tslib_1.__assign({}, interpretation, { words: selectedWords.concat(includedStopwords), consumed: interpretation.consumed + selectedWords.length + stopMatch.length, penalty: interpretation.penalty + distance });
                    if (distance === 0) {
                        possibleInterpretations.push(newInterpretation);
                        stopSeen = true;
                        break;
                    }
                    fuzzyStopMatches.push(newInterpretation);
                }
            }
            if (!stopSeen) {
                possibleInterpretations.push.apply(possibleInterpretations, fuzzyStopMatches);
            }
        });
        return sort_1.trimf(possibleInterpretations);
    };
};
var remainingPhraseFilter = function (preFilter) {
    return function (filtered) {
        return preFilter(filtered).map(function (interpretation) { return (tslib_1.__assign({}, interpretation, { consumed: interpretation.words.length + interpretation.consumed })); });
    };
};
var filterInterpretationToKey = function (interpretation) {
    return interpretation.varType + "," + interpretation.consumed + "," + interpretation.words.join(' ');
};
var filterInterpretationsToMap = function (interpretations) {
    var interpretationMap = {};
    interpretations.forEach(function (interpretation) {
        var key = filterInterpretationToKey(interpretation);
        var curKeyPenalty = interpretationMap[key] === undefined ? Infinity : interpretationMap[key].penalty;
        if (interpretation.penalty < curKeyPenalty) {
            interpretationMap[key] = interpretation;
        }
    });
    return interpretationMap;
};
var mergeInterpretationMaps = function (map1, map2) {
    var merged = {};
    var allKeys = Object.keys(map1).concat(Object.keys(map2));
    for (var _i = 0, allKeys_1 = allKeys; _i < allKeys_1.length; _i++) {
        var key = allKeys_1[_i];
        if (map1[key] !== undefined && map2[key] !== undefined) {
            merged[key] = tslib_1.__assign({}, map1[key], { penalty: Math.min(map1[key].penalty, map2[key].penalty) });
        }
        else {
            merged[key] = map1[key] === undefined ? map2[key] : map1[key];
        }
    }
    return merged;
};
var intersectInterpretationMaps = function (map1, map2) {
    var intersected = {};
    for (var _i = 0, _a = Object.keys(map1); _i < _a.length; _i++) {
        var key = _a[_i];
        if (map2[key] !== undefined) {
            intersected[key] = tslib_1.__assign({}, map1[key], { penalty: (map1[key].penalty + map2[key].penalty) });
        }
    }
    return intersected;
};
var orFilter = function (filters) {
    return function (filtered) {
        var mergeList = {};
        var allResults = filters.map(function (filterI) { return filterI(filtered); });
        allResults.forEach(function (result) {
            mergeList = mergeInterpretationMaps(mergeList, filterInterpretationsToMap(result));
        });
        return sort_1.trimf(Object.keys(mergeList).map(function (key) { return mergeList[key]; }));
    };
};
var andFilter = function (filters) {
    return function (filtered) {
        var candidateInterpretations = {};
        var allResults = filters.map(function (filterI) { return filterI(filtered); });
        allResults.forEach(function (result, i) {
            if (i === 0) {
                candidateInterpretations = filterInterpretationsToMap(result);
            }
            else {
                candidateInterpretations = intersectInterpretationMaps(candidateInterpretations, filterInterpretationsToMap(result));
            }
        });
        return sort_1.trimf(lodash_1.flatten(allResults));
    };
};
var anyFilter = function (phraseWhitelist, preFilter) {
    return function (filteredInput) {
        return sort_1.trimf(lodash_1.flatten(preFilter(filteredInput).map(function (interpretation) {
            return phraseWhitelist.map(function (allowed) {
                var matchedWords = text_1.matchWordsToPhrase(interpretation.words, allowed);
                var phrasePenalty = text_1.phoneticPhraseDistance(allowed, matchedWords.join(' '));
                var allowedWords = allowed.split(' ');
                return tslib_1.__assign({}, interpretation, { words: allowedWords, consumed: interpretation.consumed + matchedWords.length, penalty: phrasePenalty + interpretation.penalty });
            });
        })));
    };
};
var lazyAnyFilter = function (phraseWhitelistGenerator, preFilter) {
    return function (filteredInput) {
        return anyFilter(phraseWhitelistGenerator(), preFilter)(filteredInput);
    };
};
var blacklistWordCount = function (phraseBlacklist) {
    if (phraseBlacklist.length === 0) {
        throw new Error('Cannot pass empty list to None');
    }
    var wordCount = phraseBlacklist[0].split(' ').length;
    phraseBlacklist.map(function (p) {
        if (p.split(' ').length !== wordCount) {
            throw new Error('None\'s blacklisted phrases must all have equal word counts');
        }
    });
    return wordCount;
};
var noneFilter = function (phraseBlacklist, preFilter) {
    var wordCount = blacklistWordCount(phraseBlacklist);
    return function (filteredInput) {
        return sort_1.trimf(preFilter(filteredInput).map(function (interpretation) {
            for (var _i = 0, phraseBlacklist_1 = phraseBlacklist; _i < phraseBlacklist_1.length; _i++) {
                var disallowed = phraseBlacklist_1[_i];
                var matchedWords = text_1.matchWordsToPhrase(interpretation.words, disallowed);
                var distance = text_1.phoneticPhraseDistance(matchedWords.join(' '), disallowed);
                if (distance === 0) {
                    return tslib_1.__assign({}, interpretation, { words: [], penalty: Infinity });
                }
            }
            var withRemovals = interpretation.words.slice(0, wordCount);
            return tslib_1.__assign({}, interpretation, { words: withRemovals, consumed: interpretation.consumed + wordCount });
        }));
    };
};
var lazyNoneFilter = function (phraseBlacklistGenerator, preFilter) {
    return function (filteredInput) {
        return noneFilter(phraseBlacklistGenerator(), preFilter)(filteredInput);
    };
};
var precisionFilter = function (maxAllowablePenalty, preFilter) {
    return function (filteredInput) {
        return sort_1.trimf(preFilter(filteredInput).filter(function (interpretation) {
            return interpretation.penalty <= maxAllowablePenalty;
        }));
    };
};
var numericFilter = function (minNumber, maxNumber, preFilter) {
    return function (filteredInput) {
        return preFilter(filteredInput).map(function (interpretation) {
            var parsedNumber = numeric_1.wordsToParsedNumber(interpretation.words);
            if (isFinite(parsedNumber.value) &&
                parsedNumber.value >= minNumber &&
                parsedNumber.value <= maxNumber) {
                return tslib_1.__assign({}, interpretation, { words: ["" + parsedNumber.value], consumed: (interpretation.consumed + parsedNumber.consumed), varType: publicInterfaces_1.VarType.Numeric });
            }
            else {
                return tslib_1.__assign({}, interpretation, { varType: publicInterfaces_1.VarType.Numeric, penalty: Infinity, words: [] });
            }
        });
    };
};
var paramValue = function (interpretation) {
    return interpretation.varType === publicInterfaces_1.VarType.Text ?
        interpretation.words.join(' ') :
        parseFloat(interpretation.words[0]);
};
function updateParams(oldParams, name, value) {
    if (name !== undefined) {
        return tslib_1.__assign({}, oldParams, (_a = {}, _a[name] = value, _a));
    }
    return lodash_1.cloneDeep(oldParams);
    var _a;
}
function varDirective(name, filter) {
    return function (words, runParams, maxFuzzyFilterResults) {
        var nullInterpretation = {
            maxResults: maxFuzzyFilterResults,
            penalty: 0,
            words: words,
            consumed: 0,
            varType: publicInterfaces_1.VarType.Text,
        };
        var filteredInterpretations = sort_1.trimf(filter([nullInterpretation]));
        return filteredInterpretations.map(function (interpretation) {
            return {
                filterInterpretation: interpretation,
                runParams: updateParams(runParams, name, paramValue(interpretation)),
                remainingWords: words.slice(interpretation.consumed),
            };
        });
    };
}
function optionDirective(name, defaultVal, filter) {
    var varType = !util_1.isNullOrUndefined(defaultVal) ?
        (util_1.isNumber(defaultVal) ? publicInterfaces_1.VarType.Numeric : publicInterfaces_1.VarType.Text) :
        publicInterfaces_1.VarType.Undefined;
    return function (words, runParams, maxFuzzyFilterResults) { return varDirective(name, filter)(words, runParams, maxFuzzyFilterResults).concat([
        {
            filterInterpretation: {
                maxResults: maxFuzzyFilterResults,
                penalty: 0,
                varType: varType,
                words: [],
                consumed: 0,
            },
            runParams: updateParams(runParams, name, defaultVal),
            remainingWords: words,
        },
    ]); };
}
exports.Var = function (name, filter) { return varDirective(name, filter); };
exports.Option = function (name, defaultVal, filter) {
    return optionDirective(name, defaultVal, filter);
};
exports.Require = function (filter) { return varDirective(undefined, filter); };
exports.Ignore = function (filter) { return optionDirective(undefined, undefined, filter); };
exports.Phrase = function (wordCount, filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return phraseFilter(wordCount, filter);
};
exports.Word = function (filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return exports.Phrase(1, filter);
};
exports.StopPhrase = function (stopwords, includeStopword, filter) {
    if (includeStopword === void 0) { includeStopword = false; }
    if (filter === void 0) { filter = passThruFilter; }
    return stopPhraseFilter(stopwords, includeStopword, filter);
};
exports.Sentence = function (filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return remainingPhraseFilter(filter);
};
exports.Or = function (filters) { return orFilter(filters); };
exports.And = function (filters) { return andFilter(filters); };
exports.Any = function (whitelist, filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return anyFilter(whitelist, filter);
};
exports.GetAny = function (whitelistGenerator, filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return lazyAnyFilter(whitelistGenerator, filter);
};
exports.None = function (blacklist, filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return noneFilter(blacklist, filter);
};
exports.GetNone = function (blacklistGenerator, filter) {
    if (filter === void 0) { filter = passThruFilter; }
    return lazyNoneFilter(blacklistGenerator, filter);
};
exports.Exact = function (preFilter) { return precisionFilter(0, preFilter); };
exports.Threshold = function (maxAllowablePenalty, preFilter) {
    return precisionFilter(maxAllowablePenalty, preFilter);
};
exports.Numeric = function (min, max, filter) {
    if (min === void 0) { min = Number.MIN_VALUE; }
    if (max === void 0) { max = Number.MAX_VALUE; }
    if (filter === void 0) { filter = passThruFilter; }
    return numericFilter(min, max, filter);
};

},{"./numeric":15,"./publicInterfaces":16,"./sort":17,"./text":20,"lodash":91,"tslib":94,"util":96}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stopwords_1 = require("./stopwords");
var util_1 = require("util");
var metaphone = require('metaphone');
var leven = require('leven');
exports.filterFirstStopwords = function (words, maxReturned) {
    if (maxReturned === void 0) { maxReturned = Infinity; }
    var matchedStopwords = [];
    var _loop_1 = function (word) {
        if (!util_1.isNullOrUndefined(stopwords_1.stopwords.find(function (stopword) { return stopword === word; }))) {
            matchedStopwords.push(word);
            if (matchedStopwords.length === maxReturned) {
                return "break";
            }
        }
        else {
            return "break";
        }
    };
    for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
        var word = words_1[_i];
        var state_1 = _loop_1(word);
        if (state_1 === "break")
            break;
    }
    return matchedStopwords;
};
exports.trimFirstStopwords = function (words) {
    return words.slice(exports.filterFirstStopwords(words).length);
};
exports.matchWordsToPhrase = function (words, phrase) {
    var wordCount = phrase.split(' ').length;
    var matched = [];
    for (var w = 0; w < wordCount && w < words.length; w++) {
        matched.push(words[w]);
    }
    return matched;
};
exports.txtToValidWords = function (txt) {
    return txt
        .toLowerCase()
        .replace(/\+/g, ' plus ')
        .replace(/\-\s*([0-9]+)/g, ' negative $1')
        .replace(/\s\&\s/g, ' and ')
        .replace('=', ' equals ')
        .replace(/[^a-z0-9\. ]/g, ' ')
        .split(' ')
        .map(function (word) { return word.trim(); })
        .filter(function (word) { return word.length > 0; });
};
var phraseToPhonetic = function (phrase) {
    return phrase.split(' ')
        .map(function (word) { return "" + metaphone(word); })
        .join(' ');
};
exports.phoneticPhraseDistance = function (phrase1, phrase2) {
    var phonetics1 = phraseToPhonetic(phrase1);
    var phonetics2 = phraseToPhonetic(phrase2);
    return leven(phonetics1, phonetics2);
};
exports.replaceWords = function (phraseToReplacementMap, words) {
    for (var _i = 0, _a = Object.keys(phraseToReplacementMap); _i < _a.length; _i++) {
        var phrase = _a[_i];
        var matchedWords = exports.matchWordsToPhrase(words, phrase);
        var distance = exports.phoneticPhraseDistance(matchedWords.join(' '), phrase);
        if (distance === 0) {
            var replacement = phraseToReplacementMap[phrase].split(' ');
            return replacement.concat(words.slice(matchedWords.length));
        }
    }
    return words;
};

},{"./stopwords":18,"leven":89,"metaphone":92,"util":96}],21:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/array/from"), __esModule: true };
},{"core-js/library/fn/array/from":27}],22:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/assign"), __esModule: true };
},{"core-js/library/fn/object/assign":28}],23:[function(require,module,exports){
module.exports = { "default": require("core-js/library/fn/object/keys"), __esModule: true };
},{"core-js/library/fn/object/keys":29}],24:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _assign = require("../core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _assign2.default || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};
},{"../core-js/object/assign":22}],25:[function(require,module,exports){
"use strict";

exports.__esModule = true;

var _from = require("../core-js/array/from");

var _from2 = _interopRequireDefault(_from);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  } else {
    return (0, _from2.default)(arr);
  }
};
},{"../core-js/array/from":21}],26:[function(require,module,exports){
/* clj-fuzzy - v0.3.3 - Author: Yomguithereal (Guillaume Plique) - Repository: https://github.com/Yomguithereal/clj-fuzzy */
if(typeof Math.imul=="undefined"||Math.imul(4294967295,5)==0){Math.imul=function(a,b){var ah=a>>>16&65535;var al=a&65535;var bh=b>>>16&65535;var bl=b&65535;return al*bl+(ah*bl+al*bh<<16>>>0)|0}}(function(){var f,ba=this;function l(a){var b=typeof a;if("object"==b){if(a){if(a instanceof Array){return"array"}if(a instanceof Object){return b}var c=Object.prototype.toString.call(a);if("[object Window]"==c){return"object"}if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice")){return"array"}if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call")){return"function"}}else{return"null"}}else{if("function"==b&&"undefined"==typeof a.call){return"object"}}return b}var ca="closure_uid_"+(1e9*Math.random()>>>0),da=0;function ea(a,b){var c=a.split("."),d=ba;c[0]in d||!d.execScript||d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());){c.length||void 0===b?d=d[e]?d[e]:d[e]={}:d[e]=b}}var fa=String.prototype.trim?function(a){return a.trim()}:function(a){return a.replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")};function ga(a){return Array.prototype.join.call(arguments,"")}function ha(a,b){for(var c in a){b.call(void 0,a[c],c,a)}}function ia(a,b){null!=a&&this.append.apply(this,arguments)}f=ia.prototype;f.Ha="";f.set=function(a){this.Ha=""+a};f.append=function(a,b,c){this.Ha+=a;if(null!=b){for(var d=1;d<arguments.length;d++){this.Ha+=arguments[d]}}return this};f.clear=function(){this.Ha=""};f.toString=function(){return this.Ha};if("undefined"===typeof ja){var ja=function(){throw Error("No *print-fn* fn set for evaluation environment")}}var ka=null;if("undefined"===typeof la){var la=null}function ma(){return new pa(null,5,[qa,!0,ra,!0,ua,!1,va,!1,wa,null],null)}function n(a){return null!=a&&!1!==a}function xa(a){return null==a}function Ba(a){return a instanceof Array}function Ca(a){return n(a)?!1:!0}function r(a,b){return a[l(null==b?null:b)]?!0:a._?!0:!1}function t(a,b){var c=null==b?null:b.constructor,c=n(n(c)?c.Jb:c)?c.Ib:l(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}function Da(a){var b=a.Ib;return n(b)?b:""+u(a)}var Ga="undefined"!==typeof Symbol&&"function"===l(Symbol)?Symbol.iterator:"@@iterator";function Ha(a){for(var b=a.length,c=Array(b),d=0;;){if(d<b){c[d]=a[d],d+=1}else{break}}return c}function Ia(a){function b(a,b){a.push(b);return a}var c=[];return Ka?Ka(b,c,a):La.call(null,b,c,a)}var Ma={},Na={},Oa=function Oa(b){if(b?b.L:b){return b.L(b)}var c;c=Oa[l(null==b?null:b)];if(!c&&(c=Oa._,!c)){throw t("ICounted.-count",b)}return c.call(null,b)},Qa=function Qa(b){if(b?b.M:b){return b.M(b)}var c;c=Qa[l(null==b?null:b)];if(!c&&(c=Qa._,!c)){throw t("IEmptyableCollection.-empty",b)}return c.call(null,b)},Ra={},Sa=function Sa(b,c){if(b?b.J:b){return b.J(b,c)}var d;d=Sa[l(null==b?null:b)];if(!d&&(d=Sa._,!d)){throw t("ICollection.-conj",b)}return d.call(null,b,c)},Va={},v=function v(){switch(arguments.length){case 2:return v.a(arguments[0],arguments[1]);case 3:return v.i(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};v.a=function(a,b){if(a?a.N:a){return a.N(a,b)}var c;c=v[l(null==a?null:a)];if(!c&&(c=v._,!c)){throw t("IIndexed.-nth",a)}return c.call(null,a,b)};v.i=function(a,b,c){if(a?a.da:a){return a.da(a,b,c)}var d;d=v[l(null==a?null:a)];if(!d&&(d=v._,!d)){throw t("IIndexed.-nth",a)}return d.call(null,a,b,c)};v.v=3;var Wa={},Xa=function Xa(b){if(b?b.R:b){return b.R(b)}var c;c=Xa[l(null==b?null:b)];if(!c&&(c=Xa._,!c)){throw t("ISeq.-first",b)}return c.call(null,b)},Za=function Za(b){if(b?b.Y:b){return b.Y(b)}var c;c=Za[l(null==b?null:b)];if(!c&&(c=Za._,!c)){throw t("ISeq.-rest",b)}return c.call(null,b)},$a={},ab={},bb=function bb(){switch(arguments.length){case 2:return bb.a(arguments[0],arguments[1]);case 3:return bb.i(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};bb.a=function(a,b){if(a?a.G:a){return a.G(a,b)}var c;c=bb[l(null==a?null:a)];if(!c&&(c=bb._,!c)){throw t("ILookup.-lookup",a)}return c.call(null,a,b)};bb.i=function(a,b,c){if(a?a.F:a){return a.F(a,b,c)}var d;d=bb[l(null==a?null:a)];if(!d&&(d=bb._,!d)){throw t("ILookup.-lookup",a)}return d.call(null,a,b,c)};bb.v=3;var cb=function cb(b,c){if(b?b.eb:b){return b.eb(b,c)}var d;d=cb[l(null==b?null:b)];if(!d&&(d=cb._,!d)){throw t("IAssociative.-contains-key?",b)}return d.call(null,b,c)},db=function db(b,c,d){if(b?b.Qa:b){return b.Qa(b,c,d)}var e;e=db[l(null==b?null:b)];if(!e&&(e=db._,!e)){throw t("IAssociative.-assoc",b)}return e.call(null,b,c,d)},eb={},fb=function fb(b,c){if(b?b.ib:b){return b.ib(b,c)}var d;d=fb[l(null==b?null:b)];if(!d&&(d=fb._,!d)){throw t("IMap.-dissoc",b)}return d.call(null,b,c)},hb={},ib=function ib(b){if(b?b.jb:b){return b.jb()}var c;c=ib[l(null==b?null:b)];if(!c&&(c=ib._,!c)){throw t("IMapEntry.-key",b)}return c.call(null,b)},jb=function jb(b){if(b?b.kb:b){return b.kb()}var c;c=jb[l(null==b?null:b)];if(!c&&(c=jb._,!c)){throw t("IMapEntry.-val",b)}return c.call(null,b)},kb={},lb=function lb(b,c){if(b?b.pb:b){return b.pb(0,c)}var d;d=lb[l(null==b?null:b)];if(!d&&(d=lb._,!d)){throw t("ISet.-disjoin",b)}return d.call(null,b,c)},mb=function mb(b){if(b?b.Sa:b){return b.Sa(b)}var c;c=mb[l(null==b?null:b)];if(!c&&(c=mb._,!c)){throw t("IStack.-peek",b)}return c.call(null,b)},nb={},ob=function ob(b,c,d){if(b?b.lb:b){return b.lb(b,c,d)}var e;e=ob[l(null==b?null:b)];if(!e&&(e=ob._,!e)){throw t("IVector.-assoc-n",b)}return e.call(null,b,c,d)},pb={},qb=function qb(b){if(b?b.O:b){return b.O(b)}var c;c=qb[l(null==b?null:b)];if(!c&&(c=qb._,!c)){throw t("IMeta.-meta",b)}return c.call(null,b)},rb={},sb=function sb(b,c){if(b?b.S:b){return b.S(b,c)}var d;d=sb[l(null==b?null:b)];if(!d&&(d=sb._,!d)){throw t("IWithMeta.-with-meta",b)}return d.call(null,b,c)},tb={},ub=function ub(){switch(arguments.length){case 2:return ub.a(arguments[0],arguments[1]);case 3:return ub.i(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};ub.a=function(a,b){if(a?a.T:a){return a.T(a,b)}var c;c=ub[l(null==a?null:a)];if(!c&&(c=ub._,!c)){throw t("IReduce.-reduce",a)}return c.call(null,a,b)};ub.i=function(a,b,c){if(a?a.U:a){return a.U(a,b,c)}var d;d=ub[l(null==a?null:a)];if(!d&&(d=ub._,!d)){throw t("IReduce.-reduce",a)}return d.call(null,a,b,c)};ub.v=3;var vb=function vb(b,c){if(b?b.s:b){return b.s(b,c)}var d;d=vb[l(null==b?null:b)];if(!d&&(d=vb._,!d)){throw t("IEquiv.-equiv",b)}return d.call(null,b,c)},wb=function wb(b){if(b?b.I:b){return b.I(b)}var c;c=wb[l(null==b?null:b)];if(!c&&(c=wb._,!c)){throw t("IHash.-hash",b)}return c.call(null,b)},xb={},zb=function zb(b){if(b?b.K:b){return b.K(b)}var c;c=zb[l(null==b?null:b)];if(!c&&(c=zb._,!c)){throw t("ISeqable.-seq",b)}return c.call(null,b)},Ab={},Bb={},Cb=function Cb(b){if(b?b.Za:b){return b.Za(b)}var c;c=Cb[l(null==b?null:b)];if(!c&&(c=Cb._,!c)){throw t("IReversible.-rseq",b)}return c.call(null,b)},Db=function Db(b,c){if(b?b.rb:b){return b.rb(0,c)}var d;d=Db[l(null==b?null:b)];if(!d&&(d=Db._,!d)){throw t("IWriter.-write",b)}return d.call(null,b,c)},Gb={},Hb=function Hb(b,c,d){if(b?b.H:b){return b.H(b,c,d)}var e;e=Hb[l(null==b?null:b)];if(!e&&(e=Hb._,!e)){throw t("IPrintWithWriter.-pr-writer",b)}return e.call(null,b,c,d)},Ib=function Ib(b){if(b?b.La:b){return b.La(b)}var c;c=Ib[l(null==b?null:b)];if(!c&&(c=Ib._,!c)){throw t("IEditableCollection.-as-transient",b)}return c.call(null,b)},Jb=function Jb(b,c){if(b?b.Ia:b){return b.Ia(b,c)}var d;d=Jb[l(null==b?null:b)];if(!d&&(d=Jb._,!d)){throw t("ITransientCollection.-conj!",b)}return d.call(null,b,c)},Kb=function Kb(b){if(b?b.Ma:b){return b.Ma(b)}var c;c=Kb[l(null==b?null:b)];if(!c&&(c=Kb._,!c)){throw t("ITransientCollection.-persistent!",b)}return c.call(null,b)},Lb=function Lb(b,c,d){if(b?b.Ta:b){return b.Ta(b,c,d)}var e;e=Lb[l(null==b?null:b)];if(!e&&(e=Lb._,!e)){throw t("ITransientAssociative.-assoc!",b)}return e.call(null,b,c,d)},Mb=function Mb(b,c,d){if(b?b.qb:b){return b.qb(0,c,d)}var e;e=Mb[l(null==b?null:b)];if(!e&&(e=Mb._,!e)){throw t("ITransientVector.-assoc-n!",b)}return e.call(null,b,c,d)},Nb=function Nb(b){if(b?b.ob:b){return b.ob()}var c;c=Nb[l(null==b?null:b)];if(!c&&(c=Nb._,!c)){throw t("IChunk.-drop-first",b)}return c.call(null,b)},Ob=function Ob(b){if(b?b.gb:b){return b.gb(b)}var c;c=Ob[l(null==b?null:b)];if(!c&&(c=Ob._,!c)){throw t("IChunkedSeq.-chunked-first",b)}return c.call(null,b)},Qb=function Qb(b){if(b?b.hb:b){return b.hb(b)}var c;c=Qb[l(null==b?null:b)];if(!c&&(c=Qb._,!c)){throw t("IChunkedSeq.-chunked-rest",b)}return c.call(null,b)},Rb=function Rb(b){if(b?b.fb:b){return b.fb(b)}var c;c=Rb[l(null==b?null:b)];if(!c&&(c=Rb._,!c)){throw t("IChunkedNext.-chunked-next",b)}return c.call(null,b)},Sb=function Sb(b){if(b?b.Ra:b){return b.Ra(b)}var c;c=Sb[l(null==b?null:b)];if(!c&&(c=Sb._,!c)){throw t("IIterable.-iterator",b)}return c.call(null,b)};function Tb(a){this.Kb=a;this.h=1073741824;this.w=0}Tb.prototype.rb=function(a,b){return this.Kb.append(b)};function Ub(a){var b=new ia;a.H(null,new Tb(b),ma());return""+u(b)}var Vb="undefined"!==typeof Math.imul&&0!==Math.imul(4294967295,5)?function(a,b){return Math.imul(a,b)}:function(a,b){var c=a&65535,d=b&65535;return c*d+((a>>>16&65535)*d+c*(b>>>16&65535)<<16>>>0)|0};function Wb(a){a=Vb(a|0,-862048943);return Vb(a<<15|a>>>-15,461845907)}function Xb(a,b){var c=(a|0)^(b|0);return Vb(c<<13|c>>>-13,5)+-430675100|0}function Yb(a,b){var c=(a|0)^b,c=Vb(c^c>>>16,-2048144789),c=Vb(c^c>>>13,-1028477387);return c^c>>>16}function Zb(a){var b;a:{b=1;for(var c=0;;){if(b<a.length){var d=b+2,c=Xb(c,Wb(a.charCodeAt(b-1)|a.charCodeAt(b)<<16));b=d}else{b=c;break a}}}b=1===(a.length&1)?b^Wb(a.charCodeAt(a.length-1)):b;return Yb(b,Vb(2,a.length))}var $b={},ac=0;function bc(a){255<ac&&($b={},ac=0);var b=$b[a];if("number"!==typeof b){a:{if(null!=a){if(b=a.length,0<b){for(var c=0,d=0;;){if(c<b){var e=c+1,d=Vb(31,d)+a.charCodeAt(c),c=e}else{b=d;break a}}}else{b=0}}else{b=0}}$b[a]=b;ac+=1}return a=b}function cc(a){a&&(a.h&4194304||a.Ob)?a=a.I(null):"number"===typeof a?a=Math.floor(a)%2147483647:!0===a?a=1:!1===a?a=0:"string"===typeof a?(a=bc(a),0!==a&&(a=Wb(a),a=Xb(0,a),a=Yb(a,4))):a=a instanceof Date?a.valueOf():null==a?0:wb(a);return a}function dc(a,b){return a^b+2654435769+(a<<6)+(a>>2)}function w(a){if(null==a){return null}if(a&&(a.h&8388608||a.Qb)){return a.K(null)}if(Ba(a)||"string"===typeof a){return 0===a.length?null:new x(a,0)}if(r(xb,a)){return zb(a)}throw Error([u(a),u(" is not ISeqable")].join(""))}function y(a){if(null==a){return null}if(a&&(a.h&64||a.$a)){return a.R(null)}a=w(a);return null==a?null:Xa(a)}function ec(a){return null!=a?a&&(a.h&64||a.$a)?a.Y(null):(a=w(a))?Za(a):C:C}function D(a){return null==a?null:a&&(a.h&128||a.Ya)?a.W(null):w(ec(a))}var E=function E(){switch(arguments.length){case 1:return E.b(arguments[0]);case 2:return E.a(arguments[0],arguments[1]);default:return E.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};E.b=function(){return!0};E.a=function(a,b){return null==a?null==b:a===b||vb(a,b)};E.m=function(a,b,c){for(;;){if(E.a(a,b)){if(D(c)){a=b,b=y(c),c=D(c)}else{return E.a(b,y(c))}}else{return!1}}};E.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return E.m(b,a,c)};E.v=2;function fc(a){this.u=a}fc.prototype.next=function(){if(null!=this.u){var a=y(this.u);this.u=D(this.u);return{value:a,done:!1}}return{value:null,done:!0}};function gc(a){return new fc(w(a))}function hc(a,b){var c=Wb(a),c=Xb(0,c);return Yb(c,b)}function ic(a){var b=0,c=1;for(a=w(a);;){if(null!=a){b+=1,c=Vb(31,c)+cc(y(a))|0,a=D(a)}else{return hc(c,b)}}}var jc=hc(1,0);function kc(a){var b=0,c=0;for(a=w(a);;){if(null!=a){b+=1,c=c+cc(y(a))|0,a=D(a)}else{return hc(c,b)}}}var lc=hc(0,0);Na["null"]=!0;Oa["null"]=function(){return 0};Date.prototype.s=function(a,b){return b instanceof Date&&this.valueOf()===b.valueOf()};vb.number=function(a,b){return a===b};Ma["function"]=!0;pb["function"]=!0;qb["function"]=function(){return null};wb._=function(a){return a[ca]||(a[ca]=++da)};function mc(a,b){var c=Oa(a);if(0===c){return b.C?b.C():b.call(null)}for(var d=v.a(a,0),e=1;;){if(e<c){var g=v.a(a,e),d=b.a?b.a(d,g):b.call(null,d,g),e=e+1}else{return d}}}function nc(a,b,c){var d=Oa(a),e=c;for(c=0;;){if(c<d){var g=v.a(a,c),e=b.a?b.a(e,g):b.call(null,e,g);c+=1}else{return e}}}function oc(a,b){var c=a.length;if(0===a.length){return b.C?b.C():b.call(null)}for(var d=a[0],e=1;;){if(e<c){var g=a[e],d=b.a?b.a(d,g):b.call(null,d,g),e=e+1}else{return d}}}function pc(a,b,c){var d=a.length,e=c;for(c=0;;){if(c<d){var g=a[c],e=b.a?b.a(e,g):b.call(null,e,g);c+=1}else{return e}}}function qc(a,b,c,d){for(var e=a.length;;){if(d<e){var g=a[d];c=b.a?b.a(c,g):b.call(null,c,g);d+=1}else{return c}}}function rc(a){return a?a.h&2||a.vb?!0:a.h?!1:r(Na,a):r(Na,a)}function sc(a,b){this.c=a;this.j=b}sc.prototype.ab=function(){return this.j<this.c.length};sc.prototype.next=function(){var a=this.c[this.j];this.j+=1;return a};function x(a,b){this.c=a;this.j=b;this.h=166199550;this.w=8192}f=x.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.N=function(a,b){var c=b+this.j;return c<this.c.length?this.c[c]:null};f.da=function(a,b,c){a=b+this.j;return a<this.c.length?this.c[a]:c};f.Ra=function(){return new sc(this.c,this.j)};f.W=function(){return this.j+1<this.c.length?new x(this.c,this.j+1):null};f.L=function(){var a=this.c.length-this.j;return 0>a?0:a};f.Za=function(){var a=Oa(this);return 0<a?new uc(this,a-1,null):null};f.I=function(){return ic(this)};f.s=function(a,b){return vc.a?vc.a(this,b):vc.call(null,this,b)};f.M=function(){return C};f.T=function(a,b){return qc(this.c,b,this.c[this.j],this.j+1)};f.U=function(a,b,c){return qc(this.c,b,c,this.j)};f.R=function(){return this.c[this.j]};f.Y=function(){return this.j+1<this.c.length?new x(this.c,this.j+1):C};f.K=function(){return this.j<this.c.length?this:null};f.J=function(a,b){return F.a?F.a(b,this):F.call(null,b,this)};x.prototype[Ga]=function(){return gc(this)};function wc(a,b){return b<a.length?new x(a,b):null}function xc(){switch(arguments.length){case 1:return wc(arguments[0],0);case 2:return wc(arguments[0],arguments[1]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function uc(a,b,c){this.Wa=a;this.j=b;this.l=c;this.h=32374990;this.w=8192}f=uc.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.W=function(){return 0<this.j?new uc(this.Wa,this.j-1,null):null};f.L=function(){return this.j+1};f.I=function(){return ic(this)};f.s=function(a,b){return vc.a?vc.a(this,b):vc.call(null,this,b)};f.M=function(){var a=this.l;return yc.a?yc.a(C,a):yc.call(null,C,a)};f.T=function(a,b){return zc?zc(b,this):Ac.call(null,b,this)};f.U=function(a,b,c){return Bc?Bc(b,c,this):Ac.call(null,b,c,this)};f.R=function(){return v.a(this.Wa,this.j)};f.Y=function(){return 0<this.j?new uc(this.Wa,this.j-1,null):C};f.K=function(){return this};f.S=function(a,b){return new uc(this.Wa,this.j,b)};f.J=function(a,b){return F.a?F.a(b,this):F.call(null,b,this)};uc.prototype[Ga]=function(){return gc(this)};function Cc(a){return y(D(a))}function Dc(a){for(;;){var b=D(a);if(null!=b){a=b}else{return y(a)}}}vb._=function(a,b){return a===b};var Ec=function Ec(){switch(arguments.length){case 0:return Ec.C();case 1:return Ec.b(arguments[0]);case 2:return Ec.a(arguments[0],arguments[1]);default:return Ec.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};Ec.C=function(){return Fc};Ec.b=function(a){return a};Ec.a=function(a,b){return null!=a?Sa(a,b):Sa(C,b)};Ec.m=function(a,b,c){for(;;){if(n(c)){a=Ec.a(a,b),b=y(c),c=D(c)}else{return Ec.a(a,b)}}};Ec.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return Ec.m(b,a,c)};Ec.v=2;function H(a){if(null!=a){if(a&&(a.h&2||a.vb)){a=a.L(null)}else{if(Ba(a)){a=a.length}else{if("string"===typeof a){a=a.length}else{if(r(Na,a)){a=Oa(a)}else{a:{a=w(a);for(var b=0;;){if(rc(a)){a=b+Oa(a);break a}a=D(a);b+=1}}}}}}}else{a=0}return a}function Gc(a,b){for(var c=null;;){if(null==a){return c}if(0===b){return w(a)?y(a):c}var d=a;if(d?d.h&16||d.Bb||(d.h?0:r(Va,d)):r(Va,d)){return v.i(a,b,c)}if(w(a)){var d=D(a),e=b-1;a=d;b=e}else{return c}}}function L(a,b){if("number"!==typeof b){throw Error("index argument to nth must be a number.")}if(null==a){return null}if(a&&(a.h&16||a.Bb)){return a.da(null,b,null)}if(Ba(a)||"string"===typeof a){return b<a.length?a[b]:null}if(r(Va,a)){return v.a(a,b)}if(a?a.h&64||a.$a||(a.h?0:r(Wa,a)):r(Wa,a)){return Gc(a,b)}throw Error([u("nth not supported on this type "),u(Da(null==a?null:a.constructor))].join(""))}function Hc(a,b){return null==a?null:a&&(a.h&256||a.Cb)?a.G(null,b):Ba(a)?b<a.length?a[b|0]:null:"string"===typeof a?b<a.length?a[b|0]:null:r(ab,a)?bb.a(a,b):null}function Ic(a,b,c){return null!=a?a&&(a.h&256||a.Cb)?a.F(null,b,c):Ba(a)?b<a.length?a[b]:c:"string"===typeof a?b<a.length?a[b]:c:r(ab,a)?bb.i(a,b,c):c:c}var Jc=function Jc(){switch(arguments.length){case 3:return Jc.i(arguments[0],arguments[1],arguments[2]);default:return Jc.m(arguments[0],arguments[1],arguments[2],new x(Array.prototype.slice.call(arguments,3),0))}};Jc.i=function(a,b,c){return null!=a?db(a,b,c):Kc([b],[c])};Jc.m=function(a,b,c,d){for(;;){if(a=Jc.i(a,b,c),n(d)){b=y(d),c=Cc(d),d=D(D(d))}else{return a}}};Jc.A=function(a){var b=y(a),c=D(a);a=y(c);var d=D(c),c=y(d),d=D(d);return Jc.m(b,a,c,d)};Jc.v=3;function Lc(a){var b="function"==l(a);return n(b)?b:a?n(n(null)?null:a.ub)?!0:a.mb?!1:r(Ma,a):r(Ma,a)}function Mc(a,b){this.f=a;this.l=b;this.h=393217;this.w=0}f=Mc.prototype;f.O=function(){return this.l};f.S=function(a,b){return new Mc(this.f,b)};f.ub=!0;f.call=function(){function a(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V,aa,Ja){a=this.f;return Nc.Xa?Nc.Xa(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V,aa,Ja):Nc.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V,aa,Ja)}function b(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V,aa){a=this;return a.f.wa?a.f.wa(b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V,aa):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V,aa)}function c(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V){a=this;return a.f.va?a.f.va(b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J,V)}function d(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J){a=this;return a.f.ua?a.f.ua(b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,J)}function e(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O){a=this;return a.f.ta?a.f.ta(b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O)}function g(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K){a=this;return a.f.sa?a.f.sa(b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K)}function h(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I){a=this;return a.f.ra?a.f.ra(b,c,d,e,g,h,k,m,q,p,z,B,A,G,I):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I)}function k(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G){a=this;return a.f.qa?a.f.qa(b,c,d,e,g,h,k,m,q,p,z,B,A,G):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A,G)}function m(a,b,c,d,e,g,h,k,m,q,p,z,B,A){a=this;return a.f.pa?a.f.pa(b,c,d,e,g,h,k,m,q,p,z,B,A):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B,A)}function q(a,b,c,d,e,g,h,k,m,q,p,z,B){a=this;return a.f.oa?a.f.oa(b,c,d,e,g,h,k,m,q,p,z,B):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z,B)}function p(a,b,c,d,e,g,h,k,m,q,p,z){a=this;return a.f.na?a.f.na(b,c,d,e,g,h,k,m,q,p,z):a.f.call(null,b,c,d,e,g,h,k,m,q,p,z)}function z(a,b,c,d,e,g,h,k,m,q,p){a=this;return a.f.ma?a.f.ma(b,c,d,e,g,h,k,m,q,p):a.f.call(null,b,c,d,e,g,h,k,m,q,p)}function B(a,b,c,d,e,g,h,k,m,q){a=this;return a.f.Aa?a.f.Aa(b,c,d,e,g,h,k,m,q):a.f.call(null,b,c,d,e,g,h,k,m,q)}function A(a,b,c,d,e,g,h,k,m){a=this;return a.f.za?a.f.za(b,c,d,e,g,h,k,m):a.f.call(null,b,c,d,e,g,h,k,m)}function G(a,b,c,d,e,g,h,k){a=this;return a.f.ya?a.f.ya(b,c,d,e,g,h,k):a.f.call(null,b,c,d,e,g,h,k)}function I(a,b,c,d,e,g,h){a=this;return a.f.xa?a.f.xa(b,c,d,e,g,h):a.f.call(null,b,c,d,e,g,h)}function K(a,b,c,d,e,g){a=this;return a.f.ba?a.f.ba(b,c,d,e,g):a.f.call(null,b,c,d,e,g)}function O(a,b,c,d,e){a=this;return a.f.aa?a.f.aa(b,c,d,e):a.f.call(null,b,c,d,e)}function V(a,b,c,d){a=this;return a.f.i?a.f.i(b,c,d):a.f.call(null,b,c,d)}function aa(a,b,c){a=this;return a.f.a?a.f.a(b,c):a.f.call(null,b,c)}function Fa(a,b){a=this;return a.f.b?a.f.b(b):a.f.call(null,b)}function Ja(a){a=this;return a.f.C?a.f.C():a.f.call(null)}var J=null,J=function(J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb,Pb,tc,Uc,Vc,pe){switch(arguments.length){case 1:return Ja.call(this,J);case 2:return Fa.call(this,J,na);case 3:return aa.call(this,J,na,oa);case 4:return V.call(this,J,na,oa,sa);case 5:return O.call(this,J,na,oa,sa,ta);case 6:return K.call(this,J,na,oa,sa,ta,ya);case 7:return I.call(this,J,na,oa,sa,ta,ya,za);case 8:return G.call(this,J,na,oa,sa,ta,ya,za,Aa);case 9:return A.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea);case 10:return B.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya);case 11:return z.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta);case 12:return p.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb);case 13:return q.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa);case 14:return m.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua);case 15:return k.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb);case 16:return h.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb);case 17:return g.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb);case 18:return e.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb,Pb);case 19:return d.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb,Pb,tc);case 20:return c.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb,Pb,tc,Uc);case 21:return b.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb,Pb,tc,Uc,Vc);case 22:return a.call(this,J,na,oa,sa,ta,ya,za,Aa,Ea,Ya,Ta,gb,Pa,Ua,Eb,yb,Fb,Pb,tc,Uc,Vc,pe)}throw Error("Invalid arity: "+arguments.length)};J.b=Ja;J.a=Fa;J.i=aa;J.aa=V;J.ba=O;J.xa=K;J.ya=I;J.za=G;J.Aa=A;J.ma=B;J.na=z;J.oa=p;J.pa=q;J.qa=m;J.ra=k;J.sa=h;J.ta=g;J.ua=e;J.va=d;J.wa=c;J.Ab=b;J.Xa=a;return J}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.C=function(){return this.f.C?this.f.C():this.f.call(null)};f.b=function(a){return this.f.b?this.f.b(a):this.f.call(null,a)};f.a=function(a,b){return this.f.a?this.f.a(a,b):this.f.call(null,a,b)};f.i=function(a,b,c){return this.f.i?this.f.i(a,b,c):this.f.call(null,a,b,c)};f.aa=function(a,b,c,d){return this.f.aa?this.f.aa(a,b,c,d):this.f.call(null,a,b,c,d)};f.ba=function(a,b,c,d,e){return this.f.ba?this.f.ba(a,b,c,d,e):this.f.call(null,a,b,c,d,e)};f.xa=function(a,b,c,d,e,g){return this.f.xa?this.f.xa(a,b,c,d,e,g):this.f.call(null,a,b,c,d,e,g)};f.ya=function(a,b,c,d,e,g,h){return this.f.ya?this.f.ya(a,b,c,d,e,g,h):this.f.call(null,a,b,c,d,e,g,h)};f.za=function(a,b,c,d,e,g,h,k){return this.f.za?this.f.za(a,b,c,d,e,g,h,k):this.f.call(null,a,b,c,d,e,g,h,k)};f.Aa=function(a,b,c,d,e,g,h,k,m){return this.f.Aa?this.f.Aa(a,b,c,d,e,g,h,k,m):this.f.call(null,a,b,c,d,e,g,h,k,m)};f.ma=function(a,b,c,d,e,g,h,k,m,q){return this.f.ma?this.f.ma(a,b,c,d,e,g,h,k,m,q):this.f.call(null,a,b,c,d,e,g,h,k,m,q)};f.na=function(a,b,c,d,e,g,h,k,m,q,p){return this.f.na?this.f.na(a,b,c,d,e,g,h,k,m,q,p):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p)};f.oa=function(a,b,c,d,e,g,h,k,m,q,p,z){return this.f.oa?this.f.oa(a,b,c,d,e,g,h,k,m,q,p,z):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z)};f.pa=function(a,b,c,d,e,g,h,k,m,q,p,z,B){return this.f.pa?this.f.pa(a,b,c,d,e,g,h,k,m,q,p,z,B):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B)};f.qa=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A){return this.f.qa?this.f.qa(a,b,c,d,e,g,h,k,m,q,p,z,B,A):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A)};f.ra=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G){return this.f.ra?this.f.ra(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G)};f.sa=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I){return this.f.sa?this.f.sa(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I)};f.ta=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K){return this.f.ta?this.f.ta(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K)};f.ua=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O){return this.f.ua?this.f.ua(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O)};f.va=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V){return this.f.va?this.f.va(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V)};f.wa=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa){return this.f.wa?this.f.wa(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa):this.f.call(null,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa)};f.Ab=function(a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa){var Ja=this.f;return Nc.Xa?Nc.Xa(Ja,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa):Nc.call(null,Ja,a,b,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa)};function yc(a,b){return Lc(a)&&!(a?a.h&262144||a.Ub||(a.h?0:r(rb,a)):r(rb,a))?new Mc(a,b):null==a?null:sb(a,b)}function Oc(a){var b=null!=a;return(b?a?a.h&131072||a.Fb||(a.h?0:r(pb,a)):r(pb,a):b)?qb(a):null}function Pc(a){return null==a?null:mb(a)}var Qc=function Qc(){switch(arguments.length){case 1:return Qc.b(arguments[0]);case 2:return Qc.a(arguments[0],arguments[1]);default:return Qc.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};Qc.b=function(a){return a};Qc.a=function(a,b){return null==a?null:lb(a,b)};Qc.m=function(a,b,c){for(;;){if(null==a){return null}a=Qc.a(a,b);if(n(c)){b=y(c),c=D(c)}else{return a}}};Qc.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return Qc.m(b,a,c)};Qc.v=2;function Rc(a){return null==a||Ca(w(a))}function Sc(a){return null==a?!1:a?a.h&8||a.Mb?!0:a.h?!1:r(Ra,a):r(Ra,a)}function Tc(a){return null==a?!1:a?a.h&4096||a.Sb?!0:a.h?!1:r(kb,a):r(kb,a)}function Wc(a){return a?a.h&16777216||a.Rb?!0:a.h?!1:r(Ab,a):r(Ab,a)}function Xc(a){return null==a?!1:a?a.h&1024||a.Db?!0:a.h?!1:r(eb,a):r(eb,a)}function Yc(a){return a?a.h&16384||a.Tb?!0:a.h?!1:r(nb,a):r(nb,a)}function Zc(a){return a?a.w&512||a.Lb?!0:!1:!1}function $c(a){var b=[];ha(a,function(a,b){return function(a,c){return b.push(c)}}(a,b));return b}function ad(a,b,c,d,e){for(;0!==e;){c[d]=a[b],d+=1,--e,b+=1}}var bd={};function cd(a){return null==a?!1:a?a.h&64||a.$a?!0:a.h?!1:r(Wa,a):r(Wa,a)}function dd(a){return n(a)?!0:!1}function ed(a,b){return Ic(a,b,bd)===bd?!1:!0}function Ac(){switch(arguments.length){case 2:return zc(arguments[0],arguments[1]);case 3:return Bc(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function zc(a,b){var c=w(b);if(c){var d=y(c),c=D(c);return Ka?Ka(a,d,c):La.call(null,a,d,c)}return a.C?a.C():a.call(null)}function Bc(a,b,c){for(c=w(c);;){if(c){var d=y(c);b=a.a?a.a(b,d):a.call(null,b,d);c=D(c)}else{return b}}}function La(){switch(arguments.length){case 2:var a=arguments[0],b=arguments[1];return b&&(b.h&524288||b.Hb)?b.T(null,a):Ba(b)?oc(b,a):"string"===typeof b?oc(b,a):r(tb,b)?ub.a(b,a):zc(a,b);case 3:return Ka(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function Ka(a,b,c){return c&&(c.h&524288||c.Hb)?c.U(null,a,b):Ba(c)?pc(c,a,b):"string"===typeof c?pc(c,a,b):r(tb,c)?ub.i(c,a,b):Bc(a,b,c)}function fd(a){return a}function gd(a,b,c,d){a=a.b?a.b(b):a.call(null,b);c=Ka(a,c,d);return a.b?a.b(c):a.call(null,c)}function hd(a){a=(a-a%2)/2;return 0<=a?Math.floor(a):Math.ceil(a)}function id(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}function jd(a){return 0===a}var u=function u(){switch(arguments.length){case 0:return u.C();case 1:return u.b(arguments[0]);default:return u.m(arguments[0],new x(Array.prototype.slice.call(arguments,1),0))}};u.C=function(){return""};u.b=function(a){return null==a?"":ga(a)};u.m=function(a,b){for(var c=new ia(""+u(a)),d=b;;){if(n(d)){c=c.append(""+u(y(d))),d=D(d)}else{return c.toString()}}};u.A=function(a){var b=y(a);a=D(a);return u.m(b,a)};u.v=1;function kd(a,b){return a.substring(b)}function ld(a,b){return a.substring(0,b)}function vc(a,b){var c;if(Wc(b)){if(rc(a)&&rc(b)&&H(a)!==H(b)){c=!1}else{a:{c=w(a);for(var d=w(b);;){if(null==c){c=null==d;break a}if(null!=d&&E.a(y(c),y(d))){c=D(c),d=D(d)}else{c=!1;break a}}}}}else{c=null}return dd(c)}function md(a,b,c,d,e){this.l=a;this.first=b;this.Ca=c;this.count=d;this.o=e;this.h=65937646;this.w=8192}f=md.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.W=function(){return 1===this.count?null:this.Ca};f.L=function(){return this.count};f.Sa=function(){return this.first};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return sb(C,this.l)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return this.first};f.Y=function(){return 1===this.count?C:this.Ca};f.K=function(){return this};f.S=function(a,b){return new md(b,this.first,this.Ca,this.count,this.o)};f.J=function(a,b){return new md(this.l,b,this,this.count+1,null)};md.prototype[Ga]=function(){return gc(this)};function nd(a){this.l=a;this.h=65937614;this.w=8192}f=nd.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.W=function(){return null};f.L=function(){return 0};f.Sa=function(){return null};f.I=function(){return jc};f.s=function(a,b){return vc(this,b)};f.M=function(){return this};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return null};f.Y=function(){return C};f.K=function(){return null};f.S=function(a,b){return new nd(b)};f.J=function(a,b){return new md(this.l,b,null,1,null)};var C=new nd(null);nd.prototype[Ga]=function(){return gc(this)};function sd(a){return(a?a.h&134217728||a.Pb||(a.h?0:r(Bb,a)):r(Bb,a))?Cb(a):Ka(Ec,C,a)}function M(){a:{var a=0<arguments.length?new x(Array.prototype.slice.call(arguments,0),0):null,b;if(a instanceof x&&0===a.j){b=a.c}else{b:{for(b=[];;){if(null!=a){b.push(a.R(null)),a=a.W(null)}else{break b}}}}for(var a=b.length,c=C;;){if(0<a){var d=a-1,c=c.J(null,b[a-1]),a=d}else{break a}}}return c}function td(a,b,c,d){this.l=a;this.first=b;this.Ca=c;this.o=d;this.h=65929452;this.w=8192}f=td.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.W=function(){return null==this.Ca?null:w(this.Ca)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.l)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return this.first};f.Y=function(){return null==this.Ca?C:this.Ca};f.K=function(){return this};f.S=function(a,b){return new td(b,this.first,this.Ca,this.o)};f.J=function(a,b){return new td(null,b,this,this.o)};td.prototype[Ga]=function(){return gc(this)};function F(a,b){var c=null==b;return(c?c:b&&(b.h&64||b.$a))?new td(null,a,b,null):new td(null,a,w(b),null)}function N(a,b,c,d){this.sb=a;this.name=b;this.Ea=c;this.nb=d;this.h=2153775105;this.w=4096}f=N.prototype;f.toString=function(){return[u(":"),u(this.Ea)].join("")};f.equiv=function(a){return this.s(null,a)};f.s=function(a,b){return b instanceof N?this.Ea===b.Ea:!1};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return Hc(c,this);case 3:return Ic(c,this,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return Hc(c,this)};a.i=function(a,c,d){return Ic(c,this,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return Hc(a,this)};f.a=function(a,b){return Ic(a,this,b)};f.I=function(){var a=this.nb;return null!=a?a:this.nb=a=dc(Zb(this.name),bc(this.sb))+2654435769|0;
};f.H=function(a,b){return Db(b,[u(":"),u(this.Ea)].join(""))};var ud=function ud(){switch(arguments.length){case 1:return ud.b(arguments[0]);case 2:return ud.a(arguments[0],arguments[1]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};ud.b=function(a){var b;return a instanceof N?a:"string"===typeof a?(b=a.split("/"),2===b.length?new N(b[0],b[1],a,null):new N(null,b[0],a,null)):null};ud.a=function(a,b){return new N(a,b,[u(n(a)?[u(a),u("/")].join(""):null),u(b)].join(""),null)};ud.v=2;function vd(a,b,c,d){this.l=a;this.Oa=b;this.u=c;this.o=d;this.h=32374988;this.w=0}f=vd.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};function wd(a){null!=a.Oa&&(a.u=a.Oa.C?a.Oa.C():a.Oa.call(null),a.Oa=null);return a.u}f.O=function(){return this.l};f.W=function(){zb(this);return null==this.u?null:D(this.u)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.l)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){zb(this);return null==this.u?null:y(this.u)};f.Y=function(){zb(this);return null!=this.u?ec(this.u):C};f.K=function(){wd(this);if(null==this.u){return null}for(var a=this.u;;){if(a instanceof vd){a=wd(a)}else{return this.u=a,w(this.u)}}};f.S=function(a,b){return new vd(b,this.Oa,this.u,this.o)};f.J=function(a,b){return F(b,this)};vd.prototype[Ga]=function(){return gc(this)};function xd(a,b){this.cb=a;this.end=b;this.h=2;this.w=0}xd.prototype.add=function(a){this.cb[this.end]=a;return this.end+=1};xd.prototype.ea=function(){var a=new yd(this.cb,0,this.end);this.cb=null;return a};xd.prototype.L=function(){return this.end};function yd(a,b,c){this.c=a;this.V=b;this.end=c;this.h=524306;this.w=0}f=yd.prototype;f.L=function(){return this.end-this.V};f.N=function(a,b){return this.c[this.V+b]};f.da=function(a,b,c){return 0<=b&&b<this.end-this.V?this.c[this.V+b]:c};f.ob=function(){if(this.V===this.end){throw Error("-drop-first of empty chunk")}return new yd(this.c,this.V+1,this.end)};f.T=function(a,b){return qc(this.c,b,this.c[this.V],this.V+1)};f.U=function(a,b,c){return qc(this.c,b,c,this.V)};function zd(a,b,c,d){this.ea=a;this.ja=b;this.l=c;this.o=d;this.h=31850732;this.w=1536}f=zd.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.W=function(){if(1<Oa(this.ea)){return new zd(Nb(this.ea),this.ja,this.l,null)}var a=zb(this.ja);return null==a?null:a};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.l)};f.R=function(){return v.a(this.ea,0)};f.Y=function(){return 1<Oa(this.ea)?new zd(Nb(this.ea),this.ja,this.l,null):null==this.ja?C:this.ja};f.K=function(){return this};f.gb=function(){return this.ea};f.hb=function(){return null==this.ja?C:this.ja};f.S=function(a,b){return new zd(this.ea,this.ja,b,this.o)};f.J=function(a,b){return F(b,this)};f.fb=function(){return null==this.ja?null:this.ja};zd.prototype[Ga]=function(){return gc(this)};function Ad(a,b){return 0===Oa(a)?b:new zd(a,b,null,null)}function Bd(a,b){a.add(b)}function Cd(a){for(var b=[];;){if(w(a)){b.push(y(a)),a=D(a)}else{return b}}}function Dd(a,b){if(rc(a)){return H(a)}for(var c=a,d=b,e=0;;){if(0<d&&w(c)){c=D(c),--d,e+=1}else{return e}}}var Ed=function Ed(b){return null==b?null:null==D(b)?w(y(b)):F(y(b),Ed(D(b)))},Fd=function Fd(){switch(arguments.length){case 0:return Fd.C();case 1:return Fd.b(arguments[0]);case 2:return Fd.a(arguments[0],arguments[1]);default:return Fd.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};Fd.C=function(){return new vd(null,function(){return null},null,null)};Fd.b=function(a){return new vd(null,function(){return a},null,null)};Fd.a=function(a,b){return new vd(null,function(){var c=w(a);return c?Zc(c)?Ad(Ob(c),Fd.a(Qb(c),b)):F(y(c),Fd.a(ec(c),b)):b},null,null)};Fd.m=function(a,b,c){return function e(a,b){return new vd(null,function(){var c=w(a);return c?Zc(c)?Ad(Ob(c),e(Qb(c),b)):F(y(c),e(ec(c),b)):n(b)?e(y(b),D(b)):null},null,null)}(Fd.a(a,b),c)};Fd.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return Fd.m(b,a,c)};Fd.v=2;var Gd=function Gd(){switch(arguments.length){case 0:return Gd.C();case 1:return Gd.b(arguments[0]);case 2:return Gd.a(arguments[0],arguments[1]);default:return Gd.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};Gd.C=function(){return Ib(Fc)};Gd.b=function(a){return a};Gd.a=function(a,b){return Jb(a,b)};Gd.m=function(a,b,c){for(;;){if(a=Jb(a,b),n(c)){b=y(c),c=D(c)}else{return a}}};Gd.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return Gd.m(b,a,c)};Gd.v=2;function Hd(a,b,c){var d=w(c);if(0===b){return a.C?a.C():a.call(null)}c=Xa(d);var e=Za(d);if(1===b){return a.b?a.b(c):a.b?a.b(c):a.call(null,c)}var d=Xa(e),g=Za(e);if(2===b){return a.a?a.a(c,d):a.a?a.a(c,d):a.call(null,c,d)}var e=Xa(g),h=Za(g);if(3===b){return a.i?a.i(c,d,e):a.i?a.i(c,d,e):a.call(null,c,d,e)}var g=Xa(h),k=Za(h);if(4===b){return a.aa?a.aa(c,d,e,g):a.aa?a.aa(c,d,e,g):a.call(null,c,d,e,g)}var h=Xa(k),m=Za(k);if(5===b){return a.ba?a.ba(c,d,e,g,h):a.ba?a.ba(c,d,e,g,h):a.call(null,c,d,e,g,h)}var k=Xa(m),q=Za(m);if(6===b){return a.xa?a.xa(c,d,e,g,h,k):a.xa?a.xa(c,d,e,g,h,k):a.call(null,c,d,e,g,h,k)}var m=Xa(q),p=Za(q);if(7===b){return a.ya?a.ya(c,d,e,g,h,k,m):a.ya?a.ya(c,d,e,g,h,k,m):a.call(null,c,d,e,g,h,k,m)}var q=Xa(p),z=Za(p);if(8===b){return a.za?a.za(c,d,e,g,h,k,m,q):a.za?a.za(c,d,e,g,h,k,m,q):a.call(null,c,d,e,g,h,k,m,q)}var p=Xa(z),B=Za(z);if(9===b){return a.Aa?a.Aa(c,d,e,g,h,k,m,q,p):a.Aa?a.Aa(c,d,e,g,h,k,m,q,p):a.call(null,c,d,e,g,h,k,m,q,p)}var z=Xa(B),A=Za(B);if(10===b){return a.ma?a.ma(c,d,e,g,h,k,m,q,p,z):a.ma?a.ma(c,d,e,g,h,k,m,q,p,z):a.call(null,c,d,e,g,h,k,m,q,p,z)}var B=Xa(A),G=Za(A);if(11===b){return a.na?a.na(c,d,e,g,h,k,m,q,p,z,B):a.na?a.na(c,d,e,g,h,k,m,q,p,z,B):a.call(null,c,d,e,g,h,k,m,q,p,z,B)}var A=Xa(G),I=Za(G);if(12===b){return a.oa?a.oa(c,d,e,g,h,k,m,q,p,z,B,A):a.oa?a.oa(c,d,e,g,h,k,m,q,p,z,B,A):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A)}var G=Xa(I),K=Za(I);if(13===b){return a.pa?a.pa(c,d,e,g,h,k,m,q,p,z,B,A,G):a.pa?a.pa(c,d,e,g,h,k,m,q,p,z,B,A,G):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G)}var I=Xa(K),O=Za(K);if(14===b){return a.qa?a.qa(c,d,e,g,h,k,m,q,p,z,B,A,G,I):a.qa?a.qa(c,d,e,g,h,k,m,q,p,z,B,A,G,I):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I)}var K=Xa(O),V=Za(O);if(15===b){return a.ra?a.ra(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K):a.ra?a.ra(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K)}var O=Xa(V),aa=Za(V);if(16===b){return a.sa?a.sa(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O):a.sa?a.sa(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O)}var V=Xa(aa),Fa=Za(aa);if(17===b){return a.ta?a.ta(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V):a.ta?a.ta(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V)}var aa=Xa(Fa),Ja=Za(Fa);if(18===b){return a.ua?a.ua(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa):a.ua?a.ua(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa)}Fa=Xa(Ja);Ja=Za(Ja);if(19===b){return a.va?a.va(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa):a.va?a.va(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa)}var J=Xa(Ja);Za(Ja);if(20===b){return a.wa?a.wa(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa,J):a.wa?a.wa(c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa,J):a.call(null,c,d,e,g,h,k,m,q,p,z,B,A,G,I,K,O,V,aa,Fa,J)}throw Error("Only up to 20 arguments supported on functions")}function Nc(){switch(arguments.length){case 2:return Id(arguments[0],arguments[1]);case 3:return Jd(arguments[0],arguments[1],arguments[2]);case 4:return Kd(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:var a;a=arguments[0];var b=F(arguments[1],F(arguments[2],F(arguments[3],arguments[4]))),c=a.v;if(a.A){var d=Dd(b,c+1);a=d<=c?Hd(a,d,b):a.A(b)}else{a=a.apply(a,Cd(b))}return a;default:return a=arguments[0],b=F(arguments[1],F(arguments[2],F(arguments[3],F(arguments[4],Ed(new x(Array.prototype.slice.call(arguments,5),0)))))),c=a.v,a.A?(d=Dd(b,c+1),a=d<=c?Hd(a,d,b):a.A(b)):a=a.apply(a,Cd(b)),a}}function Id(a,b){var c=a.v;if(a.A){var d=Dd(b,c+1);return d<=c?Hd(a,d,b):a.A(b)}return a.apply(a,Cd(b))}function Jd(a,b,c){b=F(b,c);c=a.v;if(a.A){var d=Dd(b,c+1);return d<=c?Hd(a,d,b):a.A(b)}return a.apply(a,Cd(b))}function Kd(a,b,c,d){b=F(b,F(c,d));c=a.v;return a.A?(d=Dd(b,c+1),d<=c?Hd(a,d,b):a.A(b)):a.apply(a,Cd(b))}function Ld(a,b){return!E.a(a,b)}function Md(a,b){for(;;){if(null==w(b)){return!0}var c;c=y(b);c=a.b?a.b(c):a.call(null,c);if(n(c)){c=a;var d=D(b);a=c;b=d}else{return!1}}}function Nd(a,b){for(;;){if(w(b)){var c;c=y(b);c=a.b?a.b(c):a.call(null,c);if(n(c)){return c}c=a;var d=D(b);a=c;b=d}else{return null}}}function Od(a){return function(){function b(b,c){return Ca(a.a?a.a(b,c):a.call(null,b,c))}function c(b){return Ca(a.b?a.b(b):a.call(null,b))}function d(){return Ca(a.C?a.C():a.call(null))}var e=null,g=function(){function b(a,d,e){var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;){h[g]=arguments[g+2],++g}g=new x(h,0)}return c.call(this,a,d,g)}function c(b,d,e){return Ca(Kd(a,b,d,e))}b.v=2;b.A=function(a){var b=y(a);a=D(a);var d=y(a);a=ec(a);return c(b,d,a)};b.m=c;return b}(),e=function(a,e,m){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,a);case 2:return b.call(this,a,e);default:var q=null;if(2<arguments.length){for(var q=0,p=Array(arguments.length-2);q<p.length;){p[q]=arguments[q+2],++q}q=new x(p,0)}return g.m(a,e,q)}throw Error("Invalid arity: "+arguments.length)};e.v=2;e.A=g.A;e.C=d;e.b=c;e.a=b;e.m=g.m;return e}()}function Pd(a,b){return function d(b,g){return new vd(null,function(){var h=w(g);if(h){if(Zc(h)){for(var k=Ob(h),m=H(k),q=new xd(Array(m),0),p=0;;){if(p<m){Bd(q,function(){var d=b+p,g=v.a(k,p);return a.a?a.a(d,g):a.call(null,d,g)}()),p+=1}else{break}}return Ad(q.ea(),d(b+m,Qb(h)))}return F(function(){var d=y(h);return a.a?a.a(b,d):a.call(null,b,d)}(),d(b+1,ec(h)))}return null},null,null)}(0,b)}var P=function P(){switch(arguments.length){case 1:return P.b(arguments[0]);case 2:return P.a(arguments[0],arguments[1]);case 3:return P.i(arguments[0],arguments[1],arguments[2]);case 4:return P.aa(arguments[0],arguments[1],arguments[2],arguments[3]);default:return P.m(arguments[0],arguments[1],arguments[2],arguments[3],new x(Array.prototype.slice.call(arguments,4),0))}};P.b=function(a){return function(b){return function(){function c(c,d){var e=a.b?a.b(d):a.call(null,d);return b.a?b.a(c,e):b.call(null,c,e)}function d(a){return b.b?b.b(a):b.call(null,a)}function e(){return b.C?b.C():b.call(null)}var g=null,h=function(){function c(a,b,e){var g=null;if(2<arguments.length){for(var g=0,h=Array(arguments.length-2);g<h.length;){h[g]=arguments[g+2],++g}g=new x(h,0)}return d.call(this,a,b,g)}function d(c,e,g){e=Jd(a,e,g);return b.a?b.a(c,e):b.call(null,c,e)}c.v=2;c.A=function(a){var b=y(a);a=D(a);var c=y(a);a=ec(a);return d(b,c,a)};c.m=d;return c}(),g=function(a,b,g){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,a);case 2:return c.call(this,a,b);default:var p=null;if(2<arguments.length){for(var p=0,z=Array(arguments.length-2);p<z.length;){z[p]=arguments[p+2],++p}p=new x(z,0)}return h.m(a,b,p)}throw Error("Invalid arity: "+arguments.length)};g.v=2;g.A=h.A;g.C=e;g.b=d;g.a=c;g.m=h.m;return g}()}};P.a=function(a,b){return new vd(null,function(){var c=w(b);if(c){if(Zc(c)){for(var d=Ob(c),e=H(d),g=new xd(Array(e),0),h=0;;){if(h<e){Bd(g,function(){var b=v.a(d,h);return a.b?a.b(b):a.call(null,b)}()),h+=1}else{break}}return Ad(g.ea(),P.a(a,Qb(c)))}return F(function(){var b=y(c);return a.b?a.b(b):a.call(null,b)}(),P.a(a,ec(c)))}return null},null,null)};P.i=function(a,b,c){return new vd(null,function(){var d=w(b),e=w(c);if(d&&e){var g=F,h;h=y(d);var k=y(e);h=a.a?a.a(h,k):a.call(null,h,k);d=g(h,P.i(a,ec(d),ec(e)))}else{d=null}return d},null,null)};P.aa=function(a,b,c,d){return new vd(null,function(){var e=w(b),g=w(c),h=w(d);if(e&&g&&h){var k=F,m;m=y(e);var q=y(g),p=y(h);m=a.i?a.i(m,q,p):a.call(null,m,q,p);e=k(m,P.aa(a,ec(e),ec(g),ec(h)))}else{e=null}return e},null,null)};P.m=function(a,b,c,d,e){var g=function k(a){return new vd(null,function(){var b=P.a(w,a);return Md(fd,b)?F(P.a(y,b),k(P.a(ec,b))):null},null,null)};return P.a(function(){return function(b){return Id(a,b)}}(g),g(Ec.m(e,d,xc([c,b],0))))};P.A=function(a){var b=y(a),c=D(a);a=y(c);var d=D(c),c=y(d),e=D(d),d=y(e),e=D(e);return P.m(b,a,c,d,e)};P.v=4;function Qd(a,b){return new vd(null,function(){if(0<a){var c=w(b);return c?F(y(c),Qd(a-1,ec(c))):null}return null},null,null)}function Rd(a,b){return new vd(null,function(c){return function(){return c(a,b)}}(function(a,b){for(;;){var e=w(b);if(0<a&&e){var g=a-1,e=ec(e);a=g;b=e}else{return e}}}),null,null)}function Sd(a,b){for(var c=w(b),d=w(Rd(a,b));;){if(d){c=D(c),d=D(d)}else{return c}}}function Td(a){return new vd(null,function(){return F(a,Td(a))},null,null)}function Ud(a,b){return Qd(a,Td(b))}var Yd=function Yd(){switch(arguments.length){case 2:return Yd.a(arguments[0],arguments[1]);default:return Yd.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};Yd.a=function(a,b){return new vd(null,function(){var c=w(a),d=w(b);return c&&d?F(y(c),F(y(d),Yd.a(ec(c),ec(d)))):null},null,null)};Yd.m=function(a,b,c){return new vd(null,function(){var d=P.a(w,Ec.m(c,b,xc([a],0)));return Md(fd,d)?Fd.a(P.a(y,d),Id(Yd,P.a(ec,d))):null},null,null)};Yd.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return Yd.m(b,a,c)};Yd.v=2;function Zd(a,b){return new vd(null,function(){var c=w(b);if(c){if(Zc(c)){for(var d=Ob(c),e=H(d),g=new xd(Array(e),0),h=0;;){if(h<e){var k;k=v.a(d,h);k=a.b?a.b(k):a.call(null,k);n(k)&&(k=v.a(d,h),g.add(k));h+=1}else{break}}return Ad(g.ea(),Zd(a,Qb(c)))}d=y(c);c=ec(c);return n(a.b?a.b(d):a.call(null,d))?F(d,Zd(a,c)):Zd(a,c)}return null},null,null)}function $d(a,b){return Zd(Od(a),b)}function ae(a){return function c(a){return new vd(null,function(){var e;n(Wc.b?Wc.b(a):Wc.call(null,a))?(e=xc([w.b?w.b(a):w.call(null,a)],0),e=Id(Fd,Jd(P,c,e))):e=null;return F(a,e)},null,null)}(a)}function be(a){return Zd(function(a){return!Wc(a)},ec(ae(a)))}var ce=function ce(){switch(arguments.length){case 2:return ce.a(arguments[0],arguments[1]);case 3:return ce.i(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};ce.a=function(a,b){var c;null!=a?a&&(a.w&4||a.wb)?(c=Ka(Jb,Ib(a),b),c=Kb(c),c=yc(c,Oc(a))):c=Ka(Sa,a,b):c=Ka(Ec,C,b);return c};ce.i=function(a,b,c){a&&(a.w&4||a.wb)?(b=gd(b,Gd,Ib(a),c),b=Kb(b),a=yc(b,Oc(a))):a=gd(b,Ec,a,c);return a};ce.v=3;function de(a){return ee(2,2,a)}function ee(a,b,c){return new vd(null,function(){var d=w(c);if(d){var e=Qd(a,d);return a===H(e)?F(e,ee(a,b,Rd(b,d))):null}return null},null,null)}function fe(a,b){this.B=a;this.c=b}function ge(a){return new fe(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function he(a){a=a.g;return 32>a?0:a-1>>>5<<5}function ie(a,b,c){for(;;){if(0===b){return c}var d=ge(a);d.c[0]=c;c=d;b-=5}}var je=function je(b,c,d,e){var g=new fe(d.B,Ha(d.c)),h=b.g-1>>>c&31;5===c?g.c[h]=e:(d=d.c[h],b=null!=d?je(b,c-5,d,e):ie(null,c-5,e),g.c[h]=b);return g};function ke(a,b){throw Error([u("No item "),u(a),u(" in vector of length "),u(b)].join(""))}function le(a,b){if(b>=he(a)){return a.$}for(var c=a.root,d=a.shift;;){if(0<d){var e=d-5,c=c.c[b>>>d&31],d=e}else{return c.c}}}function me(a,b){return 0<=b&&b<a.g?le(a,b):ke(b,a.g)}var ne=function ne(b,c,d,e,g){var h=new fe(d.B,Ha(d.c));if(0===c){h.c[e&31]=g}else{var k=e>>>c&31;b=ne(b,c-5,d.c[k],e,g);h.c[k]=b}return h};function oe(a,b,c,d,e,g){this.j=a;this.bb=b;this.c=c;this.ka=d;this.start=e;this.end=g}oe.prototype.ab=function(){return this.j<this.end};oe.prototype.next=function(){32===this.j-this.bb&&(this.c=le(this.ka,this.j),this.bb+=32);var a=this.c[this.j&31];this.j+=1;return a};function Q(a,b,c,d,e,g){this.l=a;this.g=b;this.shift=c;this.root=d;this.$=e;this.o=g;this.h=167668511;this.w=8196}f=Q.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){return"number"===typeof b?v.i(this,b,c):c};f.N=function(a,b){return me(this,b)[b&31]};f.da=function(a,b,c){return 0<=b&&b<this.g?le(this,b)[b&31]:c};f.lb=function(a,b,c){if(0<=b&&b<this.g){return he(this)<=b?(a=Ha(this.$),a[b&31]=c,new Q(this.l,this.g,this.shift,this.root,a,null)):new Q(this.l,this.g,this.shift,ne(this,this.shift,this.root,b,c),this.$,null)}if(b===this.g){return Sa(this,c)}throw Error([u("Index "),u(b),u(" out of bounds  [0,"),u(this.g),u("]")].join(""))};f.Ra=function(){var a=this.g;return new oe(0,0,0<H(this)?le(this,0):null,this,0,a)};f.O=function(){return this.l};f.L=function(){return this.g};f.jb=function(){return v.a(this,0)};f.kb=function(){return v.a(this,1)};f.Sa=function(){return 0<this.g?v.a(this,this.g-1):null};f.Za=function(){return 0<this.g?new uc(this,this.g-1,null):null};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){if(b instanceof Q){if(this.g===H(b)){for(var c=Sb(this),d=Sb(b);;){if(n(c.ab())){var e=c.next(),g=d.next();if(!E.a(e,g)){return!1}}else{return!0}}}else{return!1}}else{return vc(this,b)}};f.La=function(){var a=this;return new qe(a.g,a.shift,function(){var b=a.root;return re.b?re.b(b):re.call(null,b)}(),function(){var b=a.$;return se.b?se.b(b):se.call(null,b)}())};f.M=function(){return yc(Fc,this.l)};f.T=function(a,b){return mc(this,b)};f.U=function(a,b,c){a=0;for(var d=c;;){if(a<this.g){var e=le(this,a);c=e.length;a:{for(var g=0;;){if(g<c){var h=e[g],d=b.a?b.a(d,h):b.call(null,d,h),g=g+1}else{e=d;break a}}}a+=c;d=e}else{return d}}};f.Qa=function(a,b,c){if("number"===typeof b){return ob(this,b,c)}throw Error("Vector's key for assoc must be a number.")};f.K=function(){if(0===this.g){return null}if(32>=this.g){return new x(this.$,0)}var a;a:{a=this.root;for(var b=this.shift;;){if(0<b){b-=5,a=a.c[0]}else{a=a.c;break a}}}return te?te(this,a,0,0):ue.call(null,this,a,0,0)};f.S=function(a,b){return new Q(b,this.g,this.shift,this.root,this.$,this.o)};f.J=function(a,b){if(32>this.g-he(this)){for(var c=this.$.length,d=Array(c+1),e=0;;){if(e<c){d[e]=this.$[e],e+=1}else{break}}d[c]=b;return new Q(this.l,this.g+1,this.shift,this.root,d,null)}c=(d=this.g>>>5>1<<this.shift)?this.shift+5:this.shift;d?(d=ge(null),d.c[0]=this.root,e=ie(null,this.shift,new fe(null,this.$)),d.c[1]=e):d=je(this,this.shift,this.root,new fe(null,this.$));return new Q(this.l,this.g+1,c,d,[b],null)};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.N(null,c);case 3:return this.da(null,c,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return this.N(null,c)};a.i=function(a,c,d){return this.da(null,c,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return this.N(null,a)};f.a=function(a,b){return this.da(null,a,b)};var R=new fe(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),Fc=new Q(null,0,5,R,[],jc);function ve(a){var b=a.length;if(32>b){return new Q(null,b,5,R,a,null)}for(var c=32,d=new Q(null,32,5,R,a.slice(0,32),null).La(null);;){if(c<b){var e=c+1,d=Gd.a(d,a[c]),c=e}else{return Kb(d)}}}Q.prototype[Ga]=function(){return gc(this)};function we(a){return Ba(a)?ve(a):Kb(Ka(Jb,Ib(Fc),a))}var xe=function xe(){return xe.m(0<arguments.length?new x(Array.prototype.slice.call(arguments,0),0):null)};xe.m=function(a){return a instanceof x&&0===a.j?ve(a.c):we(a)};xe.v=0;xe.A=function(a){return xe.m(w(a))};function ye(a,b,c,d,e,g){this.ga=a;this.node=b;this.j=c;this.V=d;this.l=e;this.o=g;this.h=32375020;this.w=1536}f=ye.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.W=function(){if(this.V+1<this.node.length){var a;a=this.ga;var b=this.node,c=this.j,d=this.V+1;a=te?te(a,b,c,d):ue.call(null,a,b,c,d);return null==a?null:a}return Rb(this)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(Fc,this.l)};f.T=function(a,b){var c;c=this.ga;var d=this.j+this.V,e=H(this.ga);c=ze?ze(c,d,e):Ae.call(null,c,d,e);return mc(c,b)};f.U=function(a,b,c){a=this.ga;var d=this.j+this.V,e=H(this.ga);a=ze?ze(a,d,e):Ae.call(null,a,d,e);return nc(a,b,c)};f.R=function(){return this.node[this.V]};f.Y=function(){if(this.V+1<this.node.length){var a;a=this.ga;var b=this.node,c=this.j,d=this.V+1;a=te?te(a,b,c,d):ue.call(null,a,b,c,d);return null==a?C:a}return Qb(this)};f.K=function(){return this};f.gb=function(){var a=this.node;return new yd(a,this.V,a.length)};f.hb=function(){var a=this.j+this.node.length;if(a<Oa(this.ga)){var b=this.ga,c=le(this.ga,a);return te?te(b,c,a,0):ue.call(null,b,c,a,0)}return C};f.S=function(a,b){var c=this.ga,d=this.node,e=this.j,g=this.V;return Be?Be(c,d,e,g,b):ue.call(null,c,d,e,g,b)};f.J=function(a,b){return F(b,this)};f.fb=function(){var a=this.j+this.node.length;if(a<Oa(this.ga)){var b=this.ga,c=le(this.ga,a);return te?te(b,c,a,0):ue.call(null,b,c,a,0)}return null};ye.prototype[Ga]=function(){return gc(this)};function ue(){switch(arguments.length){case 3:var a=arguments[0],b=arguments[1],c=arguments[2];return new ye(a,me(a,b),b,c,null,null);case 4:return te(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:return Be(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function te(a,b,c,d){return new ye(a,b,c,d,null,null)}function Be(a,b,c,d,e){return new ye(a,b,c,d,e,null)}function Ce(a,b,c,d,e){this.l=a;this.ka=b;this.start=c;this.end=d;this.o=e;this.h=167666463;this.w=8192}f=Ce.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){return"number"===typeof b?v.i(this,b,c):c};f.N=function(a,b){return 0>b||this.end<=this.start+b?ke(b,this.end-this.start):v.a(this.ka,this.start+b)};f.da=function(a,b,c){return 0>b||this.end<=this.start+b?c:v.i(this.ka,this.start+b,c)};f.lb=function(a,b,c){var d=this.start+b;a=this.l;c=Jc.i(this.ka,d,c);b=this.start;var e=this.end,d=d+1,d=e>d?e:d;return De.ba?De.ba(a,c,b,d,null):De.call(null,a,c,b,d,null)};f.O=function(){return this.l};f.L=function(){return this.end-this.start};f.Sa=function(){return v.a(this.ka,this.end-1)};f.Za=function(){return this.start!==this.end?new uc(this,this.end-this.start-1,null):null};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(Fc,this.l)};f.T=function(a,b){return mc(this,b)};f.U=function(a,b,c){return nc(this,b,c)};f.Qa=function(a,b,c){if("number"===typeof b){return ob(this,b,c)}throw Error("Subvec's key for assoc must be a number.")};f.K=function(){var a=this;return function(b){return function d(e){return e===a.end?null:F(v.a(a.ka,e),new vd(null,function(){return function(){return d(e+1)}}(b),null,null))}}(this)(a.start)};f.S=function(a,b){var c=this.ka,d=this.start,e=this.end,g=this.o;return De.ba?De.ba(b,c,d,e,g):De.call(null,b,c,d,e,g)};f.J=function(a,b){var c=this.l,d=ob(this.ka,this.end,b),e=this.start,g=this.end+1;return De.ba?De.ba(c,d,e,g,null):De.call(null,c,d,e,g,null)};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.N(null,c);case 3:return this.da(null,c,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return this.N(null,c)};a.i=function(a,c,d){return this.da(null,c,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return this.N(null,a)};f.a=function(a,b){return this.da(null,a,b)};Ce.prototype[Ga]=function(){return gc(this)};function De(a,b,c,d,e){for(;;){if(b instanceof Ce){c=b.start+c,d=b.start+d,b=b.ka}else{var g=H(b);if(0>c||0>d||c>g||d>g){throw Error("Index out of bounds")}return new Ce(a,b,c,d,e)}}}function Ae(){switch(arguments.length){case 2:var a=arguments[0];return ze(a,arguments[1],H(a));case 3:return ze(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function ze(a,b,c){return De(null,a,b,c,null)}function Ee(a,b){return a===b.B?b:new fe(a,Ha(b.c))}function re(a){return new fe({},Ha(a.c))}function se(a){var b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];ad(a,0,b,0,a.length);return b}var Fe=function Fe(b,c,d,e){d=Ee(b.root.B,d);var g=b.g-1>>>c&31;if(5===c){b=e}else{var h=d.c[g];b=null!=h?Fe(b,c-5,h,e):ie(b.root.B,c-5,e)}d.c[g]=b;return d};function qe(a,b,c,d){this.g=a;this.shift=b;this.root=c;this.$=d;this.w=88;this.h=275}f=qe.prototype;f.Ia=function(a,b){if(this.root.B){if(32>this.g-he(this)){this.$[this.g&31]=b}else{var c=new fe(this.root.B,this.$),d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];d[0]=b;this.$=d;if(this.g>>>5>1<<this.shift){var d=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],e=this.shift+5;d[0]=this.root;d[1]=ie(this.root.B,this.shift,c);this.root=new fe(this.root.B,d);this.shift=e}else{this.root=Fe(this,this.shift,this.root,c)}}this.g+=1;return this}throw Error("conj! after persistent!")};f.Ma=function(){if(this.root.B){this.root.B=null;var a=this.g-he(this),b=Array(a);ad(this.$,0,b,0,a);return new Q(null,this.g,this.shift,this.root,b,null)}throw Error("persistent! called twice")};f.Ta=function(a,b,c){if("number"===typeof b){return Mb(this,b,c)}throw Error("TransientVector's key for assoc! must be a number.")};f.qb=function(a,b,c){var d=this;if(d.root.B){if(0<=b&&b<d.g){return he(this)<=b?d.$[b&31]=c:(a=function(){return function g(a,k){var m=Ee(d.root.B,k);if(0===a){m.c[b&31]=c}else{var q=b>>>a&31,p=g(a-5,m.c[q]);m.c[q]=p}return m}}(this).call(null,d.shift,d.root),d.root=a),this}if(b===d.g){return Jb(this,c)}throw Error([u("Index "),u(b),u(" out of bounds for TransientVector of length"),u(d.g)].join(""))}throw Error("assoc! after persistent!")};f.L=function(){if(this.root.B){return this.g}throw Error("count after persistent!")};f.N=function(a,b){if(this.root.B){return me(this,b)[b&31]}throw Error("nth after persistent!")};f.da=function(a,b,c){return 0<=b&&b<this.g?v.a(this,b):c};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){return"number"===typeof b?v.i(this,b,c):c};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.G(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return this.G(null,c)};a.i=function(a,c,d){return this.F(null,c,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return this.G(null,a)};f.a=function(a,b){return this.F(null,a,b)};function Ge(){this.h=2097152;this.w=0}Ge.prototype.equiv=function(a){return this.s(null,a)};Ge.prototype.s=function(){return!1};var He=new Ge;function Ie(a,b){return dd(Xc(b)?H(a)===H(b)?Md(fd,P.a(function(a){return E.a(Ic(b,y(a),He),Cc(a))},a)):null:null)}function Je(a){this.u=a}Je.prototype.next=function(){if(null!=this.u){var a=y(this.u),b=L(a,0),a=L(a,1);this.u=D(this.u);return{value:[b,a],done:!1}}return{value:null,done:!0}};function Ke(a){return new Je(w(a))}function Le(a){this.u=a}Le.prototype.next=function(){if(null!=this.u){var a=y(this.u);this.u=D(this.u);return{value:[a,a],done:!1}}return{value:null,done:!0}};function Me(a,b){var c;if(b instanceof N){a:{c=a.length;for(var d=b.Ea,e=0;;){if(c<=e){c=-1;break a}var g=a[e];if(g instanceof N&&d===g.Ea){c=e;break a}e+=2}}}else{if(c="string"==typeof b,n(n(c)?c:"number"===typeof b)){a:{for(c=a.length,d=0;;){if(c<=d){c=-1;break a}if(b===a[d]){c=d;break a}d+=2}}}else{if(null==b){a:{for(c=a.length,d=0;;){if(c<=d){c=-1;break a}if(null==a[d]){c=d;break a}d+=2}}}else{a:{for(c=a.length,d=0;;){if(c<=d){c=-1;break a}if(E.a(b,a[d])){c=d;break a}d+=2}}}}}return c}function Ne(a,b,c){this.c=a;this.j=b;this.ca=c;this.h=32374990;this.w=0}f=Ne.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.ca};f.W=function(){return this.j<this.c.length-2?new Ne(this.c,this.j+2,this.ca):null};f.L=function(){return(this.c.length-this.j)/2};f.I=function(){return ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.ca)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return new Q(null,2,5,R,[this.c[this.j],this.c[this.j+1]],null)};f.Y=function(){return this.j<this.c.length-2?new Ne(this.c,this.j+2,this.ca):C};f.K=function(){return this};f.S=function(a,b){return new Ne(this.c,this.j,b)};f.J=function(a,b){return F(b,this)};Ne.prototype[Ga]=function(){return gc(this)};function Te(a,b,c){this.c=a;this.j=b;this.g=c}Te.prototype.ab=function(){return this.j<this.g};Te.prototype.next=function(){var a=new Q(null,2,5,R,[this.c[this.j],this.c[this.j+1]],null);this.j+=2;return a};function pa(a,b,c,d){this.l=a;this.g=b;this.c=c;this.o=d;this.h=16647951;this.w=8196}f=pa.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.keys=function(){return gc(Ue.b?Ue.b(this):Ue.call(null,this))};f.entries=function(){return Ke(w(this))};f.values=function(){return gc(Ve.b?Ve.b(this):Ve.call(null,this))};f.has=function(a){return ed(this,a)};f.get=function(a,b){return this.F(null,a,b)};f.forEach=function(a){for(var b=w(this),c=null,d=0,e=0;;){if(e<d){var g=c.N(null,e),h=L(g,0),g=L(g,1);a.a?a.a(g,h):a.call(null,g,h);e+=1}else{if(b=w(b)){Zc(b)?(c=Ob(b),b=Qb(b),h=c,d=H(c),c=h):(c=y(b),h=L(c,0),c=g=L(c,1),a.a?a.a(c,h):a.call(null,c,h),b=D(b),c=null,d=0),e=0}else{return null}}}};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){a=Me(this.c,b);return-1===a?c:this.c[a+1]};f.Ra=function(){return new Te(this.c,0,2*this.g)};f.O=function(){return this.l};f.L=function(){return this.g};f.I=function(){var a=this.o;return null!=a?a:this.o=a=kc(this)};f.s=function(a,b){if(b&&(b.h&1024||b.Db)){var c=this.c.length;if(this.g===b.L(null)){for(var d=0;;){if(d<c){var e=b.F(null,this.c[d],bd);if(e!==bd){if(E.a(this.c[d+1],e)){d+=2}else{return!1}}else{return!1}}else{return!0}}}else{return!1}}else{return Ie(this,b)}};f.La=function(){return new We({},this.c.length,Ha(this.c))};f.M=function(){return sb(Xe,this.l)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.ib=function(a,b){if(0<=Me(this.c,b)){var c=this.c.length,d=c-2;if(0===d){return Qa(this)}for(var d=Array(d),e=0,g=0;;){if(e>=c){return new pa(this.l,this.g-1,d,null)}E.a(b,this.c[e])||(d[g]=this.c[e],d[g+1]=this.c[e+1],g+=2);e+=2}}else{return this}};f.Qa=function(a,b,c){a=Me(this.c,b);if(-1===a){if(this.g<Ye){a=this.c;for(var d=a.length,e=Array(d+2),g=0;;){if(g<d){e[g]=a[g],g+=1}else{break}}e[d]=b;e[d+1]=c;return new pa(this.l,this.g+1,e,null)}return sb(db(ce.a(Ze,this),b,c),this.l)}if(c===this.c[a+1]){return this}b=Ha(this.c);b[a+1]=c;return new pa(this.l,this.g,b,null)};f.eb=function(a,b){return-1!==Me(this.c,b)};f.K=function(){var a=this.c;return 0<=a.length-2?new Ne(a,0,null):null};f.S=function(a,b){return new pa(b,this.g,this.c,this.o)};f.J=function(a,b){if(Yc(b)){return db(this,v.a(b,0),v.a(b,1))}for(var c=this,d=w(b);;){if(null==d){return c}var e=y(d);if(Yc(e)){c=db(c,v.a(e,0),v.a(e,1)),d=D(d)}else{throw Error("conj on a map takes map entries or seqables of map entries");
}}};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.G(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return this.G(null,c)};a.i=function(a,c,d){return this.F(null,c,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return this.G(null,a)};f.a=function(a,b){return this.F(null,a,b)};var Xe=new pa(null,0,[],lc),Ye=8;pa.prototype[Ga]=function(){return gc(this)};function We(a,b,c){this.Na=a;this.Pa=b;this.c=c;this.h=258;this.w=56}f=We.prototype;f.L=function(){if(n(this.Na)){return hd(this.Pa)}throw Error("count after persistent!")};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){if(n(this.Na)){return a=Me(this.c,b),-1===a?c:this.c[a+1]}throw Error("lookup after persistent!")};f.Ia=function(a,b){if(n(this.Na)){if(b?b.h&2048||b.Eb||(b.h?0:r(hb,b)):r(hb,b)){return Lb(this,$e.b?$e.b(b):$e.call(null,b),af.b?af.b(b):af.call(null,b))}for(var c=w(b),d=this;;){var e=y(c);if(n(e)){var g=e,c=D(c),d=Lb(d,function(){var a=g;return $e.b?$e.b(a):$e.call(null,a)}(),function(){var a=g;return af.b?af.b(a):af.call(null,a)}())}else{return d}}}else{throw Error("conj! after persistent!")}};f.Ma=function(){if(n(this.Na)){return this.Na=!1,new pa(null,hd(this.Pa),this.c,null)}throw Error("persistent! called twice")};f.Ta=function(a,b,c){if(n(this.Na)){a=Me(this.c,b);if(-1===a){if(this.Pa+2<=2*Ye){return this.Pa+=2,this.c.push(b),this.c.push(c),this}a=this.Pa;var d=this.c;a=bf.a?bf.a(a,d):bf.call(null,a,d);return Lb(a,b,c)}c!==this.c[a+1]&&(this.c[a+1]=c);return this}throw Error("assoc! after persistent!")};function bf(a,b){for(var c=Ib(Ze),d=0;;){if(d<a){c=Lb(c,b[d],b[d+1]),d+=2}else{return c}}}function cf(){this.la=!1}function df(a,b){return a===b?!0:a===b||a instanceof N&&b instanceof N&&a.Ea===b.Ea?!0:E.a(a,b)}function ff(a,b,c){a=Ha(a);a[b]=c;return a}function gf(a,b){var c=Array(a.length-2);ad(a,0,c,0,2*b);ad(a,2*(b+1),c,2*b,c.length-2*b);return c}function hf(a,b,c,d){a=a.Ja(b);a.c[c]=d;return a}function jf(a,b,c){this.B=a;this.D=b;this.c=c}f=jf.prototype;f.Ja=function(a){if(a===this.B){return this}var b=id(this.D),c=Array(0>b?4:2*(b+1));ad(this.c,0,c,0,2*b);return new jf(a,this.D,c)};f.Ua=function(){var a=this.c;return kf?kf(a):lf.call(null,a)};f.Fa=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.D&e)){return d}var g=id(this.D&e-1),e=this.c[2*g],g=this.c[2*g+1];return null==e?g.Fa(a+5,b,c,d):df(c,e)?g:d};f.ia=function(a,b,c,d,e,g){var h=1<<(c>>>b&31),k=id(this.D&h-1);if(0===(this.D&h)){var m=id(this.D);if(2*m<this.c.length){a=this.Ja(a);b=a.c;g.la=!0;a:{for(c=2*(m-k),g=2*k+(c-1),m=2*(k+1)+(c-1);;){if(0===c){break a}b[m]=b[g];--m;--c;--g}}b[2*k]=d;b[2*k+1]=e;a.D|=h;return a}if(16<=m){k=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];k[c>>>b&31]=mf.ia(a,b+5,c,d,e,g);for(e=d=0;;){if(32>d){0!==(this.D>>>d&1)&&(k[d]=null!=this.c[e]?mf.ia(a,b+5,cc(this.c[e]),this.c[e],this.c[e+1],g):this.c[e+1],e+=2),d+=1}else{break}}return new nf(a,m+1,k)}b=Array(2*(m+4));ad(this.c,0,b,0,2*k);b[2*k]=d;b[2*k+1]=e;ad(this.c,2*k,b,2*(k+1),2*(m-k));g.la=!0;a=this.Ja(a);a.c=b;a.D|=h;return a}m=this.c[2*k];h=this.c[2*k+1];if(null==m){return m=h.ia(a,b+5,c,d,e,g),m===h?this:hf(this,a,2*k+1,m)}if(df(d,m)){return e===h?this:hf(this,a,2*k+1,e)}g.la=!0;g=b+5;d=of?of(a,g,m,h,c,d,e):pf.call(null,a,g,m,h,c,d,e);e=2*k;k=2*k+1;a=this.Ja(a);a.c[e]=null;a.c[k]=d;return a};f.ha=function(a,b,c,d,e){var g=1<<(b>>>a&31),h=id(this.D&g-1);if(0===(this.D&g)){var k=id(this.D);if(16<=k){h=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];h[b>>>a&31]=mf.ha(a+5,b,c,d,e);for(d=c=0;;){if(32>c){0!==(this.D>>>c&1)&&(h[c]=null!=this.c[d]?mf.ha(a+5,cc(this.c[d]),this.c[d],this.c[d+1],e):this.c[d+1],d+=2),c+=1}else{break}}return new nf(null,k+1,h)}a=Array(2*(k+1));ad(this.c,0,a,0,2*h);a[2*h]=c;a[2*h+1]=d;ad(this.c,2*h,a,2*(h+1),2*(k-h));e.la=!0;return new jf(null,this.D|g,a)}var m=this.c[2*h],g=this.c[2*h+1];if(null==m){return k=g.ha(a+5,b,c,d,e),k===g?this:new jf(null,this.D,ff(this.c,2*h+1,k))}if(df(c,m)){return d===g?this:new jf(null,this.D,ff(this.c,2*h+1,d))}e.la=!0;e=this.D;k=this.c;a+=5;a=qf?qf(a,m,g,b,c,d):pf.call(null,a,m,g,b,c,d);c=2*h;h=2*h+1;d=Ha(k);d[c]=null;d[h]=a;return new jf(null,e,d)};f.Va=function(a,b,c){var d=1<<(b>>>a&31);if(0===(this.D&d)){return this}var e=id(this.D&d-1),g=this.c[2*e],h=this.c[2*e+1];return null==g?(a=h.Va(a+5,b,c),a===h?this:null!=a?new jf(null,this.D,ff(this.c,2*e+1,a)):this.D===d?null:new jf(null,this.D^d,gf(this.c,e))):df(c,g)?new jf(null,this.D^d,gf(this.c,e)):this};var mf=new jf(null,0,[]);function nf(a,b,c){this.B=a;this.g=b;this.c=c}f=nf.prototype;f.Ja=function(a){return a===this.B?this:new nf(a,this.g,Ha(this.c))};f.Ua=function(){var a=this.c;return rf?rf(a):sf.call(null,a)};f.Fa=function(a,b,c,d){var e=this.c[b>>>a&31];return null!=e?e.Fa(a+5,b,c,d):d};f.ia=function(a,b,c,d,e,g){var h=c>>>b&31,k=this.c[h];if(null==k){return a=hf(this,a,h,mf.ia(a,b+5,c,d,e,g)),a.g+=1,a}b=k.ia(a,b+5,c,d,e,g);return b===k?this:hf(this,a,h,b)};f.ha=function(a,b,c,d,e){var g=b>>>a&31,h=this.c[g];if(null==h){return new nf(null,this.g+1,ff(this.c,g,mf.ha(a+5,b,c,d,e)))}a=h.ha(a+5,b,c,d,e);return a===h?this:new nf(null,this.g,ff(this.c,g,a))};f.Va=function(a,b,c){var d=b>>>a&31,e=this.c[d];if(null!=e){a=e.Va(a+5,b,c);if(a===e){d=this}else{if(null==a){if(8>=this.g){a:{e=this.c;a=e.length;b=Array(2*(this.g-1));c=0;for(var g=1,h=0;;){if(c<a){c!==d&&null!=e[c]&&(b[g]=e[c],g+=2,h|=1<<c),c+=1}else{d=new jf(null,h,b);break a}}}}else{d=new nf(null,this.g-1,ff(this.c,d,a))}}else{d=new nf(null,this.g,ff(this.c,d,a))}}return d}return this};function tf(a,b,c){b*=2;for(var d=0;;){if(d<b){if(df(c,a[d])){return d}d+=2}else{return-1}}}function uf(a,b,c,d){this.B=a;this.Ba=b;this.g=c;this.c=d}f=uf.prototype;f.Ja=function(a){if(a===this.B){return this}var b=Array(2*(this.g+1));ad(this.c,0,b,0,2*this.g);return new uf(a,this.Ba,this.g,b)};f.Ua=function(){var a=this.c;return kf?kf(a):lf.call(null,a)};f.Fa=function(a,b,c,d){a=tf(this.c,this.g,c);return 0>a?d:df(c,this.c[a])?this.c[a+1]:d};f.ia=function(a,b,c,d,e,g){if(c===this.Ba){b=tf(this.c,this.g,d);if(-1===b){if(this.c.length>2*this.g){return b=2*this.g,c=2*this.g+1,a=this.Ja(a),a.c[b]=d,a.c[c]=e,g.la=!0,a.g+=1,a}c=this.c.length;b=Array(c+2);ad(this.c,0,b,0,c);b[c]=d;b[c+1]=e;g.la=!0;d=this.g+1;a===this.B?(this.c=b,this.g=d,a=this):a=new uf(this.B,this.Ba,d,b);return a}return this.c[b+1]===e?this:hf(this,a,b+1,e)}return new jf(a,1<<(this.Ba>>>b&31),[null,this,null,null]).ia(a,b,c,d,e,g)};f.ha=function(a,b,c,d,e){return b===this.Ba?(a=tf(this.c,this.g,c),-1===a?(a=2*this.g,b=Array(a+2),ad(this.c,0,b,0,a),b[a]=c,b[a+1]=d,e.la=!0,new uf(null,this.Ba,this.g+1,b)):E.a(this.c[a],d)?this:new uf(null,this.Ba,this.g,ff(this.c,a+1,d))):new jf(null,1<<(this.Ba>>>a&31),[null,this]).ha(a,b,c,d,e)};f.Va=function(a,b,c){a=tf(this.c,this.g,c);return-1===a?this:1===this.g?null:new uf(null,this.Ba,this.g-1,gf(this.c,hd(a)))};function pf(){switch(arguments.length){case 6:return qf(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);case 7:return of(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],arguments[5],arguments[6]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function qf(a,b,c,d,e,g){var h=cc(b);if(h===d){return new uf(null,h,2,[b,c,e,g])}var k=new cf;return mf.ha(a,h,b,c,k).ha(a,d,e,g,k)}function of(a,b,c,d,e,g,h){var k=cc(c);if(k===e){return new uf(null,k,2,[c,d,g,h])}var m=new cf;return mf.ia(a,b,k,c,d,m).ia(a,b,e,g,h,m)}function vf(a,b,c,d,e){this.l=a;this.Ga=b;this.j=c;this.u=d;this.o=e;this.h=32374860;this.w=0}f=vf.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.l)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return null==this.u?new Q(null,2,5,R,[this.Ga[this.j],this.Ga[this.j+1]],null):y(this.u)};f.Y=function(){if(null==this.u){var a=this.Ga,b=this.j+2;return wf?wf(a,b,null):lf.call(null,a,b,null)}var a=this.Ga,b=this.j,c=D(this.u);return wf?wf(a,b,c):lf.call(null,a,b,c)};f.K=function(){return this};f.S=function(a,b){return new vf(b,this.Ga,this.j,this.u,this.o)};f.J=function(a,b){return F(b,this)};vf.prototype[Ga]=function(){return gc(this)};function lf(){switch(arguments.length){case 1:return kf(arguments[0]);case 3:return wf(arguments[0],arguments[1],arguments[2]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function kf(a){return wf(a,0,null)}function wf(a,b,c){if(null==c){for(c=a.length;;){if(b<c){if(null!=a[b]){return new vf(null,a,b,null,null)}var d=a[b+1];if(n(d)&&(d=d.Ua(),n(d))){return new vf(null,a,b+2,d,null)}b+=2}else{return null}}}else{return new vf(null,a,b,c,null)}}function xf(a,b,c,d,e){this.l=a;this.Ga=b;this.j=c;this.u=d;this.o=e;this.h=32374860;this.w=0}f=xf.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.l};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.l)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return y(this.u)};f.Y=function(){var a=this.Ga,b=this.j,c=D(this.u);return yf?yf(null,a,b,c):sf.call(null,null,a,b,c)};f.K=function(){return this};f.S=function(a,b){return new xf(b,this.Ga,this.j,this.u,this.o)};f.J=function(a,b){return F(b,this)};xf.prototype[Ga]=function(){return gc(this)};function sf(){switch(arguments.length){case 1:return rf(arguments[0]);case 4:return yf(arguments[0],arguments[1],arguments[2],arguments[3]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}}function rf(a){return yf(null,a,0,null)}function yf(a,b,c,d){if(null==d){for(d=b.length;;){if(c<d){var e=b[c];if(n(e)&&(e=e.Ua(),n(e))){return new xf(a,b,c+1,e,null)}c+=1}else{return null}}}else{return new xf(a,b,c,d,null)}}function zf(a,b,c,d,e,g){this.l=a;this.g=b;this.root=c;this.Z=d;this.fa=e;this.o=g;this.h=16123663;this.w=8196}f=zf.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.keys=function(){return gc(Ue.b?Ue.b(this):Ue.call(null,this))};f.entries=function(){return Ke(w(this))};f.values=function(){return gc(Ve.b?Ve.b(this):Ve.call(null,this))};f.has=function(a){return ed(this,a)};f.get=function(a,b){return this.F(null,a,b)};f.forEach=function(a){for(var b=w(this),c=null,d=0,e=0;;){if(e<d){var g=c.N(null,e),h=L(g,0),g=L(g,1);a.a?a.a(g,h):a.call(null,g,h);e+=1}else{if(b=w(b)){Zc(b)?(c=Ob(b),b=Qb(b),h=c,d=H(c),c=h):(c=y(b),h=L(c,0),c=g=L(c,1),a.a?a.a(c,h):a.call(null,c,h),b=D(b),c=null,d=0),e=0}else{return null}}}};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){return null==b?this.Z?this.fa:c:null==this.root?c:this.root.Fa(0,cc(b),b,c)};f.O=function(){return this.l};f.L=function(){return this.g};f.I=function(){var a=this.o;return null!=a?a:this.o=a=kc(this)};f.s=function(a,b){return Ie(this,b)};f.La=function(){return new Af({},this.root,this.g,this.Z,this.fa)};f.M=function(){return sb(Ze,this.l)};f.ib=function(a,b){if(null==b){return this.Z?new zf(this.l,this.g-1,this.root,!1,null,null):this}if(null==this.root){return this}var c=this.root.Va(0,cc(b),b);return c===this.root?this:new zf(this.l,this.g-1,c,this.Z,this.fa,null)};f.Qa=function(a,b,c){if(null==b){return this.Z&&c===this.fa?this:new zf(this.l,this.Z?this.g:this.g+1,this.root,!0,c,null)}a=new cf;b=(null==this.root?mf:this.root).ha(0,cc(b),b,c,a);return b===this.root?this:new zf(this.l,a.la?this.g+1:this.g,b,this.Z,this.fa,null)};f.eb=function(a,b){return null==b?this.Z:null==this.root?!1:this.root.Fa(0,cc(b),b,bd)!==bd};f.K=function(){if(0<this.g){var a=null!=this.root?this.root.Ua():null;return this.Z?F(new Q(null,2,5,R,[null,this.fa],null),a):a}return null};f.S=function(a,b){return new zf(b,this.g,this.root,this.Z,this.fa,this.o)};f.J=function(a,b){if(Yc(b)){return db(this,v.a(b,0),v.a(b,1))}for(var c=this,d=w(b);;){if(null==d){return c}var e=y(d);if(Yc(e)){c=db(c,v.a(e,0),v.a(e,1)),d=D(d)}else{throw Error("conj on a map takes map entries or seqables of map entries")}}};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.G(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return this.G(null,c)};a.i=function(a,c,d){return this.F(null,c,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return this.G(null,a)};f.a=function(a,b){return this.F(null,a,b)};var Ze=new zf(null,0,null,!1,null,lc);function Kc(a,b){for(var c=a.length,d=0,e=Ib(Ze);;){if(d<c){var g=d+1,e=e.Ta(null,a[d],b[d]),d=g}else{return Kb(e)}}}zf.prototype[Ga]=function(){return gc(this)};function Af(a,b,c,d,e){this.B=a;this.root=b;this.count=c;this.Z=d;this.fa=e;this.h=258;this.w=56}function Bf(a,b){if(a.B){if(b?b.h&2048||b.Eb||(b.h?0:r(hb,b)):r(hb,b)){return Cf(a,$e.b?$e.b(b):$e.call(null,b),af.b?af.b(b):af.call(null,b))}for(var c=w(b),d=a;;){var e=y(c);if(n(e)){var g=e,c=D(c),d=Cf(d,function(){var a=g;return $e.b?$e.b(a):$e.call(null,a)}(),function(){var a=g;return af.b?af.b(a):af.call(null,a)}())}else{return d}}}else{throw Error("conj! after persistent")}}function Cf(a,b,c){if(a.B){if(null==b){a.fa!==c&&(a.fa=c),a.Z||(a.count+=1,a.Z=!0)}else{var d=new cf;b=(null==a.root?mf:a.root).ia(a.B,0,cc(b),b,c,d);b!==a.root&&(a.root=b);d.la&&(a.count+=1)}return a}throw Error("assoc! after persistent!")}f=Af.prototype;f.L=function(){if(this.B){return this.count}throw Error("count after persistent!")};f.G=function(a,b){return null==b?this.Z?this.fa:null:null==this.root?null:this.root.Fa(0,cc(b),b)};f.F=function(a,b,c){return null==b?this.Z?this.fa:c:null==this.root?c:this.root.Fa(0,cc(b),b,c)};f.Ia=function(a,b){return Bf(this,b)};f.Ma=function(){var a;if(this.B){this.B=null,a=new zf(null,this.count,this.root,this.Z,this.fa,null)}else{throw Error("persistent! called twice")}return a};f.Ta=function(a,b,c){return Cf(this,b,c)};var Df=function Df(){return Df.m(0<arguments.length?new x(Array.prototype.slice.call(arguments,0),0):null)};Df.m=function(a){for(var b=w(a),c=Ib(Ze);;){if(b){a=D(D(b));var d=y(b),b=Cc(b),c=Lb(c,d,b),b=a}else{return Kb(c)}}};Df.v=0;Df.A=function(a){return Df.m(w(a))};var Ef=function Ef(){return Ef.m(0<arguments.length?new x(Array.prototype.slice.call(arguments,0),0):null)};Ef.m=function(a){a=a instanceof x&&0===a.j?a.c:Ia(a);for(var b=[],c=0;;){if(c<a.length){var d=a[c],e=a[c+1];-1===Me(b,d)&&(b.push(d),b.push(e));c+=2}else{break}}return new pa(null,b.length/2,b,null)};Ef.v=0;Ef.A=function(a){return Ef.m(w(a))};function Ff(a,b){this.X=a;this.ca=b;this.h=32374988;this.w=0}f=Ff.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.ca};f.W=function(){var a=this.X,a=(a?a.h&128||a.Ya||(a.h?0:r($a,a)):r($a,a))?this.X.W(null):D(this.X);return null==a?null:new Ff(a,this.ca)};f.I=function(){return ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.ca)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return this.X.R(null).jb()};f.Y=function(){var a=this.X,a=(a?a.h&128||a.Ya||(a.h?0:r($a,a)):r($a,a))?this.X.W(null):D(this.X);return null!=a?new Ff(a,this.ca):C};f.K=function(){return this};f.S=function(a,b){return new Ff(this.X,b)};f.J=function(a,b){return F(b,this)};Ff.prototype[Ga]=function(){return gc(this)};function Ue(a){return(a=w(a))?new Ff(a,null):null}function $e(a){return ib(a)}function Gf(a,b){this.X=a;this.ca=b;this.h=32374988;this.w=0}f=Gf.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.O=function(){return this.ca};f.W=function(){var a=this.X,a=(a?a.h&128||a.Ya||(a.h?0:r($a,a)):r($a,a))?this.X.W(null):D(this.X);return null==a?null:new Gf(a,this.ca)};f.I=function(){return ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.ca)};f.T=function(a,b){return zc(b,this)};f.U=function(a,b,c){return Bc(b,c,this)};f.R=function(){return this.X.R(null).kb()};f.Y=function(){var a=this.X,a=(a?a.h&128||a.Ya||(a.h?0:r($a,a)):r($a,a))?this.X.W(null):D(this.X);return null!=a?new Gf(a,this.ca):C};f.K=function(){return this};f.S=function(a,b){return new Gf(this.X,b)};f.J=function(a,b){return F(b,this)};Gf.prototype[Ga]=function(){return gc(this)};function Ve(a){return(a=w(a))?new Gf(a,null):null}function af(a){return jb(a)}function Hf(a,b,c){this.l=a;this.Ka=b;this.o=c;this.h=15077647;this.w=8196}f=Hf.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.keys=function(){return gc(w(this))};f.entries=function(){var a=w(this);return new Le(w(a))};f.values=function(){return gc(w(this))};f.has=function(a){return ed(this,a)};f.forEach=function(a){for(var b=w(this),c=null,d=0,e=0;;){if(e<d){var g=c.N(null,e),h=L(g,0),g=L(g,1);a.a?a.a(g,h):a.call(null,g,h);e+=1}else{if(b=w(b)){Zc(b)?(c=Ob(b),b=Qb(b),h=c,d=H(c),c=h):(c=y(b),h=L(c,0),c=g=L(c,1),a.a?a.a(c,h):a.call(null,c,h),b=D(b),c=null,d=0),e=0}else{return null}}}};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){return cb(this.Ka,b)?b:c};f.O=function(){return this.l};f.L=function(){return Oa(this.Ka)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=kc(this)};f.s=function(a,b){return Tc(b)&&H(this)===H(b)&&Md(function(a){return function(b){return ed(a,b)}}(this),b)};f.La=function(){return new If(Ib(this.Ka))};f.M=function(){return yc(Jf,this.l)};f.pb=function(a,b){return new Hf(this.l,fb(this.Ka,b),null)};f.K=function(){return Ue(this.Ka)};f.S=function(a,b){return new Hf(b,this.Ka,this.o)};f.J=function(a,b){return new Hf(this.l,Jc.i(this.Ka,b,null),null)};f.call=function(){var a=null,a=function(a,c,d){switch(arguments.length){case 2:return this.G(null,c);case 3:return this.F(null,c,d)}throw Error("Invalid arity: "+arguments.length)};a.a=function(a,c){return this.G(null,c)};a.i=function(a,c,d){return this.F(null,c,d)};return a}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return this.G(null,a)};f.a=function(a,b){return this.F(null,a,b)};var Jf=new Hf(null,Xe,lc);Hf.prototype[Ga]=function(){return gc(this)};function If(a){this.Da=a;this.w=136;this.h=259}f=If.prototype;f.Ia=function(a,b){this.Da=Lb(this.Da,b,null);return this};f.Ma=function(){return new Hf(null,Kb(this.Da),null)};f.L=function(){return H(this.Da)};f.G=function(a,b){return bb.i(this,b,null)};f.F=function(a,b,c){return bb.i(this.Da,b,bd)===bd?c:b};f.call=function(){function a(a,b,c){return bb.i(this.Da,b,bd)===bd?c:b}function b(a,b){return bb.i(this.Da,b,bd)===bd?null:b}var c=null,c=function(c,e,g){switch(arguments.length){case 2:return b.call(this,c,e);case 3:return a.call(this,c,e,g)}throw Error("Invalid arity: "+arguments.length)};c.a=b;c.i=a;return c}();f.apply=function(a,b){return this.call.apply(this,[this].concat(Ha(b)))};f.b=function(a){return bb.i(this.Da,a,bd)===bd?null:a};f.a=function(a,b){return bb.i(this.Da,a,bd)===bd?b:a};function Kf(a){a=w(a);if(null==a){return Jf}if(a instanceof x&&0===a.j){a=a.c;a:{for(var b=0,c=Ib(Jf);;){if(b<a.length){var d=b+1,c=c.Ia(null,a[b]),b=d}else{break a}}}return c.Ma(null)}for(d=Ib(Jf);;){if(null!=a){b=D(a),d=d.Ia(null,a.R(null)),a=b}else{return Kb(d)}}}function Lf(a){if(a&&(a.w&4096||a.Gb)){return a.name}if("string"===typeof a){return a}throw Error([u("Doesn't support name: "),u(a)].join(""))}var Mf=function Mf(){switch(arguments.length){case 2:return Mf.a(arguments[0],arguments[1]);case 3:return Mf.i(arguments[0],arguments[1],arguments[2]);default:return Mf.m(arguments[0],arguments[1],arguments[2],new x(Array.prototype.slice.call(arguments,3),0))}};Mf.a=function(a,b){return b};Mf.i=function(a,b,c){return(a.b?a.b(b):a.call(null,b))>(a.b?a.b(c):a.call(null,c))?b:c};Mf.m=function(a,b,c,d){return Ka(function(b,c){return Mf.i(a,b,c)},Mf.i(a,b,c),d)};Mf.A=function(a){var b=y(a),c=D(a);a=y(c);var d=D(c),c=y(d),d=D(d);return Mf.m(b,a,c,d)};Mf.v=3;function Nf(a,b){return new vd(null,function(){var c=w(b);if(c){var d;d=y(c);d=a.b?a.b(d):a.call(null,d);c=n(d)?F(y(c),Nf(a,ec(c))):null}else{c=null}return c},null,null)}function Of(a,b,c){this.j=a;this.end=b;this.step=c}Of.prototype.ab=function(){return 0<this.step?this.j<this.end:this.j>this.end};Of.prototype.next=function(){var a=this.j;this.j+=this.step;return a};function Pf(a,b,c,d,e){this.l=a;this.start=b;this.end=c;this.step=d;this.o=e;this.h=32375006;this.w=8192}f=Pf.prototype;f.toString=function(){return Ub(this)};f.equiv=function(a){return this.s(null,a)};f.N=function(a,b){if(b<Oa(this)){return this.start+b*this.step}if(this.start>this.end&&0===this.step){return this.start}throw Error("Index out of bounds")};f.da=function(a,b,c){return b<Oa(this)?this.start+b*this.step:this.start>this.end&&0===this.step?this.start:c};f.Ra=function(){return new Of(this.start,this.end,this.step)};f.O=function(){return this.l};f.W=function(){return 0<this.step?this.start+this.step<this.end?new Pf(this.l,this.start+this.step,this.end,this.step,null):null:this.start+this.step>this.end?new Pf(this.l,this.start+this.step,this.end,this.step,null):null};f.L=function(){return Ca(zb(this))?0:Math.ceil((this.end-this.start)/this.step)};f.I=function(){var a=this.o;return null!=a?a:this.o=a=ic(this)};f.s=function(a,b){return vc(this,b)};f.M=function(){return yc(C,this.l)};f.T=function(a,b){return mc(this,b)};f.U=function(a,b,c){for(a=this.start;;){if(0<this.step?a<this.end:a>this.end){var d=a;c=b.a?b.a(c,d):b.call(null,c,d);a+=this.step}else{return c}}};f.R=function(){return null==zb(this)?null:this.start};f.Y=function(){return null!=zb(this)?new Pf(this.l,this.start+this.step,this.end,this.step,null):C};f.K=function(){return 0<this.step?this.start<this.end?this:null:this.start>this.end?this:null};f.S=function(a,b){return new Pf(b,this.start,this.end,this.step,this.o)};f.J=function(a,b){return F(b,this)};Pf.prototype[Ga]=function(){return gc(this)};function Qf(a,b){return new vd(null,function(){var c=w(b);if(c){var d=y(c),e=a.b?a.b(d):a.call(null,d),d=F(d,Nf(function(b,c){return function(b){return E.a(c,a.b?a.b(b):a.call(null,b))}}(d,e,c,c),D(c)));return F(d,Qf(a,w(Rd(H(d),c))))}return null},null,null)}function yg(a){a:{for(var b=a;;){if(w(b)){b=D(b)}else{break a}}}return a}function zg(a,b){if("string"===typeof b){var c=a.exec(b);return null==c?null:1===H(c)?y(c):we(c)}throw new TypeError("re-find must match against a string.")}function Ag(a){if(a instanceof RegExp){return a}var b=zg(/^\(\?([idmsux]*)\)/,a),c=L(b,0),b=L(b,1);a=kd(a,H(c));return new RegExp(a,n(b)?b:"")}function Bg(a,b,c,d,e,g,h){var k=ka;ka=null==ka?null:ka-1;try{if(null!=ka&&0>ka){return Db(a,"#")}Db(a,c);if(0===wa.b(g)){w(h)&&Db(a,function(){var a=Cg.b(g);return n(a)?a:"..."}())}else{if(w(h)){var m=y(h);b.i?b.i(m,a,g):b.call(null,m,a,g)}for(var q=D(h),p=wa.b(g)-1;;){if(!q||null!=p&&0===p){w(q)&&0===p&&(Db(a,d),Db(a,function(){var a=Cg.b(g);return n(a)?a:"..."}()));break}else{Db(a,d);var z=y(q);c=a;h=g;b.i?b.i(z,c,h):b.call(null,z,c,h);var B=D(q);c=p-1;q=B;p=c}}}return Db(a,e)}finally{ka=k}}function Dg(a,b){for(var c=w(b),d=null,e=0,g=0;;){if(g<e){var h=d.N(null,g);Db(a,h);g+=1}else{if(c=w(c)){d=c,Zc(d)?(c=Ob(d),e=Qb(d),d=c,h=H(c),c=e,e=h):(h=y(d),Db(a,h),c=D(d),d=null,e=0),g=0}else{return null}}}}var Eg={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"};function Fg(a){return[u('"'),u(a.replace(RegExp('[\\\\"\b\f\n\r\t]',"g"),function(a){return Eg[a]})),u('"')].join("")}function Gg(a,b,c){if(null==a){return Db(b,"nil")}if(void 0===a){return Db(b,"#<undefined>")}if(n(function(){var b=Hc(c,ua);return n(b)?(b=a?a.h&131072||a.Fb?!0:a.h?!1:r(pb,a):r(pb,a))?Oc(a):b:b}())){Db(b,"^");var d=Oc(a);Hg.i?Hg.i(d,b,c):Hg.call(null,d,b,c);Db(b," ")}return null==a?Db(b,"nil"):a.Jb?a.Vb(a,b,c):a&&(a.h&2147483648||a.P)?a.H(null,b,c):(null==a?null:a.constructor)===Boolean||"number"===typeof a?Db(b,""+u(a)):null!=a&&a.constructor===Object?(Db(b,"#js "),d=P.a(function(b){return new Q(null,2,5,R,[ud.b(b),a[b]],null)},$c(a)),Ig.aa?Ig.aa(d,Hg,b,c):Ig.call(null,d,Hg,b,c)):Ba(a)?Bg(b,Hg,"#js ["," ","]",c,a):n("string"==typeof a)?n(ra.b(c))?Db(b,Fg(a)):Db(b,a):Lc(a)?Dg(b,xc(["#<",""+u(a),">"],0)):a instanceof Date?(d=function(a,b){for(var c=""+u(a);;){if(H(c)<b){c=[u("0"),u(c)].join("")}else{return c}}},Dg(b,xc(['#inst "',""+u(a.getUTCFullYear()),"-",d(a.getUTCMonth()+1,2),"-",d(a.getUTCDate(),2),"T",d(a.getUTCHours(),2),":",d(a.getUTCMinutes(),2),":",d(a.getUTCSeconds(),2),".",d(a.getUTCMilliseconds(),3),"-",'00:00"'],0))):n(a instanceof RegExp)?Dg(b,xc(['#"',a.source,'"'],0)):(a?a.h&2147483648||a.P||(a.h?0:r(Gb,a)):r(Gb,a))?Hb(a,b,c):Dg(b,xc(["#<",""+u(a),">"],0))}function Hg(a,b,c){var d=Jg.b(c);return n(d)?(c=Jc.i(c,Kg,Gg),d.i?d.i(a,b,c):d.call(null,a,b,c)):Gg(a,b,c)}function Ig(a,b,c,d){return Bg(c,function(a,c,d){var k=ib(a);b.i?b.i(k,c,d):b.call(null,k,c,d);Db(c," ");a=jb(a);return b.i?b.i(a,c,d):b.call(null,a,c,d)},"{",", ","}",d,w(a))}x.prototype.P=!0;x.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};vd.prototype.P=!0;vd.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};vf.prototype.P=!0;vf.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};Ne.prototype.P=!0;Ne.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};ye.prototype.P=!0;ye.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};td.prototype.P=!0;td.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};uc.prototype.P=!0;uc.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};zf.prototype.P=!0;zf.prototype.H=function(a,b,c){return Ig(this,Hg,b,c)};xf.prototype.P=!0;xf.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};Ce.prototype.P=!0;Ce.prototype.H=function(a,b,c){return Bg(b,Hg,"["," ","]",c,this)};Hf.prototype.P=!0;Hf.prototype.H=function(a,b,c){return Bg(b,Hg,"#{"," ","}",c,this)};zd.prototype.P=!0;zd.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};Gf.prototype.P=!0;Gf.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};Q.prototype.P=!0;Q.prototype.H=function(a,b,c){return Bg(b,Hg,"["," ","]",c,this)};nd.prototype.P=!0;nd.prototype.H=function(a,b){return Db(b,"()")};pa.prototype.P=!0;pa.prototype.H=function(a,b,c){return Ig(this,Hg,b,c)};Pf.prototype.P=!0;Pf.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};Ff.prototype.P=!0;Ff.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};md.prototype.P=!0;md.prototype.H=function(a,b,c){return Bg(b,Hg,"("," ",")",c,this)};var Lg={},Mg=function Mg(b){if(b?b.zb:b){return b.zb(b)}var c;c=Mg[l(null==b?null:b)];if(!c&&(c=Mg._,!c)){throw t("IEncodeJS.-clj->js",b)}return c.call(null,b)};function Ng(a){if(a?n(n(null)?null:a.yb)||(a.mb?0:r(Lg,a)):r(Lg,a)){a=Mg(a)}else{if("string"===typeof a||"number"===typeof a||a instanceof N){a=Og.b?Og.b(a):Og.call(null,a)}else{var b=xc([a],0);a=ma();if(Rc(b)){a=""}else{var c=u,d=new ia;a:{var e=new Tb(d);Hg(y(b),e,a);for(var b=w(D(b)),g=null,h=0,k=0;;){if(k<h){var m=g.N(null,k);Db(e," ");Hg(m,e,a);k+=1}else{if(b=w(b)){g=b,Zc(g)?(b=Ob(g),h=Qb(g),g=b,m=H(b),b=h,h=m):(m=y(g),Db(e," "),Hg(m,e,a),b=D(g),g=null,h=0),k=0}else{break a}}}}a=""+c(d)}}}return a}var Og=function Og(b){if(null==b){return null}if(b?n(n(null)?null:b.yb)||(b.mb?0:r(Lg,b)):r(Lg,b)){return Mg(b)}if(b instanceof N){return Lf(b)}if(Xc(b)){var c={};b=w(b);for(var d=null,e=0,g=0;;){if(g<e){var h=d.N(null,g),k=L(h,0),h=L(h,1);c[Ng(k)]=Og(h);g+=1}else{if(b=w(b)){Zc(b)?(e=Ob(b),b=Qb(b),d=e,e=H(e)):(e=y(b),d=L(e,0),e=L(e,1),c[Ng(d)]=Og(e),b=D(b),d=null,e=0),g=0}else{break}}}return c}if(Sc(b)){c=[];b=w(P.a(Og,b));d=null;for(g=e=0;;){if(g<e){k=d.N(null,g),c.push(k),g+=1}else{if(b=w(b)){d=b,Zc(d)?(b=Ob(d),g=Qb(d),d=b,e=H(b),b=g):(b=y(d),c.push(b),b=D(d),d=null,e=0),g=0}else{break}}}return c}return b},Pg={},Qg=function Qg(b,c){if(b?b.xb:b){return b.xb(b,c)}var d;d=Qg[l(null==b?null:b)];if(!d&&(d=Qg._,!d)){throw t("IEncodeClojure.-js->clj",b)}return d.call(null,b,c)};function Rg(a){var b=xc([Sg,!0],0),c=cd(b)?Id(Df,b):b,d=Hc(c,Sg);return function(a,c,d,k){return function q(p){return(p?n(n(null)?null:p.Nb)||(p.mb?0:r(Pg,p)):r(Pg,p))?Qg(p,Id(Ef,b)):cd(p)?yg(P.a(q,p)):Sc(p)?ce.a(null==p?null:Qa(p),P.a(q,p)):Ba(p)?we(P.a(q,p)):(null==p?null:p.constructor)===Object?ce.a(Xe,function(){return function(a,b,c,d){return function K(e){return new vd(null,function(a,b,c,d){return function(){for(;;){var a=w(e);if(a){if(Zc(a)){var b=Ob(a),c=H(b),g=new xd(Array(c),0);return function(){for(var a=0;;){if(a<c){var e=v.a(b,a),h=g,k=R,z;z=e;z=d.b?d.b(z):d.call(null,z);e=new Q(null,2,5,k,[z,q(p[e])],null);h.add(e);a+=1}else{return!0}}}()?Ad(g.ea(),K(Qb(a))):Ad(g.ea(),null)}var h=y(a);return F(new Q(null,2,5,R,[function(){var a=h;return d.b?d.b(a):d.call(null,a)}(),q(p[h])],null),K(ec(a)))}return null}}}(a,b,c,d),null,null)}}(a,c,d,k)($c(p))}()):p}}(b,c,d,n(d)?ud:u)(a)}var Tg=new N(null,"L","L",-1038307519),Ug=new N(null,"M","M",-1755742206),Vg=new N(null,"SK","SK",-2019305726),Wg=new N(null,"I","I",1827140963),Xg=new N(null,"codex","codex",-1831831581),Yg=new N(null,"CC","CC",-1077285628),ua=new N(null,"meta","meta",1499536964),Zg=new N(null,"protect","protect",-67966332),$g=new N(null,"beta","beta",455605892),va=new N(null,"dup","dup",556298533),ah=new N(null,"verb","verb",-1492655803),bh=new N(null,"R","R",-936662523),ch=new N(null,"AA","AA",2016584549),dh=new N(null,"O","O",795252742),S=new N(null,"A","A",-1688942394),eh=new N(null,"F","F",-1115543258),fh=new N(null,"second","second",-444702010),T=new N(null,"continue","continue",-207346553),gh=new N(null,"W","W",-2035370425),hh=new N(null,"Q","Q",663320520),ih=new N(null,"0","0",351625802),jh=new N(null,"P","P",1668913291),kh=new N(null,"original","original",-445386197),lh=new N(null,"D","D",-8015893),mh=new N(null,"revisited","revisited",-474682004),nh=new N(null,"refined","refined",-448168596),U=new N(null,"B","B",-1422503380),oh=new N(null,"TS","TS",-510110068),ph=new N(null,"J","J",1394734828),qh=new N(null,"Z","Z",459124588),rh=new N(null,"KN","KN",-509476499),Kg=new N(null,"fallback-impl","fallback-impl",-1501286995),sh=new N(null,"T","T",175240877),th=new N(null,"C","C",-173629587),qa=new N(null,"flush-on-newline","flush-on-newline",-151457939),uh=new N(null,"similarity","similarity",1871163855),vh=new N(null,"intact","intact",-1755370897),wh=new N(null,"KS","KS",-1201182352),ra=new N(null,"readably","readably",1129599760),Cg=new N(null,"more-marker","more-marker",-14717935),xh=new N(null,"BB","BB",1873237105),W=new N(null,"stop","stop",-2140911342),yh=new N(null,"E","E",230849842),zh=new N(null,"G","G",-738544397),wa=new N(null,"print-length","print-length",1931866356),Ah=new N(null,"Y","Y",-560717356),Bh=new N(null,"minimum","minimum",-1621006059),Ch=new N(null,"alpha","alpha",-1574982441),Dh=new N(null,"symmetric","symmetric",-960442568),Eh=new N(null,"TK","TK",-906932264),Fh=new N(null,"X","X",1705996313),Gh=new N(null,"H","H",-938148327),Hh=new N(null,"V","V",-1169284006),Ih=new N(null,"first","first",-644103046),Jh=new N(null,"KL","KL",1621356699),Jg=new N(null,"alt-impl","alt-impl",670969595),Kh=new N(null,"U","U",1362002044),Lh=new N(null,"S","S",1267293308),Mh=new N(null,"noun","noun",185846460),Sg=new N(null,"keywordize-keys","keywordize-keys",1310784252),Nh=new N(null,"N","N",-640629860),X=new N(null,"K","K",711741),Oh=new N(null,"match","match",1220059550);function Ph(a,b,c){if("string"===typeof b){return a.replace(new RegExp(String(b).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08"),"g"),c);
}if(b instanceof RegExp){return a.replace(new RegExp(b.source,"g"),c)}throw[u("Invalid match arg: "),u(b)].join("")}function Qh(a){var b=new ia;for(a=w(a);;){if(a){b.append(""+u(y(a))),a=D(a),null!=a&&b.append("|")}else{return b.toString()}}}function Rh(a){return a.toUpperCase()}function Sh(a){return a.toLowerCase()}function Y(a,b,c){b=0>b?H(a)+b:b;return Id(u,Qd(c,Rd(b,a)))}function Th(a){return ld(a,H(a)-1)}function Uh(a,b){var c=de(b);return Ka(function(){return function(a,b){return Jd(Ph,a,b)}}(c),a,c)}function qi(a){return Ph(a,/[^a-zA-Z]/,"")}function Z(a,b){return null!=zg(a,b)}function ri(a){return P.a(y,Qf(fd,a))}function si(a,b){var c;a:{c=[a];var d=c.length;if(d<=Ye){for(var e=0,g=Ib(Xe);;){if(e<d){var h=e+1,g=Lb(g,c[e],null),e=h}else{c=new Hf(null,Kb(g),null);break a}}}else{for(e=0,g=Ib(Jf);;){if(e<d){h=e+1,g=Jb(g,c[e]),e=h}else{c=Kb(g);break a}}}}return dd(Nd(c,b))}var ti=Od(si);var ui;a:{for(var vi=Ib(Xe),wi=w("AEIOUYWHBPFVCSKGJQXZDTLMNR"),xi=w("000000DD111122222222334556");;){if(wi&&xi){var yi,zi=y(wi),Ai=y(xi);yi=Lb(vi,zi,Ai);var Bi=D(wi),Ci=D(xi),vi=yi,wi=Bi,xi=Ci}else{ui=Kb(vi);break a}}}function Di(a){return ui.b?ui.b(a):ui.call(null,a)}function Ei(a){return ld([u(a),u("000")].join(""),4)}function Fi(a){return Zd(function(a){return Ld("D",a)},P.a(Di,a))}function Gi(a,b){return E.a(y(a),ui.b?ui.b(b):ui.call(null,b))?Rd(1,a):a}function Hi(a){return Z(/W|K|CZ|WITZ/,a)}function Ii(a){return Z(/^A|E|I|O|U|Y$/,a)}var Ji=Od(Z);function Ki(a,b){return 0<b&&E.a("CHAE",Y(a,b,4))?new Q(null,3,5,R,[X,Fh,2],null):n(function(){var c=0===b;return c?(c=si(Y(a,b+1,5),new Q(null,2,5,R,["HARAC","HARIS"],null)),c=n(c)?c:si(Y(a,b+1,3),new Q(null,4,5,R,["HOR","HYM","HIA","HEM"],null)),n(c)?Ld("CHORE",Y(a,0,5)):c):c}())?new Q(null,3,5,R,[X,X,2],null):n(function(){var c=si(Y(a,0,4),new Q(null,2,5,R,["VAN ","VON "],null));if(n(c)||(c=E.a("SCH",Y(a,0,3)))){return c}c=si(Y(a,b-2,6),new Q(null,3,5,R,["ORCHES","ARCHIT","ORCHID"],null));if(n(c)){return c}c=si(Y(a,b+2,1),new Q(null,2,5,R,["T","S"],null));if(n(c)){return c}c=(c=0===b)?c:si(Y(a,b-1,1),new Q(null,4,5,R,["A","O","U","E"],null));return n(c)?si(Y(a,b+2,1),new Q(null,10,5,R,"LRNMBHFVW ".split(""),null)):c}())?new Q(null,3,5,R,[X,X,2],null):0<b?new Q(null,3,5,R,[E.a("MC",Y(a,0,2))?X:Fh,X,2],null):new Q(null,3,5,R,[Fh,Fh,2],null)}function Li(a,b){return n(function(){var c=Z(/^I|E|H$/,Y(a,b+2,1));return n(c)?Ld("HU",Y(a,b+2,2)):c}())?n(function(){var c=E.a(b,1)&&E.a("A",Y(a,b-1,1));return c?c:Z(/^UCCE(E|S)$/,Y(a,b-1,5))}())?new Q(null,3,5,R,[wh,wh,3],null):new Q(null,3,5,R,[Fh,Fh,3],null):new Q(null,3,5,R,[X,X,2],null)}function Mi(a,b){var c;n(Z(/^ (C|Q|G)$/,Y(a,b+1,2)))?c=new Q(null,3,5,R,[X,X,3],null):(c=Z(/^C|K|Q$/,Y(a,b+1,1)),c=n(c)?Ca(si(Y(a,b+1,2),new Q(null,2,5,R,["CE","CI"],null))):c,c=new Q(null,3,5,R,[X,X,n(c)?2:1],null));return c}function Ni(a,b){return n(function(){var c=1<b;return c&&(c=Ii(Y(a,b-2,1)),n(c)&&(c=E.a("ACH",Y(a,b-1,3))))&&(c=Ld("I",Y(a,b+2,1)))?(c=Ld("E",Y(a,b+2,1)))?c:Z(/^(B|M)ACHER$/,Y(a,b-2,6)):c}())?new Q(null,3,5,R,[X,X,2],null):0===b&&E.a("CAESAR",Y(a,b,6))?new Q(null,3,5,R,[Lh,Lh,2],null):E.a("CHIA",Y(a,b,4))?new Q(null,3,5,R,[X,X,2],null):E.a("CH",Y(a,b,2))?Ki(a,b):E.a("CZ",Y(a,b,2))&&Ld("WICZ",Y(a,b-2,4))?new Q(null,3,5,R,[Lh,Fh,2],null):E.a("CIA",Y(a,b+1,3))?new Q(null,3,5,R,[Fh,Fh,3],null):!E.a("CC",Y(a,b,2))||E.a(b,1)||E.a("M",Y(a,0,1))?n(Z(/^C(K|G|Q)$/,Y(a,b,2)))?new Q(null,3,5,R,[X,X,2],null):n(Z(/^C(I|E|Y)$/,Y(a,b,2)))?new Q(null,3,5,R,[Lh,n(Z(/^CI(O|E|A)$/,Y(a,b,3)))?Fh:Lh,2],null):Mi(a,b):Li(a,b)}function Oi(a,b){var c;if(c=2<b){c=(c=E.a("U",Y(a,b-1,1)))?Z(/^C|G|L|R|T$/,Y(a,b-3,1)):c}return n(c)?new Q(null,3,5,R,[eh,eh,2],null):0<b&&Ld("I",Y(a,b-1,1))?new Q(null,3,5,R,[X,X,2],null):new Q(null,3,5,R,[null,null,2],null)}function Pi(a,b){return 0<b&&Ca(Ii(Y(a,b-1,1)))?new Q(null,3,5,R,[X,X,2],null):0===b?E.a("I",Y(a,b+2,1))?new Q(null,3,5,R,[ph,ph,2],null):new Q(null,3,5,R,[X,X,2],null):n(function(){var c=function(){var c=1<b;return c?Z(/^B|H|D$/,Y(a,b-2,1)):c}();if(n(c)){return c}c=function(){var c=2<b;return c?Z(/^B|H|D$/,Y(a,b-3,1)):c}();return n(c)?c:(c=3<b)?Z(/^B|H$/,Y(a,b-4,1)):c}())?new Q(null,3,5,R,[null,null,2],null):Oi(a,b)}function Qi(a,b){var c;if(c=E.a(b,1)){c=Ii(Y(a,0,1)),c=n(c)?Ca(Hi(a)):c}return n(c)?new Q(null,3,5,R,[rh,Nh,2],null):Ld("EY",Y(a,b+2,2))&&Ld("Y",Y(a,b+1,1))&&Ca(Hi(a))?new Q(null,3,5,R,[Nh,rh,2],null):new Q(null,3,5,R,[rh,rh,2],null)}function Ri(a,b){var c;c=Z(/^V(A|O)N $/,Y(a,0,4));c=n(c)?c:E.a("SCH",Y(a,0,3))||E.a("ET",Y(a,b+1,2));return n(c)?new Q(null,3,5,R,[X,X,2],null):E.a("IER ",Y(a,b+1,4))?new Q(null,3,5,R,[ph,ph,2],null):new Q(null,3,5,R,[ph,X,2],null)}function Si(a,b){return E.a("H",Y(a,b+1,1))?Pi(a,b):E.a("N",Y(a,b+1,1))?Qi(a,b):E.a("LI",Y(a,b+1,2))&&Ca(Hi(a))?new Q(null,3,5,R,[Jh,Tg,2],null):n(function(){var c=0===b;return c?(c=E.a("Y",Y(a,b+1,1)))?c:Z(/^(E(S|P|B|L|Y|I|R)|I(B|L|N|E))$/,Y(a,b+1,2)):c}())?new Q(null,3,5,R,[X,ph,2],null):n(function(){var c=E.a("ER",Y(a,b+1,2))||E.a("Y",Y(a,b+1,1));if(c&&(c=function(){var b=/^(D|R|M)ANGER$/,c=Y(a,0,6);return Ji.a?Ji.a(b,c):Ji.call(null,b,c)}(),n(c)&&(c=function(){var c=/^E|I$/,d=Y(a,b-1,1);return Ji.a?Ji.a(c,d):Ji.call(null,c,d)}(),n(c)))){var c=/^(R|O)GY$/,d=Y(a,b-1,3);return Ji.a?Ji.a(c,d):Ji.call(null,c,d)}return c}())?new Q(null,3,5,R,[X,ph,2],null):n(function(){var c=Z(/^E|I|Y$/,Y(a,b+1,1));return n(c)?c:Z(/^(A|O)GGI$/,Y(a,b-1,4))}())?Ri(a,b):E.a("G",Y(a,b+1,1))?new Q(null,3,5,R,[X,X,2],null):new Q(null,3,5,R,[X,X,1],null)}function Ti(a,b,c,d){return n(function(){var e=function(){var d=E.a(c-3,b);return d?Z(/^(ILL(O|A)|ALLE)$/,Y(a,b-1,4)):d}();if(n(e)){return e}e=function(){var b=Z(/^(A|O)S$/,Y(a,d-1,2));return n(b)?b:Z(/^A|O$/,Y(a,d,1))}();return n(e)?E.a("ALLE",Y(a,b-1,4)):e}())?new Q(null,3,5,R,[Tg,null,2],null):new Q(null,3,5,R,[Tg,Tg,2],null)}function Ui(a,b,c){var d=E.a("R",Y(a,b+1,1))?2:1;return n(function(){var d=E.a(c,b);if(d&&(d=Ca(Hi(a)))&&(d=E.a("IE",Y(a,b-2,2)))){var d=/^M(E|A)$/,g=Y(a,b-4,2);return Ji.a?Ji.a(d,g):Ji.call(null,d,g)}return d}())?new Q(null,3,5,R,[null,bh,d],null):new Q(null,3,5,R,[bh,bh,d],null)}function Vi(a,b){return E.a("H",Y(a,b+2,1))?n(Z(/^OO|ER|EN|UY|ED|EM$/,Y(a,b+3,2)))?new Q(null,3,5,R,[n(Z(/^E(R|N)$/,Y(a,b+3,2)))?Fh:Vg,Vg,3],null):new Q(null,3,5,R,[Fh,0===b&&Ca(Ii(Y(a,3,1)))&&Ld("W",Y(a,b+3,1))?Lh:Fh,3],null):n(Z(/^I|E|Y$/,Y(a,b+2,1)))?new Q(null,3,5,R,[Lh,Lh,3],null):new Q(null,3,5,R,[Vg,Vg,3],null)}function Wi(a,b,c){return n(Z(/^(I|Y)SL$/,Y(a,b-1,3)))?new Q(null,3,5,R,[null,null,1],null):0===b&&E.a("SUGAR",Y(a,b,5))?new Q(null,3,5,R,[Fh,Lh,1],null):E.a("SH",Y(a,b,2))?n(Z(/^H(EIM|OEK|OLM|OLZ)$/,Y(a,b+1,4)))?new Q(null,3,5,R,[Lh,Lh,2],null):new Q(null,3,5,R,[Fh,Fh,2],null):n(function(){var c=Z(/^SI(O|A)$/,Y(a,b,3));return n(c)?c:E.a("SIAN",Y(a,b,4))}())?new Q(null,3,5,R,[Lh,n(Hi(a))?Lh:Fh,3],null):n(function(){var c;c=(c=0===b)?Z(/^M|N|L|W$/,Y(a,b+1,1)):c;return n(c)?c:E.a("Z",Y(a,b+1,1))}())?new Q(null,3,5,R,[Lh,Fh,E.a("Z",Y(a,b+1,1))?2:1],null):E.a("SC",Y(a,b,2))?Vi(a,b):new Q(null,3,5,R,[n(function(){var d=E.a(c,b);return d?Z(/^(A|O)I$/,Y(a,b-2,2)):d}())?null:Lh,Lh,n(Z(/^S|Z$/,Y(a,b+1,1)))?2:1],null)}function Xi(a){return Ag([u("("),u(Qh(a)),u(")$")].join(""))}var Yi=Xi(xc("ational tional enci anci izer bli alli entli ousli ization ation ator alism iveness fulness ousness aliti iviti biliti logi".split(" "),0)),Zi=Xi(xc("icate ative alize iciti ical ful ness".split(" "),0)),$i=Xi(xc("al ance ence er ic able ible ant ement ment ent ou ism ate iti ous ive ize".split(" "),0)),aj=Kc("izer biliti fulness iveness logi alli ousness bli alism aliti ator ation anci ational tional iviti ization enci".split(" "),"ize ble ful ive log al ous ble al al ate ate ance ate tion ive ize ence".split(" ")),bj=new pa(null,7,"icate ic ative  alize al iciti ic ical ic ful  ness ".split(" "),null),cj=[u("[^aeiou]"),u("[^aeiou]"),u("*")].join(""),dj=[u("[aeiouy]"),u("[aeiouy]"),u("*")].join("");function ej(a){return function(b){return Z(Ag(a),b)}}var fj=ej([u("^("),u(cj),u(")?"),u(dj),u(cj)].join("")),gj=ej([u("^("),u(cj),u(")?"),u(dj),u(cj),u("("),u(dj),u(")?$")].join("")),hj=ej([u("^("),u(cj),u(")?"),u(dj),u(cj),u(dj),u(cj)].join("")),ij=ej([u("^("),u(cj),u(")?"),u("[aeiouy]")].join("")),jj=ej([u("^"),u(cj),u("[aeiouy]"),u("[^aeiouwxy]$")].join(""));function kj(a,b){var c=zg(a,b),d=L(c,0),e=L(c,1);null!=c?(c=""+u(d),d=b.lastIndexOf(c),c=0>d?b:[u(ld(b,d)),u(kd(b,d+H(c)))].join(""),e=new Q(null,2,5,R,[c,e],null)):e=new Q(null,2,5,R,[null,null],null);return e}function lj(a,b,c){var d=kj(b,a);b=L(d,0);d=L(d,1);return n(n(b)?fj.b?fj.b(b):fj.call(null,b):b)?[u(b),u(Hc(c,d))].join(""):a}var mj=new pa(null,2,[kh,M(/e$/,"",/^(cou|rou|tou|enou|trou)gh/,"$12f",/^gn/,"2n",/^mb/,"m2",/cq/,"2q",/ci/,"si",/ce/,"se",/cy/,"sy",/tch/,"2ch",/c/,"k",/q/,"k",/x/,"k",/v/,"f",/dg/,"2g",/tio/,"sio",/tia/,"sia",/d/,"t",/ph/,"fh",/b/,"p",/sh/,"s2",/z/,"s",/^[aieou]/,"A",/[aeiou]/,"3",/i/,"y",/^y3/,"Y3",/^y/,"A",/y/,"3",/3gh3/,"3kh3",/gh/,"22",/g/,"k",/s+/,"S",/t+/,"T",/p+/,"P",/k+/,"K",/f+/,"F",/m+/,"M",/n+/,"N",/w3/,"W3",/wh3/,"Wh3",/w$/,"3",/w/,"2",/^h/,"A",/h/,"2",/r3/,"R3",/r$/,"3",/r/,"2",/l3/,"L3",/l$/,"3",/l/,"2",/2/,"",/3$/,"A",/3/,""),mh,M(/e$/,"",/^(cou|rou|tou|enou|trou)gh/,"$12f",/^gn/,"2n",/mb$/,"mb",/cq/,"2q",/c([iey])/,"s",/tch/,"2ch",/[cqx]/,"k",/v/,"f",/dg/,"2g",/ti([oa])/,"si",/d/,"t",/ph/,"fh",/b/,"p",/sh/,"s2",/z/,"s",/^[aeiou]/,"A",/[aeiou]/,"3",/j/,"y",/^y3/,"Y3",/^y/,"A",/y/,"3",/3gh3/,"3kh3",/gh/,"22",/g/,"k",/s+/,"S",/t+/,"T",/p+/,"P",/k+/,"K",/f+/,"F",/m+/,"M",/n+/,"N",/w3/,"W3",/wh3/,"Wh3",/w$/,"3",/w/,"2",/^h/,"A",/h/,"2",/r3/,"R3",/r$/,"3",/r/,"2",/l3/,"L3",/l$/,"3",/l/,"2",/2/,"",/3$/,"A",/3/,"")],null);function nj(a,b){var c=qi(Sh(a)),c=Uh(c,mj.b?mj.b(b):mj.call(null,b));return ld([u(c),u(Id(u,Ud(10,"1")))].join(""),10)}var oj=function oj(){switch(arguments.length){case 1:return oj.b(arguments[0]);case 2:return oj.a(arguments[0],arguments[1]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};oj.b=function(a){return nj(a,kh)};oj.a=function(a,b){return nj(a,b)};oj.v=2;function pj(a){return $d(xa,a)}function qj(a,b){return de(Yd.a(a,Fd.a(b,Ud(H(a)-H(b),null))))}function rj(a){return Zd(function(a){return Ld(y(a),Cc(a))},a)}function sj(a){a=qi(Rh(a));a=Jd(u,y(a),Ph(Id(u,Rd(1,a)),/[AEIOU]/,""));a=ri(a);var b=H(a)-3;return Id(u,Fd.a(Qd(3,a),Sd(3<b?3:b,a)))}var tj=new pa(null,2,[kh,new pa(null,2,[Ih,M(/JR$/,"",/SR$/,"",/^MAC/,"MCC",/^KN/,"NN",/^K/,"C",/^(PH|PF)/,"FF",/^SCH/,"SSS",/(EE|IE)$/,"Y",/(DT|RT|RD|NT|ND)$/,"D"),fh,M(/EV/,"AF",/[EIOU]/,"A",/Q/,"G",/Z/,"S",/(M|KN)/,"N",/K/,"C",/SCH/,"SSS",/PH/,"FF",/([^A])H/,"$1",/(.)H[^A]/,"$1",/AW/,"A",/S$/,"",/AY$/,"Y",/A$/,"")],null),nh,new pa(null,2,[Ih,M(/JR$/,"",/SR$/,"",/(S|Z)$/,"",/MAC/,"MC",/PH/,"F",/IX$/,"IC",/EX$/,"EC",/(YE|EE|IE)/,"Y",/(DT|RT|RD|NT|ND)$/,"D",/(.+)EV/,"$1EF"),fh,M(/([AEIOU]+)W/,"$1",/[EIOU]/,"A",/AA+/,"A",/GHT/,"GT",/DG/,"G",/PH/,"F",/(.+)HA/,"$1A",/A+H/,"A",/KN/,"N",/K/,"C",/(.+)M/,"$1N",/(.+)Q/,"$1G",/(SH|SCH)/,"S",/YW/,"Y",/(.+)Y(.+)/,"$1A$2",/WR/,"R",/(.+)Z/,"$1S",/AY$/,"Y",/A+$/,"",/^\w/,"")],null)],null);function uj(a,b){return ri(Uh(a,b))}function vj(a,b){return(tj.b?tj.b(a):tj.call(null,a)).call(null,b)}function wj(a){return function(b){b=qi(fa(Rh(b)));var c=vj(a,Ih);b=Uh(b,c);return Id(u,Fd.a(Qd(1,b),uj(E.a(a,kh)?Id(u,Rd(1,b)):b,vj(a,fh))))}}var xj=new pa(null,2,[kh,wj(kh),nh,wj(nh)],null),yj=function yj(){switch(arguments.length){case 1:return yj.b(arguments[0]);case 2:return yj.a(arguments[0],arguments[1]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};yj.b=function(a){return(xj.b?xj.b(kh):xj.call(null,kh)).call(null,a)};yj.a=function(a,b){var c=ud.b(b);return(xj.b?xj.b(c):xj.call(null,c)).call(null,a)};yj.v=2;var zj=M(/([bcdfhjklmnpqrstvwxyz])\1+/,"$1",/^ae/,"E",/^[gkp]n/,"N",/^wr/,"R",/^x/,"S",/^wh/,"W",/mb$/,"M",/(?!^)sch/,"SK",/th/,"0",/t?ch|sh/,"X",/c(?=ia)/,"X",/[st](?=i[ao])/,"X",/s?c(?=[iey])/,"S",/[cq]/,"K",/dg(?=[iey])/,"J",/d/,"T",/g(?=h[^aeiou])/,"",/gn(ed)?/,"N",/([^g]|^)g(?=[iey])/,"$1J",/g+/,"K",/ph/,"F",/([aeiou])h(?=\b|[^aeiou])/,"$1",/[wy](?![aeiou])/,"",/z/,"S",/v/,"F",/(?!^)[aeiou]+/,"");function Aj(a){return Pd(function(b,c){return new Q(null,3,5,R,[Hc(a,b-1),c,Hc(a,b+1)],null)},a)}function Bj(a,b){return n(function(){var c;c=(c=null==a)?si(b,M("A","H","K","L","O","Q","R","U","X")):c;if(n(c)){return c}c=si(b,M("A","H","K","O","Q","U","X"));return n(c)?(c=M("S","Z"),ti.a?ti.a(a,c):ti.call(null,a,c)):c}())?4:8}function Cj(a){var b=y(a),c=Cc(a);a=Dc(a);return n(si(c,M("A","E","I","O","U","J","Y")))?0:E.a("H",c)?null:n(si(c,M("B","P")))?1:n(si(c,M("D","T")))?n(si(a,M("C","S","Z")))?8:2:n(si(c,M("F","V","W")))?3:n(si(c,M("G","K","Q")))?4:E.a("C",c)?Bj(b,a):E.a("X",c)?n(si(b,M("C","Q","K")))?8:48:E.a("L",c)?5:n(si(c,M("M","N")))?6:E.a("R",c)?7:n(si(c,M("S","Z")))?8:null}ea("clj_fuzzy.phonetics.metaphone",function(a){a=Sh(qi(a));return Rh(Uh(a,zj))});ea("clj_fuzzy.phonetics.double_metaphone",function(a){for(var b=[u(Rh(a)),u("     ")].join(""),c=n(Z(/^GN|KN|PN|WR|PS$/,Y(b,0,2)))?1:0,d=H(a),e=d-1,g=c,h=Fc,k=Fc;;){if(g>d||4<=H(h)&&4<=H(k)){return new Q(null,2,5,R,[Y(Id(u,P.a(Lf,h)),0,4),Y(Id(u,P.a(Lf,k)),0,4)],null)}var m,q=b,p=g,z=d,B=e,A=Y(q,p,1),G;if(n(Ii(A))){G=0===p?new Q(null,3,5,R,[S,S,1],null):new Q(null,3,5,R,[null,null,1],null)}else{var I;if(E.a("B",A)){I=new Q(null,3,5,R,[jh,jh,E.a("B",Y(q,p+1,1))?2:1],null)}else{var K;if(E.a("Ç",A)){K=new Q(null,3,5,R,[Lh,Lh,1],null)}else{var O;if(E.a("C",A)){O=Ni(q,p)}else{var V;if(E.a("D",A)){var aa=q,Fa=p;V=E.a("DG",Y(aa,Fa,2))?n(Z(/^I|E|Y$/,Y(aa,Fa+2,1)))?new Q(null,3,5,R,[ph,ph,3],null):new Q(null,3,5,R,[Eh,Eh,2],null):new Q(null,3,5,R,[sh,sh,n(Z(/^D(T|D)$/,Y(aa,Fa,2)))?2:1],null)}else{var Ja;if(E.a("F",A)){Ja=new Q(null,3,5,R,[eh,eh,E.a("F",Y(q,p+1,1))?2:1],null)}else{var J;if(E.a("G",A)){J=Si(q,p)}else{var ef;if(E.a("H",A)){var na=q,oa=p,sa=void 0,ta=void 0,ya=0===oa,ta=ya?ya:Ii(Y(na,oa-1,1)),sa=n(ta)?Ii(Y(na,oa+1,1)):ta;ef=n(sa)?new Q(null,3,5,R,[Gh,Gh,2],null):new Q(null,3,5,R,[null,null,1],null)}else{var za;if(E.a("J",A)){var Aa=q,Ea=p,Ya=B,Ta;if(E.a("JOSE",Y(Aa,Ea,4))||E.a("SAN ",Y(Aa,0,4))){var gb=Aa;Ta=0===Ea&&E.a(" ",Y(gb,Ea+4,1))||E.a("SAN ",Y(gb,0,4))?new Q(null,3,5,R,[Gh,Gh,1],null):new Q(null,3,5,R,[ph,Gh,1],null)}else{var Pa=Aa,Ua=Ea,Eb=Ya,yb=E.a("J",Y(Pa,Ua+1,1))?2:1,Fb=void 0;if(0===Ua&&Ld("JOSE",Y(Pa,Ua,4))){Fb=new Q(null,3,5,R,[ph,S,yb],null)}else{var Pb=void 0;var tc=Ii(Y(Pa,Ua-1,1));if(n(tc)){var Uc=Ca(Hi(Pa)),Pb=Uc?Z(/^A|O$/,Y(Pa,Ua+1,1)):Uc}else{Pb=tc}var Vc;if(n(Pb)){Vc=new Q(null,3,5,R,[ph,Gh,yb],null)}else{var pe=Pa,Rf=Ua,Sf=yb,Tf=void 0;if(E.a(Eb,Rf)){Tf=new Q(null,3,5,R,[ph,null,Sf],null)}else{var Uf=void 0;var Vf=void 0,Vh=/^L|T|K|S|N|M|B|Z$/,Wh=Y(pe,Rf+1,1),Vf=Ji.a?Ji.a(Vh,Wh):Ji.call(null,Vh,Wh);if(n(Vf)){var Xh=/^S|K|L$/,Yh=Y(pe,Rf-1,1),Uf=Ji.a?Ji.a(Xh,Yh):Ji.call(null,Xh,Yh)}else{Uf=Vf}Tf=n(Uf)?new Q(null,3,5,R,[ph,ph,Sf],null):new Q(null,3,5,R,[null,null,Sf],null)}Vc=Tf}Fb=Vc}Ta=Fb}za=Ta}else{var Wf;if(E.a("K",A)){Wf=new Q(null,3,5,R,[X,X,E.a("K",Y(q,p+1,1))?2:1],null)}else{var Xf;if(E.a("L",A)){var Zh=q,$h=p,Oj=z,Pj=B;Xf=E.a("L",Y(Zh,$h+1,1))?Ti(Zh,$h,Oj,Pj):new Q(null,3,5,R,[Tg,Tg,1],null)}else{var Yf;if(E.a("M",A)){var Zf=q,Oe=p,Qj=B;Yf=E.a("UMB",Y(Zf,Oe-1,3))&&(E.a(Qj-1,Oe)||E.a("ER",Y(Zf,Oe+2,2)))||E.a("M",Y(Zf,Oe+1,1))?new Q(null,3,5,R,[Ug,Ug,2],null):new Q(null,3,5,R,[Ug,Ug,1],null)}else{var $f;if(E.a("N",A)){$f=new Q(null,3,5,R,[Nh,Nh,E.a("N",Y(q,p+1,1))?2:1],null)}else{var ag;if(E.a("Ñ",A)){ag=new Q(null,3,5,R,[Nh,Nh,1],null)}else{var bg;if(E.a("P",A)){var ai=q,bi=p;bg=E.a("H",Y(ai,bi+1,1))?new Q(null,3,5,R,[eh,eh,2],null):new Q(null,3,5,R,[jh,jh,n(Z(/^P|B$/,Y(ai,bi+1,1)))?2:1],null)}else{var cg;if(E.a("Q",A)){cg=new Q(null,3,5,R,[X,X,E.a("Q",Y(q,p+1,1))?2:1],null)}else{var dg;if(E.a("R",A)){dg=Ui(q,p,B)}else{var eg;if(E.a("S",A)){eg=Wi(q,p,B)}else{var fg;if(E.a("T",A)){var od=q,pd=p,gg;if(E.a("TION",Y(od,pd,4))){gg=new Q(null,3,5,R,[Fh,Fh,3],null)}else{var hg;if(n(Z(/^T(IA|CH)$/,Y(od,pd,3)))){hg=new Q(null,3,5,R,[Fh,Fh,3],null)}else{var ig;if(E.a("TH",Y(od,pd,2))||E.a("TTH",Y(od,pd,3))){var jg=od,kg=void 0;var ci=Z(/^(O|A)M$/,Y(jg,pd+2,2));if(n(ci)){kg=ci}else{var di=Z(/^V(A|O)N /,Y(jg,0,4)),kg=n(di)?di:E.a("SCH",Y(jg,0,3))}ig=n(kg)?new Q(null,3,5,R,[sh,sh,2],null):new Q(null,3,5,R,[ih,sh,2],null)}else{ig=new Q(null,3,5,R,[sh,sh,n(Z(/^T|D$/,Y(od,pd+1,1)))?2:1],null)}hg=ig}gg=hg}fg=gg}else{var lg;if(E.a("V",A)){lg=new Q(null,3,5,R,[eh,eh,E.a("V",Y(q,p+1,1))?2:1],null)}else{var Pe;if(E.a("W",A)){var qd=q,rd=p,Rj=B;if(E.a("WR",Y(qd,rd,2))){Pe=new Q(null,3,5,R,[bh,bh,2],null)}else{var mg,ng=qd,Qe=rd,og=void 0;var ei=0===Qe;if(ei){var fi=Ii(Y(ng,Qe+1,1)),og=n(fi)?fi:E.a("WH",Y(ng,Qe,2))}else{og=ei}mg=n(og)?new Q(null,2,5,R,["A",n(Ii(Y(ng,Qe+1,1)))?"F":"A"],null):new Q(null,2,5,R,[null,null],null);var pg=L(mg,0),qg=L(mg,1),rg=void 0;var sg=void 0,gi=E.a(Rj,rd),sg=gi?Ii(Y(qd,rd-1,1)):gi;if(n(sg)){rg=sg}else{var hi=E.a("SCH",Y(qd,0,3)),rg=hi?hi:Z(/^EWSKI|EWSKY|OWSKI|OWSKY$/,Y(qd,rd-1,5))}var tg;if(n(rg)){var Sj=qg;tg=new Q(null,3,5,R,[ud.b(pg),ud.b([u(Sj),u("F")].join("")),1],null)}else{var ug;if(n(Z(/^WI(C|T)Z$/,Y(qd,rd,4)))){var Tj=qg;ug=new Q(null,3,5,R,[ud.b([u(pg),u("TS")].join("")),ud.b([u(Tj),u("FX")].join("")),4],null)}else{ug=new Q(null,3,5,R,[ud.b(pg),ud.b(qg),1],null)}tg=ug}Pe=tg}}else{var Re;if(E.a("X",A)){var vg=q,Vd=p,Uj=B;if(0===Vd){Re=new Q(null,3,5,R,[Lh,Lh,1],null)}else{var ii=n(Z(/^C|X$/,Y(vg,Vd+1,1)))?2:1,wg=void 0;var ji=E.a(Uj,Vd);if(ji){var ki=Z(/^(I|E)AU$/,Y(vg,Vd-3,3)),wg=n(ki)?ki:Z(/^(A|O)U$/,Y(vg,Vd-2,2))}else{wg=ji}Re=Ca(wg)?new Q(null,3,5,R,[wh,wh,ii],null):new Q(null,3,5,R,[null,null,ii],null)}}else{var Se;if(E.a("Z",A)){var Wd=q,Xd=p;if(E.a("H",Y(Wd,Xd+1,1))){Se=new Q(null,3,5,R,[ph,ph,2],null)}else{var li=E.a("Z",Y(Wd,Xd+1,1))?2:1,xg=void 0;var mi=Z(/^Z(O|I|A)$/,Y(Wd,Xd+1,2));if(n(mi)){xg=mi}else{var ni=Hi(Wd),xg=n(ni)?0<Xd&&Ld("T",Y(Wd,Xd-1,1)):ni}Se=n(xg)?new Q(null,3,5,R,[Lh,oh,li],null):new Q(null,3,5,R,[Lh,Lh,li],null)}}else{Se=new Q(null,3,5,R,[null,null,1],null)}Re=Se}Pe=Re}lg=Pe}fg=lg}eg=fg}dg=eg}cg=dg}bg=cg}ag=bg}$f=ag}Yf=$f}Xf=Yf}Wf=Xf}za=Wf}ef=za}J=ef}Ja=J}V=Ja}O=V}K=O}I=K}G=I}m=G;var oi=L(m,0),pi=L(m,1),Vj=L(m,2)+g,Wj=null==oi?h:Ec.a(h,oi),Xj=null==pi?k:Ec.a(k,pi),g=Vj,h=Wj,k=Xj}});ea("clj_fuzzy.phonetics.soundex",function(a){a=qi(Rh(a));var b=y(a),c=Fi(Id(u,Rd(1,a))),d=Gi(c,b);return Ei([u(b),u(Id(u,Zd(function(){return function(a){return Ld("0",a)}}(a,b,c,d),ri(d))))].join(""))});ea("clj_fuzzy.phonetics.nysiis",yj);ea("clj_fuzzy.phonetics.caverphone",oj);ea("clj_fuzzy.phonetics.mra_codex",sj);ea("clj_fuzzy.phonetics.cologne",function(a){a=Aj(qi(Uh(Rh(a),M(/\u00c4/,"A",/\u00d6/,"O",/\u00dc/,"U",/\u00df/,"SS",/PH/,"F"))));return Id(u,$d(jd,ri($d(xa,P.a(Cj,a)))))});var Dj=M(/alistically$/,U,/arizability$/,S,/izationally$/,U,/antialness$/,S,/arisations$/,S,/arizations$/,S,/entialness$/,S,/allically$/,th,/antaneous$/,S,/antiality$/,S,/arisation$/,S,/arization$/,S,/ationally$/,U,/ativeness$/,S,/eableness$/,yh,/entations$/,S,/entiality$/,S,/entialize$/,S,/entiation$/,S,/ionalness$/,S,/istically$/,S,/itousness$/,S,/izability$/,S,/izational$/,S,/ableness$/,S,/arizable$/,S,/entation$/,S,/entially$/,S,/eousness$/,S,/ibleness$/,S,/icalness$/,S,/ionalism$/,S,/ionality$/,S,/ionalize$/,S,/iousness$/,S,/izations$/,S,/lessness$/,S,/ability$/,S,/aically$/,S,/alistic$/,U,/alities$/,S,/ariness$/,yh,/aristic$/,S,/arizing$/,S,/ateness$/,S,/atingly$/,S,/ational$/,U,/atively$/,S,/ativism$/,S,/elihood$/,yh,/encible$/,S,/entally$/,S,/entials$/,S,/entiate$/,S,/entness$/,S,/fulness$/,S,/ibility$/,S,/icalism$/,S,/icalist$/,S,/icality$/,S,/icalize$/,S,/ication$/,zh,/icianry$/,S,/ination$/,S,/ingness$/,S,/ionally$/,S,/isation$/,S,/ishness$/,S,/istical$/,S,/iteness$/,S,/iveness$/,S,/ivistic$/,S,/ivities$/,S,/ization$/,eh,/izement$/,S,/oidally$/,S,/ousness$/,S,/aceous$/,S,/acious$/,U,/action$/,zh,/alness$/,S,/ancial$/,S,/ancies$/,S,/ancing$/,U,/ariser$/,S,/arized$/,S,/arizer$/,S,/atable$/,S,/ations$/,U,/atives$/,S,/eature$/,qh,/efully$/,S,/encies$/,S,/encing$/,S,/ential$/,S,/enting$/,th,/entist$/,S,/eously$/,S,/ialist$/,S,/iality$/,S,/ialize$/,S,/ically$/,S,/icance$/,S,/icians$/,S,/icists$/,S,/ifully$/,S,/ionals$/,S,/ionate$/,lh,/ioning$/,S,/ionist$/,S,/iously$/,S,/istics$/,S,/izable$/,yh,/lessly$/,S,/nesses$/,S,/oidism$/,S,/acies$/,S,/acity$/,S,/aging$/,U,/aical$/,S,/alist$/,S,/alism$/,U,/ality$/,S,/alize$/,S,/allic$/,xh,/anced$/,U,/ances$/,U,/antic$/,th,/arial$/,S,/aries$/,S,/arily$/,S,/arity$/,U,/arize$/,S,/aroid$/,S,/ately$/,S,/ating$/,Wg,/ation$/,U,/ative$/,S,/ators$/,S,/atory$/,S,/ature$/,yh,/early$/,Ah,/ehood$/,S,/eless$/,S,/elity$/,S,/ement$/,S,/enced$/,S,/ences$/,S,/eness$/,yh,/ening$/,yh,/ental$/,S,/ented$/,th,/ently$/,S,/fully$/,S,/ially$/,S,/icant$/,S,/ician$/,S,/icide$/,S,/icism$/,S,/icist$/,S,/icity$/,S,/idine$/,Wg,/iedly$/,S,/ihood$/,S,/inate$/,S,/iness$/,S,/ingly$/,U,/inism$/,ph,/inity$/,Yg,/ional$/,S,/ioned$/,S,/ished$/,S,/istic$/,S,/ities$/,S,/itous$/,S,/ively$/,S,/ivity$/,S,/izers$/,eh,/izing$/,eh,/oidal$/,S,/oides$/,S,/otide$/,S,/ously$/,S,/able$/,S,/ably$/,S,/ages$/,U,/ally$/,U,/ance$/,U,/ancy$/,U,/ants$/,U,/aric$/,S,/arly$/,X,/ated$/,Wg,/ates$/,S,/atic$/,U,/ator$/,S,/ealy$/,Ah,/edly$/,yh,/eful$/,S,/eity$/,S,/ence$/,S,/ency$/,S,/ened$/,yh,/enly$/,yh,/eous$/,S,/hood$/,S,/ials$/,S,/ians$/,S,/ible$/,S,/ibly$/,S,/ical$/,S,/ides$/,Tg,/iers$/,S,/iful$/,S,/ines$/,Ug,/ings$/,Nh,/ions$/,U,/ious$/,S,/isms$/,U,/ists$/,S,/itic$/,Gh,/ized$/,eh,/izer$/,eh,/less$/,S,/lily$/,S,/ness$/,S,/ogen$/,S,/ward$/,S,/wise$/,S,/ying$/,U,/yish$/,S,/acy$/,S,/age$/,U,/aic$/,S,/als$/,xh,/ant$/,U,/ars$/,dh,/ary$/,eh,/ata$/,S,/ate$/,S,/eal$/,Ah,/ear$/,Ah,/ely$/,yh,/ene$/,yh,/ent$/,th,/ery$/,yh,/ese$/,S,/ful$/,S,/ial$/,S,/ian$/,S,/ics$/,S,/ide$/,Tg,/ied$/,S,/ier$/,S,/ies$/,jh,/ily$/,S,/ine$/,Ug,/ing$/,Nh,/ion$/,hh,/ish$/,th,/ism$/,U,/ist$/,S,/ite$/,ch,/ity$/,S,/ium$/,S,/ive$/,S,/ize$/,eh,/oid$/,S,/one$/,bh,/ous$/,S,/ae$/,S,/al$/,xh,/ar$/,Fh,/as$/,U,/ed$/,yh,/en$/,eh,/es$/,yh,/ia$/,S,/ic$/,S,/is$/,S,/ly$/,U,/on$/,Lh,/or$/,sh,/um$/,Kh,/us$/,Hh,/yl$/,bh,/s'/,S,/'s$/,S,/a$/,S,/e$/,S,/i$/,S,/o$/,S,/s$/,gh,/y$/,U),Ej=Kc([Tg,Ug,Wg,Yg,bh,ch,dh,S,eh,gh,hh,jh,lh,U,ph,qh,sh,th,xh,yh,zh,Ah,Fh,Gh,Hh,Kh,Lh,Nh,X],[function(a){return Ca(Z(/(u|x|([^o]s))$/,a))},function(a){return Ca(Z(/[acem]$/,a))},function(a){return Ca(Z(/[oe]$/,a))},function(a){return Z(/l$/,a)},function(a){return Z(/[nr]$/,a)},function(a){return Z(/([dflt]|ph|th|er|or|es)$/,a)},function(a){return Z(/[li]$/,a)},function(){return!0},function(a){var b=(Ej.b?Ej.b(U):Ej.call(null,U)).call(null,a);return n(b)?Ej.a?Ej.a(yh,a):Ej.call(null,yh,a):b},function(a){return Ca(Z(/[su]$/,a))},function(a){var b=(Ej.b?Ej.b(U):Ej.call(null,U)).call(null,a);return n(b)?Ca(Z(/[ln]$/,a)):b},function(a){return Ca(Z(/c$/,a))},function(a){return 4<H(a)},function(a){return 2<H(a)},function(a){return Ca(Z(/[ae]$/,a))},function(a){return Ca(Z(/f$/,a))},function(a){return Z(/(s|[^o]t)$/,a)},function(a){return 3<H(a)},function(a){var b=(Ej.b?Ej.b(U):Ej.call(null,U)).call(null,a);return n(b)?Ca(Z(/(met|ryst)/,a)):b},function(a){return Ca(Z(/e$/,a))},function(a){var b=(Ej.b?Ej.b(U):Ej.call(null,U)).call(null,a);return n(b)?Z(/f$/,a):b},function(a){return Z(/in$/,a)},function(a){return Z(/(l|i|u\we)$/,a)},function(a){return Z(/(t|ll)$/,a)},function(a){return Z(/c$/,a)},function(a){return Z(/[lmnr]$/,a)},function(a){return Z(/(dr|[^t]t)$/,a)},function(a){return n(Z(/s\w{2}$/,a))?(Ej.b?Ej.b(th):Ej.call(null,th)).call(null,a):(Ej.b?Ej.b(U):Ej.call(null,U)).call(null,a)},function(a){var b=(Ej.b?Ej.b(U):Ej.call(null,U)).call(null,a);return n(b)?Z(/(l|i|(u\we))$/,a):b}]),Fj=M(/iev$/,"ief",/uct$/,"uc",/umpt$/,"um",/rpt$/,"rb",/urs$/,"ur",/istr$/,"ister",/metr$/,"meter",/olv$/,"olut",/([^aoi])ul$/,"$1l",/bex$/,"bic",/dex$/,"dic",/pex$/,"pic",/tex$/,"tic",/ax$/,"ac",/ex$/,"ec",/ix$/,"ic",/lux$/,"luc",/uad$/,"uas",/vad$/,"vas",/cid$/,"cis",/lid$/,"lis",/erid$/,"eris",/pand$/,"pans",/([^s])end$/,"$1ens",/ond$/,"ons",/lud$/,"lus",/rud$/,"rus",/([^pt])her$/,"$1hes",/mit$/,"mis",/([^m])ent$/,"$1ens",/ert$/,"ers",/([^n])et$/,"$1es",/(yt|yz)$/,"ys");function Gj(a){return function(b){var c=y(b);b=Cc(b);c=Ph(a,c,"");var d=H(c)<H(a);b=d?(d=1<H(c))?(Ej.b?Ej.b(b):Ej.call(null,b)).call(null,c):d:d;return n(b)?c:null}}function Hj(a){var b=Nd(function(b){return n(Z(y(b),a))?b:null},de(Fj));if(n(b)){var c=L(b,0),b=L(b,1);return Ph(a,c,b)}return a}var Ij=ve("atque quoque neque itaque absque apsque abusque adaeque adusque denique deque susque oblique peraeque plenisque quandoque quisque quaeque cuiusque cuique quemque quamque quaque quique quorumque quarumque quibusque quosque quasque quotusquisque quousque ubique undique usque uterque utique utroque utribique torque coque concoque contorque detorque decoque excoque extorque obtorque optorque retorque recoque attorque incoque intorque praetorque".split(" ")),Jj=new Q(null,19,5,R,[/ibus$/,/ius$/,/ae$/,/am$/,/as$/,/em$/,/es$/,/ia$/,/is$/,/nt$/,/os$/,/ud$/,/um$/,/us$/,/a$/,/e$/,/i$/,/o$/,/u$/],null),Kj=new Q(null,25,5,R,[M(/iuntur$/,"$1i"),M(/erunt$/,"$1i"),M(/untur$/,"$1i"),M(/iunt$/,"$1i"),M(/unt$/,"$1i"),M(/beris$/,"$1bi"),M(/bor$/,"$1bi"),M(/bo$/,"$1bi"),M(/ero$/,"$1eri"),M(/mini$/),M(/ntur$/),M(/stis$/),M(/mur$/),M(/mus$/),M(/ris$/),M(/sti$/),M(/tis$/),M(/tur$/),M(/ns$/),M(/nt$/),M(/ri$/),M(/m$/),M(/r$/),M(/s$/),M(/t$/)],null);function Lj(a){var b=Nd(function(b){return n(Z(b,a))?b:null},Jj);return n(b)?Ph(a,b,""):a}function Mj(a){var b=Nd(function(b){return n(Z(y(b),a))?b:null},Kj);if(n(b)){var c=n(Cc(b))?Ag([u("(.{2,})"),u(y(b))].join("")):y(b),d=function(){var a=Cc(b);return n(a)?a:""}();return Ph(a,c,d)}return a}var Nj=Kc("abcdefghijlmnprstuvyz".split(""),[new Q(null,2,5,R,[M("ia","",vh),M("a","",vh)],null),new Q(null,1,5,R,[M("bb","b",W)],null),new Q(null,3,5,R,[M("ytic","ys",W),M("ic","",T),M("nc","nt",T)],null),new Q(null,6,5,R,[M("dd","d",W),M("ied","y",T),M("ceed","cess",W),M("eed","ee",W),M("ed","",T),M("hood","",T)],null),new Q(null,1,5,R,[M("e","",T)],null),new Q(null,2,5,R,[M("lief","liev",W),M("if","",T)],null),new Q(null,4,5,R,[M("ing","",T),M("iag","y",W),M("ag","",T),M("gg","g",W)],null),new Q(null,3,5,R,[M("th","",vh),M("guish","ct",W),M("ish","",T)],null),new Q(null,2,5,R,[M("i","",vh),M("i","y",T)],null),new Q(null,9,5,R,[M("ij","id",W),M("fuj","fus",W),M("uj","ud",W),M("oj","od",W),M("hej","her",W),M("verj","vert",W),M("misj","mit",W),M("nj","nd",W),M("j","s",W)],null),new Q(null,13,5,R,[M("ifiabl","",W),M("iabl","y",W),M("abl","",T),M("ibl","",W),M("bil","bl",T),M("cl","c",W),M("iful","y",W),M("ful","",T),M("ul","",W),M("ial","",T),M("ual","",T),M("al","",T),M("ll","l",W)],null),new Q(null,4,5,R,[M("ium","",W),M("um","",vh),M("ism","",T),M("mm","m",W)],null),new Q(null,8,5,R,[M("sion","j",T),M("xion","ct",W),M("ion","",T),M("ian","",T),M("an","",T),M("een","",Zg),M("en","",T),M("nn","n",W)],null),new Q(null,2,5,R,[M("ship","",T),M("pp","p",W)],null),new Q(null,9,5,R,[M("er","",T),M("ear","",Zg),M("ar","",W),M("ior","",T),M("or","",T),M("ur","",T),M("rr","r",W),M("tr","t",T),M("ier","y",T)],null),new Q(null,9,5,R,[M("ies","y",T),M("sis","s",W),M("is","",T),M("ness","",T),M("ss","",Zg),M("ous","",T),M("us","",vh),M("s","",T),M("s","",W)],null),new Q(null,14,5,R,[M("plicat","ply",W),M("at","",T),M("ment","",T),M("ent","",T),M("ant","",T),M("ript","rib",W),M("orpt","orb",W),M("duct","duc",W),M("sumpt","sum",W),M("cept","ceiv",W),M("olut","olv",W),M("sist","",Zg),M("ist","",T),M("tt","t",W)],null),new Q(null,2,5,R,[M("iqu","",W),M("ogu","og",W)],null),new Q(null,3,5,R,[M("siv","j",T),M("eiv","",Zg),M("iv","",T)],null),new Q(null,17,5,R,[M("bly","bl",T),M("ily","y",T),M("ply","",Zg),M("ly","",T),M("ogy","og",W),M("phy","ph",W),M("omy","om",W),M("opy","op",W),M("ity","",T),M("ety","",T),M("lty","l",W),M("istry","",W),M("ary","",T),M("ory","",T),M("ify","",W),M("ncy","nt",T),M("acy","",T)],null),new Q(null,2,5,R,[M("iz","",T),M("yz","ys",W)],null)]);function Yj(a){return Z(/[aeiouy]/,""+u(a))}ea("clj_fuzzy.stemmers.lancaster",function(a){a:{a=Sh(qi(a));for(var b=!0;;){var c;c=Dc(a);c=Nj.b?Nj.b(c):Nj.call(null,c);if(n(c)){b:{for(var d=0;;){var e=Ic(c,d,C),g=y(e),h=Cc(e),k=Dc(e),m=H(a)-H(g);if(null==w(e)){c=new Q(null,2,5,R,[!1,a],null);break b}if(Ca(b)&&E.a(k,vh)){d+=1}else{if(0>m||Ld(a.substring(m),g)){d+=1}else{if(E.a(k,Zg)){c=new Q(null,2,5,R,[!1,a],null);break b}e=[u(ld(a,m)),u(h)].join("");g=e;g=n(Yj(y(g)))?1<H(g):(h=2<H(g))?Yj(g):h;if(Ca(g)){d+=1}else{c=E.a(k,T)?new Q(null,2,5,R,[!0,e],null):new Q(null,2,5,R,[!1,e],null);break b}}}}}a=L(c,0);c=L(c,1);if(n(a)){a=c,b=!1}else{a=c;break a}}else{break a}}}return a});ea("clj_fuzzy.stemmers.lovins",function(a){a=Ph(Sh(a),/[^a-zA-Z']/,"");var b=Nd(Gj(a),de(Dj));a=Ph(n(b)?b:a,/([bdglmnprst])\1{1,}$/,"$1");return Hj(a)});ea("clj_fuzzy.stemmers.porter",function(a){if(!(3>H(a))){a=Sh(a);a=n(Z(/^y/,a))?2>H(a)?Rh(a):[u(Rh(ld(a,1))),u(Sh(a.substring(1)))].join(""):a;var b=kj(/(ss|i)es$/,a),c=L(b,0),b=L(b,1),d=kj(/([^s])s$/,a),e=L(d,0),d=L(d,1);a=n(c)?[u(c),u(b)].join(""):n(e)?[u(e),u(d)].join(""):a;n(Z(/eed$/,a))?(c=ld(a,H(a)-3),c=fj.b?fj.b(c):fj.call(null,c),a=n(c)?Th(a):a):n(Z(/(ed|ing)$/,a))&&(c=kj(/(ed|ing)$/,a),b=L(c,0),L(c,1),a=n(ij.b?ij.b(b):ij.call(null,b))?n(Z(/(at|bl|iz)$/,b))?[u(b),u("e")].join(""):n(Z(/([^aeiouylsz])\1$/,b))?Th(b):n(jj.b?jj.b(b):jj.call(null,b))?[u(b),u("e")].join(""):b:a);c=zg(/y$/,a);b=Th(a);a=n(n(c)?ij.b?ij.b(b):ij.call(null,b):c)?[u(b),u("i")].join(""):a;a=lj(a,Yi,aj);a=lj(a,Zi,bj);c=kj($i,a);b=L(c,0);L(c,1);n(n(b)?hj.b?hj.b(b):hj.call(null,b):b)?a=b:(b=kj(/(s|t)(ion)$/,a),c=L(b,0),b=L(b,1),b=[u(c),u(b)].join(""),a=n(n(c)?hj.b?hj.b(b):hj.call(null,b):c)?b:a);n(Z(/e$/,a))&&(c=Th(a),b=hj.b?hj.b(c):hj.call(null,c),n(b)||(b=gj.b?gj.b(c):gj.call(null,c),b=n(b)?Ca(jj.b?jj.b(c):jj.call(null,c)):b),a=n(b)?c:a);c=Z(/ll$/,a);c=n(c)?hj.b?hj.b(a):hj.call(null,a):c;a=n(c)?Th(a):a;a=E.a("Y",y(a))?[u("y"),u(Rd(1,a))].join(""):a}return a});ea("clj_fuzzy.stemmers.schinke",function(a){a=qi(Sh(a));a=Uh(a,M(/j/,"i",/v/,"u"));var b;b=Z(/que$/,a);b=n(b)?si(a,Ij):b;b=n(b)?!1:Ph(a,/que$/,"");if(n(b)){a=Lj(b);var c=Mj(b);return new pa(null,2,[Mh,1<H(a)?a:b,ah,1<H(c)?c:b],null)}return new pa(null,2,[Mh,a,ah,a],null)});function Zj(a,b){var c=Jd(Mf,a,b);return F(c,$d(function(a){return function(b){return a===b}}(c),b))}var ak=function ak(){switch(arguments.length){case 1:return ak.b(arguments[0]);case 2:return ak.a(arguments[0],arguments[1]);default:return ak.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};ak.b=function(a){return a};ak.a=function(a,b){for(;;){if(H(b)<H(a)){var c=a;a=b;b=c}else{return Ka(function(a,b){return function(a,c){return ed(b,c)?a:Qc.a(a,c)}}(a,b),a,a)}}};ak.m=function(a,b,c){a=Zj(function(a){return-H(a)},Ec.m(c,b,xc([a],0)));return Ka(ak,y(a),ec(a))};ak.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return ak.m(b,a,c)};ak.v=2;var bk=function bk(){switch(arguments.length){case 1:return bk.b(arguments[0]);case 2:return bk.a(arguments[0],arguments[1]);default:return bk.m(arguments[0],arguments[1],new x(Array.prototype.slice.call(arguments,2),0))}};bk.b=function(a){return a};bk.a=function(a,b){return H(a)<H(b)?Ka(function(a,d){return ed(b,d)?Qc.a(a,d):a},a,a):Ka(Qc,a,b)};bk.m=function(a,b,c){return Ka(bk,a,Ec.a(c,b))};bk.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return bk.m(b,a,c)};bk.v=2;function ck(a,b){var c=Kf(a),d=Kf(b),e=H(ak.a(c,d)),c=H(c)<H(d)?Ka(Ec,d,c):Ka(Ec,c,d);return 1-e/H(c)}function dk(a,b,c){return Ka(function(a,c){var g=L(c,0),h=L(c,1),k=L(c,2);E.a(k,b)||(g=g<h?g:h,h=Pc(a),g=(g<h?g:h)+1);return Ec.a(a,g)},new Q(null,1,5,R,[y(a)+1],null),P.aa(xe,a,D(a),c))}function ek(a,b,c,d){a=Kf(a);b=Kf(b);var e=H(ak.a(a,b));return e/(e+c*H(bk.a(a,b))+d*H(bk.a(b,a)))}function fk(a,b,c,d){a=Kf(a);var e=Kf(b);b=H(ak.a(a,e));var g=H(bk.a(a,e));a=H(bk.a(e,a));return b/(b+d*(c*(g<a?g:a)+Math.pow(1-c,g>a?g:a)))}var gk=function gk(){return gk.m(arguments[0],arguments[1],2<arguments.length?new x(Array.prototype.slice.call(arguments,2),0):null);
};gk.m=function(a,b,c){var d=cd(c)?Id(Df,c):c;c=Ic(d,Ch,1);var e=Ic(d,$g,1),d=Ic(d,Dh,!1);return(n(d)?fk:ek).call(null,a,b,c,e)};gk.v=2;gk.A=function(a){var b=y(a),c=D(a);a=y(c);c=D(c);return gk.m(b,a,c)};function hk(a,b){return H(a)>=H(b)?new Q(null,2,5,R,[a,b],null):new Q(null,2,5,R,[b,a],null)}function ik(a){a=(a/2|0)-1;return 0<a?a:0}function jk(a,b,c,d,e,g,h){for(var k=h;;){var m=Od(xa).call(null,d);if(n(n(m)?d<=e:m)){Ca(Hc(h,d))&&E.a(b,Hc(c,d))?(g=Jc.i(g,a,b),k=Jc.i(k,d,Hc(c,d)),d=null):d+=1}else{return new Q(null,2,5,R,[g,k],null)}}}function kk(a,b){for(var c=hk(a,b),d=L(c,0),c=L(c,1),e=H(d),g=H(c),h=ik(e),k=0,m=we(Ud(e,null)),q=we(Ud(e,null));;){if(k<e){var p=function(){var a=k-h;return 0<a?a:0}(),z=function(){var a=k+h+1;return a<g?a:g}(),q=jk(k,Hc(d,k),c,p,z,m,q),m=L(q,0),q=L(q,1),k=k+1}else{return new Q(null,2,5,R,[$d(xa,m),$d(xa,q)],null)}}}function lk(a,b){var c=H(a)-H(b),d=de(Yd.a(a,Fd.a(b,Ud(c,null))));return H(Zd(function(){return function(a){return Ld(y(a),Cc(a))}}(c,d),d))/2}function mk(a,b){var c=kk(a,b),d=L(c,0),e=L(c,1),c=H(d),d=lk(d,e);return 0===c?0:(c/H(a)+c/H(b)+(c-d)/c)/3}function nk(a,b){if(E.a(a,b)){return 1}if(2>H(a)&&2>H(b)){return 0}var c=Rh(Ph(a,/\s+/,"")),c=Kf(ee(2,1,c)),d=Rh(Ph(b,/\s+/,"")),d=Kf(ee(2,1,d)),e=H(c)+H(d);return 2*H(ak.a(c,d))/e}ea("clj_fuzzy.metrics.levenshtein",function(a,b){return Rc(a)&&Rc(b)?0:Rc(a)?H(b):Rc(b)?H(a):Pc(Ka(function(a,d){return dk(a,d,b)},P.i(function(a,b){return b},F(null,b),new Pf(null,0,Number.MAX_VALUE,1,null)),a))});ea("clj_fuzzy.metrics.dice",nk);ea("clj_fuzzy.metrics.sorensen",nk);ea("clj_fuzzy.metrics.mra_comparison",function(a,b){var c=sj(a),d=sj(b),e=H(c)-H(d);if(3>Math.abs(e)){var e=H(c)+H(d),e=4>=e?5:4<e&&7>=e?4:7<e&&11>=e?3:2,g,h;g=H(c);h=H(d);h=g>h?new Q(null,2,5,R,[c,d],null):new Q(null,2,5,R,[d,c],null);g=L(h,0);h=L(h,1);h=rj(qj(g,h));g=pj(P.a(y,h));h=pj(P.a(Cc,h));g=qj(sd(g),sd(h));g=6-H(pj(rj(g)));return new pa(null,4,[Bh,e,uh,g,Xg,new Q(null,2,5,R,[c,d],null),Oh,g>=e],null)}return null});ea("clj_fuzzy.metrics.jaccard",ck);ea("clj_fuzzy.metrics.tanimoto",ck);ea("clj_fuzzy.metrics.hamming",function(a,b){var c=H(a),d=H(b);return E.a(c,d)?H($d(function(){return function(a){return E.a(y(a),Cc(a))}}(c,d),de(Yd.a(a,b)))):null});ea("clj_fuzzy.metrics.jaro",mk);ea("clj_fuzzy.metrics.jaro_winkler",function(a,b){var c=mk(a,b);a:{for(var d=0,e=0;;){if(4>d){E.a(Hc(a,d),Hc(b,d))?(e+=1,d+=1):d=5}else{break a}}}return c+.1*e*(1-c)});ea("clj_fuzzy.metrics.tversky",gk);function ok(a,b){return function(){function c(a){var b=null;if(0<arguments.length){for(var b=0,c=Array(arguments.length-0);b<c.length;){c[b]=arguments[b+0],++b}b=new x(c,0)}return d.call(this,b)}function d(c){var d=Qd(b,c);c=y(Rd(b,c));c=Rg(c);c=be(w(c));return Id(a,Fd.a(d,c))}c.v=0;c.A=function(a){a=w(a);return d(a)};c.m=d;return c}()}var pk=function pk(){switch(arguments.length){case 1:return pk.b(arguments[0]);case 2:return pk.a(arguments[0],arguments[1]);default:throw Error([u("Invalid arity: "),u(arguments.length)].join(""))}};ea("clj_fuzzy.js.convert_keyword_fn",pk);pk.b=function(a){return ok(a,0)};pk.a=function(a,b){return ok(a,b)};pk.v=2;ea("clj_fuzzy.js.clj_to_js",Og)})();(function(){var js=clj_fuzzy.js,mra=clj_fuzzy.metrics.mra_comparison,tversky=clj_fuzzy.metrics.tversky,dm=clj_fuzzy.phonetics.double_metaphone,schinke=clj_fuzzy.stemmers.schinke;clj_fuzzy.metrics.mra_comparison=function(){return js.clj_to_js(mra.apply(null,arguments))};clj_fuzzy.phonetics.double_metaphone=function(){return js.clj_to_js(dm.apply(null,arguments))};clj_fuzzy.stemmers.schinke=function(){return js.clj_to_js(schinke.apply(null,arguments))};clj_fuzzy.metrics.tversky=js.convert_keyword_fn(tversky,2);delete clj_fuzzy.js})();if(typeof exports!=="undefined"){if(typeof module!=="undefined"&&module.exports)exports=module.exports=clj_fuzzy;exports.clj_fuzzy=clj_fuzzy}else if(typeof define==="function"&&define.amd)define("clj_fuzzy",[],function(){return clj_fuzzy});

},{}],27:[function(require,module,exports){
require('../../modules/es6.string.iterator');
require('../../modules/es6.array.from');
module.exports = require('../../modules/_core').Array.from;

},{"../../modules/_core":35,"../../modules/es6.array.from":83,"../../modules/es6.string.iterator":86}],28:[function(require,module,exports){
require('../../modules/es6.object.assign');
module.exports = require('../../modules/_core').Object.assign;

},{"../../modules/_core":35,"../../modules/es6.object.assign":84}],29:[function(require,module,exports){
require('../../modules/es6.object.keys');
module.exports = require('../../modules/_core').Object.keys;

},{"../../modules/_core":35,"../../modules/es6.object.keys":85}],30:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],31:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":51}],32:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":74,"./_to-iobject":76,"./_to-length":77}],33:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof');
var TAG = require('./_wks')('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":34,"./_wks":81}],34:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],35:[function(require,module,exports){
var core = module.exports = { version: '2.5.5' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],36:[function(require,module,exports){
'use strict';
var $defineProperty = require('./_object-dp');
var createDesc = require('./_property-desc');

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};

},{"./_object-dp":60,"./_property-desc":68}],37:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":30}],38:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],39:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":43}],40:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":44,"./_is-object":51}],41:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],42:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var ctx = require('./_ctx');
var hide = require('./_hide');
var has = require('./_has');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":35,"./_ctx":37,"./_global":44,"./_has":45,"./_hide":46}],43:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],44:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],45:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],46:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":39,"./_object-dp":60,"./_property-desc":68}],47:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":44}],48:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":39,"./_dom-create":40,"./_fails":43}],49:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":34}],50:[function(require,module,exports){
// check on default Array iterator
var Iterators = require('./_iterators');
var ITERATOR = require('./_wks')('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"./_iterators":56,"./_wks":81}],51:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],52:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"./_an-object":31}],53:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":46,"./_object-create":59,"./_property-desc":68,"./_set-to-string-tag":70,"./_wks":81}],54:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":42,"./_hide":46,"./_iter-create":53,"./_iterators":56,"./_library":57,"./_object-gpo":63,"./_redefine":69,"./_set-to-string-tag":70,"./_wks":81}],55:[function(require,module,exports){
var ITERATOR = require('./_wks')('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};

},{"./_wks":81}],56:[function(require,module,exports){
module.exports = {};

},{}],57:[function(require,module,exports){
module.exports = true;

},{}],58:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys = require('./_object-keys');
var gOPS = require('./_object-gops');
var pIE = require('./_object-pie');
var toObject = require('./_to-object');
var IObject = require('./_iobject');
var $assign = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function () {
  var A = {};
  var B = {};
  // eslint-disable-next-line no-undef
  var S = Symbol();
  var K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function (k) { B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source) { // eslint-disable-line no-unused-vars
  var T = toObject(target);
  var aLen = arguments.length;
  var index = 1;
  var getSymbols = gOPS.f;
  var isEnum = pIE.f;
  while (aLen > index) {
    var S = IObject(arguments[index++]);
    var keys = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S);
    var length = keys.length;
    var j = 0;
    var key;
    while (length > j) if (isEnum.call(S, key = keys[j++])) T[key] = S[key];
  } return T;
} : $assign;

},{"./_fails":43,"./_iobject":49,"./_object-gops":62,"./_object-keys":65,"./_object-pie":66,"./_to-object":78}],59:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":31,"./_dom-create":40,"./_enum-bug-keys":41,"./_html":47,"./_object-dps":61,"./_shared-key":71}],60:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":31,"./_descriptors":39,"./_ie8-dom-define":48,"./_to-primitive":79}],61:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":31,"./_descriptors":39,"./_object-dp":60,"./_object-keys":65}],62:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],63:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":45,"./_shared-key":71,"./_to-object":78}],64:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":32,"./_has":45,"./_shared-key":71,"./_to-iobject":76}],65:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":41,"./_object-keys-internal":64}],66:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],67:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export');
var core = require('./_core');
var fails = require('./_fails');
module.exports = function (KEY, exec) {
  var fn = (core.Object || {})[KEY] || Object[KEY];
  var exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function () { fn(1); }), 'Object', exp);
};

},{"./_core":35,"./_export":42,"./_fails":43}],68:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],69:[function(require,module,exports){
module.exports = require('./_hide');

},{"./_hide":46}],70:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":45,"./_object-dp":60,"./_wks":81}],71:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":72,"./_uid":80}],72:[function(require,module,exports){
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"./_global":44}],73:[function(require,module,exports){
var toInteger = require('./_to-integer');
var defined = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":38,"./_to-integer":75}],74:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":75}],75:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],76:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":38,"./_iobject":49}],77:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":75}],78:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":38}],79:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":51}],80:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],81:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":44,"./_shared":72,"./_uid":80}],82:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"./_classof":33,"./_core":35,"./_iterators":56,"./_wks":81}],83:[function(require,module,exports){
'use strict';
var ctx = require('./_ctx');
var $export = require('./_export');
var toObject = require('./_to-object');
var call = require('./_iter-call');
var isArrayIter = require('./_is-array-iter');
var toLength = require('./_to-length');
var createProperty = require('./_create-property');
var getIterFn = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":36,"./_ctx":37,"./_export":42,"./_is-array-iter":50,"./_iter-call":52,"./_iter-detect":55,"./_to-length":77,"./_to-object":78,"./core.get-iterator-method":82}],84:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', { assign: require('./_object-assign') });

},{"./_export":42,"./_object-assign":58}],85:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./_to-object');
var $keys = require('./_object-keys');

require('./_object-sap')('keys', function () {
  return function keys(it) {
    return $keys(toObject(it));
  };
});

},{"./_object-keys":65,"./_object-sap":67,"./_to-object":78}],86:[function(require,module,exports){
'use strict';
var $at = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":54,"./_string-at":73}],87:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],88:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.itsSet = itsSet;

var _lodash = require('lodash.get');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function itsSet(val) {
  var checkVal = function checkVal(v) {
    return typeof v !== 'undefined' && v !== null;
  };
  if (!checkVal(val)) return false;
  if (val.constructor === Array) {
    return val.every(function (v) {
      return checkVal(v);
    });
  } else if (arguments.length === 2) {
    return checkVal((0, _lodash2.default)(arguments[0], arguments[1]));
  }
  return true;
}

exports.default = itsSet;
},{"lodash.get":90}],89:[function(require,module,exports){
/* eslint-disable no-nested-ternary */
'use strict';
var arr = [];
var charCodeCache = [];

module.exports = function (a, b) {
	if (a === b) {
		return 0;
	}

	var swap = a;

	// Swapping the strings if `a` is longer than `b` so we know which one is the
	// shortest & which one is the longest
	if (a.length > b.length) {
		a = b;
		b = swap;
	}

	var aLen = a.length;
	var bLen = b.length;

	if (aLen === 0) {
		return bLen;
	}

	if (bLen === 0) {
		return aLen;
	}

	// Performing suffix trimming:
	// We can linearly drop suffix common to both strings since they
	// don't increase distance at all
	// Note: `~-` is the bitwise way to perform a `- 1` operation
	while (aLen > 0 && (a.charCodeAt(~-aLen) === b.charCodeAt(~-bLen))) {
		aLen--;
		bLen--;
	}

	if (aLen === 0) {
		return bLen;
	}

	// Performing prefix trimming
	// We can linearly drop prefix common to both strings since they
	// don't increase distance at all
	var start = 0;

	while (start < aLen && (a.charCodeAt(start) === b.charCodeAt(start))) {
		start++;
	}

	aLen -= start;
	bLen -= start;

	if (aLen === 0) {
		return bLen;
	}

	var bCharCode;
	var ret;
	var tmp;
	var tmp2;
	var i = 0;
	var j = 0;

	while (i < aLen) {
		charCodeCache[start + i] = a.charCodeAt(start + i);
		arr[i] = ++i;
	}

	while (j < bLen) {
		bCharCode = b.charCodeAt(start + j);
		tmp = j++;
		ret = j;

		for (i = 0; i < aLen; i++) {
			tmp2 = bCharCode === charCodeCache[start + i] ? tmp : tmp + 1;
			tmp = arr[i];
			ret = arr[i] = tmp > ret ? tmp2 > ret ? ret + 1 : tmp2 : tmp2 > tmp ? tmp + 1 : tmp2;
		}
	}

	return ret;
};

},{}],90:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    splice = arrayProto.splice;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],91:[function(require,module,exports){
(function (global){
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright JS Foundation and other contributors <https://js.foundation/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
;(function() {

  /** Used as a safe reference for `undefined` in pre-ES5 environments. */
  var undefined;

  /** Used as the semantic version number. */
  var VERSION = '4.17.10';

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Error message constants. */
  var CORE_ERROR_TEXT = 'Unsupported core-js use. Try https://npms.io/search?q=ponyfill.',
      FUNC_ERROR_TEXT = 'Expected a function';

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /** Used as the internal argument placeholder. */
  var PLACEHOLDER = '__lodash_placeholder__';

  /** Used to compose bitmasks for cloning. */
  var CLONE_DEEP_FLAG = 1,
      CLONE_FLAT_FLAG = 2,
      CLONE_SYMBOLS_FLAG = 4;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

  /** Used to compose bitmasks for function metadata. */
  var WRAP_BIND_FLAG = 1,
      WRAP_BIND_KEY_FLAG = 2,
      WRAP_CURRY_BOUND_FLAG = 4,
      WRAP_CURRY_FLAG = 8,
      WRAP_CURRY_RIGHT_FLAG = 16,
      WRAP_PARTIAL_FLAG = 32,
      WRAP_PARTIAL_RIGHT_FLAG = 64,
      WRAP_ARY_FLAG = 128,
      WRAP_REARG_FLAG = 256,
      WRAP_FLIP_FLAG = 512;

  /** Used as default options for `_.truncate`. */
  var DEFAULT_TRUNC_LENGTH = 30,
      DEFAULT_TRUNC_OMISSION = '...';

  /** Used to detect hot functions by number of calls within a span of milliseconds. */
  var HOT_COUNT = 800,
      HOT_SPAN = 16;

  /** Used to indicate the type of lazy iteratees. */
  var LAZY_FILTER_FLAG = 1,
      LAZY_MAP_FLAG = 2,
      LAZY_WHILE_FLAG = 3;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0,
      MAX_SAFE_INTEGER = 9007199254740991,
      MAX_INTEGER = 1.7976931348623157e+308,
      NAN = 0 / 0;

  /** Used as references for the maximum length and index of an array. */
  var MAX_ARRAY_LENGTH = 4294967295,
      MAX_ARRAY_INDEX = MAX_ARRAY_LENGTH - 1,
      HALF_MAX_ARRAY_LENGTH = MAX_ARRAY_LENGTH >>> 1;

  /** Used to associate wrap methods with their bit flags. */
  var wrapFlags = [
    ['ary', WRAP_ARY_FLAG],
    ['bind', WRAP_BIND_FLAG],
    ['bindKey', WRAP_BIND_KEY_FLAG],
    ['curry', WRAP_CURRY_FLAG],
    ['curryRight', WRAP_CURRY_RIGHT_FLAG],
    ['flip', WRAP_FLIP_FLAG],
    ['partial', WRAP_PARTIAL_FLAG],
    ['partialRight', WRAP_PARTIAL_RIGHT_FLAG],
    ['rearg', WRAP_REARG_FLAG]
  ];

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      asyncTag = '[object AsyncFunction]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      domExcTag = '[object DOMException]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      nullTag = '[object Null]',
      objectTag = '[object Object]',
      promiseTag = '[object Promise]',
      proxyTag = '[object Proxy]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]',
      undefinedTag = '[object Undefined]',
      weakMapTag = '[object WeakMap]',
      weakSetTag = '[object WeakSet]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match empty string literals in compiled template source. */
  var reEmptyStringLeading = /\b__p \+= '';/g,
      reEmptyStringMiddle = /\b(__p \+=) '' \+/g,
      reEmptyStringTrailing = /(__e\(.*?\)|\b__t\)) \+\n'';/g;

  /** Used to match HTML entities and HTML characters. */
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g,
      reUnescapedHtml = /[&<>"']/g,
      reHasEscapedHtml = RegExp(reEscapedHtml.source),
      reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

  /** Used to match template delimiters. */
  var reEscape = /<%-([\s\S]+?)%>/g,
      reEvaluate = /<%([\s\S]+?)%>/g,
      reInterpolate = /<%=([\s\S]+?)%>/g;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g,
      reHasRegExpChar = RegExp(reRegExpChar.source);

  /** Used to match leading and trailing whitespace. */
  var reTrim = /^\s+|\s+$/g,
      reTrimStart = /^\s+/,
      reTrimEnd = /\s+$/;

  /** Used to match wrap detail comments. */
  var reWrapComment = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/,
      reWrapDetails = /\{\n\/\* \[wrapped with (.+)\] \*/,
      reSplitDetails = /,? & /;

  /** Used to match words composed of alphanumeric characters. */
  var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Used to match
   * [ES template delimiters](http://ecma-international.org/ecma-262/7.0/#sec-template-literal-lexical-components).
   */
  var reEsTemplate = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g;

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to match Latin Unicode letters (excluding mathematical operators). */
  var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

  /** Used to ensure capturing order of template delimiters. */
  var reNoMatch = /($^)/;

  /** Used to match unescaped characters in compiled string literals. */
  var reUnescapedString = /['\n\r\u2028\u2029\\]/g;

  /** Used to compose unicode character classes. */
  var rsAstralRange = '\\ud800-\\udfff',
      rsComboMarksRange = '\\u0300-\\u036f',
      reComboHalfMarksRange = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange = '\\u20d0-\\u20ff',
      rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
      rsDingbatRange = '\\u2700-\\u27bf',
      rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
      rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
      rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
      rsPunctuationRange = '\\u2000-\\u206f',
      rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
      rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
      rsVarRange = '\\ufe0e\\ufe0f',
      rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

  /** Used to compose unicode capture groups. */
  var rsApos = "['\u2019]",
      rsAstral = '[' + rsAstralRange + ']',
      rsBreak = '[' + rsBreakRange + ']',
      rsCombo = '[' + rsComboRange + ']',
      rsDigits = '\\d+',
      rsDingbat = '[' + rsDingbatRange + ']',
      rsLower = '[' + rsLowerRange + ']',
      rsMisc = '[^' + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
      rsFitz = '\\ud83c[\\udffb-\\udfff]',
      rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
      rsNonAstral = '[^' + rsAstralRange + ']',
      rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
      rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
      rsUpper = '[' + rsUpperRange + ']',
      rsZWJ = '\\u200d';

  /** Used to compose unicode regexes. */
  var rsMiscLower = '(?:' + rsLower + '|' + rsMisc + ')',
      rsMiscUpper = '(?:' + rsUpper + '|' + rsMisc + ')',
      rsOptContrLower = '(?:' + rsApos + '(?:d|ll|m|re|s|t|ve))?',
      rsOptContrUpper = '(?:' + rsApos + '(?:D|LL|M|RE|S|T|VE))?',
      reOptMod = rsModifier + '?',
      rsOptVar = '[' + rsVarRange + ']?',
      rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
      rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])',
      rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])',
      rsSeq = rsOptVar + reOptMod + rsOptJoin,
      rsEmoji = '(?:' + [rsDingbat, rsRegional, rsSurrPair].join('|') + ')' + rsSeq,
      rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

  /** Used to match apostrophes. */
  var reApos = RegExp(rsApos, 'g');

  /**
   * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
   * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
   */
  var reComboMark = RegExp(rsCombo, 'g');

  /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
  var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

  /** Used to match complex or compound words. */
  var reUnicodeWord = RegExp([
    rsUpper + '?' + rsLower + '+' + rsOptContrLower + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
    rsMiscUpper + '+' + rsOptContrUpper + '(?=' + [rsBreak, rsUpper + rsMiscLower, '$'].join('|') + ')',
    rsUpper + '?' + rsMiscLower + '+' + rsOptContrLower,
    rsUpper + '+' + rsOptContrUpper,
    rsOrdUpper,
    rsOrdLower,
    rsDigits,
    rsEmoji
  ].join('|'), 'g');

  /** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
  var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');

  /** Used to detect strings that need a more robust regexp to match words. */
  var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

  /** Used to assign default `context` object properties. */
  var contextProps = [
    'Array', 'Buffer', 'DataView', 'Date', 'Error', 'Float32Array', 'Float64Array',
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Map', 'Math', 'Object',
    'Promise', 'RegExp', 'Set', 'String', 'Symbol', 'TypeError', 'Uint8Array',
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap',
    '_', 'clearTimeout', 'isFinite', 'parseInt', 'setTimeout'
  ];

  /** Used to make template sourceURLs easier to identify. */
  var templateCounter = -1;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] =
  cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
  cloneableTags[boolTag] = cloneableTags[dateTag] =
  cloneableTags[float32Tag] = cloneableTags[float64Tag] =
  cloneableTags[int8Tag] = cloneableTags[int16Tag] =
  cloneableTags[int32Tag] = cloneableTags[mapTag] =
  cloneableTags[numberTag] = cloneableTags[objectTag] =
  cloneableTags[regexpTag] = cloneableTags[setTag] =
  cloneableTags[stringTag] = cloneableTags[symbolTag] =
  cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
  cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] =
  cloneableTags[weakMapTag] = false;

  /** Used to map Latin Unicode letters to basic Latin letters. */
  var deburredLetters = {
    // Latin-1 Supplement block.
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss',
    // Latin Extended-A block.
    '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
    '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
    '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
    '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
    '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
    '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
    '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
    '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
    '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
    '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
    '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
    '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
    '\u0134': 'J',  '\u0135': 'j',
    '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
    '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
    '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
    '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
    '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
    '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
    '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
    '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
    '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
    '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
    '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
    '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
    '\u0163': 't',  '\u0165': 't', '\u0167': 't',
    '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
    '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
    '\u0174': 'W',  '\u0175': 'w',
    '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
    '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
    '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
    '\u0132': 'IJ', '\u0133': 'ij',
    '\u0152': 'Oe', '\u0153': 'oe',
    '\u0149': "'n", '\u017f': 's'
  };

  /** Used to map characters to HTML entities. */
  var htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  /** Used to map HTML entities to characters. */
  var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };

  /** Used to escape characters for inclusion in compiled string literals. */
  var stringEscapes = {
    '\\': '\\',
    "'": "'",
    '\n': 'n',
    '\r': 'r',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  /** Built-in method references without a dependency on `root`. */
  var freeParseFloat = parseFloat,
      freeParseInt = parseInt;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  /** Detect free variable `exports`. */
  var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  /* Node.js helper references. */
  var nodeIsArrayBuffer = nodeUtil && nodeUtil.isArrayBuffer,
      nodeIsDate = nodeUtil && nodeUtil.isDate,
      nodeIsMap = nodeUtil && nodeUtil.isMap,
      nodeIsRegExp = nodeUtil && nodeUtil.isRegExp,
      nodeIsSet = nodeUtil && nodeUtil.isSet,
      nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /*--------------------------------------------------------------------------*/

  /**
   * A faster alternative to `Function#apply`, this function invokes `func`
   * with the `this` binding of `thisArg` and the arguments of `args`.
   *
   * @private
   * @param {Function} func The function to invoke.
   * @param {*} thisArg The `this` binding of `func`.
   * @param {Array} args The arguments to invoke `func` with.
   * @returns {*} Returns the result of `func`.
   */
  function apply(func, thisArg, args) {
    switch (args.length) {
      case 0: return func.call(thisArg);
      case 1: return func.call(thisArg, args[0]);
      case 2: return func.call(thisArg, args[0], args[1]);
      case 3: return func.call(thisArg, args[0], args[1], args[2]);
    }
    return func.apply(thisArg, args);
  }

  /**
   * A specialized version of `baseAggregator` for arrays.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} setter The function to set `accumulator` values.
   * @param {Function} iteratee The iteratee to transform keys.
   * @param {Object} accumulator The initial aggregated object.
   * @returns {Function} Returns `accumulator`.
   */
  function arrayAggregator(array, setter, iteratee, accumulator) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      var value = array[index];
      setter(accumulator, value, iteratee(value), array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * A specialized version of `_.forEachRight` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEachRight(array, iteratee) {
    var length = array == null ? 0 : array.length;

    while (length--) {
      if (iteratee(array[length], length, array) === false) {
        break;
      }
    }
    return array;
  }

  /**
   * A specialized version of `_.every` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if all elements pass the predicate check,
   *  else `false`.
   */
  function arrayEvery(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (!predicate(array[index], index, array)) {
        return false;
      }
    }
    return true;
  }

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  /**
   * A specialized version of `_.includes` for arrays without support for
   * specifying an index to search from.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludes(array, value) {
    var length = array == null ? 0 : array.length;
    return !!length && baseIndexOf(array, value, 0) > -1;
  }

  /**
   * This function is like `arrayIncludes` except that it accepts a comparator.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludesWith(array, value, comparator) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (comparator(value, array[index])) {
        return true;
      }
    }
    return false;
  }

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  /**
   * A specialized version of `_.reduce` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the first element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array == null ? 0 : array.length;

    if (initAccum && length) {
      accumulator = array[++index];
    }
    while (++index < length) {
      accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.reduceRight` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the last element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduceRight(array, iteratee, accumulator, initAccum) {
    var length = array == null ? 0 : array.length;
    if (initAccum && length) {
      accumulator = array[--length];
    }
    while (length--) {
      accumulator = iteratee(accumulator, array[length], length, array);
    }
    return accumulator;
  }

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the size of an ASCII `string`.
   *
   * @private
   * @param {string} string The string inspect.
   * @returns {number} Returns the string size.
   */
  var asciiSize = baseProperty('length');

  /**
   * Converts an ASCII `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function asciiToArray(string) {
    return string.split('');
  }

  /**
   * Splits an ASCII `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function asciiWords(string) {
    return string.match(reAsciiWord) || [];
  }

  /**
   * The base implementation of methods like `_.findKey` and `_.findLastKey`,
   * without support for iteratee shorthands, which iterates over `collection`
   * using `eachFunc`.
   *
   * @private
   * @param {Array|Object} collection The collection to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {Function} eachFunc The function to iterate over `collection`.
   * @returns {*} Returns the found element or its key, else `undefined`.
   */
  function baseFindKey(collection, predicate, eachFunc) {
    var result;
    eachFunc(collection, function(value, key, collection) {
      if (predicate(value, key, collection)) {
        result = key;
        return false;
      }
    });
    return result;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    return value === value
      ? strictIndexOf(array, value, fromIndex)
      : baseFindIndex(array, baseIsNaN, fromIndex);
  }

  /**
   * This function is like `baseIndexOf` except that it accepts a comparator.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOfWith(array, value, fromIndex, comparator) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (comparator(array[index], value)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.isNaN` without support for number objects.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
   */
  function baseIsNaN(value) {
    return value !== value;
  }

  /**
   * The base implementation of `_.mean` and `_.meanBy` without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {number} Returns the mean.
   */
  function baseMean(array, iteratee) {
    var length = array == null ? 0 : array.length;
    return length ? (baseSum(array, iteratee) / length) : NAN;
  }

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key];
    };
  }

  /**
   * The base implementation of `_.propertyOf` without support for deep paths.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyOf(object) {
    return function(key) {
      return object == null ? undefined : object[key];
    };
  }

  /**
   * The base implementation of `_.reduce` and `_.reduceRight`, without support
   * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} accumulator The initial value.
   * @param {boolean} initAccum Specify using the first or last element of
   *  `collection` as the initial value.
   * @param {Function} eachFunc The function to iterate over `collection`.
   * @returns {*} Returns the accumulated value.
   */
  function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
    eachFunc(collection, function(value, index, collection) {
      accumulator = initAccum
        ? (initAccum = false, value)
        : iteratee(accumulator, value, index, collection);
    });
    return accumulator;
  }

  /**
   * The base implementation of `_.sortBy` which uses `comparer` to define the
   * sort order of `array` and replaces criteria objects with their corresponding
   * values.
   *
   * @private
   * @param {Array} array The array to sort.
   * @param {Function} comparer The function to define sort order.
   * @returns {Array} Returns `array`.
   */
  function baseSortBy(array, comparer) {
    var length = array.length;

    array.sort(comparer);
    while (length--) {
      array[length] = array[length].value;
    }
    return array;
  }

  /**
   * The base implementation of `_.sum` and `_.sumBy` without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {number} Returns the sum.
   */
  function baseSum(array, iteratee) {
    var result,
        index = -1,
        length = array.length;

    while (++index < length) {
      var current = iteratee(array[index]);
      if (current !== undefined) {
        result = result === undefined ? current : (result + current);
      }
    }
    return result;
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * The base implementation of `_.toPairs` and `_.toPairsIn` which creates an array
   * of key-value pairs for `object` corresponding to the property names of `props`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} props The property names to get values for.
   * @returns {Object} Returns the key-value pairs.
   */
  function baseToPairs(object, props) {
    return arrayMap(props, function(key) {
      return [key, object[key]];
    });
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  /**
   * The base implementation of `_.values` and `_.valuesIn` which creates an
   * array of `object` property values corresponding to the property names
   * of `props`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array} props The property names to get values for.
   * @returns {Object} Returns the array of property values.
   */
  function baseValues(object, props) {
    return arrayMap(props, function(key) {
      return object[key];
    });
  }

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  /**
   * Used by `_.trim` and `_.trimStart` to get the index of the first string symbol
   * that is not found in the character symbols.
   *
   * @private
   * @param {Array} strSymbols The string symbols to inspect.
   * @param {Array} chrSymbols The character symbols to find.
   * @returns {number} Returns the index of the first unmatched string symbol.
   */
  function charsStartIndex(strSymbols, chrSymbols) {
    var index = -1,
        length = strSymbols.length;

    while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
    return index;
  }

  /**
   * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol
   * that is not found in the character symbols.
   *
   * @private
   * @param {Array} strSymbols The string symbols to inspect.
   * @param {Array} chrSymbols The character symbols to find.
   * @returns {number} Returns the index of the last unmatched string symbol.
   */
  function charsEndIndex(strSymbols, chrSymbols) {
    var index = strSymbols.length;

    while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
    return index;
  }

  /**
   * Gets the number of `placeholder` occurrences in `array`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} placeholder The placeholder to search for.
   * @returns {number} Returns the placeholder count.
   */
  function countHolders(array, placeholder) {
    var length = array.length,
        result = 0;

    while (length--) {
      if (array[length] === placeholder) {
        ++result;
      }
    }
    return result;
  }

  /**
   * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
   * letters to basic Latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  var deburrLetter = basePropertyOf(deburredLetters);

  /**
   * Used by `_.escape` to convert characters to HTML entities.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  var escapeHtmlChar = basePropertyOf(htmlEscapes);

  /**
   * Used by `_.template` to escape characters for inclusion in compiled string literals.
   *
   * @private
   * @param {string} chr The matched character to escape.
   * @returns {string} Returns the escaped character.
   */
  function escapeStringChar(chr) {
    return '\\' + stringEscapes[chr];
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Checks if `string` contains Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a symbol is found, else `false`.
   */
  function hasUnicode(string) {
    return reHasUnicode.test(string);
  }

  /**
   * Checks if `string` contains a word composed of Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a word is found, else `false`.
   */
  function hasUnicodeWord(string) {
    return reHasUnicodeWord.test(string);
  }

  /**
   * Converts `iterator` to an array.
   *
   * @private
   * @param {Object} iterator The iterator to convert.
   * @returns {Array} Returns the converted array.
   */
  function iteratorToArray(iterator) {
    var data,
        result = [];

    while (!(data = iterator.next()).done) {
      result.push(data.value);
    }
    return result;
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  /**
   * Replaces all `placeholder` elements in `array` with an internal placeholder
   * and returns an array of their indexes.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {*} placeholder The placeholder to replace.
   * @returns {Array} Returns the new array of placeholder indexes.
   */
  function replaceHolders(array, placeholder) {
    var index = -1,
        length = array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (value === placeholder || value === PLACEHOLDER) {
        array[index] = PLACEHOLDER;
        result[resIndex++] = index;
      }
    }
    return result;
  }

  /**
   * Gets the value at `key`, unless `key` is "__proto__".
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function safeGet(object, key) {
    return key == '__proto__'
      ? undefined
      : object[key];
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }

  /**
   * Converts `set` to its value-value pairs.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the value-value pairs.
   */
  function setToPairs(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = [value, value];
    });
    return result;
  }

  /**
   * A specialized version of `_.indexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictIndexOf(array, value, fromIndex) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  /**
   * A specialized version of `_.lastIndexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictLastIndexOf(array, value, fromIndex) {
    var index = fromIndex + 1;
    while (index--) {
      if (array[index] === value) {
        return index;
      }
    }
    return index;
  }

  /**
   * Gets the number of symbols in `string`.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {number} Returns the string size.
   */
  function stringSize(string) {
    return hasUnicode(string)
      ? unicodeSize(string)
      : asciiSize(string);
  }

  /**
   * Converts `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function stringToArray(string) {
    return hasUnicode(string)
      ? unicodeToArray(string)
      : asciiToArray(string);
  }

  /**
   * Used by `_.unescape` to convert HTML entities to characters.
   *
   * @private
   * @param {string} chr The matched character to unescape.
   * @returns {string} Returns the unescaped character.
   */
  var unescapeHtmlChar = basePropertyOf(htmlUnescapes);

  /**
   * Gets the size of a Unicode `string`.
   *
   * @private
   * @param {string} string The string inspect.
   * @returns {number} Returns the string size.
   */
  function unicodeSize(string) {
    var result = reUnicode.lastIndex = 0;
    while (reUnicode.test(string)) {
      ++result;
    }
    return result;
  }

  /**
   * Converts a Unicode `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function unicodeToArray(string) {
    return string.match(reUnicode) || [];
  }

  /**
   * Splits a Unicode `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function unicodeWords(string) {
    return string.match(reUnicodeWord) || [];
  }

  /*--------------------------------------------------------------------------*/

  /**
   * Create a new pristine `lodash` function using the `context` object.
   *
   * @static
   * @memberOf _
   * @since 1.1.0
   * @category Util
   * @param {Object} [context=root] The context object.
   * @returns {Function} Returns a new `lodash` function.
   * @example
   *
   * _.mixin({ 'foo': _.constant('foo') });
   *
   * var lodash = _.runInContext();
   * lodash.mixin({ 'bar': lodash.constant('bar') });
   *
   * _.isFunction(_.foo);
   * // => true
   * _.isFunction(_.bar);
   * // => false
   *
   * lodash.isFunction(lodash.foo);
   * // => false
   * lodash.isFunction(lodash.bar);
   * // => true
   *
   * // Create a suped-up `defer` in Node.js.
   * var defer = _.runInContext({ 'setTimeout': setImmediate }).defer;
   */
  var runInContext = (function runInContext(context) {
    context = context == null ? root : _.defaults(root.Object(), context, _.pick(root, contextProps));

    /** Built-in constructor references. */
    var Array = context.Array,
        Date = context.Date,
        Error = context.Error,
        Function = context.Function,
        Math = context.Math,
        Object = context.Object,
        RegExp = context.RegExp,
        String = context.String,
        TypeError = context.TypeError;

    /** Used for built-in method references. */
    var arrayProto = Array.prototype,
        funcProto = Function.prototype,
        objectProto = Object.prototype;

    /** Used to detect overreaching core-js shims. */
    var coreJsData = context['__core-js_shared__'];

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to generate unique IDs. */
    var idCounter = 0;

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /** Used to infer the `Object` constructor. */
    var objectCtorString = funcToString.call(Object);

    /** Used to restore the original `_` reference in `_.noConflict`. */
    var oldDash = root._;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /** Built-in value references. */
    var Buffer = moduleExports ? context.Buffer : undefined,
        Symbol = context.Symbol,
        Uint8Array = context.Uint8Array,
        allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined,
        getPrototype = overArg(Object.getPrototypeOf, Object),
        objectCreate = Object.create,
        propertyIsEnumerable = objectProto.propertyIsEnumerable,
        splice = arrayProto.splice,
        spreadableSymbol = Symbol ? Symbol.isConcatSpreadable : undefined,
        symIterator = Symbol ? Symbol.iterator : undefined,
        symToStringTag = Symbol ? Symbol.toStringTag : undefined;

    var defineProperty = (function() {
      try {
        var func = getNative(Object, 'defineProperty');
        func({}, '', {});
        return func;
      } catch (e) {}
    }());

    /** Mocked built-ins. */
    var ctxClearTimeout = context.clearTimeout !== root.clearTimeout && context.clearTimeout,
        ctxNow = Date && Date.now !== root.Date.now && Date.now,
        ctxSetTimeout = context.setTimeout !== root.setTimeout && context.setTimeout;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeCeil = Math.ceil,
        nativeFloor = Math.floor,
        nativeGetSymbols = Object.getOwnPropertySymbols,
        nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined,
        nativeIsFinite = context.isFinite,
        nativeJoin = arrayProto.join,
        nativeKeys = overArg(Object.keys, Object),
        nativeMax = Math.max,
        nativeMin = Math.min,
        nativeNow = Date.now,
        nativeParseInt = context.parseInt,
        nativeRandom = Math.random,
        nativeReverse = arrayProto.reverse;

    /* Built-in method references that are verified to be native. */
    var DataView = getNative(context, 'DataView'),
        Map = getNative(context, 'Map'),
        Promise = getNative(context, 'Promise'),
        Set = getNative(context, 'Set'),
        WeakMap = getNative(context, 'WeakMap'),
        nativeCreate = getNative(Object, 'create');

    /** Used to store function metadata. */
    var metaMap = WeakMap && new WeakMap;

    /** Used to lookup unminified function names. */
    var realNames = {};

    /** Used to detect maps, sets, and weakmaps. */
    var dataViewCtorString = toSource(DataView),
        mapCtorString = toSource(Map),
        promiseCtorString = toSource(Promise),
        setCtorString = toSource(Set),
        weakMapCtorString = toSource(WeakMap);

    /** Used to convert symbols to primitives and strings. */
    var symbolProto = Symbol ? Symbol.prototype : undefined,
        symbolValueOf = symbolProto ? symbolProto.valueOf : undefined,
        symbolToString = symbolProto ? symbolProto.toString : undefined;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` object which wraps `value` to enable implicit method
     * chain sequences. Methods that operate on and return arrays, collections,
     * and functions can be chained together. Methods that retrieve a single value
     * or may return a primitive value will automatically end the chain sequence
     * and return the unwrapped value. Otherwise, the value must be unwrapped
     * with `_#value`.
     *
     * Explicit chain sequences, which must be unwrapped with `_#value`, may be
     * enabled using `_.chain`.
     *
     * The execution of chained methods is lazy, that is, it's deferred until
     * `_#value` is implicitly or explicitly called.
     *
     * Lazy evaluation allows several methods to support shortcut fusion.
     * Shortcut fusion is an optimization to merge iteratee calls; this avoids
     * the creation of intermediate arrays and can greatly reduce the number of
     * iteratee executions. Sections of a chain sequence qualify for shortcut
     * fusion if the section is applied to an array and iteratees accept only
     * one argument. The heuristic for whether a section qualifies for shortcut
     * fusion is subject to change.
     *
     * Chaining is supported in custom builds as long as the `_#value` method is
     * directly or indirectly included in the build.
     *
     * In addition to lodash methods, wrappers have `Array` and `String` methods.
     *
     * The wrapper `Array` methods are:
     * `concat`, `join`, `pop`, `push`, `shift`, `sort`, `splice`, and `unshift`
     *
     * The wrapper `String` methods are:
     * `replace` and `split`
     *
     * The wrapper methods that support shortcut fusion are:
     * `at`, `compact`, `drop`, `dropRight`, `dropWhile`, `filter`, `find`,
     * `findLast`, `head`, `initial`, `last`, `map`, `reject`, `reverse`, `slice`,
     * `tail`, `take`, `takeRight`, `takeRightWhile`, `takeWhile`, and `toArray`
     *
     * The chainable wrapper methods are:
     * `after`, `ary`, `assign`, `assignIn`, `assignInWith`, `assignWith`, `at`,
     * `before`, `bind`, `bindAll`, `bindKey`, `castArray`, `chain`, `chunk`,
     * `commit`, `compact`, `concat`, `conforms`, `constant`, `countBy`, `create`,
     * `curry`, `debounce`, `defaults`, `defaultsDeep`, `defer`, `delay`,
     * `difference`, `differenceBy`, `differenceWith`, `drop`, `dropRight`,
     * `dropRightWhile`, `dropWhile`, `extend`, `extendWith`, `fill`, `filter`,
     * `flatMap`, `flatMapDeep`, `flatMapDepth`, `flatten`, `flattenDeep`,
     * `flattenDepth`, `flip`, `flow`, `flowRight`, `fromPairs`, `functions`,
     * `functionsIn`, `groupBy`, `initial`, `intersection`, `intersectionBy`,
     * `intersectionWith`, `invert`, `invertBy`, `invokeMap`, `iteratee`, `keyBy`,
     * `keys`, `keysIn`, `map`, `mapKeys`, `mapValues`, `matches`, `matchesProperty`,
     * `memoize`, `merge`, `mergeWith`, `method`, `methodOf`, `mixin`, `negate`,
     * `nthArg`, `omit`, `omitBy`, `once`, `orderBy`, `over`, `overArgs`,
     * `overEvery`, `overSome`, `partial`, `partialRight`, `partition`, `pick`,
     * `pickBy`, `plant`, `property`, `propertyOf`, `pull`, `pullAll`, `pullAllBy`,
     * `pullAllWith`, `pullAt`, `push`, `range`, `rangeRight`, `rearg`, `reject`,
     * `remove`, `rest`, `reverse`, `sampleSize`, `set`, `setWith`, `shuffle`,
     * `slice`, `sort`, `sortBy`, `splice`, `spread`, `tail`, `take`, `takeRight`,
     * `takeRightWhile`, `takeWhile`, `tap`, `throttle`, `thru`, `toArray`,
     * `toPairs`, `toPairsIn`, `toPath`, `toPlainObject`, `transform`, `unary`,
     * `union`, `unionBy`, `unionWith`, `uniq`, `uniqBy`, `uniqWith`, `unset`,
     * `unshift`, `unzip`, `unzipWith`, `update`, `updateWith`, `values`,
     * `valuesIn`, `without`, `wrap`, `xor`, `xorBy`, `xorWith`, `zip`,
     * `zipObject`, `zipObjectDeep`, and `zipWith`
     *
     * The wrapper methods that are **not** chainable by default are:
     * `add`, `attempt`, `camelCase`, `capitalize`, `ceil`, `clamp`, `clone`,
     * `cloneDeep`, `cloneDeepWith`, `cloneWith`, `conformsTo`, `deburr`,
     * `defaultTo`, `divide`, `each`, `eachRight`, `endsWith`, `eq`, `escape`,
     * `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`, `findLast`,
     * `findLastIndex`, `findLastKey`, `first`, `floor`, `forEach`, `forEachRight`,
     * `forIn`, `forInRight`, `forOwn`, `forOwnRight`, `get`, `gt`, `gte`, `has`,
     * `hasIn`, `head`, `identity`, `includes`, `indexOf`, `inRange`, `invoke`,
     * `isArguments`, `isArray`, `isArrayBuffer`, `isArrayLike`, `isArrayLikeObject`,
     * `isBoolean`, `isBuffer`, `isDate`, `isElement`, `isEmpty`, `isEqual`,
     * `isEqualWith`, `isError`, `isFinite`, `isFunction`, `isInteger`, `isLength`,
     * `isMap`, `isMatch`, `isMatchWith`, `isNaN`, `isNative`, `isNil`, `isNull`,
     * `isNumber`, `isObject`, `isObjectLike`, `isPlainObject`, `isRegExp`,
     * `isSafeInteger`, `isSet`, `isString`, `isUndefined`, `isTypedArray`,
     * `isWeakMap`, `isWeakSet`, `join`, `kebabCase`, `last`, `lastIndexOf`,
     * `lowerCase`, `lowerFirst`, `lt`, `lte`, `max`, `maxBy`, `mean`, `meanBy`,
     * `min`, `minBy`, `multiply`, `noConflict`, `noop`, `now`, `nth`, `pad`,
     * `padEnd`, `padStart`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`,
     * `repeat`, `result`, `round`, `runInContext`, `sample`, `shift`, `size`,
     * `snakeCase`, `some`, `sortedIndex`, `sortedIndexBy`, `sortedLastIndex`,
     * `sortedLastIndexBy`, `startCase`, `startsWith`, `stubArray`, `stubFalse`,
     * `stubObject`, `stubString`, `stubTrue`, `subtract`, `sum`, `sumBy`,
     * `template`, `times`, `toFinite`, `toInteger`, `toJSON`, `toLength`,
     * `toLower`, `toNumber`, `toSafeInteger`, `toString`, `toUpper`, `trim`,
     * `trimEnd`, `trimStart`, `truncate`, `unescape`, `uniqueId`, `upperCase`,
     * `upperFirst`, `value`, and `words`
     *
     * @name _
     * @constructor
     * @category Seq
     * @param {*} value The value to wrap in a `lodash` instance.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var wrapped = _([1, 2, 3]);
     *
     * // Returns an unwrapped value.
     * wrapped.reduce(_.add);
     * // => 6
     *
     * // Returns a wrapped value.
     * var squares = wrapped.map(square);
     *
     * _.isArray(squares);
     * // => false
     *
     * _.isArray(squares.value());
     * // => true
     */
    function lodash(value) {
      if (isObjectLike(value) && !isArray(value) && !(value instanceof LazyWrapper)) {
        if (value instanceof LodashWrapper) {
          return value;
        }
        if (hasOwnProperty.call(value, '__wrapped__')) {
          return wrapperClone(value);
        }
      }
      return new LodashWrapper(value);
    }

    /**
     * The base implementation of `_.create` without support for assigning
     * properties to the created object.
     *
     * @private
     * @param {Object} proto The object to inherit from.
     * @returns {Object} Returns the new object.
     */
    var baseCreate = (function() {
      function object() {}
      return function(proto) {
        if (!isObject(proto)) {
          return {};
        }
        if (objectCreate) {
          return objectCreate(proto);
        }
        object.prototype = proto;
        var result = new object;
        object.prototype = undefined;
        return result;
      };
    }());

    /**
     * The function whose prototype chain sequence wrappers inherit from.
     *
     * @private
     */
    function baseLodash() {
      // No operation performed.
    }

    /**
     * The base constructor for creating `lodash` wrapper objects.
     *
     * @private
     * @param {*} value The value to wrap.
     * @param {boolean} [chainAll] Enable explicit method chain sequences.
     */
    function LodashWrapper(value, chainAll) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__chain__ = !!chainAll;
      this.__index__ = 0;
      this.__values__ = undefined;
    }

    /**
     * By default, the template delimiters used by lodash are like those in
     * embedded Ruby (ERB) as well as ES2015 template strings. Change the
     * following template settings to use alternative delimiters.
     *
     * @static
     * @memberOf _
     * @type {Object}
     */
    lodash.templateSettings = {

      /**
       * Used to detect `data` property values to be HTML-escaped.
       *
       * @memberOf _.templateSettings
       * @type {RegExp}
       */
      'escape': reEscape,

      /**
       * Used to detect code to be evaluated.
       *
       * @memberOf _.templateSettings
       * @type {RegExp}
       */
      'evaluate': reEvaluate,

      /**
       * Used to detect `data` property values to inject.
       *
       * @memberOf _.templateSettings
       * @type {RegExp}
       */
      'interpolate': reInterpolate,

      /**
       * Used to reference the data object in the template text.
       *
       * @memberOf _.templateSettings
       * @type {string}
       */
      'variable': '',

      /**
       * Used to import variables into the compiled template.
       *
       * @memberOf _.templateSettings
       * @type {Object}
       */
      'imports': {

        /**
         * A reference to the `lodash` function.
         *
         * @memberOf _.templateSettings.imports
         * @type {Function}
         */
        '_': lodash
      }
    };

    // Ensure wrappers are instances of `baseLodash`.
    lodash.prototype = baseLodash.prototype;
    lodash.prototype.constructor = lodash;

    LodashWrapper.prototype = baseCreate(baseLodash.prototype);
    LodashWrapper.prototype.constructor = LodashWrapper;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.
     *
     * @private
     * @constructor
     * @param {*} value The value to wrap.
     */
    function LazyWrapper(value) {
      this.__wrapped__ = value;
      this.__actions__ = [];
      this.__dir__ = 1;
      this.__filtered__ = false;
      this.__iteratees__ = [];
      this.__takeCount__ = MAX_ARRAY_LENGTH;
      this.__views__ = [];
    }

    /**
     * Creates a clone of the lazy wrapper object.
     *
     * @private
     * @name clone
     * @memberOf LazyWrapper
     * @returns {Object} Returns the cloned `LazyWrapper` object.
     */
    function lazyClone() {
      var result = new LazyWrapper(this.__wrapped__);
      result.__actions__ = copyArray(this.__actions__);
      result.__dir__ = this.__dir__;
      result.__filtered__ = this.__filtered__;
      result.__iteratees__ = copyArray(this.__iteratees__);
      result.__takeCount__ = this.__takeCount__;
      result.__views__ = copyArray(this.__views__);
      return result;
    }

    /**
     * Reverses the direction of lazy iteration.
     *
     * @private
     * @name reverse
     * @memberOf LazyWrapper
     * @returns {Object} Returns the new reversed `LazyWrapper` object.
     */
    function lazyReverse() {
      if (this.__filtered__) {
        var result = new LazyWrapper(this);
        result.__dir__ = -1;
        result.__filtered__ = true;
      } else {
        result = this.clone();
        result.__dir__ *= -1;
      }
      return result;
    }

    /**
     * Extracts the unwrapped value from its lazy wrapper.
     *
     * @private
     * @name value
     * @memberOf LazyWrapper
     * @returns {*} Returns the unwrapped value.
     */
    function lazyValue() {
      var array = this.__wrapped__.value(),
          dir = this.__dir__,
          isArr = isArray(array),
          isRight = dir < 0,
          arrLength = isArr ? array.length : 0,
          view = getView(0, arrLength, this.__views__),
          start = view.start,
          end = view.end,
          length = end - start,
          index = isRight ? end : (start - 1),
          iteratees = this.__iteratees__,
          iterLength = iteratees.length,
          resIndex = 0,
          takeCount = nativeMin(length, this.__takeCount__);

      if (!isArr || (!isRight && arrLength == length && takeCount == length)) {
        return baseWrapperValue(array, this.__actions__);
      }
      var result = [];

      outer:
      while (length-- && resIndex < takeCount) {
        index += dir;

        var iterIndex = -1,
            value = array[index];

        while (++iterIndex < iterLength) {
          var data = iteratees[iterIndex],
              iteratee = data.iteratee,
              type = data.type,
              computed = iteratee(value);

          if (type == LAZY_MAP_FLAG) {
            value = computed;
          } else if (!computed) {
            if (type == LAZY_FILTER_FLAG) {
              continue outer;
            } else {
              break outer;
            }
          }
        }
        result[resIndex++] = value;
      }
      return result;
    }

    // Ensure `LazyWrapper` is an instance of `baseLodash`.
    LazyWrapper.prototype = baseCreate(baseLodash.prototype);
    LazyWrapper.prototype.constructor = LazyWrapper;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate ? nativeCreate(null) : {};
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty.call(data, key) ? data[key] : undefined;
    }

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
    }

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
      return this;
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear;
    Hash.prototype['delete'] = hashDelete;
    Hash.prototype.get = hashGet;
    Hash.prototype.has = hashHas;
    Hash.prototype.set = hashSet;

    /*------------------------------------------------------------------------*/

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf(this.__data__, key) > -1;
    }

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear;
    ListCache.prototype['delete'] = listCacheDelete;
    ListCache.prototype.get = listCacheGet;
    ListCache.prototype.has = listCacheHas;
    ListCache.prototype.set = listCacheSet;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash,
        'map': new (Map || ListCache),
        'string': new Hash
      };
    }

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData(this, key).get(key);
    }

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData(this, key).has(key);
    }

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear;
    MapCache.prototype['delete'] = mapCacheDelete;
    MapCache.prototype.get = mapCacheGet;
    MapCache.prototype.has = mapCacheHas;
    MapCache.prototype.set = mapCacheSet;

    /*------------------------------------------------------------------------*/

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values == null ? 0 : values.length;

      this.__data__ = new MapCache;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED);
      return this;
    }

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
    SetCache.prototype.has = setCacheHas;

    /*------------------------------------------------------------------------*/

    /**
     * Creates a stack cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Stack(entries) {
      var data = this.__data__ = new ListCache(entries);
      this.size = data.size;
    }

    /**
     * Removes all key-value entries from the stack.
     *
     * @private
     * @name clear
     * @memberOf Stack
     */
    function stackClear() {
      this.__data__ = new ListCache;
      this.size = 0;
    }

    /**
     * Removes `key` and its value from the stack.
     *
     * @private
     * @name delete
     * @memberOf Stack
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function stackDelete(key) {
      var data = this.__data__,
          result = data['delete'](key);

      this.size = data.size;
      return result;
    }

    /**
     * Gets the stack value for `key`.
     *
     * @private
     * @name get
     * @memberOf Stack
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function stackGet(key) {
      return this.__data__.get(key);
    }

    /**
     * Checks if a stack value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Stack
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function stackHas(key) {
      return this.__data__.has(key);
    }

    /**
     * Sets the stack `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Stack
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the stack cache instance.
     */
    function stackSet(key, value) {
      var data = this.__data__;
      if (data instanceof ListCache) {
        var pairs = data.__data__;
        if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
          pairs.push([key, value]);
          this.size = ++data.size;
          return this;
        }
        data = this.__data__ = new MapCache(pairs);
      }
      data.set(key, value);
      this.size = data.size;
      return this;
    }

    // Add methods to `Stack`.
    Stack.prototype.clear = stackClear;
    Stack.prototype['delete'] = stackDelete;
    Stack.prototype.get = stackGet;
    Stack.prototype.has = stackHas;
    Stack.prototype.set = stackSet;

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of the enumerable property names of the array-like `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @param {boolean} inherited Specify returning inherited property names.
     * @returns {Array} Returns the array of property names.
     */
    function arrayLikeKeys(value, inherited) {
      var isArr = isArray(value),
          isArg = !isArr && isArguments(value),
          isBuff = !isArr && !isArg && isBuffer(value),
          isType = !isArr && !isArg && !isBuff && isTypedArray(value),
          skipIndexes = isArr || isArg || isBuff || isType,
          result = skipIndexes ? baseTimes(value.length, String) : [],
          length = result.length;

      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) &&
            !(skipIndexes && (
               // Safari 9 has enumerable `arguments.length` in strict mode.
               key == 'length' ||
               // Node.js 0.10 has enumerable non-index properties on buffers.
               (isBuff && (key == 'offset' || key == 'parent')) ||
               // PhantomJS 2 has enumerable non-index properties on typed arrays.
               (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
               // Skip index properties.
               isIndex(key, length)
            ))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * A specialized version of `_.sample` for arrays.
     *
     * @private
     * @param {Array} array The array to sample.
     * @returns {*} Returns the random element.
     */
    function arraySample(array) {
      var length = array.length;
      return length ? array[baseRandom(0, length - 1)] : undefined;
    }

    /**
     * A specialized version of `_.sampleSize` for arrays.
     *
     * @private
     * @param {Array} array The array to sample.
     * @param {number} n The number of elements to sample.
     * @returns {Array} Returns the random elements.
     */
    function arraySampleSize(array, n) {
      return shuffleSelf(copyArray(array), baseClamp(n, 0, array.length));
    }

    /**
     * A specialized version of `_.shuffle` for arrays.
     *
     * @private
     * @param {Array} array The array to shuffle.
     * @returns {Array} Returns the new shuffled array.
     */
    function arrayShuffle(array) {
      return shuffleSelf(copyArray(array));
    }

    /**
     * This function is like `assignValue` except that it doesn't assign
     * `undefined` values.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignMergeValue(object, key, value) {
      if ((value !== undefined && !eq(object[key], value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Assigns `value` to `key` of `object` if the existing value is not equivalent
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
          (value === undefined && !(key in object))) {
        baseAssignValue(object, key, value);
      }
    }

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    /**
     * Aggregates elements of `collection` on `accumulator` with keys transformed
     * by `iteratee` and values set by `setter`.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} setter The function to set `accumulator` values.
     * @param {Function} iteratee The iteratee to transform keys.
     * @param {Object} accumulator The initial aggregated object.
     * @returns {Function} Returns `accumulator`.
     */
    function baseAggregator(collection, setter, iteratee, accumulator) {
      baseEach(collection, function(value, key, collection) {
        setter(accumulator, value, iteratee(value), collection);
      });
      return accumulator;
    }

    /**
     * The base implementation of `_.assign` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssign(object, source) {
      return object && copyObject(source, keys(source), object);
    }

    /**
     * The base implementation of `_.assignIn` without support for multiple sources
     * or `customizer` functions.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @returns {Object} Returns `object`.
     */
    function baseAssignIn(object, source) {
      return object && copyObject(source, keysIn(source), object);
    }

    /**
     * The base implementation of `assignValue` and `assignMergeValue` without
     * value checks.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {string} key The key of the property to assign.
     * @param {*} value The value to assign.
     */
    function baseAssignValue(object, key, value) {
      if (key == '__proto__' && defineProperty) {
        defineProperty(object, key, {
          'configurable': true,
          'enumerable': true,
          'value': value,
          'writable': true
        });
      } else {
        object[key] = value;
      }
    }

    /**
     * The base implementation of `_.at` without support for individual paths.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {string[]} paths The property paths to pick.
     * @returns {Array} Returns the picked elements.
     */
    function baseAt(object, paths) {
      var index = -1,
          length = paths.length,
          result = Array(length),
          skip = object == null;

      while (++index < length) {
        result[index] = skip ? undefined : get(object, paths[index]);
      }
      return result;
    }

    /**
     * The base implementation of `_.clamp` which doesn't coerce arguments.
     *
     * @private
     * @param {number} number The number to clamp.
     * @param {number} [lower] The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the clamped number.
     */
    function baseClamp(number, lower, upper) {
      if (number === number) {
        if (upper !== undefined) {
          number = number <= upper ? number : upper;
        }
        if (lower !== undefined) {
          number = number >= lower ? number : lower;
        }
      }
      return number;
    }

    /**
     * The base implementation of `_.clone` and `_.cloneDeep` which tracks
     * traversed objects.
     *
     * @private
     * @param {*} value The value to clone.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Deep clone
     *  2 - Flatten inherited properties
     *  4 - Clone symbols
     * @param {Function} [customizer] The function to customize cloning.
     * @param {string} [key] The key of `value`.
     * @param {Object} [object] The parent object of `value`.
     * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
     * @returns {*} Returns the cloned value.
     */
    function baseClone(value, bitmask, customizer, key, object, stack) {
      var result,
          isDeep = bitmask & CLONE_DEEP_FLAG,
          isFlat = bitmask & CLONE_FLAT_FLAG,
          isFull = bitmask & CLONE_SYMBOLS_FLAG;

      if (customizer) {
        result = object ? customizer(value, key, object, stack) : customizer(value);
      }
      if (result !== undefined) {
        return result;
      }
      if (!isObject(value)) {
        return value;
      }
      var isArr = isArray(value);
      if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
          return copyArray(value, result);
        }
      } else {
        var tag = getTag(value),
            isFunc = tag == funcTag || tag == genTag;

        if (isBuffer(value)) {
          return cloneBuffer(value, isDeep);
        }
        if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
          result = (isFlat || isFunc) ? {} : initCloneObject(value);
          if (!isDeep) {
            return isFlat
              ? copySymbolsIn(value, baseAssignIn(result, value))
              : copySymbols(value, baseAssign(result, value));
          }
        } else {
          if (!cloneableTags[tag]) {
            return object ? value : {};
          }
          result = initCloneByTag(value, tag, isDeep);
        }
      }
      // Check for circular references and return its corresponding clone.
      stack || (stack = new Stack);
      var stacked = stack.get(value);
      if (stacked) {
        return stacked;
      }
      stack.set(value, result);

      if (isSet(value)) {
        value.forEach(function(subValue) {
          result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
        });

        return result;
      }

      if (isMap(value)) {
        value.forEach(function(subValue, key) {
          result.set(key, baseClone(subValue, bitmask, customizer, key, value, stack));
        });

        return result;
      }

      var keysFunc = isFull
        ? (isFlat ? getAllKeysIn : getAllKeys)
        : (isFlat ? keysIn : keys);

      var props = isArr ? undefined : keysFunc(value);
      arrayEach(props || value, function(subValue, key) {
        if (props) {
          key = subValue;
          subValue = value[key];
        }
        // Recursively populate clone (susceptible to call stack limits).
        assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
      });
      return result;
    }

    /**
     * The base implementation of `_.conforms` which doesn't clone `source`.
     *
     * @private
     * @param {Object} source The object of property predicates to conform to.
     * @returns {Function} Returns the new spec function.
     */
    function baseConforms(source) {
      var props = keys(source);
      return function(object) {
        return baseConformsTo(object, source, props);
      };
    }

    /**
     * The base implementation of `_.conformsTo` which accepts `props` to check.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property predicates to conform to.
     * @returns {boolean} Returns `true` if `object` conforms, else `false`.
     */
    function baseConformsTo(object, source, props) {
      var length = props.length;
      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (length--) {
        var key = props[length],
            predicate = source[key],
            value = object[key];

        if ((value === undefined && !(key in object)) || !predicate(value)) {
          return false;
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.delay` and `_.defer` which accepts `args`
     * to provide to `func`.
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {Array} args The arguments to provide to `func`.
     * @returns {number|Object} Returns the timer id or timeout object.
     */
    function baseDelay(func, wait, args) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return setTimeout(function() { func.apply(undefined, args); }, wait);
    }

    /**
     * The base implementation of methods like `_.difference` without support
     * for excluding multiple arrays or iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Array} values The values to exclude.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     */
    function baseDifference(array, values, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes,
          isCommon = true,
          length = array.length,
          result = [],
          valuesLength = values.length;

      if (!length) {
        return result;
      }
      if (iteratee) {
        values = arrayMap(values, baseUnary(iteratee));
      }
      if (comparator) {
        includes = arrayIncludesWith;
        isCommon = false;
      }
      else if (values.length >= LARGE_ARRAY_SIZE) {
        includes = cacheHas;
        isCommon = false;
        values = new SetCache(values);
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee == null ? value : iteratee(value);

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var valuesIndex = valuesLength;
          while (valuesIndex--) {
            if (values[valuesIndex] === computed) {
              continue outer;
            }
          }
          result.push(value);
        }
        else if (!includes(values, computed, comparator)) {
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.forEach` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     */
    var baseEach = createBaseEach(baseForOwn);

    /**
     * The base implementation of `_.forEachRight` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     */
    var baseEachRight = createBaseEach(baseForOwnRight, true);

    /**
     * The base implementation of `_.every` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`
     */
    function baseEvery(collection, predicate) {
      var result = true;
      baseEach(collection, function(value, index, collection) {
        result = !!predicate(value, index, collection);
        return result;
      });
      return result;
    }

    /**
     * The base implementation of methods like `_.max` and `_.min` which accepts a
     * `comparator` to determine the extremum value.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} iteratee The iteratee invoked per iteration.
     * @param {Function} comparator The comparator used to compare values.
     * @returns {*} Returns the extremum value.
     */
    function baseExtremum(array, iteratee, comparator) {
      var index = -1,
          length = array.length;

      while (++index < length) {
        var value = array[index],
            current = iteratee(value);

        if (current != null && (computed === undefined
              ? (current === current && !isSymbol(current))
              : comparator(current, computed)
            )) {
          var computed = current,
              result = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.fill` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     */
    function baseFill(array, value, start, end) {
      var length = array.length;

      start = toInteger(start);
      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = (end === undefined || end > length) ? length : toInteger(end);
      if (end < 0) {
        end += length;
      }
      end = start > end ? 0 : toLength(end);
      while (start < end) {
        array[start++] = value;
      }
      return array;
    }

    /**
     * The base implementation of `_.filter` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     */
    function baseFilter(collection, predicate) {
      var result = [];
      baseEach(collection, function(value, index, collection) {
        if (predicate(value, index, collection)) {
          result.push(value);
        }
      });
      return result;
    }

    /**
     * The base implementation of `_.flatten` with support for restricting flattening.
     *
     * @private
     * @param {Array} array The array to flatten.
     * @param {number} depth The maximum recursion depth.
     * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
     * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
     * @param {Array} [result=[]] The initial result value.
     * @returns {Array} Returns the new flattened array.
     */
    function baseFlatten(array, depth, predicate, isStrict, result) {
      var index = -1,
          length = array.length;

      predicate || (predicate = isFlattenable);
      result || (result = []);

      while (++index < length) {
        var value = array[index];
        if (depth > 0 && predicate(value)) {
          if (depth > 1) {
            // Recursively flatten arrays (susceptible to call stack limits).
            baseFlatten(value, depth - 1, predicate, isStrict, result);
          } else {
            arrayPush(result, value);
          }
        } else if (!isStrict) {
          result[result.length] = value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `baseForOwn` which iterates over `object`
     * properties returned by `keysFunc` and invokes `iteratee` for each property.
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseFor = createBaseFor();

    /**
     * This function is like `baseFor` except that it iterates over properties
     * in the opposite order.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @returns {Object} Returns `object`.
     */
    var baseForRight = createBaseFor(true);

    /**
     * The base implementation of `_.forOwn` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwn(object, iteratee) {
      return object && baseFor(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.forOwnRight` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Object} Returns `object`.
     */
    function baseForOwnRight(object, iteratee) {
      return object && baseForRight(object, iteratee, keys);
    }

    /**
     * The base implementation of `_.functions` which creates an array of
     * `object` function property names filtered from `props`.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Array} props The property names to filter.
     * @returns {Array} Returns the function names.
     */
    function baseFunctions(object, props) {
      return arrayFilter(props, function(key) {
        return isFunction(object[key]);
      });
    }

    /**
     * The base implementation of `_.get` without support for default values.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @returns {*} Returns the resolved value.
     */
    function baseGet(object, path) {
      path = castPath(path, object);

      var index = 0,
          length = path.length;

      while (object != null && index < length) {
        object = object[toKey(path[index++])];
      }
      return (index && index == length) ? object : undefined;
    }

    /**
     * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
     * `keysFunc` and `symbolsFunc` to get the enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Function} keysFunc The function to get the keys of `object`.
     * @param {Function} symbolsFunc The function to get the symbols of `object`.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function baseGetAllKeys(object, keysFunc, symbolsFunc) {
      var result = keysFunc(object);
      return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
    }

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag && symToStringTag in Object(value))
        ? getRawTag(value)
        : objectToString(value);
    }

    /**
     * The base implementation of `_.gt` which doesn't coerce arguments.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than `other`,
     *  else `false`.
     */
    function baseGt(value, other) {
      return value > other;
    }

    /**
     * The base implementation of `_.has` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHas(object, key) {
      return object != null && hasOwnProperty.call(object, key);
    }

    /**
     * The base implementation of `_.hasIn` without support for deep paths.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {Array|string} key The key to check.
     * @returns {boolean} Returns `true` if `key` exists, else `false`.
     */
    function baseHasIn(object, key) {
      return object != null && key in Object(object);
    }

    /**
     * The base implementation of `_.inRange` which doesn't coerce arguments.
     *
     * @private
     * @param {number} number The number to check.
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `number` is in the range, else `false`.
     */
    function baseInRange(number, start, end) {
      return number >= nativeMin(start, end) && number < nativeMax(start, end);
    }

    /**
     * The base implementation of methods like `_.intersection`, without support
     * for iteratee shorthands, that accepts an array of arrays to inspect.
     *
     * @private
     * @param {Array} arrays The arrays to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of shared values.
     */
    function baseIntersection(arrays, iteratee, comparator) {
      var includes = comparator ? arrayIncludesWith : arrayIncludes,
          length = arrays[0].length,
          othLength = arrays.length,
          othIndex = othLength,
          caches = Array(othLength),
          maxLength = Infinity,
          result = [];

      while (othIndex--) {
        var array = arrays[othIndex];
        if (othIndex && iteratee) {
          array = arrayMap(array, baseUnary(iteratee));
        }
        maxLength = nativeMin(array.length, maxLength);
        caches[othIndex] = !comparator && (iteratee || (length >= 120 && array.length >= 120))
          ? new SetCache(othIndex && array)
          : undefined;
      }
      array = arrays[0];

      var index = -1,
          seen = caches[0];

      outer:
      while (++index < length && result.length < maxLength) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (!(seen
              ? cacheHas(seen, computed)
              : includes(result, computed, comparator)
            )) {
          othIndex = othLength;
          while (--othIndex) {
            var cache = caches[othIndex];
            if (!(cache
                  ? cacheHas(cache, computed)
                  : includes(arrays[othIndex], computed, comparator))
                ) {
              continue outer;
            }
          }
          if (seen) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.invert` and `_.invertBy` which inverts
     * `object` with values transformed by `iteratee` and set by `setter`.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} setter The function to set `accumulator` values.
     * @param {Function} iteratee The iteratee to transform values.
     * @param {Object} accumulator The initial inverted object.
     * @returns {Function} Returns `accumulator`.
     */
    function baseInverter(object, setter, iteratee, accumulator) {
      baseForOwn(object, function(value, key, object) {
        setter(accumulator, iteratee(value), key, object);
      });
      return accumulator;
    }

    /**
     * The base implementation of `_.invoke` without support for individual
     * method arguments.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {Array} args The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     */
    function baseInvoke(object, path, args) {
      path = castPath(path, object);
      object = parent(object, path);
      var func = object == null ? object : object[toKey(last(path))];
      return func == null ? undefined : apply(func, object, args);
    }

    /**
     * The base implementation of `_.isArguments`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     */
    function baseIsArguments(value) {
      return isObjectLike(value) && baseGetTag(value) == argsTag;
    }

    /**
     * The base implementation of `_.isArrayBuffer` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
     */
    function baseIsArrayBuffer(value) {
      return isObjectLike(value) && baseGetTag(value) == arrayBufferTag;
    }

    /**
     * The base implementation of `_.isDate` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
     */
    function baseIsDate(value) {
      return isObjectLike(value) && baseGetTag(value) == dateTag;
    }

    /**
     * The base implementation of `_.isEqual` which supports partial comparisons
     * and tracks traversed objects.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {boolean} bitmask The bitmask flags.
     *  1 - Unordered comparison
     *  2 - Partial comparison
     * @param {Function} [customizer] The function to customize comparisons.
     * @param {Object} [stack] Tracks traversed `value` and `other` objects.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     */
    function baseIsEqual(value, other, bitmask, customizer, stack) {
      if (value === other) {
        return true;
      }
      if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
        return value !== value && other !== other;
      }
      return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
    }

    /**
     * A specialized version of `baseIsEqual` for arrays and objects which performs
     * deep comparisons and tracks traversed objects enabling objects with circular
     * references to be compared.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} [stack] Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
      var objIsArr = isArray(object),
          othIsArr = isArray(other),
          objTag = objIsArr ? arrayTag : getTag(object),
          othTag = othIsArr ? arrayTag : getTag(other);

      objTag = objTag == argsTag ? objectTag : objTag;
      othTag = othTag == argsTag ? objectTag : othTag;

      var objIsObj = objTag == objectTag,
          othIsObj = othTag == objectTag,
          isSameTag = objTag == othTag;

      if (isSameTag && isBuffer(object)) {
        if (!isBuffer(other)) {
          return false;
        }
        objIsArr = true;
        objIsObj = false;
      }
      if (isSameTag && !objIsObj) {
        stack || (stack = new Stack);
        return (objIsArr || isTypedArray(object))
          ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
          : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
      }
      if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
        var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
            othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

        if (objIsWrapped || othIsWrapped) {
          var objUnwrapped = objIsWrapped ? object.value() : object,
              othUnwrapped = othIsWrapped ? other.value() : other;

          stack || (stack = new Stack);
          return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
        }
      }
      if (!isSameTag) {
        return false;
      }
      stack || (stack = new Stack);
      return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
    }

    /**
     * The base implementation of `_.isMap` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     */
    function baseIsMap(value) {
      return isObjectLike(value) && getTag(value) == mapTag;
    }

    /**
     * The base implementation of `_.isMatch` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Array} matchData The property names, values, and compare flags to match.
     * @param {Function} [customizer] The function to customize comparisons.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     */
    function baseIsMatch(object, source, matchData, customizer) {
      var index = matchData.length,
          length = index,
          noCustomizer = !customizer;

      if (object == null) {
        return !length;
      }
      object = Object(object);
      while (index--) {
        var data = matchData[index];
        if ((noCustomizer && data[2])
              ? data[1] !== object[data[0]]
              : !(data[0] in object)
            ) {
          return false;
        }
      }
      while (++index < length) {
        data = matchData[index];
        var key = data[0],
            objValue = object[key],
            srcValue = data[1];

        if (noCustomizer && data[2]) {
          if (objValue === undefined && !(key in object)) {
            return false;
          }
        } else {
          var stack = new Stack;
          if (customizer) {
            var result = customizer(objValue, srcValue, key, object, source, stack);
          }
          if (!(result === undefined
                ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
                : result
              )) {
            return false;
          }
        }
      }
      return true;
    }

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject(value) || isMasked(value)) {
        return false;
      }
      var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource(value));
    }

    /**
     * The base implementation of `_.isRegExp` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
     */
    function baseIsRegExp(value) {
      return isObjectLike(value) && baseGetTag(value) == regexpTag;
    }

    /**
     * The base implementation of `_.isSet` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     */
    function baseIsSet(value) {
      return isObjectLike(value) && getTag(value) == setTag;
    }

    /**
     * The base implementation of `_.isTypedArray` without Node.js optimizations.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     */
    function baseIsTypedArray(value) {
      return isObjectLike(value) &&
        isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
    }

    /**
     * The base implementation of `_.iteratee`.
     *
     * @private
     * @param {*} [value=_.identity] The value to convert to an iteratee.
     * @returns {Function} Returns the iteratee.
     */
    function baseIteratee(value) {
      // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
      // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
      if (typeof value == 'function') {
        return value;
      }
      if (value == null) {
        return identity;
      }
      if (typeof value == 'object') {
        return isArray(value)
          ? baseMatchesProperty(value[0], value[1])
          : baseMatches(value);
      }
      return property(value);
    }

    /**
     * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != 'constructor') {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function baseKeysIn(object) {
      if (!isObject(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object),
          result = [];

      for (var key in object) {
        if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.lt` which doesn't coerce arguments.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than `other`,
     *  else `false`.
     */
    function baseLt(value, other) {
      return value < other;
    }

    /**
     * The base implementation of `_.map` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} iteratee The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     */
    function baseMap(collection, iteratee) {
      var index = -1,
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value, key, collection) {
        result[++index] = iteratee(value, key, collection);
      });
      return result;
    }

    /**
     * The base implementation of `_.matches` which doesn't clone `source`.
     *
     * @private
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new spec function.
     */
    function baseMatches(source) {
      var matchData = getMatchData(source);
      if (matchData.length == 1 && matchData[0][2]) {
        return matchesStrictComparable(matchData[0][0], matchData[0][1]);
      }
      return function(object) {
        return object === source || baseIsMatch(object, source, matchData);
      };
    }

    /**
     * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
     *
     * @private
     * @param {string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     */
    function baseMatchesProperty(path, srcValue) {
      if (isKey(path) && isStrictComparable(srcValue)) {
        return matchesStrictComparable(toKey(path), srcValue);
      }
      return function(object) {
        var objValue = get(object, path);
        return (objValue === undefined && objValue === srcValue)
          ? hasIn(object, path)
          : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
      };
    }

    /**
     * The base implementation of `_.merge` without support for multiple sources.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} [customizer] The function to customize merged values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMerge(object, source, srcIndex, customizer, stack) {
      if (object === source) {
        return;
      }
      baseFor(source, function(srcValue, key) {
        if (isObject(srcValue)) {
          stack || (stack = new Stack);
          baseMergeDeep(object, source, key, srcIndex, baseMerge, customizer, stack);
        }
        else {
          var newValue = customizer
            ? customizer(safeGet(object, key), srcValue, (key + ''), object, source, stack)
            : undefined;

          if (newValue === undefined) {
            newValue = srcValue;
          }
          assignMergeValue(object, key, newValue);
        }
      }, keysIn);
    }

    /**
     * A specialized version of `baseMerge` for arrays and objects which performs
     * deep merges and tracks traversed objects enabling objects with circular
     * references to be merged.
     *
     * @private
     * @param {Object} object The destination object.
     * @param {Object} source The source object.
     * @param {string} key The key of the value to merge.
     * @param {number} srcIndex The index of `source`.
     * @param {Function} mergeFunc The function to merge values.
     * @param {Function} [customizer] The function to customize assigned values.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     */
    function baseMergeDeep(object, source, key, srcIndex, mergeFunc, customizer, stack) {
      var objValue = safeGet(object, key),
          srcValue = safeGet(source, key),
          stacked = stack.get(srcValue);

      if (stacked) {
        assignMergeValue(object, key, stacked);
        return;
      }
      var newValue = customizer
        ? customizer(objValue, srcValue, (key + ''), object, source, stack)
        : undefined;

      var isCommon = newValue === undefined;

      if (isCommon) {
        var isArr = isArray(srcValue),
            isBuff = !isArr && isBuffer(srcValue),
            isTyped = !isArr && !isBuff && isTypedArray(srcValue);

        newValue = srcValue;
        if (isArr || isBuff || isTyped) {
          if (isArray(objValue)) {
            newValue = objValue;
          }
          else if (isArrayLikeObject(objValue)) {
            newValue = copyArray(objValue);
          }
          else if (isBuff) {
            isCommon = false;
            newValue = cloneBuffer(srcValue, true);
          }
          else if (isTyped) {
            isCommon = false;
            newValue = cloneTypedArray(srcValue, true);
          }
          else {
            newValue = [];
          }
        }
        else if (isPlainObject(srcValue) || isArguments(srcValue)) {
          newValue = objValue;
          if (isArguments(objValue)) {
            newValue = toPlainObject(objValue);
          }
          else if (!isObject(objValue) || (srcIndex && isFunction(objValue))) {
            newValue = initCloneObject(srcValue);
          }
        }
        else {
          isCommon = false;
        }
      }
      if (isCommon) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, newValue);
        mergeFunc(newValue, srcValue, srcIndex, customizer, stack);
        stack['delete'](srcValue);
      }
      assignMergeValue(object, key, newValue);
    }

    /**
     * The base implementation of `_.nth` which doesn't coerce arguments.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {number} n The index of the element to return.
     * @returns {*} Returns the nth element of `array`.
     */
    function baseNth(array, n) {
      var length = array.length;
      if (!length) {
        return;
      }
      n += n < 0 ? length : 0;
      return isIndex(n, length) ? array[n] : undefined;
    }

    /**
     * The base implementation of `_.orderBy` without param guards.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
     * @param {string[]} orders The sort orders of `iteratees`.
     * @returns {Array} Returns the new sorted array.
     */
    function baseOrderBy(collection, iteratees, orders) {
      var index = -1;
      iteratees = arrayMap(iteratees.length ? iteratees : [identity], baseUnary(getIteratee()));

      var result = baseMap(collection, function(value, key, collection) {
        var criteria = arrayMap(iteratees, function(iteratee) {
          return iteratee(value);
        });
        return { 'criteria': criteria, 'index': ++index, 'value': value };
      });

      return baseSortBy(result, function(object, other) {
        return compareMultiple(object, other, orders);
      });
    }

    /**
     * The base implementation of `_.pick` without support for individual
     * property identifiers.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} paths The property paths to pick.
     * @returns {Object} Returns the new object.
     */
    function basePick(object, paths) {
      return basePickBy(object, paths, function(value, path) {
        return hasIn(object, path);
      });
    }

    /**
     * The base implementation of  `_.pickBy` without support for iteratee shorthands.
     *
     * @private
     * @param {Object} object The source object.
     * @param {string[]} paths The property paths to pick.
     * @param {Function} predicate The function invoked per property.
     * @returns {Object} Returns the new object.
     */
    function basePickBy(object, paths, predicate) {
      var index = -1,
          length = paths.length,
          result = {};

      while (++index < length) {
        var path = paths[index],
            value = baseGet(object, path);

        if (predicate(value, path)) {
          baseSet(result, castPath(path, object), value);
        }
      }
      return result;
    }

    /**
     * A specialized version of `baseProperty` which supports deep paths.
     *
     * @private
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new accessor function.
     */
    function basePropertyDeep(path) {
      return function(object) {
        return baseGet(object, path);
      };
    }

    /**
     * The base implementation of `_.pullAllBy` without support for iteratee
     * shorthands.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns `array`.
     */
    function basePullAll(array, values, iteratee, comparator) {
      var indexOf = comparator ? baseIndexOfWith : baseIndexOf,
          index = -1,
          length = values.length,
          seen = array;

      if (array === values) {
        values = copyArray(values);
      }
      if (iteratee) {
        seen = arrayMap(array, baseUnary(iteratee));
      }
      while (++index < length) {
        var fromIndex = 0,
            value = values[index],
            computed = iteratee ? iteratee(value) : value;

        while ((fromIndex = indexOf(seen, computed, fromIndex, comparator)) > -1) {
          if (seen !== array) {
            splice.call(seen, fromIndex, 1);
          }
          splice.call(array, fromIndex, 1);
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.pullAt` without support for individual
     * indexes or capturing the removed elements.
     *
     * @private
     * @param {Array} array The array to modify.
     * @param {number[]} indexes The indexes of elements to remove.
     * @returns {Array} Returns `array`.
     */
    function basePullAt(array, indexes) {
      var length = array ? indexes.length : 0,
          lastIndex = length - 1;

      while (length--) {
        var index = indexes[length];
        if (length == lastIndex || index !== previous) {
          var previous = index;
          if (isIndex(index)) {
            splice.call(array, index, 1);
          } else {
            baseUnset(array, index);
          }
        }
      }
      return array;
    }

    /**
     * The base implementation of `_.random` without support for returning
     * floating-point numbers.
     *
     * @private
     * @param {number} lower The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the random number.
     */
    function baseRandom(lower, upper) {
      return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
    }

    /**
     * The base implementation of `_.range` and `_.rangeRight` which doesn't
     * coerce arguments.
     *
     * @private
     * @param {number} start The start of the range.
     * @param {number} end The end of the range.
     * @param {number} step The value to increment or decrement by.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the range of numbers.
     */
    function baseRange(start, end, step, fromRight) {
      var index = -1,
          length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
          result = Array(length);

      while (length--) {
        result[fromRight ? length : ++index] = start;
        start += step;
      }
      return result;
    }

    /**
     * The base implementation of `_.repeat` which doesn't coerce arguments.
     *
     * @private
     * @param {string} string The string to repeat.
     * @param {number} n The number of times to repeat the string.
     * @returns {string} Returns the repeated string.
     */
    function baseRepeat(string, n) {
      var result = '';
      if (!string || n < 1 || n > MAX_SAFE_INTEGER) {
        return result;
      }
      // Leverage the exponentiation by squaring algorithm for a faster repeat.
      // See https://en.wikipedia.org/wiki/Exponentiation_by_squaring for more details.
      do {
        if (n % 2) {
          result += string;
        }
        n = nativeFloor(n / 2);
        if (n) {
          string += string;
        }
      } while (n);

      return result;
    }

    /**
     * The base implementation of `_.rest` which doesn't validate or coerce arguments.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     */
    function baseRest(func, start) {
      return setToString(overRest(func, start, identity), func + '');
    }

    /**
     * The base implementation of `_.sample`.
     *
     * @private
     * @param {Array|Object} collection The collection to sample.
     * @returns {*} Returns the random element.
     */
    function baseSample(collection) {
      return arraySample(values(collection));
    }

    /**
     * The base implementation of `_.sampleSize` without param guards.
     *
     * @private
     * @param {Array|Object} collection The collection to sample.
     * @param {number} n The number of elements to sample.
     * @returns {Array} Returns the random elements.
     */
    function baseSampleSize(collection, n) {
      var array = values(collection);
      return shuffleSelf(array, baseClamp(n, 0, array.length));
    }

    /**
     * The base implementation of `_.set`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @param {Function} [customizer] The function to customize path creation.
     * @returns {Object} Returns `object`.
     */
    function baseSet(object, path, value, customizer) {
      if (!isObject(object)) {
        return object;
      }
      path = castPath(path, object);

      var index = -1,
          length = path.length,
          lastIndex = length - 1,
          nested = object;

      while (nested != null && ++index < length) {
        var key = toKey(path[index]),
            newValue = value;

        if (index != lastIndex) {
          var objValue = nested[key];
          newValue = customizer ? customizer(objValue, key, nested) : undefined;
          if (newValue === undefined) {
            newValue = isObject(objValue)
              ? objValue
              : (isIndex(path[index + 1]) ? [] : {});
          }
        }
        assignValue(nested, key, newValue);
        nested = nested[key];
      }
      return object;
    }

    /**
     * The base implementation of `setData` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var baseSetData = !metaMap ? identity : function(func, data) {
      metaMap.set(func, data);
      return func;
    };

    /**
     * The base implementation of `setToString` without support for hot loop shorting.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var baseSetToString = !defineProperty ? identity : function(func, string) {
      return defineProperty(func, 'toString', {
        'configurable': true,
        'enumerable': false,
        'value': constant(string),
        'writable': true
      });
    };

    /**
     * The base implementation of `_.shuffle`.
     *
     * @private
     * @param {Array|Object} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     */
    function baseShuffle(collection) {
      return shuffleSelf(values(collection));
    }

    /**
     * The base implementation of `_.slice` without an iteratee call guard.
     *
     * @private
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseSlice(array, start, end) {
      var index = -1,
          length = array.length;

      if (start < 0) {
        start = -start > length ? 0 : (length + start);
      }
      end = end > length ? length : end;
      if (end < 0) {
        end += length;
      }
      length = start > end ? 0 : ((end - start) >>> 0);
      start >>>= 0;

      var result = Array(length);
      while (++index < length) {
        result[index] = array[index + start];
      }
      return result;
    }

    /**
     * The base implementation of `_.some` without support for iteratee shorthands.
     *
     * @private
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} predicate The function invoked per iteration.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     */
    function baseSome(collection, predicate) {
      var result;

      baseEach(collection, function(value, index, collection) {
        result = predicate(value, index, collection);
        return !result;
      });
      return !!result;
    }

    /**
     * The base implementation of `_.sortedIndex` and `_.sortedLastIndex` which
     * performs a binary search of `array` to determine the index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function baseSortedIndex(array, value, retHighest) {
      var low = 0,
          high = array == null ? low : array.length;

      if (typeof value == 'number' && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
        while (low < high) {
          var mid = (low + high) >>> 1,
              computed = array[mid];

          if (computed !== null && !isSymbol(computed) &&
              (retHighest ? (computed <= value) : (computed < value))) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        return high;
      }
      return baseSortedIndexBy(array, value, identity, retHighest);
    }

    /**
     * The base implementation of `_.sortedIndexBy` and `_.sortedLastIndexBy`
     * which invokes `iteratee` for `value` and each element of `array` to compute
     * their sort ranking. The iteratee is invoked with one argument; (value).
     *
     * @private
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} iteratee The iteratee invoked per element.
     * @param {boolean} [retHighest] Specify returning the highest qualified index.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     */
    function baseSortedIndexBy(array, value, iteratee, retHighest) {
      value = iteratee(value);

      var low = 0,
          high = array == null ? 0 : array.length,
          valIsNaN = value !== value,
          valIsNull = value === null,
          valIsSymbol = isSymbol(value),
          valIsUndefined = value === undefined;

      while (low < high) {
        var mid = nativeFloor((low + high) / 2),
            computed = iteratee(array[mid]),
            othIsDefined = computed !== undefined,
            othIsNull = computed === null,
            othIsReflexive = computed === computed,
            othIsSymbol = isSymbol(computed);

        if (valIsNaN) {
          var setLow = retHighest || othIsReflexive;
        } else if (valIsUndefined) {
          setLow = othIsReflexive && (retHighest || othIsDefined);
        } else if (valIsNull) {
          setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
        } else if (valIsSymbol) {
          setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
        } else if (othIsNull || othIsSymbol) {
          setLow = false;
        } else {
          setLow = retHighest ? (computed <= value) : (computed < value);
        }
        if (setLow) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return nativeMin(high, MAX_ARRAY_INDEX);
    }

    /**
     * The base implementation of `_.sortedUniq` and `_.sortedUniqBy` without
     * support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     */
    function baseSortedUniq(array, iteratee) {
      var index = -1,
          length = array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        if (!index || !eq(computed, seen)) {
          var seen = computed;
          result[resIndex++] = value === 0 ? 0 : value;
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.toNumber` which doesn't ensure correct
     * conversions of binary, hexadecimal, or octal string values.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     */
    function baseToNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      return +value;
    }

    /**
     * The base implementation of `_.toString` which doesn't convert nullish
     * values to empty strings.
     *
     * @private
     * @param {*} value The value to process.
     * @returns {string} Returns the string.
     */
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value;
      }
      if (isArray(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return arrayMap(value, baseToString) + '';
      }
      if (isSymbol(value)) {
        return symbolToString ? symbolToString.call(value) : '';
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
    }

    /**
     * The base implementation of `_.uniqBy` without support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     */
    function baseUniq(array, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes,
          length = array.length,
          isCommon = true,
          result = [],
          seen = result;

      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith;
      }
      else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet(array);
        if (set) {
          return setToArray(set);
        }
        isCommon = false;
        includes = cacheHas;
        seen = new SetCache;
      }
      else {
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (!includes(seen, computed, comparator)) {
          if (seen !== result) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    /**
     * The base implementation of `_.unset`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The property path to unset.
     * @returns {boolean} Returns `true` if the property is deleted, else `false`.
     */
    function baseUnset(object, path) {
      path = castPath(path, object);
      object = parent(object, path);
      return object == null || delete object[toKey(last(path))];
    }

    /**
     * The base implementation of `_.update`.
     *
     * @private
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to update.
     * @param {Function} updater The function to produce the updated value.
     * @param {Function} [customizer] The function to customize path creation.
     * @returns {Object} Returns `object`.
     */
    function baseUpdate(object, path, updater, customizer) {
      return baseSet(object, path, updater(baseGet(object, path)), customizer);
    }

    /**
     * The base implementation of methods like `_.dropWhile` and `_.takeWhile`
     * without support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to query.
     * @param {Function} predicate The function invoked per iteration.
     * @param {boolean} [isDrop] Specify dropping elements instead of taking them.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Array} Returns the slice of `array`.
     */
    function baseWhile(array, predicate, isDrop, fromRight) {
      var length = array.length,
          index = fromRight ? length : -1;

      while ((fromRight ? index-- : ++index < length) &&
        predicate(array[index], index, array)) {}

      return isDrop
        ? baseSlice(array, (fromRight ? 0 : index), (fromRight ? index + 1 : length))
        : baseSlice(array, (fromRight ? index + 1 : 0), (fromRight ? length : index));
    }

    /**
     * The base implementation of `wrapperValue` which returns the result of
     * performing a sequence of actions on the unwrapped `value`, where each
     * successive action is supplied the return value of the previous.
     *
     * @private
     * @param {*} value The unwrapped value.
     * @param {Array} actions Actions to perform to resolve the unwrapped value.
     * @returns {*} Returns the resolved value.
     */
    function baseWrapperValue(value, actions) {
      var result = value;
      if (result instanceof LazyWrapper) {
        result = result.value();
      }
      return arrayReduce(actions, function(result, action) {
        return action.func.apply(action.thisArg, arrayPush([result], action.args));
      }, result);
    }

    /**
     * The base implementation of methods like `_.xor`, without support for
     * iteratee shorthands, that accepts an array of arrays to inspect.
     *
     * @private
     * @param {Array} arrays The arrays to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of values.
     */
    function baseXor(arrays, iteratee, comparator) {
      var length = arrays.length;
      if (length < 2) {
        return length ? baseUniq(arrays[0]) : [];
      }
      var index = -1,
          result = Array(length);

      while (++index < length) {
        var array = arrays[index],
            othIndex = -1;

        while (++othIndex < length) {
          if (othIndex != index) {
            result[index] = baseDifference(result[index] || array, arrays[othIndex], iteratee, comparator);
          }
        }
      }
      return baseUniq(baseFlatten(result, 1), iteratee, comparator);
    }

    /**
     * This base implementation of `_.zipObject` which assigns values using `assignFunc`.
     *
     * @private
     * @param {Array} props The property identifiers.
     * @param {Array} values The property values.
     * @param {Function} assignFunc The function to assign values.
     * @returns {Object} Returns the new object.
     */
    function baseZipObject(props, values, assignFunc) {
      var index = -1,
          length = props.length,
          valsLength = values.length,
          result = {};

      while (++index < length) {
        var value = index < valsLength ? values[index] : undefined;
        assignFunc(result, props[index], value);
      }
      return result;
    }

    /**
     * Casts `value` to an empty array if it's not an array like object.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Array|Object} Returns the cast array-like object.
     */
    function castArrayLikeObject(value) {
      return isArrayLikeObject(value) ? value : [];
    }

    /**
     * Casts `value` to `identity` if it's not a function.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {Function} Returns cast function.
     */
    function castFunction(value) {
      return typeof value == 'function' ? value : identity;
    }

    /**
     * Casts `value` to a path array if it's not one.
     *
     * @private
     * @param {*} value The value to inspect.
     * @param {Object} [object] The object to query keys on.
     * @returns {Array} Returns the cast property path array.
     */
    function castPath(value, object) {
      if (isArray(value)) {
        return value;
      }
      return isKey(value, object) ? [value] : stringToPath(toString(value));
    }

    /**
     * A `baseRest` alias which can be replaced with `identity` by module
     * replacement plugins.
     *
     * @private
     * @type {Function}
     * @param {Function} func The function to apply a rest parameter to.
     * @returns {Function} Returns the new function.
     */
    var castRest = baseRest;

    /**
     * Casts `array` to a slice if it's needed.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {number} start The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the cast slice.
     */
    function castSlice(array, start, end) {
      var length = array.length;
      end = end === undefined ? length : end;
      return (!start && end >= length) ? array : baseSlice(array, start, end);
    }

    /**
     * A simple wrapper around the global [`clearTimeout`](https://mdn.io/clearTimeout).
     *
     * @private
     * @param {number|Object} id The timer id or timeout object of the timer to clear.
     */
    var clearTimeout = ctxClearTimeout || function(id) {
      return root.clearTimeout(id);
    };

    /**
     * Creates a clone of  `buffer`.
     *
     * @private
     * @param {Buffer} buffer The buffer to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Buffer} Returns the cloned buffer.
     */
    function cloneBuffer(buffer, isDeep) {
      if (isDeep) {
        return buffer.slice();
      }
      var length = buffer.length,
          result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

      buffer.copy(result);
      return result;
    }

    /**
     * Creates a clone of `arrayBuffer`.
     *
     * @private
     * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
     * @returns {ArrayBuffer} Returns the cloned array buffer.
     */
    function cloneArrayBuffer(arrayBuffer) {
      var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
      new Uint8Array(result).set(new Uint8Array(arrayBuffer));
      return result;
    }

    /**
     * Creates a clone of `dataView`.
     *
     * @private
     * @param {Object} dataView The data view to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned data view.
     */
    function cloneDataView(dataView, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
      return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
    }

    /**
     * Creates a clone of `regexp`.
     *
     * @private
     * @param {Object} regexp The regexp to clone.
     * @returns {Object} Returns the cloned regexp.
     */
    function cloneRegExp(regexp) {
      var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
      result.lastIndex = regexp.lastIndex;
      return result;
    }

    /**
     * Creates a clone of the `symbol` object.
     *
     * @private
     * @param {Object} symbol The symbol object to clone.
     * @returns {Object} Returns the cloned symbol object.
     */
    function cloneSymbol(symbol) {
      return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
    }

    /**
     * Creates a clone of `typedArray`.
     *
     * @private
     * @param {Object} typedArray The typed array to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the cloned typed array.
     */
    function cloneTypedArray(typedArray, isDeep) {
      var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
      return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
    }

    /**
     * Compares values to sort them in ascending order.
     *
     * @private
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {number} Returns the sort order indicator for `value`.
     */
    function compareAscending(value, other) {
      if (value !== other) {
        var valIsDefined = value !== undefined,
            valIsNull = value === null,
            valIsReflexive = value === value,
            valIsSymbol = isSymbol(value);

        var othIsDefined = other !== undefined,
            othIsNull = other === null,
            othIsReflexive = other === other,
            othIsSymbol = isSymbol(other);

        if ((!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
            (valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
            (valIsNull && othIsDefined && othIsReflexive) ||
            (!valIsDefined && othIsReflexive) ||
            !valIsReflexive) {
          return 1;
        }
        if ((!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
            (othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
            (othIsNull && valIsDefined && valIsReflexive) ||
            (!othIsDefined && valIsReflexive) ||
            !othIsReflexive) {
          return -1;
        }
      }
      return 0;
    }

    /**
     * Used by `_.orderBy` to compare multiple properties of a value to another
     * and stable sort them.
     *
     * If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
     * specify an order of "desc" for descending or "asc" for ascending sort order
     * of corresponding values.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {boolean[]|string[]} orders The order to sort by for each property.
     * @returns {number} Returns the sort order indicator for `object`.
     */
    function compareMultiple(object, other, orders) {
      var index = -1,
          objCriteria = object.criteria,
          othCriteria = other.criteria,
          length = objCriteria.length,
          ordersLength = orders.length;

      while (++index < length) {
        var result = compareAscending(objCriteria[index], othCriteria[index]);
        if (result) {
          if (index >= ordersLength) {
            return result;
          }
          var order = orders[index];
          return result * (order == 'desc' ? -1 : 1);
        }
      }
      // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications
      // that causes it, under certain circumstances, to provide the same value for
      // `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247
      // for more details.
      //
      // This also ensures a stable sort in V8 and other engines.
      // See https://bugs.chromium.org/p/v8/issues/detail?id=90 for more details.
      return object.index - other.index;
    }

    /**
     * Creates an array that is the composition of partially applied arguments,
     * placeholders, and provided arguments into a single array of arguments.
     *
     * @private
     * @param {Array} args The provided arguments.
     * @param {Array} partials The arguments to prepend to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @params {boolean} [isCurried] Specify composing for a curried function.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgs(args, partials, holders, isCurried) {
      var argsIndex = -1,
          argsLength = args.length,
          holdersLength = holders.length,
          leftIndex = -1,
          leftLength = partials.length,
          rangeLength = nativeMax(argsLength - holdersLength, 0),
          result = Array(leftLength + rangeLength),
          isUncurried = !isCurried;

      while (++leftIndex < leftLength) {
        result[leftIndex] = partials[leftIndex];
      }
      while (++argsIndex < holdersLength) {
        if (isUncurried || argsIndex < argsLength) {
          result[holders[argsIndex]] = args[argsIndex];
        }
      }
      while (rangeLength--) {
        result[leftIndex++] = args[argsIndex++];
      }
      return result;
    }

    /**
     * This function is like `composeArgs` except that the arguments composition
     * is tailored for `_.partialRight`.
     *
     * @private
     * @param {Array} args The provided arguments.
     * @param {Array} partials The arguments to append to those provided.
     * @param {Array} holders The `partials` placeholder indexes.
     * @params {boolean} [isCurried] Specify composing for a curried function.
     * @returns {Array} Returns the new array of composed arguments.
     */
    function composeArgsRight(args, partials, holders, isCurried) {
      var argsIndex = -1,
          argsLength = args.length,
          holdersIndex = -1,
          holdersLength = holders.length,
          rightIndex = -1,
          rightLength = partials.length,
          rangeLength = nativeMax(argsLength - holdersLength, 0),
          result = Array(rangeLength + rightLength),
          isUncurried = !isCurried;

      while (++argsIndex < rangeLength) {
        result[argsIndex] = args[argsIndex];
      }
      var offset = argsIndex;
      while (++rightIndex < rightLength) {
        result[offset + rightIndex] = partials[rightIndex];
      }
      while (++holdersIndex < holdersLength) {
        if (isUncurried || argsIndex < argsLength) {
          result[offset + holders[holdersIndex]] = args[argsIndex++];
        }
      }
      return result;
    }

    /**
     * Copies the values of `source` to `array`.
     *
     * @private
     * @param {Array} source The array to copy values from.
     * @param {Array} [array=[]] The array to copy values to.
     * @returns {Array} Returns `array`.
     */
    function copyArray(source, array) {
      var index = -1,
          length = source.length;

      array || (array = Array(length));
      while (++index < length) {
        array[index] = source[index];
      }
      return array;
    }

    /**
     * Copies properties of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy properties from.
     * @param {Array} props The property identifiers to copy.
     * @param {Object} [object={}] The object to copy properties to.
     * @param {Function} [customizer] The function to customize copied values.
     * @returns {Object} Returns `object`.
     */
    function copyObject(source, props, object, customizer) {
      var isNew = !object;
      object || (object = {});

      var index = -1,
          length = props.length;

      while (++index < length) {
        var key = props[index];

        var newValue = customizer
          ? customizer(object[key], source[key], key, object, source)
          : undefined;

        if (newValue === undefined) {
          newValue = source[key];
        }
        if (isNew) {
          baseAssignValue(object, key, newValue);
        } else {
          assignValue(object, key, newValue);
        }
      }
      return object;
    }

    /**
     * Copies own symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbols(source, object) {
      return copyObject(source, getSymbols(source), object);
    }

    /**
     * Copies own and inherited symbols of `source` to `object`.
     *
     * @private
     * @param {Object} source The object to copy symbols from.
     * @param {Object} [object={}] The object to copy symbols to.
     * @returns {Object} Returns `object`.
     */
    function copySymbolsIn(source, object) {
      return copyObject(source, getSymbolsIn(source), object);
    }

    /**
     * Creates a function like `_.groupBy`.
     *
     * @private
     * @param {Function} setter The function to set accumulator values.
     * @param {Function} [initializer] The accumulator object initializer.
     * @returns {Function} Returns the new aggregator function.
     */
    function createAggregator(setter, initializer) {
      return function(collection, iteratee) {
        var func = isArray(collection) ? arrayAggregator : baseAggregator,
            accumulator = initializer ? initializer() : {};

        return func(collection, setter, getIteratee(iteratee, 2), accumulator);
      };
    }

    /**
     * Creates a function like `_.assign`.
     *
     * @private
     * @param {Function} assigner The function to assign values.
     * @returns {Function} Returns the new assigner function.
     */
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1,
            length = sources.length,
            customizer = length > 1 ? sources[length - 1] : undefined,
            guard = length > 2 ? sources[2] : undefined;

        customizer = (assigner.length > 3 && typeof customizer == 'function')
          ? (length--, customizer)
          : undefined;

        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? undefined : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }

    /**
     * Creates a `baseEach` or `baseEachRight` function.
     *
     * @private
     * @param {Function} eachFunc The function to iterate over a collection.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseEach(eachFunc, fromRight) {
      return function(collection, iteratee) {
        if (collection == null) {
          return collection;
        }
        if (!isArrayLike(collection)) {
          return eachFunc(collection, iteratee);
        }
        var length = collection.length,
            index = fromRight ? length : -1,
            iterable = Object(collection);

        while ((fromRight ? index-- : ++index < length)) {
          if (iteratee(iterable[index], index, iterable) === false) {
            break;
          }
        }
        return collection;
      };
    }

    /**
     * Creates a base function for methods like `_.forIn` and `_.forOwn`.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new base function.
     */
    function createBaseFor(fromRight) {
      return function(object, iteratee, keysFunc) {
        var index = -1,
            iterable = Object(object),
            props = keysFunc(object),
            length = props.length;

        while (length--) {
          var key = props[fromRight ? length : ++index];
          if (iteratee(iterable[key], key, iterable) === false) {
            break;
          }
        }
        return object;
      };
    }

    /**
     * Creates a function that wraps `func` to invoke it with the optional `this`
     * binding of `thisArg`.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createBind(func, bitmask, thisArg) {
      var isBind = bitmask & WRAP_BIND_FLAG,
          Ctor = createCtor(func);

      function wrapper() {
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return fn.apply(isBind ? thisArg : this, arguments);
      }
      return wrapper;
    }

    /**
     * Creates a function like `_.lowerFirst`.
     *
     * @private
     * @param {string} methodName The name of the `String` case method to use.
     * @returns {Function} Returns the new case function.
     */
    function createCaseFirst(methodName) {
      return function(string) {
        string = toString(string);

        var strSymbols = hasUnicode(string)
          ? stringToArray(string)
          : undefined;

        var chr = strSymbols
          ? strSymbols[0]
          : string.charAt(0);

        var trailing = strSymbols
          ? castSlice(strSymbols, 1).join('')
          : string.slice(1);

        return chr[methodName]() + trailing;
      };
    }

    /**
     * Creates a function like `_.camelCase`.
     *
     * @private
     * @param {Function} callback The function to combine each word.
     * @returns {Function} Returns the new compounder function.
     */
    function createCompounder(callback) {
      return function(string) {
        return arrayReduce(words(deburr(string).replace(reApos, '')), callback, '');
      };
    }

    /**
     * Creates a function that produces an instance of `Ctor` regardless of
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.
     *
     * @private
     * @param {Function} Ctor The constructor to wrap.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCtor(Ctor) {
      return function() {
        // Use a `switch` statement to work with class constructors. See
        // http://ecma-international.org/ecma-262/7.0/#sec-ecmascript-function-objects-call-thisargument-argumentslist
        // for more details.
        var args = arguments;
        switch (args.length) {
          case 0: return new Ctor;
          case 1: return new Ctor(args[0]);
          case 2: return new Ctor(args[0], args[1]);
          case 3: return new Ctor(args[0], args[1], args[2]);
          case 4: return new Ctor(args[0], args[1], args[2], args[3]);
          case 5: return new Ctor(args[0], args[1], args[2], args[3], args[4]);
          case 6: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5]);
          case 7: return new Ctor(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
        var thisBinding = baseCreate(Ctor.prototype),
            result = Ctor.apply(thisBinding, args);

        // Mimic the constructor's `return` behavior.
        // See https://es5.github.io/#x13.2.2 for more details.
        return isObject(result) ? result : thisBinding;
      };
    }

    /**
     * Creates a function that wraps `func` to enable currying.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {number} arity The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createCurry(func, bitmask, arity) {
      var Ctor = createCtor(func);

      function wrapper() {
        var length = arguments.length,
            args = Array(length),
            index = length,
            placeholder = getHolder(wrapper);

        while (index--) {
          args[index] = arguments[index];
        }
        var holders = (length < 3 && args[0] !== placeholder && args[length - 1] !== placeholder)
          ? []
          : replaceHolders(args, placeholder);

        length -= holders.length;
        if (length < arity) {
          return createRecurry(
            func, bitmask, createHybrid, wrapper.placeholder, undefined,
            args, holders, undefined, undefined, arity - length);
        }
        var fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;
        return apply(fn, this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.find` or `_.findLast` function.
     *
     * @private
     * @param {Function} findIndexFunc The function to find the collection index.
     * @returns {Function} Returns the new find function.
     */
    function createFind(findIndexFunc) {
      return function(collection, predicate, fromIndex) {
        var iterable = Object(collection);
        if (!isArrayLike(collection)) {
          var iteratee = getIteratee(predicate, 3);
          collection = keys(collection);
          predicate = function(key) { return iteratee(iterable[key], key, iterable); };
        }
        var index = findIndexFunc(collection, predicate, fromIndex);
        return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
      };
    }

    /**
     * Creates a `_.flow` or `_.flowRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new flow function.
     */
    function createFlow(fromRight) {
      return flatRest(function(funcs) {
        var length = funcs.length,
            index = length,
            prereq = LodashWrapper.prototype.thru;

        if (fromRight) {
          funcs.reverse();
        }
        while (index--) {
          var func = funcs[index];
          if (typeof func != 'function') {
            throw new TypeError(FUNC_ERROR_TEXT);
          }
          if (prereq && !wrapper && getFuncName(func) == 'wrapper') {
            var wrapper = new LodashWrapper([], true);
          }
        }
        index = wrapper ? index : length;
        while (++index < length) {
          func = funcs[index];

          var funcName = getFuncName(func),
              data = funcName == 'wrapper' ? getData(func) : undefined;

          if (data && isLaziable(data[0]) &&
                data[1] == (WRAP_ARY_FLAG | WRAP_CURRY_FLAG | WRAP_PARTIAL_FLAG | WRAP_REARG_FLAG) &&
                !data[4].length && data[9] == 1
              ) {
            wrapper = wrapper[getFuncName(data[0])].apply(wrapper, data[3]);
          } else {
            wrapper = (func.length == 1 && isLaziable(func))
              ? wrapper[funcName]()
              : wrapper.thru(func);
          }
        }
        return function() {
          var args = arguments,
              value = args[0];

          if (wrapper && args.length == 1 && isArray(value)) {
            return wrapper.plant(value).value();
          }
          var index = 0,
              result = length ? funcs[index].apply(this, args) : value;

          while (++index < length) {
            result = funcs[index].call(this, result);
          }
          return result;
        };
      });
    }

    /**
     * Creates a function that wraps `func` to invoke it with optional `this`
     * binding of `thisArg`, partial application, and currying.
     *
     * @private
     * @param {Function|string} func The function or method name to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to
     *  the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [partialsRight] The arguments to append to those provided
     *  to the new function.
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createHybrid(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, ary, arity) {
      var isAry = bitmask & WRAP_ARY_FLAG,
          isBind = bitmask & WRAP_BIND_FLAG,
          isBindKey = bitmask & WRAP_BIND_KEY_FLAG,
          isCurried = bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG),
          isFlip = bitmask & WRAP_FLIP_FLAG,
          Ctor = isBindKey ? undefined : createCtor(func);

      function wrapper() {
        var length = arguments.length,
            args = Array(length),
            index = length;

        while (index--) {
          args[index] = arguments[index];
        }
        if (isCurried) {
          var placeholder = getHolder(wrapper),
              holdersCount = countHolders(args, placeholder);
        }
        if (partials) {
          args = composeArgs(args, partials, holders, isCurried);
        }
        if (partialsRight) {
          args = composeArgsRight(args, partialsRight, holdersRight, isCurried);
        }
        length -= holdersCount;
        if (isCurried && length < arity) {
          var newHolders = replaceHolders(args, placeholder);
          return createRecurry(
            func, bitmask, createHybrid, wrapper.placeholder, thisArg,
            args, newHolders, argPos, ary, arity - length
          );
        }
        var thisBinding = isBind ? thisArg : this,
            fn = isBindKey ? thisBinding[func] : func;

        length = args.length;
        if (argPos) {
          args = reorder(args, argPos);
        } else if (isFlip && length > 1) {
          args.reverse();
        }
        if (isAry && ary < length) {
          args.length = ary;
        }
        if (this && this !== root && this instanceof wrapper) {
          fn = Ctor || createCtor(fn);
        }
        return fn.apply(thisBinding, args);
      }
      return wrapper;
    }

    /**
     * Creates a function like `_.invertBy`.
     *
     * @private
     * @param {Function} setter The function to set accumulator values.
     * @param {Function} toIteratee The function to resolve iteratees.
     * @returns {Function} Returns the new inverter function.
     */
    function createInverter(setter, toIteratee) {
      return function(object, iteratee) {
        return baseInverter(object, setter, toIteratee(iteratee), {});
      };
    }

    /**
     * Creates a function that performs a mathematical operation on two values.
     *
     * @private
     * @param {Function} operator The function to perform the operation.
     * @param {number} [defaultValue] The value used for `undefined` arguments.
     * @returns {Function} Returns the new mathematical operation function.
     */
    function createMathOperation(operator, defaultValue) {
      return function(value, other) {
        var result;
        if (value === undefined && other === undefined) {
          return defaultValue;
        }
        if (value !== undefined) {
          result = value;
        }
        if (other !== undefined) {
          if (result === undefined) {
            return other;
          }
          if (typeof value == 'string' || typeof other == 'string') {
            value = baseToString(value);
            other = baseToString(other);
          } else {
            value = baseToNumber(value);
            other = baseToNumber(other);
          }
          result = operator(value, other);
        }
        return result;
      };
    }

    /**
     * Creates a function like `_.over`.
     *
     * @private
     * @param {Function} arrayFunc The function to iterate over iteratees.
     * @returns {Function} Returns the new over function.
     */
    function createOver(arrayFunc) {
      return flatRest(function(iteratees) {
        iteratees = arrayMap(iteratees, baseUnary(getIteratee()));
        return baseRest(function(args) {
          var thisArg = this;
          return arrayFunc(iteratees, function(iteratee) {
            return apply(iteratee, thisArg, args);
          });
        });
      });
    }

    /**
     * Creates the padding for `string` based on `length`. The `chars` string
     * is truncated if the number of characters exceeds `length`.
     *
     * @private
     * @param {number} length The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padding for `string`.
     */
    function createPadding(length, chars) {
      chars = chars === undefined ? ' ' : baseToString(chars);

      var charsLength = chars.length;
      if (charsLength < 2) {
        return charsLength ? baseRepeat(chars, length) : chars;
      }
      var result = baseRepeat(chars, nativeCeil(length / stringSize(chars)));
      return hasUnicode(chars)
        ? castSlice(stringToArray(result), 0, length).join('')
        : result.slice(0, length);
    }

    /**
     * Creates a function that wraps `func` to invoke it with the `this` binding
     * of `thisArg` and `partials` prepended to the arguments it receives.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {Array} partials The arguments to prepend to those provided to
     *  the new function.
     * @returns {Function} Returns the new wrapped function.
     */
    function createPartial(func, bitmask, thisArg, partials) {
      var isBind = bitmask & WRAP_BIND_FLAG,
          Ctor = createCtor(func);

      function wrapper() {
        var argsIndex = -1,
            argsLength = arguments.length,
            leftIndex = -1,
            leftLength = partials.length,
            args = Array(leftLength + argsLength),
            fn = (this && this !== root && this instanceof wrapper) ? Ctor : func;

        while (++leftIndex < leftLength) {
          args[leftIndex] = partials[leftIndex];
        }
        while (argsLength--) {
          args[leftIndex++] = arguments[++argsIndex];
        }
        return apply(fn, isBind ? thisArg : this, args);
      }
      return wrapper;
    }

    /**
     * Creates a `_.range` or `_.rangeRight` function.
     *
     * @private
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {Function} Returns the new range function.
     */
    function createRange(fromRight) {
      return function(start, end, step) {
        if (step && typeof step != 'number' && isIterateeCall(start, end, step)) {
          end = step = undefined;
        }
        // Ensure the sign of `-0` is preserved.
        start = toFinite(start);
        if (end === undefined) {
          end = start;
          start = 0;
        } else {
          end = toFinite(end);
        }
        step = step === undefined ? (start < end ? 1 : -1) : toFinite(step);
        return baseRange(start, end, step, fromRight);
      };
    }

    /**
     * Creates a function that performs a relational operation on two values.
     *
     * @private
     * @param {Function} operator The function to perform the operation.
     * @returns {Function} Returns the new relational operation function.
     */
    function createRelationalOperation(operator) {
      return function(value, other) {
        if (!(typeof value == 'string' && typeof other == 'string')) {
          value = toNumber(value);
          other = toNumber(other);
        }
        return operator(value, other);
      };
    }

    /**
     * Creates a function that wraps `func` to continue currying.
     *
     * @private
     * @param {Function} func The function to wrap.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @param {Function} wrapFunc The function to create the `func` wrapper.
     * @param {*} placeholder The placeholder value.
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to prepend to those provided to
     *  the new function.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createRecurry(func, bitmask, wrapFunc, placeholder, thisArg, partials, holders, argPos, ary, arity) {
      var isCurry = bitmask & WRAP_CURRY_FLAG,
          newHolders = isCurry ? holders : undefined,
          newHoldersRight = isCurry ? undefined : holders,
          newPartials = isCurry ? partials : undefined,
          newPartialsRight = isCurry ? undefined : partials;

      bitmask |= (isCurry ? WRAP_PARTIAL_FLAG : WRAP_PARTIAL_RIGHT_FLAG);
      bitmask &= ~(isCurry ? WRAP_PARTIAL_RIGHT_FLAG : WRAP_PARTIAL_FLAG);

      if (!(bitmask & WRAP_CURRY_BOUND_FLAG)) {
        bitmask &= ~(WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG);
      }
      var newData = [
        func, bitmask, thisArg, newPartials, newHolders, newPartialsRight,
        newHoldersRight, argPos, ary, arity
      ];

      var result = wrapFunc.apply(undefined, newData);
      if (isLaziable(func)) {
        setData(result, newData);
      }
      result.placeholder = placeholder;
      return setWrapToString(result, func, bitmask);
    }

    /**
     * Creates a function like `_.round`.
     *
     * @private
     * @param {string} methodName The name of the `Math` method to use when rounding.
     * @returns {Function} Returns the new round function.
     */
    function createRound(methodName) {
      var func = Math[methodName];
      return function(number, precision) {
        number = toNumber(number);
        precision = precision == null ? 0 : nativeMin(toInteger(precision), 292);
        if (precision) {
          // Shift with exponential notation to avoid floating-point issues.
          // See [MDN](https://mdn.io/round#Examples) for more details.
          var pair = (toString(number) + 'e').split('e'),
              value = func(pair[0] + 'e' + (+pair[1] + precision));

          pair = (toString(value) + 'e').split('e');
          return +(pair[0] + 'e' + (+pair[1] - precision));
        }
        return func(number);
      };
    }

    /**
     * Creates a set object of `values`.
     *
     * @private
     * @param {Array} values The values to add to the set.
     * @returns {Object} Returns the new set.
     */
    var createSet = !(Set && (1 / setToArray(new Set([,-0]))[1]) == INFINITY) ? noop : function(values) {
      return new Set(values);
    };

    /**
     * Creates a `_.toPairs` or `_.toPairsIn` function.
     *
     * @private
     * @param {Function} keysFunc The function to get the keys of a given object.
     * @returns {Function} Returns the new pairs function.
     */
    function createToPairs(keysFunc) {
      return function(object) {
        var tag = getTag(object);
        if (tag == mapTag) {
          return mapToArray(object);
        }
        if (tag == setTag) {
          return setToPairs(object);
        }
        return baseToPairs(object, keysFunc(object));
      };
    }

    /**
     * Creates a function that either curries or invokes `func` with optional
     * `this` binding and partially applied arguments.
     *
     * @private
     * @param {Function|string} func The function or method name to wrap.
     * @param {number} bitmask The bitmask flags.
     *    1 - `_.bind`
     *    2 - `_.bindKey`
     *    4 - `_.curry` or `_.curryRight` of a bound function
     *    8 - `_.curry`
     *   16 - `_.curryRight`
     *   32 - `_.partial`
     *   64 - `_.partialRight`
     *  128 - `_.rearg`
     *  256 - `_.ary`
     *  512 - `_.flip`
     * @param {*} [thisArg] The `this` binding of `func`.
     * @param {Array} [partials] The arguments to be partially applied.
     * @param {Array} [holders] The `partials` placeholder indexes.
     * @param {Array} [argPos] The argument positions of the new function.
     * @param {number} [ary] The arity cap of `func`.
     * @param {number} [arity] The arity of `func`.
     * @returns {Function} Returns the new wrapped function.
     */
    function createWrap(func, bitmask, thisArg, partials, holders, argPos, ary, arity) {
      var isBindKey = bitmask & WRAP_BIND_KEY_FLAG;
      if (!isBindKey && typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var length = partials ? partials.length : 0;
      if (!length) {
        bitmask &= ~(WRAP_PARTIAL_FLAG | WRAP_PARTIAL_RIGHT_FLAG);
        partials = holders = undefined;
      }
      ary = ary === undefined ? ary : nativeMax(toInteger(ary), 0);
      arity = arity === undefined ? arity : toInteger(arity);
      length -= holders ? holders.length : 0;

      if (bitmask & WRAP_PARTIAL_RIGHT_FLAG) {
        var partialsRight = partials,
            holdersRight = holders;

        partials = holders = undefined;
      }
      var data = isBindKey ? undefined : getData(func);

      var newData = [
        func, bitmask, thisArg, partials, holders, partialsRight, holdersRight,
        argPos, ary, arity
      ];

      if (data) {
        mergeData(newData, data);
      }
      func = newData[0];
      bitmask = newData[1];
      thisArg = newData[2];
      partials = newData[3];
      holders = newData[4];
      arity = newData[9] = newData[9] === undefined
        ? (isBindKey ? 0 : func.length)
        : nativeMax(newData[9] - length, 0);

      if (!arity && bitmask & (WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG)) {
        bitmask &= ~(WRAP_CURRY_FLAG | WRAP_CURRY_RIGHT_FLAG);
      }
      if (!bitmask || bitmask == WRAP_BIND_FLAG) {
        var result = createBind(func, bitmask, thisArg);
      } else if (bitmask == WRAP_CURRY_FLAG || bitmask == WRAP_CURRY_RIGHT_FLAG) {
        result = createCurry(func, bitmask, arity);
      } else if ((bitmask == WRAP_PARTIAL_FLAG || bitmask == (WRAP_BIND_FLAG | WRAP_PARTIAL_FLAG)) && !holders.length) {
        result = createPartial(func, bitmask, thisArg, partials);
      } else {
        result = createHybrid.apply(undefined, newData);
      }
      var setter = data ? baseSetData : setData;
      return setWrapToString(setter(result, newData), func, bitmask);
    }

    /**
     * Used by `_.defaults` to customize its `_.assignIn` use to assign properties
     * of source objects to the destination object for all destination properties
     * that resolve to `undefined`.
     *
     * @private
     * @param {*} objValue The destination value.
     * @param {*} srcValue The source value.
     * @param {string} key The key of the property to assign.
     * @param {Object} object The parent object of `objValue`.
     * @returns {*} Returns the value to assign.
     */
    function customDefaultsAssignIn(objValue, srcValue, key, object) {
      if (objValue === undefined ||
          (eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key))) {
        return srcValue;
      }
      return objValue;
    }

    /**
     * Used by `_.defaultsDeep` to customize its `_.merge` use to merge source
     * objects into destination objects that are passed thru.
     *
     * @private
     * @param {*} objValue The destination value.
     * @param {*} srcValue The source value.
     * @param {string} key The key of the property to merge.
     * @param {Object} object The parent object of `objValue`.
     * @param {Object} source The parent object of `srcValue`.
     * @param {Object} [stack] Tracks traversed source values and their merged
     *  counterparts.
     * @returns {*} Returns the value to assign.
     */
    function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
      if (isObject(objValue) && isObject(srcValue)) {
        // Recursively merge objects and arrays (susceptible to call stack limits).
        stack.set(srcValue, objValue);
        baseMerge(objValue, srcValue, undefined, customDefaultsMerge, stack);
        stack['delete'](srcValue);
      }
      return objValue;
    }

    /**
     * Used by `_.omit` to customize its `_.cloneDeep` use to only clone plain
     * objects.
     *
     * @private
     * @param {*} value The value to inspect.
     * @param {string} key The key of the property to inspect.
     * @returns {*} Returns the uncloned value or `undefined` to defer cloning to `_.cloneDeep`.
     */
    function customOmitClone(value) {
      return isPlainObject(value) ? undefined : value;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for arrays with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Array} array The array to compare.
     * @param {Array} other The other array to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `array` and `other` objects.
     * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
     */
    function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
          arrLength = array.length,
          othLength = other.length;

      if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(array);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var index = -1,
          result = true,
          seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

      stack.set(array, other);
      stack.set(other, array);

      // Ignore non-index properties.
      while (++index < arrLength) {
        var arrValue = array[index],
            othValue = other[index];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, arrValue, index, other, array, stack)
            : customizer(arrValue, othValue, index, array, other, stack);
        }
        if (compared !== undefined) {
          if (compared) {
            continue;
          }
          result = false;
          break;
        }
        // Recursively compare arrays (susceptible to call stack limits).
        if (seen) {
          if (!arraySome(other, function(othValue, othIndex) {
                if (!cacheHas(seen, othIndex) &&
                    (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                  return seen.push(othIndex);
                }
              })) {
            result = false;
            break;
          }
        } else if (!(
              arrValue === othValue ||
                equalFunc(arrValue, othValue, bitmask, customizer, stack)
            )) {
          result = false;
          break;
        }
      }
      stack['delete'](array);
      stack['delete'](other);
      return result;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for comparing objects of
     * the same `toStringTag`.
     *
     * **Note:** This function only supports comparing values with tags of
     * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {string} tag The `toStringTag` of the objects to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
      switch (tag) {
        case dataViewTag:
          if ((object.byteLength != other.byteLength) ||
              (object.byteOffset != other.byteOffset)) {
            return false;
          }
          object = object.buffer;
          other = other.buffer;

        case arrayBufferTag:
          if ((object.byteLength != other.byteLength) ||
              !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
            return false;
          }
          return true;

        case boolTag:
        case dateTag:
        case numberTag:
          // Coerce booleans to `1` or `0` and dates to milliseconds.
          // Invalid dates are coerced to `NaN`.
          return eq(+object, +other);

        case errorTag:
          return object.name == other.name && object.message == other.message;

        case regexpTag:
        case stringTag:
          // Coerce regexes to strings and treat strings, primitives and objects,
          // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
          // for more details.
          return object == (other + '');

        case mapTag:
          var convert = mapToArray;

        case setTag:
          var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
          convert || (convert = setToArray);

          if (object.size != other.size && !isPartial) {
            return false;
          }
          // Assume cyclic values are equal.
          var stacked = stack.get(object);
          if (stacked) {
            return stacked == other;
          }
          bitmask |= COMPARE_UNORDERED_FLAG;

          // Recursively compare objects (susceptible to call stack limits).
          stack.set(object, other);
          var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
          stack['delete'](object);
          return result;

        case symbolTag:
          if (symbolValueOf) {
            return symbolValueOf.call(object) == symbolValueOf.call(other);
          }
      }
      return false;
    }

    /**
     * A specialized version of `baseIsEqualDeep` for objects with support for
     * partial deep comparisons.
     *
     * @private
     * @param {Object} object The object to compare.
     * @param {Object} other The other object to compare.
     * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
     * @param {Function} customizer The function to customize comparisons.
     * @param {Function} equalFunc The function to determine equivalents of values.
     * @param {Object} stack Tracks traversed `object` and `other` objects.
     * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
     */
    function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
          objProps = getAllKeys(object),
          objLength = objProps.length,
          othProps = getAllKeys(other),
          othLength = othProps.length;

      if (objLength != othLength && !isPartial) {
        return false;
      }
      var index = objLength;
      while (index--) {
        var key = objProps[index];
        if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
          return false;
        }
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked && stack.get(other)) {
        return stacked == other;
      }
      var result = true;
      stack.set(object, other);
      stack.set(other, object);

      var skipCtor = isPartial;
      while (++index < objLength) {
        key = objProps[index];
        var objValue = object[key],
            othValue = other[key];

        if (customizer) {
          var compared = isPartial
            ? customizer(othValue, objValue, key, other, object, stack)
            : customizer(objValue, othValue, key, object, other, stack);
        }
        // Recursively compare objects (susceptible to call stack limits).
        if (!(compared === undefined
              ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
              : compared
            )) {
          result = false;
          break;
        }
        skipCtor || (skipCtor = key == 'constructor');
      }
      if (result && !skipCtor) {
        var objCtor = object.constructor,
            othCtor = other.constructor;

        // Non `Object` object instances with different constructors are not equal.
        if (objCtor != othCtor &&
            ('constructor' in object && 'constructor' in other) &&
            !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
              typeof othCtor == 'function' && othCtor instanceof othCtor)) {
          result = false;
        }
      }
      stack['delete'](object);
      stack['delete'](other);
      return result;
    }

    /**
     * A specialized version of `baseRest` which flattens the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @returns {Function} Returns the new function.
     */
    function flatRest(func) {
      return setToString(overRest(func, undefined, flatten), func + '');
    }

    /**
     * Creates an array of own enumerable property names and symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeys(object) {
      return baseGetAllKeys(object, keys, getSymbols);
    }

    /**
     * Creates an array of own and inherited enumerable property names and
     * symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names and symbols.
     */
    function getAllKeysIn(object) {
      return baseGetAllKeys(object, keysIn, getSymbolsIn);
    }

    /**
     * Gets metadata for `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {*} Returns the metadata for `func`.
     */
    var getData = !metaMap ? noop : function(func) {
      return metaMap.get(func);
    };

    /**
     * Gets the name of `func`.
     *
     * @private
     * @param {Function} func The function to query.
     * @returns {string} Returns the function name.
     */
    function getFuncName(func) {
      var result = (func.name + ''),
          array = realNames[result],
          length = hasOwnProperty.call(realNames, result) ? array.length : 0;

      while (length--) {
        var data = array[length],
            otherFunc = data.func;
        if (otherFunc == null || otherFunc == func) {
          return data.name;
        }
      }
      return result;
    }

    /**
     * Gets the argument placeholder value for `func`.
     *
     * @private
     * @param {Function} func The function to inspect.
     * @returns {*} Returns the placeholder value.
     */
    function getHolder(func) {
      var object = hasOwnProperty.call(lodash, 'placeholder') ? lodash : func;
      return object.placeholder;
    }

    /**
     * Gets the appropriate "iteratee" function. If `_.iteratee` is customized,
     * this function returns the custom method, otherwise it returns `baseIteratee`.
     * If arguments are provided, the chosen function is invoked with them and
     * its result is returned.
     *
     * @private
     * @param {*} [value] The value to convert to an iteratee.
     * @param {number} [arity] The arity of the created iteratee.
     * @returns {Function} Returns the chosen function or its result.
     */
    function getIteratee() {
      var result = lodash.iteratee || iteratee;
      result = result === iteratee ? baseIteratee : result;
      return arguments.length ? result(arguments[0], arguments[1]) : result;
    }

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    /**
     * Gets the property names, values, and compare flags of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the match data of `object`.
     */
    function getMatchData(object) {
      var result = keys(object),
          length = result.length;

      while (length--) {
        var key = result[length],
            value = object[key];

        result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
    }

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue(object, key);
      return baseIsNative(value) ? value : undefined;
    }

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag),
          tag = value[symToStringTag];

      try {
        value[symToStringTag] = undefined;
        var unmasked = true;
      } catch (e) {}

      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }

    /**
     * Creates an array of the own enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
      if (object == null) {
        return [];
      }
      object = Object(object);
      return arrayFilter(nativeGetSymbols(object), function(symbol) {
        return propertyIsEnumerable.call(object, symbol);
      });
    };

    /**
     * Creates an array of the own and inherited enumerable symbols of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of symbols.
     */
    var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
      var result = [];
      while (object) {
        arrayPush(result, getSymbols(object));
        object = getPrototype(object);
      }
      return result;
    };

    /**
     * Gets the `toStringTag` of `value`.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    var getTag = baseGetTag;

    // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
    if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
        (Map && getTag(new Map) != mapTag) ||
        (Promise && getTag(Promise.resolve()) != promiseTag) ||
        (Set && getTag(new Set) != setTag) ||
        (WeakMap && getTag(new WeakMap) != weakMapTag)) {
      getTag = function(value) {
        var result = baseGetTag(value),
            Ctor = result == objectTag ? value.constructor : undefined,
            ctorString = Ctor ? toSource(Ctor) : '';

        if (ctorString) {
          switch (ctorString) {
            case dataViewCtorString: return dataViewTag;
            case mapCtorString: return mapTag;
            case promiseCtorString: return promiseTag;
            case setCtorString: return setTag;
            case weakMapCtorString: return weakMapTag;
          }
        }
        return result;
      };
    }

    /**
     * Gets the view, applying any `transforms` to the `start` and `end` positions.
     *
     * @private
     * @param {number} start The start of the view.
     * @param {number} end The end of the view.
     * @param {Array} transforms The transformations to apply to the view.
     * @returns {Object} Returns an object containing the `start` and `end`
     *  positions of the view.
     */
    function getView(start, end, transforms) {
      var index = -1,
          length = transforms.length;

      while (++index < length) {
        var data = transforms[index],
            size = data.size;

        switch (data.type) {
          case 'drop':      start += size; break;
          case 'dropRight': end -= size; break;
          case 'take':      end = nativeMin(end, start + size); break;
          case 'takeRight': start = nativeMax(start, end - size); break;
        }
      }
      return { 'start': start, 'end': end };
    }

    /**
     * Extracts wrapper details from the `source` body comment.
     *
     * @private
     * @param {string} source The source to inspect.
     * @returns {Array} Returns the wrapper details.
     */
    function getWrapDetails(source) {
      var match = source.match(reWrapDetails);
      return match ? match[1].split(reSplitDetails) : [];
    }

    /**
     * Checks if `path` exists on `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @param {Function} hasFunc The function to check properties.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     */
    function hasPath(object, path, hasFunc) {
      path = castPath(path, object);

      var index = -1,
          length = path.length,
          result = false;

      while (++index < length) {
        var key = toKey(path[index]);
        if (!(result = object != null && hasFunc(object, key))) {
          break;
        }
        object = object[key];
      }
      if (result || ++index != length) {
        return result;
      }
      length = object == null ? 0 : object.length;
      return !!length && isLength(length) && isIndex(key, length) &&
        (isArray(object) || isArguments(object));
    }

    /**
     * Initializes an array clone.
     *
     * @private
     * @param {Array} array The array to clone.
     * @returns {Array} Returns the initialized clone.
     */
    function initCloneArray(array) {
      var length = array.length,
          result = new array.constructor(length);

      // Add properties assigned by `RegExp#exec`.
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
      }
      return result;
    }

    /**
     * Initializes an object clone.
     *
     * @private
     * @param {Object} object The object to clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneObject(object) {
      return (typeof object.constructor == 'function' && !isPrototype(object))
        ? baseCreate(getPrototype(object))
        : {};
    }

    /**
     * Initializes an object clone based on its `toStringTag`.
     *
     * **Note:** This function only supports cloning values with tags of
     * `Boolean`, `Date`, `Error`, `Map`, `Number`, `RegExp`, `Set`, or `String`.
     *
     * @private
     * @param {Object} object The object to clone.
     * @param {string} tag The `toStringTag` of the object to clone.
     * @param {boolean} [isDeep] Specify a deep clone.
     * @returns {Object} Returns the initialized clone.
     */
    function initCloneByTag(object, tag, isDeep) {
      var Ctor = object.constructor;
      switch (tag) {
        case arrayBufferTag:
          return cloneArrayBuffer(object);

        case boolTag:
        case dateTag:
          return new Ctor(+object);

        case dataViewTag:
          return cloneDataView(object, isDeep);

        case float32Tag: case float64Tag:
        case int8Tag: case int16Tag: case int32Tag:
        case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
          return cloneTypedArray(object, isDeep);

        case mapTag:
          return new Ctor;

        case numberTag:
        case stringTag:
          return new Ctor(object);

        case regexpTag:
          return cloneRegExp(object);

        case setTag:
          return new Ctor;

        case symbolTag:
          return cloneSymbol(object);
      }
    }

    /**
     * Inserts wrapper `details` in a comment at the top of the `source` body.
     *
     * @private
     * @param {string} source The source to modify.
     * @returns {Array} details The details to insert.
     * @returns {string} Returns the modified source.
     */
    function insertWrapDetails(source, details) {
      var length = details.length;
      if (!length) {
        return source;
      }
      var lastIndex = length - 1;
      details[lastIndex] = (length > 1 ? '& ' : '') + details[lastIndex];
      details = details.join(length > 2 ? ', ' : ' ');
      return source.replace(reWrapComment, '{\n/* [wrapped with ' + details + '] */\n');
    }

    /**
     * Checks if `value` is a flattenable `arguments` object or array.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
     */
    function isFlattenable(value) {
      return isArray(value) || isArguments(value) ||
        !!(spreadableSymbol && value && value[spreadableSymbol]);
    }

    /**
     * Checks if `value` is a valid array-like index.
     *
     * @private
     * @param {*} value The value to check.
     * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
     * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
     */
    function isIndex(value, length) {
      var type = typeof value;
      length = length == null ? MAX_SAFE_INTEGER : length;

      return !!length &&
        (type == 'number' ||
          (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }

    /**
     * Checks if the given arguments are from an iteratee call.
     *
     * @private
     * @param {*} value The potential iteratee value argument.
     * @param {*} index The potential iteratee index or key argument.
     * @param {*} object The potential iteratee object argument.
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
     *  else `false`.
     */
    function isIterateeCall(value, index, object) {
      if (!isObject(object)) {
        return false;
      }
      var type = typeof index;
      if (type == 'number'
            ? (isArrayLike(object) && isIndex(index, object.length))
            : (type == 'string' && index in object)
          ) {
        return eq(object[index], value);
      }
      return false;
    }

    /**
     * Checks if `value` is a property name and not a property path.
     *
     * @private
     * @param {*} value The value to check.
     * @param {Object} [object] The object to query keys on.
     * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
     */
    function isKey(value, object) {
      if (isArray(value)) {
        return false;
      }
      var type = typeof value;
      if (type == 'number' || type == 'symbol' || type == 'boolean' ||
          value == null || isSymbol(value)) {
        return true;
      }
      return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
        (object != null && value in Object(object));
    }

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    /**
     * Checks if `func` has a lazy counterpart.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` has a lazy counterpart,
     *  else `false`.
     */
    function isLaziable(func) {
      var funcName = getFuncName(func),
          other = lodash[funcName];

      if (typeof other != 'function' || !(funcName in LazyWrapper.prototype)) {
        return false;
      }
      if (func === other) {
        return true;
      }
      var data = getData(other);
      return !!data && func === data[0];
    }

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    /**
     * Checks if `func` is capable of being masked.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `func` is maskable, else `false`.
     */
    var isMaskable = coreJsData ? isFunction : stubFalse;

    /**
     * Checks if `value` is likely a prototype object.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
     */
    function isPrototype(value) {
      var Ctor = value && value.constructor,
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

      return value === proto;
    }

    /**
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` if suitable for strict
     *  equality comparisons, else `false`.
     */
    function isStrictComparable(value) {
      return value === value && !isObject(value);
    }

    /**
     * A specialized version of `matchesProperty` for source values suitable
     * for strict equality comparisons, i.e. `===`.
     *
     * @private
     * @param {string} key The key of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     */
    function matchesStrictComparable(key, srcValue) {
      return function(object) {
        if (object == null) {
          return false;
        }
        return object[key] === srcValue &&
          (srcValue !== undefined || (key in Object(object)));
      };
    }

    /**
     * A specialized version of `_.memoize` which clears the memoized function's
     * cache when it exceeds `MAX_MEMOIZE_SIZE`.
     *
     * @private
     * @param {Function} func The function to have its output memoized.
     * @returns {Function} Returns the new memoized function.
     */
    function memoizeCapped(func) {
      var result = memoize(func, function(key) {
        if (cache.size === MAX_MEMOIZE_SIZE) {
          cache.clear();
        }
        return key;
      });

      var cache = result.cache;
      return result;
    }

    /**
     * Merges the function metadata of `source` into `data`.
     *
     * Merging metadata reduces the number of wrappers used to invoke a function.
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`
     * may be applied regardless of execution order. Methods like `_.ary` and
     * `_.rearg` modify function arguments, making the order in which they are
     * executed important, preventing the merging of metadata. However, we make
     * an exception for a safe combined case where curried functions have `_.ary`
     * and or `_.rearg` applied.
     *
     * @private
     * @param {Array} data The destination metadata.
     * @param {Array} source The source metadata.
     * @returns {Array} Returns `data`.
     */
    function mergeData(data, source) {
      var bitmask = data[1],
          srcBitmask = source[1],
          newBitmask = bitmask | srcBitmask,
          isCommon = newBitmask < (WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG | WRAP_ARY_FLAG);

      var isCombo =
        ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_CURRY_FLAG)) ||
        ((srcBitmask == WRAP_ARY_FLAG) && (bitmask == WRAP_REARG_FLAG) && (data[7].length <= source[8])) ||
        ((srcBitmask == (WRAP_ARY_FLAG | WRAP_REARG_FLAG)) && (source[7].length <= source[8]) && (bitmask == WRAP_CURRY_FLAG));

      // Exit early if metadata can't be merged.
      if (!(isCommon || isCombo)) {
        return data;
      }
      // Use source `thisArg` if available.
      if (srcBitmask & WRAP_BIND_FLAG) {
        data[2] = source[2];
        // Set when currying a bound function.
        newBitmask |= bitmask & WRAP_BIND_FLAG ? 0 : WRAP_CURRY_BOUND_FLAG;
      }
      // Compose partial arguments.
      var value = source[3];
      if (value) {
        var partials = data[3];
        data[3] = partials ? composeArgs(partials, value, source[4]) : value;
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : source[4];
      }
      // Compose partial right arguments.
      value = source[5];
      if (value) {
        partials = data[5];
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : value;
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : source[6];
      }
      // Use source `argPos` if available.
      value = source[7];
      if (value) {
        data[7] = value;
      }
      // Use source `ary` if it's smaller.
      if (srcBitmask & WRAP_ARY_FLAG) {
        data[8] = data[8] == null ? source[8] : nativeMin(data[8], source[8]);
      }
      // Use source `arity` if one is not provided.
      if (data[9] == null) {
        data[9] = source[9];
      }
      // Use source `func` and merge bitmasks.
      data[0] = source[0];
      data[1] = newBitmask;

      return data;
    }

    /**
     * This function is like
     * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * except that it includes inherited enumerable properties.
     *
     * @private
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     */
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }

    /**
     * A specialized version of `baseRest` which transforms the rest array.
     *
     * @private
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @param {Function} transform The rest array transform.
     * @returns {Function} Returns the new function.
     */
    function overRest(func, start, transform) {
      start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
      return function() {
        var args = arguments,
            index = -1,
            length = nativeMax(args.length - start, 0),
            array = Array(length);

        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = transform(array);
        return apply(func, this, otherArgs);
      };
    }

    /**
     * Gets the parent value at `path` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {Array} path The path to get the parent value of.
     * @returns {*} Returns the parent value.
     */
    function parent(object, path) {
      return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
    }

    /**
     * Reorder `array` according to the specified indexes where the element at
     * the first index is assigned as the first element, the element at
     * the second index is assigned as the second element, and so on.
     *
     * @private
     * @param {Array} array The array to reorder.
     * @param {Array} indexes The arranged array indexes.
     * @returns {Array} Returns `array`.
     */
    function reorder(array, indexes) {
      var arrLength = array.length,
          length = nativeMin(indexes.length, arrLength),
          oldArray = copyArray(array);

      while (length--) {
        var index = indexes[length];
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;
      }
      return array;
    }

    /**
     * Sets metadata for `func`.
     *
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short
     * period of time, it will trip its breaker and transition to an identity
     * function to avoid garbage collection pauses in V8. See
     * [V8 issue 2070](https://bugs.chromium.org/p/v8/issues/detail?id=2070)
     * for more details.
     *
     * @private
     * @param {Function} func The function to associate metadata with.
     * @param {*} data The metadata.
     * @returns {Function} Returns `func`.
     */
    var setData = shortOut(baseSetData);

    /**
     * A simple wrapper around the global [`setTimeout`](https://mdn.io/setTimeout).
     *
     * @private
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @returns {number|Object} Returns the timer id or timeout object.
     */
    var setTimeout = ctxSetTimeout || function(func, wait) {
      return root.setTimeout(func, wait);
    };

    /**
     * Sets the `toString` method of `func` to return `string`.
     *
     * @private
     * @param {Function} func The function to modify.
     * @param {Function} string The `toString` result.
     * @returns {Function} Returns `func`.
     */
    var setToString = shortOut(baseSetToString);

    /**
     * Sets the `toString` method of `wrapper` to mimic the source of `reference`
     * with wrapper details in a comment at the top of the source body.
     *
     * @private
     * @param {Function} wrapper The function to modify.
     * @param {Function} reference The reference function.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @returns {Function} Returns `wrapper`.
     */
    function setWrapToString(wrapper, reference, bitmask) {
      var source = (reference + '');
      return setToString(wrapper, insertWrapDetails(source, updateWrapDetails(getWrapDetails(source), bitmask)));
    }

    /**
     * Creates a function that'll short out and invoke `identity` instead
     * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
     * milliseconds.
     *
     * @private
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new shortable function.
     */
    function shortOut(func) {
      var count = 0,
          lastCalled = 0;

      return function() {
        var stamp = nativeNow(),
            remaining = HOT_SPAN - (stamp - lastCalled);

        lastCalled = stamp;
        if (remaining > 0) {
          if (++count >= HOT_COUNT) {
            return arguments[0];
          }
        } else {
          count = 0;
        }
        return func.apply(undefined, arguments);
      };
    }

    /**
     * A specialized version of `_.shuffle` which mutates and sets the size of `array`.
     *
     * @private
     * @param {Array} array The array to shuffle.
     * @param {number} [size=array.length] The size of `array`.
     * @returns {Array} Returns `array`.
     */
    function shuffleSelf(array, size) {
      var index = -1,
          length = array.length,
          lastIndex = length - 1;

      size = size === undefined ? length : size;
      while (++index < size) {
        var rand = baseRandom(index, lastIndex),
            value = array[rand];

        array[rand] = array[index];
        array[index] = value;
      }
      array.length = size;
      return array;
    }

    /**
     * Converts `string` to a property path array.
     *
     * @private
     * @param {string} string The string to convert.
     * @returns {Array} Returns the property path array.
     */
    var stringToPath = memoizeCapped(function(string) {
      var result = [];
      if (string.charCodeAt(0) === 46 /* . */) {
        result.push('');
      }
      string.replace(rePropName, function(match, number, quote, subString) {
        result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
      });
      return result;
    });

    /**
     * Converts `value` to a string key if it's not a string or symbol.
     *
     * @private
     * @param {*} value The value to inspect.
     * @returns {string|symbol} Returns the key.
     */
    function toKey(value) {
      if (typeof value == 'string' || isSymbol(value)) {
        return value;
      }
      var result = (value + '');
      return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
    }

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    /**
     * Updates wrapper `details` based on `bitmask` flags.
     *
     * @private
     * @returns {Array} details The details to modify.
     * @param {number} bitmask The bitmask flags. See `createWrap` for more details.
     * @returns {Array} Returns `details`.
     */
    function updateWrapDetails(details, bitmask) {
      arrayEach(wrapFlags, function(pair) {
        var value = '_.' + pair[0];
        if ((bitmask & pair[1]) && !arrayIncludes(details, value)) {
          details.push(value);
        }
      });
      return details.sort();
    }

    /**
     * Creates a clone of `wrapper`.
     *
     * @private
     * @param {Object} wrapper The wrapper to clone.
     * @returns {Object} Returns the cloned wrapper.
     */
    function wrapperClone(wrapper) {
      if (wrapper instanceof LazyWrapper) {
        return wrapper.clone();
      }
      var result = new LodashWrapper(wrapper.__wrapped__, wrapper.__chain__);
      result.__actions__ = copyArray(wrapper.__actions__);
      result.__index__  = wrapper.__index__;
      result.__values__ = wrapper.__values__;
      return result;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an array of elements split into groups the length of `size`.
     * If `array` can't be split evenly, the final chunk will be the remaining
     * elements.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to process.
     * @param {number} [size=1] The length of each chunk
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the new array of chunks.
     * @example
     *
     * _.chunk(['a', 'b', 'c', 'd'], 2);
     * // => [['a', 'b'], ['c', 'd']]
     *
     * _.chunk(['a', 'b', 'c', 'd'], 3);
     * // => [['a', 'b', 'c'], ['d']]
     */
    function chunk(array, size, guard) {
      if ((guard ? isIterateeCall(array, size, guard) : size === undefined)) {
        size = 1;
      } else {
        size = nativeMax(toInteger(size), 0);
      }
      var length = array == null ? 0 : array.length;
      if (!length || size < 1) {
        return [];
      }
      var index = 0,
          resIndex = 0,
          result = Array(nativeCeil(length / size));

      while (index < length) {
        result[resIndex++] = baseSlice(array, index, (index += size));
      }
      return result;
    }

    /**
     * Creates an array with all falsey values removed. The values `false`, `null`,
     * `0`, `""`, `undefined`, and `NaN` are falsey.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to compact.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.compact([0, 1, false, 2, '', 3]);
     * // => [1, 2, 3]
     */
    function compact(array) {
      var index = -1,
          length = array == null ? 0 : array.length,
          resIndex = 0,
          result = [];

      while (++index < length) {
        var value = array[index];
        if (value) {
          result[resIndex++] = value;
        }
      }
      return result;
    }

    /**
     * Creates a new array concatenating `array` with any additional arrays
     * and/or values.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to concatenate.
     * @param {...*} [values] The values to concatenate.
     * @returns {Array} Returns the new concatenated array.
     * @example
     *
     * var array = [1];
     * var other = _.concat(array, 2, [3], [[4]]);
     *
     * console.log(other);
     * // => [1, 2, 3, [4]]
     *
     * console.log(array);
     * // => [1]
     */
    function concat() {
      var length = arguments.length;
      if (!length) {
        return [];
      }
      var args = Array(length - 1),
          array = arguments[0],
          index = length;

      while (index--) {
        args[index - 1] = arguments[index];
      }
      return arrayPush(isArray(array) ? copyArray(array) : [array], baseFlatten(args, 1));
    }

    /**
     * Creates an array of `array` values not included in the other given arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons. The order and references of result values are
     * determined by the first array.
     *
     * **Note:** Unlike `_.pullAll`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @see _.without, _.xor
     * @example
     *
     * _.difference([2, 1], [2, 3]);
     * // => [1]
     */
    var difference = baseRest(function(array, values) {
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true))
        : [];
    });

    /**
     * This method is like `_.difference` except that it accepts `iteratee` which
     * is invoked for each element of `array` and `values` to generate the criterion
     * by which they're compared. The order and references of result values are
     * determined by the first array. The iteratee is invoked with one argument:
     * (value).
     *
     * **Note:** Unlike `_.pullAllBy`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.differenceBy([2.1, 1.2], [2.3, 3.4], Math.floor);
     * // => [1.2]
     *
     * // The `_.property` iteratee shorthand.
     * _.differenceBy([{ 'x': 2 }, { 'x': 1 }], [{ 'x': 1 }], 'x');
     * // => [{ 'x': 2 }]
     */
    var differenceBy = baseRest(function(array, values) {
      var iteratee = last(values);
      if (isArrayLikeObject(iteratee)) {
        iteratee = undefined;
      }
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true), getIteratee(iteratee, 2))
        : [];
    });

    /**
     * This method is like `_.difference` except that it accepts `comparator`
     * which is invoked to compare elements of `array` to `values`. The order and
     * references of result values are determined by the first array. The comparator
     * is invoked with two arguments: (arrVal, othVal).
     *
     * **Note:** Unlike `_.pullAllWith`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...Array} [values] The values to exclude.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     *
     * _.differenceWith(objects, [{ 'x': 1, 'y': 2 }], _.isEqual);
     * // => [{ 'x': 2, 'y': 1 }]
     */
    var differenceWith = baseRest(function(array, values) {
      var comparator = last(values);
      if (isArrayLikeObject(comparator)) {
        comparator = undefined;
      }
      return isArrayLikeObject(array)
        ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true), undefined, comparator)
        : [];
    });

    /**
     * Creates a slice of `array` with `n` elements dropped from the beginning.
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.drop([1, 2, 3]);
     * // => [2, 3]
     *
     * _.drop([1, 2, 3], 2);
     * // => [3]
     *
     * _.drop([1, 2, 3], 5);
     * // => []
     *
     * _.drop([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function drop(array, n, guard) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      return baseSlice(array, n < 0 ? 0 : n, length);
    }

    /**
     * Creates a slice of `array` with `n` elements dropped from the end.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to drop.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.dropRight([1, 2, 3]);
     * // => [1, 2]
     *
     * _.dropRight([1, 2, 3], 2);
     * // => [1]
     *
     * _.dropRight([1, 2, 3], 5);
     * // => []
     *
     * _.dropRight([1, 2, 3], 0);
     * // => [1, 2, 3]
     */
    function dropRight(array, n, guard) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      n = length - n;
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the end.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * invoked with three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.dropRightWhile(users, function(o) { return !o.active; });
     * // => objects for ['barney']
     *
     * // The `_.matches` iteratee shorthand.
     * _.dropRightWhile(users, { 'user': 'pebbles', 'active': false });
     * // => objects for ['barney', 'fred']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.dropRightWhile(users, ['active', false]);
     * // => objects for ['barney']
     *
     * // The `_.property` iteratee shorthand.
     * _.dropRightWhile(users, 'active');
     * // => objects for ['barney', 'fred', 'pebbles']
     */
    function dropRightWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3), true, true)
        : [];
    }

    /**
     * Creates a slice of `array` excluding elements dropped from the beginning.
     * Elements are dropped until `predicate` returns falsey. The predicate is
     * invoked with three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.dropWhile(users, function(o) { return !o.active; });
     * // => objects for ['pebbles']
     *
     * // The `_.matches` iteratee shorthand.
     * _.dropWhile(users, { 'user': 'barney', 'active': false });
     * // => objects for ['fred', 'pebbles']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.dropWhile(users, ['active', false]);
     * // => objects for ['pebbles']
     *
     * // The `_.property` iteratee shorthand.
     * _.dropWhile(users, 'active');
     * // => objects for ['barney', 'fred', 'pebbles']
     */
    function dropWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3), true)
        : [];
    }

    /**
     * Fills elements of `array` with `value` from `start` up to, but not
     * including, `end`.
     *
     * **Note:** This method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 3.2.0
     * @category Array
     * @param {Array} array The array to fill.
     * @param {*} value The value to fill `array` with.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.fill(array, 'a');
     * console.log(array);
     * // => ['a', 'a', 'a']
     *
     * _.fill(Array(3), 2);
     * // => [2, 2, 2]
     *
     * _.fill([4, 6, 8, 10], '*', 1, 3);
     * // => [4, '*', '*', 10]
     */
    function fill(array, value, start, end) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      if (start && typeof start != 'number' && isIterateeCall(array, value, start)) {
        start = 0;
        end = length;
      }
      return baseFill(array, value, start, end);
    }

    /**
     * This method is like `_.find` except that it returns the index of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * @static
     * @memberOf _
     * @since 1.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.findIndex(users, function(o) { return o.user == 'barney'; });
     * // => 0
     *
     * // The `_.matches` iteratee shorthand.
     * _.findIndex(users, { 'user': 'fred', 'active': false });
     * // => 1
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.findIndex(users, ['active', false]);
     * // => 0
     *
     * // The `_.property` iteratee shorthand.
     * _.findIndex(users, 'active');
     * // => 2
     */
    function findIndex(array, predicate, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = fromIndex == null ? 0 : toInteger(fromIndex);
      if (index < 0) {
        index = nativeMax(length + index, 0);
      }
      return baseFindIndex(array, getIteratee(predicate, 3), index);
    }

    /**
     * This method is like `_.findIndex` except that it iterates over elements
     * of `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the found element, else `-1`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
     * // => 2
     *
     * // The `_.matches` iteratee shorthand.
     * _.findLastIndex(users, { 'user': 'barney', 'active': true });
     * // => 0
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.findLastIndex(users, ['active', false]);
     * // => 2
     *
     * // The `_.property` iteratee shorthand.
     * _.findLastIndex(users, 'active');
     * // => 0
     */
    function findLastIndex(array, predicate, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = length - 1;
      if (fromIndex !== undefined) {
        index = toInteger(fromIndex);
        index = fromIndex < 0
          ? nativeMax(length + index, 0)
          : nativeMin(index, length - 1);
      }
      return baseFindIndex(array, getIteratee(predicate, 3), index, true);
    }

    /**
     * Flattens `array` a single level deep.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flatten([1, [2, [3, [4]], 5]]);
     * // => [1, 2, [3, [4]], 5]
     */
    function flatten(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseFlatten(array, 1) : [];
    }

    /**
     * Recursively flattens `array`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to flatten.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * _.flattenDeep([1, [2, [3, [4]], 5]]);
     * // => [1, 2, 3, 4, 5]
     */
    function flattenDeep(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseFlatten(array, INFINITY) : [];
    }

    /**
     * Recursively flatten `array` up to `depth` times.
     *
     * @static
     * @memberOf _
     * @since 4.4.0
     * @category Array
     * @param {Array} array The array to flatten.
     * @param {number} [depth=1] The maximum recursion depth.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * var array = [1, [2, [3, [4]], 5]];
     *
     * _.flattenDepth(array, 1);
     * // => [1, 2, [3, [4]], 5]
     *
     * _.flattenDepth(array, 2);
     * // => [1, 2, 3, [4], 5]
     */
    function flattenDepth(array, depth) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      depth = depth === undefined ? 1 : toInteger(depth);
      return baseFlatten(array, depth);
    }

    /**
     * The inverse of `_.toPairs`; this method returns an object composed
     * from key-value `pairs`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} pairs The key-value pairs.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.fromPairs([['a', 1], ['b', 2]]);
     * // => { 'a': 1, 'b': 2 }
     */
    function fromPairs(pairs) {
      var index = -1,
          length = pairs == null ? 0 : pairs.length,
          result = {};

      while (++index < length) {
        var pair = pairs[index];
        result[pair[0]] = pair[1];
      }
      return result;
    }

    /**
     * Gets the first element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @alias first
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the first element of `array`.
     * @example
     *
     * _.head([1, 2, 3]);
     * // => 1
     *
     * _.head([]);
     * // => undefined
     */
    function head(array) {
      return (array && array.length) ? array[0] : undefined;
    }

    /**
     * Gets the index at which the first occurrence of `value` is found in `array`
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons. If `fromIndex` is negative, it's used as the
     * offset from the end of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.indexOf([1, 2, 1, 2], 2);
     * // => 1
     *
     * // Search from the `fromIndex`.
     * _.indexOf([1, 2, 1, 2], 2, 2);
     * // => 3
     */
    function indexOf(array, value, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = fromIndex == null ? 0 : toInteger(fromIndex);
      if (index < 0) {
        index = nativeMax(length + index, 0);
      }
      return baseIndexOf(array, value, index);
    }

    /**
     * Gets all but the last element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.initial([1, 2, 3]);
     * // => [1, 2]
     */
    function initial(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseSlice(array, 0, -1) : [];
    }

    /**
     * Creates an array of unique values that are included in all given arrays
     * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons. The order and references of result values are
     * determined by the first array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * _.intersection([2, 1], [2, 3]);
     * // => [2]
     */
    var intersection = baseRest(function(arrays) {
      var mapped = arrayMap(arrays, castArrayLikeObject);
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped)
        : [];
    });

    /**
     * This method is like `_.intersection` except that it accepts `iteratee`
     * which is invoked for each element of each `arrays` to generate the criterion
     * by which they're compared. The order and references of result values are
     * determined by the first array. The iteratee is invoked with one argument:
     * (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * _.intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor);
     * // => [2.1]
     *
     * // The `_.property` iteratee shorthand.
     * _.intersectionBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }]
     */
    var intersectionBy = baseRest(function(arrays) {
      var iteratee = last(arrays),
          mapped = arrayMap(arrays, castArrayLikeObject);

      if (iteratee === last(mapped)) {
        iteratee = undefined;
      } else {
        mapped.pop();
      }
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped, getIteratee(iteratee, 2))
        : [];
    });

    /**
     * This method is like `_.intersection` except that it accepts `comparator`
     * which is invoked to compare elements of `arrays`. The order and references
     * of result values are determined by the first array. The comparator is
     * invoked with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of intersecting values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.intersectionWith(objects, others, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }]
     */
    var intersectionWith = baseRest(function(arrays) {
      var comparator = last(arrays),
          mapped = arrayMap(arrays, castArrayLikeObject);

      comparator = typeof comparator == 'function' ? comparator : undefined;
      if (comparator) {
        mapped.pop();
      }
      return (mapped.length && mapped[0] === arrays[0])
        ? baseIntersection(mapped, undefined, comparator)
        : [];
    });

    /**
     * Converts all elements in `array` into a string separated by `separator`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to convert.
     * @param {string} [separator=','] The element separator.
     * @returns {string} Returns the joined string.
     * @example
     *
     * _.join(['a', 'b', 'c'], '~');
     * // => 'a~b~c'
     */
    function join(array, separator) {
      return array == null ? '' : nativeJoin.call(array, separator);
    }

    /**
     * Gets the last element of `array`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {*} Returns the last element of `array`.
     * @example
     *
     * _.last([1, 2, 3]);
     * // => 3
     */
    function last(array) {
      var length = array == null ? 0 : array.length;
      return length ? array[length - 1] : undefined;
    }

    /**
     * This method is like `_.indexOf` except that it iterates over elements of
     * `array` from right to left.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=array.length-1] The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.lastIndexOf([1, 2, 1, 2], 2);
     * // => 3
     *
     * // Search from the `fromIndex`.
     * _.lastIndexOf([1, 2, 1, 2], 2, 2);
     * // => 1
     */
    function lastIndexOf(array, value, fromIndex) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return -1;
      }
      var index = length;
      if (fromIndex !== undefined) {
        index = toInteger(fromIndex);
        index = index < 0 ? nativeMax(length + index, 0) : nativeMin(index, length - 1);
      }
      return value === value
        ? strictLastIndexOf(array, value, index)
        : baseFindIndex(array, baseIsNaN, index, true);
    }

    /**
     * Gets the element at index `n` of `array`. If `n` is negative, the nth
     * element from the end is returned.
     *
     * @static
     * @memberOf _
     * @since 4.11.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=0] The index of the element to return.
     * @returns {*} Returns the nth element of `array`.
     * @example
     *
     * var array = ['a', 'b', 'c', 'd'];
     *
     * _.nth(array, 1);
     * // => 'b'
     *
     * _.nth(array, -2);
     * // => 'c';
     */
    function nth(array, n) {
      return (array && array.length) ? baseNth(array, toInteger(n)) : undefined;
    }

    /**
     * Removes all given values from `array` using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.without`, this method mutates `array`. Use `_.remove`
     * to remove elements from an array by predicate.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...*} [values] The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = ['a', 'b', 'c', 'a', 'b', 'c'];
     *
     * _.pull(array, 'a', 'c');
     * console.log(array);
     * // => ['b', 'b']
     */
    var pull = baseRest(pullAll);

    /**
     * This method is like `_.pull` except that it accepts an array of values to remove.
     *
     * **Note:** Unlike `_.difference`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = ['a', 'b', 'c', 'a', 'b', 'c'];
     *
     * _.pullAll(array, ['a', 'c']);
     * console.log(array);
     * // => ['b', 'b']
     */
    function pullAll(array, values) {
      return (array && array.length && values && values.length)
        ? basePullAll(array, values)
        : array;
    }

    /**
     * This method is like `_.pullAll` except that it accepts `iteratee` which is
     * invoked for each element of `array` and `values` to generate the criterion
     * by which they're compared. The iteratee is invoked with one argument: (value).
     *
     * **Note:** Unlike `_.differenceBy`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [{ 'x': 1 }, { 'x': 2 }, { 'x': 3 }, { 'x': 1 }];
     *
     * _.pullAllBy(array, [{ 'x': 1 }, { 'x': 3 }], 'x');
     * console.log(array);
     * // => [{ 'x': 2 }]
     */
    function pullAllBy(array, values, iteratee) {
      return (array && array.length && values && values.length)
        ? basePullAll(array, values, getIteratee(iteratee, 2))
        : array;
    }

    /**
     * This method is like `_.pullAll` except that it accepts `comparator` which
     * is invoked to compare elements of `array` to `values`. The comparator is
     * invoked with two arguments: (arrVal, othVal).
     *
     * **Note:** Unlike `_.differenceWith`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 4.6.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Array} values The values to remove.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [{ 'x': 1, 'y': 2 }, { 'x': 3, 'y': 4 }, { 'x': 5, 'y': 6 }];
     *
     * _.pullAllWith(array, [{ 'x': 3, 'y': 4 }], _.isEqual);
     * console.log(array);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 5, 'y': 6 }]
     */
    function pullAllWith(array, values, comparator) {
      return (array && array.length && values && values.length)
        ? basePullAll(array, values, undefined, comparator)
        : array;
    }

    /**
     * Removes elements from `array` corresponding to `indexes` and returns an
     * array of removed elements.
     *
     * **Note:** Unlike `_.at`, this method mutates `array`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {...(number|number[])} [indexes] The indexes of elements to remove.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = ['a', 'b', 'c', 'd'];
     * var pulled = _.pullAt(array, [1, 3]);
     *
     * console.log(array);
     * // => ['a', 'c']
     *
     * console.log(pulled);
     * // => ['b', 'd']
     */
    var pullAt = flatRest(function(array, indexes) {
      var length = array == null ? 0 : array.length,
          result = baseAt(array, indexes);

      basePullAt(array, arrayMap(indexes, function(index) {
        return isIndex(index, length) ? +index : index;
      }).sort(compareAscending));

      return result;
    });

    /**
     * Removes all elements from `array` that `predicate` returns truthy for
     * and returns an array of the removed elements. The predicate is invoked
     * with three arguments: (value, index, array).
     *
     * **Note:** Unlike `_.filter`, this method mutates `array`. Use `_.pull`
     * to pull elements from an array by value.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new array of removed elements.
     * @example
     *
     * var array = [1, 2, 3, 4];
     * var evens = _.remove(array, function(n) {
     *   return n % 2 == 0;
     * });
     *
     * console.log(array);
     * // => [1, 3]
     *
     * console.log(evens);
     * // => [2, 4]
     */
    function remove(array, predicate) {
      var result = [];
      if (!(array && array.length)) {
        return result;
      }
      var index = -1,
          indexes = [],
          length = array.length;

      predicate = getIteratee(predicate, 3);
      while (++index < length) {
        var value = array[index];
        if (predicate(value, index, array)) {
          result.push(value);
          indexes.push(index);
        }
      }
      basePullAt(array, indexes);
      return result;
    }

    /**
     * Reverses `array` so that the first element becomes the last, the second
     * element becomes the second to last, and so on.
     *
     * **Note:** This method mutates `array` and is based on
     * [`Array#reverse`](https://mdn.io/Array/reverse).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to modify.
     * @returns {Array} Returns `array`.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _.reverse(array);
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function reverse(array) {
      return array == null ? array : nativeReverse.call(array);
    }

    /**
     * Creates a slice of `array` from `start` up to, but not including, `end`.
     *
     * **Note:** This method is used instead of
     * [`Array#slice`](https://mdn.io/Array/slice) to ensure dense arrays are
     * returned.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to slice.
     * @param {number} [start=0] The start position.
     * @param {number} [end=array.length] The end position.
     * @returns {Array} Returns the slice of `array`.
     */
    function slice(array, start, end) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      if (end && typeof end != 'number' && isIterateeCall(array, start, end)) {
        start = 0;
        end = length;
      }
      else {
        start = start == null ? 0 : toInteger(start);
        end = end === undefined ? length : toInteger(end);
      }
      return baseSlice(array, start, end);
    }

    /**
     * Uses a binary search to determine the lowest index at which `value`
     * should be inserted into `array` in order to maintain its sort order.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedIndex([30, 50], 40);
     * // => 1
     */
    function sortedIndex(array, value) {
      return baseSortedIndex(array, value);
    }

    /**
     * This method is like `_.sortedIndex` except that it accepts `iteratee`
     * which is invoked for `value` and each element of `array` to compute their
     * sort ranking. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * var objects = [{ 'x': 4 }, { 'x': 5 }];
     *
     * _.sortedIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
     * // => 0
     *
     * // The `_.property` iteratee shorthand.
     * _.sortedIndexBy(objects, { 'x': 4 }, 'x');
     * // => 0
     */
    function sortedIndexBy(array, value, iteratee) {
      return baseSortedIndexBy(array, value, getIteratee(iteratee, 2));
    }

    /**
     * This method is like `_.indexOf` except that it performs a binary
     * search on a sorted `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.sortedIndexOf([4, 5, 5, 5, 6], 5);
     * // => 1
     */
    function sortedIndexOf(array, value) {
      var length = array == null ? 0 : array.length;
      if (length) {
        var index = baseSortedIndex(array, value);
        if (index < length && eq(array[index], value)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.sortedIndex` except that it returns the highest
     * index at which `value` should be inserted into `array` in order to
     * maintain its sort order.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * _.sortedLastIndex([4, 5, 5, 5, 6], 5);
     * // => 4
     */
    function sortedLastIndex(array, value) {
      return baseSortedIndex(array, value, true);
    }

    /**
     * This method is like `_.sortedLastIndex` except that it accepts `iteratee`
     * which is invoked for `value` and each element of `array` to compute their
     * sort ranking. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The sorted array to inspect.
     * @param {*} value The value to evaluate.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {number} Returns the index at which `value` should be inserted
     *  into `array`.
     * @example
     *
     * var objects = [{ 'x': 4 }, { 'x': 5 }];
     *
     * _.sortedLastIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
     * // => 1
     *
     * // The `_.property` iteratee shorthand.
     * _.sortedLastIndexBy(objects, { 'x': 4 }, 'x');
     * // => 1
     */
    function sortedLastIndexBy(array, value, iteratee) {
      return baseSortedIndexBy(array, value, getIteratee(iteratee, 2), true);
    }

    /**
     * This method is like `_.lastIndexOf` except that it performs a binary
     * search on a sorted `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     * @example
     *
     * _.sortedLastIndexOf([4, 5, 5, 5, 6], 5);
     * // => 3
     */
    function sortedLastIndexOf(array, value) {
      var length = array == null ? 0 : array.length;
      if (length) {
        var index = baseSortedIndex(array, value, true) - 1;
        if (eq(array[index], value)) {
          return index;
        }
      }
      return -1;
    }

    /**
     * This method is like `_.uniq` except that it's designed and optimized
     * for sorted arrays.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.sortedUniq([1, 1, 2]);
     * // => [1, 2]
     */
    function sortedUniq(array) {
      return (array && array.length)
        ? baseSortedUniq(array)
        : [];
    }

    /**
     * This method is like `_.uniqBy` except that it's designed and optimized
     * for sorted arrays.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.sortedUniqBy([1.1, 1.2, 2.3, 2.4], Math.floor);
     * // => [1.1, 2.3]
     */
    function sortedUniqBy(array, iteratee) {
      return (array && array.length)
        ? baseSortedUniq(array, getIteratee(iteratee, 2))
        : [];
    }

    /**
     * Gets all but the first element of `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.tail([1, 2, 3]);
     * // => [2, 3]
     */
    function tail(array) {
      var length = array == null ? 0 : array.length;
      return length ? baseSlice(array, 1, length) : [];
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the beginning.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.take([1, 2, 3]);
     * // => [1]
     *
     * _.take([1, 2, 3], 2);
     * // => [1, 2]
     *
     * _.take([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.take([1, 2, 3], 0);
     * // => []
     */
    function take(array, n, guard) {
      if (!(array && array.length)) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      return baseSlice(array, 0, n < 0 ? 0 : n);
    }

    /**
     * Creates a slice of `array` with `n` elements taken from the end.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {number} [n=1] The number of elements to take.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * _.takeRight([1, 2, 3]);
     * // => [3]
     *
     * _.takeRight([1, 2, 3], 2);
     * // => [2, 3]
     *
     * _.takeRight([1, 2, 3], 5);
     * // => [1, 2, 3]
     *
     * _.takeRight([1, 2, 3], 0);
     * // => []
     */
    function takeRight(array, n, guard) {
      var length = array == null ? 0 : array.length;
      if (!length) {
        return [];
      }
      n = (guard || n === undefined) ? 1 : toInteger(n);
      n = length - n;
      return baseSlice(array, n < 0 ? 0 : n, length);
    }

    /**
     * Creates a slice of `array` with elements taken from the end. Elements are
     * taken until `predicate` returns falsey. The predicate is invoked with
     * three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': true },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': false }
     * ];
     *
     * _.takeRightWhile(users, function(o) { return !o.active; });
     * // => objects for ['fred', 'pebbles']
     *
     * // The `_.matches` iteratee shorthand.
     * _.takeRightWhile(users, { 'user': 'pebbles', 'active': false });
     * // => objects for ['pebbles']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.takeRightWhile(users, ['active', false]);
     * // => objects for ['fred', 'pebbles']
     *
     * // The `_.property` iteratee shorthand.
     * _.takeRightWhile(users, 'active');
     * // => []
     */
    function takeRightWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3), false, true)
        : [];
    }

    /**
     * Creates a slice of `array` with elements taken from the beginning. Elements
     * are taken until `predicate` returns falsey. The predicate is invoked with
     * three arguments: (value, index, array).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Array
     * @param {Array} array The array to query.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the slice of `array`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'active': false },
     *   { 'user': 'fred',    'active': false },
     *   { 'user': 'pebbles', 'active': true }
     * ];
     *
     * _.takeWhile(users, function(o) { return !o.active; });
     * // => objects for ['barney', 'fred']
     *
     * // The `_.matches` iteratee shorthand.
     * _.takeWhile(users, { 'user': 'barney', 'active': false });
     * // => objects for ['barney']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.takeWhile(users, ['active', false]);
     * // => objects for ['barney', 'fred']
     *
     * // The `_.property` iteratee shorthand.
     * _.takeWhile(users, 'active');
     * // => []
     */
    function takeWhile(array, predicate) {
      return (array && array.length)
        ? baseWhile(array, getIteratee(predicate, 3))
        : [];
    }

    /**
     * Creates an array of unique values, in order, from all given arrays using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.union([2], [1, 2]);
     * // => [2, 1]
     */
    var union = baseRest(function(arrays) {
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true));
    });

    /**
     * This method is like `_.union` except that it accepts `iteratee` which is
     * invoked for each element of each `arrays` to generate the criterion by
     * which uniqueness is computed. Result values are chosen from the first
     * array in which the value occurs. The iteratee is invoked with one argument:
     * (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * _.unionBy([2.1], [1.2, 2.3], Math.floor);
     * // => [2.1, 1.2]
     *
     * // The `_.property` iteratee shorthand.
     * _.unionBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    var unionBy = baseRest(function(arrays) {
      var iteratee = last(arrays);
      if (isArrayLikeObject(iteratee)) {
        iteratee = undefined;
      }
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), getIteratee(iteratee, 2));
    });

    /**
     * This method is like `_.union` except that it accepts `comparator` which
     * is invoked to compare elements of `arrays`. Result values are chosen from
     * the first array in which the value occurs. The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of combined values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.unionWith(objects, others, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]
     */
    var unionWith = baseRest(function(arrays) {
      var comparator = last(arrays);
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), undefined, comparator);
    });

    /**
     * Creates a duplicate-free version of an array, using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons, in which only the first occurrence of each element
     * is kept. The order of result values is determined by the order they occur
     * in the array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     */
    function uniq(array) {
      return (array && array.length) ? baseUniq(array) : [];
    }

    /**
     * This method is like `_.uniq` except that it accepts `iteratee` which is
     * invoked for each element in `array` to generate the criterion by which
     * uniqueness is computed. The order of result values is determined by the
     * order they occur in the array. The iteratee is invoked with one argument:
     * (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.uniqBy([2.1, 1.2, 2.3], Math.floor);
     * // => [2.1, 1.2]
     *
     * // The `_.property` iteratee shorthand.
     * _.uniqBy([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 1 }, { 'x': 2 }]
     */
    function uniqBy(array, iteratee) {
      return (array && array.length) ? baseUniq(array, getIteratee(iteratee, 2)) : [];
    }

    /**
     * This method is like `_.uniq` except that it accepts `comparator` which
     * is invoked to compare elements of `array`. The order of result values is
     * determined by the order they occur in the array.The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.uniqWith(objects, _.isEqual);
     * // => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }]
     */
    function uniqWith(array, comparator) {
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return (array && array.length) ? baseUniq(array, undefined, comparator) : [];
    }

    /**
     * This method is like `_.zip` except that it accepts an array of grouped
     * elements and creates an array regrouping the elements to their pre-zip
     * configuration.
     *
     * @static
     * @memberOf _
     * @since 1.2.0
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip(['a', 'b'], [1, 2], [true, false]);
     * // => [['a', 1, true], ['b', 2, false]]
     *
     * _.unzip(zipped);
     * // => [['a', 'b'], [1, 2], [true, false]]
     */
    function unzip(array) {
      if (!(array && array.length)) {
        return [];
      }
      var length = 0;
      array = arrayFilter(array, function(group) {
        if (isArrayLikeObject(group)) {
          length = nativeMax(group.length, length);
          return true;
        }
      });
      return baseTimes(length, function(index) {
        return arrayMap(array, baseProperty(index));
      });
    }

    /**
     * This method is like `_.unzip` except that it accepts `iteratee` to specify
     * how regrouped values should be combined. The iteratee is invoked with the
     * elements of each group: (...group).
     *
     * @static
     * @memberOf _
     * @since 3.8.0
     * @category Array
     * @param {Array} array The array of grouped elements to process.
     * @param {Function} [iteratee=_.identity] The function to combine
     *  regrouped values.
     * @returns {Array} Returns the new array of regrouped elements.
     * @example
     *
     * var zipped = _.zip([1, 2], [10, 20], [100, 200]);
     * // => [[1, 10, 100], [2, 20, 200]]
     *
     * _.unzipWith(zipped, _.add);
     * // => [3, 30, 300]
     */
    function unzipWith(array, iteratee) {
      if (!(array && array.length)) {
        return [];
      }
      var result = unzip(array);
      if (iteratee == null) {
        return result;
      }
      return arrayMap(result, function(group) {
        return apply(iteratee, undefined, group);
      });
    }

    /**
     * Creates an array excluding all given values using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons.
     *
     * **Note:** Unlike `_.pull`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @param {...*} [values] The values to exclude.
     * @returns {Array} Returns the new array of filtered values.
     * @see _.difference, _.xor
     * @example
     *
     * _.without([2, 1, 2, 3], 1, 2);
     * // => [3]
     */
    var without = baseRest(function(array, values) {
      return isArrayLikeObject(array)
        ? baseDifference(array, values)
        : [];
    });

    /**
     * Creates an array of unique values that is the
     * [symmetric difference](https://en.wikipedia.org/wiki/Symmetric_difference)
     * of the given arrays. The order of result values is determined by the order
     * they occur in the arrays.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @returns {Array} Returns the new array of filtered values.
     * @see _.difference, _.without
     * @example
     *
     * _.xor([2, 1], [2, 3]);
     * // => [1, 3]
     */
    var xor = baseRest(function(arrays) {
      return baseXor(arrayFilter(arrays, isArrayLikeObject));
    });

    /**
     * This method is like `_.xor` except that it accepts `iteratee` which is
     * invoked for each element of each `arrays` to generate the criterion by
     * which by which they're compared. The order of result values is determined
     * by the order they occur in the arrays. The iteratee is invoked with one
     * argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * _.xorBy([2.1, 1.2], [2.3, 3.4], Math.floor);
     * // => [1.2, 3.4]
     *
     * // The `_.property` iteratee shorthand.
     * _.xorBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
     * // => [{ 'x': 2 }]
     */
    var xorBy = baseRest(function(arrays) {
      var iteratee = last(arrays);
      if (isArrayLikeObject(iteratee)) {
        iteratee = undefined;
      }
      return baseXor(arrayFilter(arrays, isArrayLikeObject), getIteratee(iteratee, 2));
    });

    /**
     * This method is like `_.xor` except that it accepts `comparator` which is
     * invoked to compare elements of `arrays`. The order of result values is
     * determined by the order they occur in the arrays. The comparator is invoked
     * with two arguments: (arrVal, othVal).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Array
     * @param {...Array} [arrays] The arrays to inspect.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new array of filtered values.
     * @example
     *
     * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
     * var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
     *
     * _.xorWith(objects, others, _.isEqual);
     * // => [{ 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]
     */
    var xorWith = baseRest(function(arrays) {
      var comparator = last(arrays);
      comparator = typeof comparator == 'function' ? comparator : undefined;
      return baseXor(arrayFilter(arrays, isArrayLikeObject), undefined, comparator);
    });

    /**
     * Creates an array of grouped elements, the first of which contains the
     * first elements of the given arrays, the second of which contains the
     * second elements of the given arrays, and so on.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zip(['a', 'b'], [1, 2], [true, false]);
     * // => [['a', 1, true], ['b', 2, false]]
     */
    var zip = baseRest(unzip);

    /**
     * This method is like `_.fromPairs` except that it accepts two arrays,
     * one of property identifiers and one of corresponding values.
     *
     * @static
     * @memberOf _
     * @since 0.4.0
     * @category Array
     * @param {Array} [props=[]] The property identifiers.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObject(['a', 'b'], [1, 2]);
     * // => { 'a': 1, 'b': 2 }
     */
    function zipObject(props, values) {
      return baseZipObject(props || [], values || [], assignValue);
    }

    /**
     * This method is like `_.zipObject` except that it supports property paths.
     *
     * @static
     * @memberOf _
     * @since 4.1.0
     * @category Array
     * @param {Array} [props=[]] The property identifiers.
     * @param {Array} [values=[]] The property values.
     * @returns {Object} Returns the new object.
     * @example
     *
     * _.zipObjectDeep(['a.b[0].c', 'a.b[1].d'], [1, 2]);
     * // => { 'a': { 'b': [{ 'c': 1 }, { 'd': 2 }] } }
     */
    function zipObjectDeep(props, values) {
      return baseZipObject(props || [], values || [], baseSet);
    }

    /**
     * This method is like `_.zip` except that it accepts `iteratee` to specify
     * how grouped values should be combined. The iteratee is invoked with the
     * elements of each group: (...group).
     *
     * @static
     * @memberOf _
     * @since 3.8.0
     * @category Array
     * @param {...Array} [arrays] The arrays to process.
     * @param {Function} [iteratee=_.identity] The function to combine
     *  grouped values.
     * @returns {Array} Returns the new array of grouped elements.
     * @example
     *
     * _.zipWith([1, 2], [10, 20], [100, 200], function(a, b, c) {
     *   return a + b + c;
     * });
     * // => [111, 222]
     */
    var zipWith = baseRest(function(arrays) {
      var length = arrays.length,
          iteratee = length > 1 ? arrays[length - 1] : undefined;

      iteratee = typeof iteratee == 'function' ? (arrays.pop(), iteratee) : undefined;
      return unzipWith(arrays, iteratee);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Creates a `lodash` wrapper instance that wraps `value` with explicit method
     * chain sequences enabled. The result of such sequences must be unwrapped
     * with `_#value`.
     *
     * @static
     * @memberOf _
     * @since 1.3.0
     * @category Seq
     * @param {*} value The value to wrap.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36 },
     *   { 'user': 'fred',    'age': 40 },
     *   { 'user': 'pebbles', 'age': 1 }
     * ];
     *
     * var youngest = _
     *   .chain(users)
     *   .sortBy('age')
     *   .map(function(o) {
     *     return o.user + ' is ' + o.age;
     *   })
     *   .head()
     *   .value();
     * // => 'pebbles is 1'
     */
    function chain(value) {
      var result = lodash(value);
      result.__chain__ = true;
      return result;
    }

    /**
     * This method invokes `interceptor` and returns `value`. The interceptor
     * is invoked with one argument; (value). The purpose of this method is to
     * "tap into" a method chain sequence in order to modify intermediate results.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Seq
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns `value`.
     * @example
     *
     * _([1, 2, 3])
     *  .tap(function(array) {
     *    // Mutate input array.
     *    array.pop();
     *  })
     *  .reverse()
     *  .value();
     * // => [2, 1]
     */
    function tap(value, interceptor) {
      interceptor(value);
      return value;
    }

    /**
     * This method is like `_.tap` except that it returns the result of `interceptor`.
     * The purpose of this method is to "pass thru" values replacing intermediate
     * results in a method chain sequence.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Seq
     * @param {*} value The value to provide to `interceptor`.
     * @param {Function} interceptor The function to invoke.
     * @returns {*} Returns the result of `interceptor`.
     * @example
     *
     * _('  abc  ')
     *  .chain()
     *  .trim()
     *  .thru(function(value) {
     *    return [value];
     *  })
     *  .value();
     * // => ['abc']
     */
    function thru(value, interceptor) {
      return interceptor(value);
    }

    /**
     * This method is the wrapper version of `_.at`.
     *
     * @name at
     * @memberOf _
     * @since 1.0.0
     * @category Seq
     * @param {...(string|string[])} [paths] The property paths to pick.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }, 4] };
     *
     * _(object).at(['a[0].b.c', 'a[1]']).value();
     * // => [3, 4]
     */
    var wrapperAt = flatRest(function(paths) {
      var length = paths.length,
          start = length ? paths[0] : 0,
          value = this.__wrapped__,
          interceptor = function(object) { return baseAt(object, paths); };

      if (length > 1 || this.__actions__.length ||
          !(value instanceof LazyWrapper) || !isIndex(start)) {
        return this.thru(interceptor);
      }
      value = value.slice(start, +start + (length ? 1 : 0));
      value.__actions__.push({
        'func': thru,
        'args': [interceptor],
        'thisArg': undefined
      });
      return new LodashWrapper(value, this.__chain__).thru(function(array) {
        if (length && !array.length) {
          array.push(undefined);
        }
        return array;
      });
    });

    /**
     * Creates a `lodash` wrapper instance with explicit method chain sequences enabled.
     *
     * @name chain
     * @memberOf _
     * @since 0.1.0
     * @category Seq
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 }
     * ];
     *
     * // A sequence without explicit chaining.
     * _(users).head();
     * // => { 'user': 'barney', 'age': 36 }
     *
     * // A sequence with explicit chaining.
     * _(users)
     *   .chain()
     *   .head()
     *   .pick('user')
     *   .value();
     * // => { 'user': 'barney' }
     */
    function wrapperChain() {
      return chain(this);
    }

    /**
     * Executes the chain sequence and returns the wrapped result.
     *
     * @name commit
     * @memberOf _
     * @since 3.2.0
     * @category Seq
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2];
     * var wrapped = _(array).push(3);
     *
     * console.log(array);
     * // => [1, 2]
     *
     * wrapped = wrapped.commit();
     * console.log(array);
     * // => [1, 2, 3]
     *
     * wrapped.last();
     * // => 3
     *
     * console.log(array);
     * // => [1, 2, 3]
     */
    function wrapperCommit() {
      return new LodashWrapper(this.value(), this.__chain__);
    }

    /**
     * Gets the next value on a wrapped object following the
     * [iterator protocol](https://mdn.io/iteration_protocols#iterator).
     *
     * @name next
     * @memberOf _
     * @since 4.0.0
     * @category Seq
     * @returns {Object} Returns the next iterator value.
     * @example
     *
     * var wrapped = _([1, 2]);
     *
     * wrapped.next();
     * // => { 'done': false, 'value': 1 }
     *
     * wrapped.next();
     * // => { 'done': false, 'value': 2 }
     *
     * wrapped.next();
     * // => { 'done': true, 'value': undefined }
     */
    function wrapperNext() {
      if (this.__values__ === undefined) {
        this.__values__ = toArray(this.value());
      }
      var done = this.__index__ >= this.__values__.length,
          value = done ? undefined : this.__values__[this.__index__++];

      return { 'done': done, 'value': value };
    }

    /**
     * Enables the wrapper to be iterable.
     *
     * @name Symbol.iterator
     * @memberOf _
     * @since 4.0.0
     * @category Seq
     * @returns {Object} Returns the wrapper object.
     * @example
     *
     * var wrapped = _([1, 2]);
     *
     * wrapped[Symbol.iterator]() === wrapped;
     * // => true
     *
     * Array.from(wrapped);
     * // => [1, 2]
     */
    function wrapperToIterator() {
      return this;
    }

    /**
     * Creates a clone of the chain sequence planting `value` as the wrapped value.
     *
     * @name plant
     * @memberOf _
     * @since 3.2.0
     * @category Seq
     * @param {*} value The value to plant.
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var wrapped = _([1, 2]).map(square);
     * var other = wrapped.plant([3, 4]);
     *
     * other.value();
     * // => [9, 16]
     *
     * wrapped.value();
     * // => [1, 4]
     */
    function wrapperPlant(value) {
      var result,
          parent = this;

      while (parent instanceof baseLodash) {
        var clone = wrapperClone(parent);
        clone.__index__ = 0;
        clone.__values__ = undefined;
        if (result) {
          previous.__wrapped__ = clone;
        } else {
          result = clone;
        }
        var previous = clone;
        parent = parent.__wrapped__;
      }
      previous.__wrapped__ = value;
      return result;
    }

    /**
     * This method is the wrapper version of `_.reverse`.
     *
     * **Note:** This method mutates the wrapped array.
     *
     * @name reverse
     * @memberOf _
     * @since 0.1.0
     * @category Seq
     * @returns {Object} Returns the new `lodash` wrapper instance.
     * @example
     *
     * var array = [1, 2, 3];
     *
     * _(array).reverse().value()
     * // => [3, 2, 1]
     *
     * console.log(array);
     * // => [3, 2, 1]
     */
    function wrapperReverse() {
      var value = this.__wrapped__;
      if (value instanceof LazyWrapper) {
        var wrapped = value;
        if (this.__actions__.length) {
          wrapped = new LazyWrapper(this);
        }
        wrapped = wrapped.reverse();
        wrapped.__actions__.push({
          'func': thru,
          'args': [reverse],
          'thisArg': undefined
        });
        return new LodashWrapper(wrapped, this.__chain__);
      }
      return this.thru(reverse);
    }

    /**
     * Executes the chain sequence to resolve the unwrapped value.
     *
     * @name value
     * @memberOf _
     * @since 0.1.0
     * @alias toJSON, valueOf
     * @category Seq
     * @returns {*} Returns the resolved unwrapped value.
     * @example
     *
     * _([1, 2, 3]).value();
     * // => [1, 2, 3]
     */
    function wrapperValue() {
      return baseWrapperValue(this.__wrapped__, this.__actions__);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` thru `iteratee`. The corresponding value of
     * each key is the number of times the key was returned by `iteratee`. The
     * iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.countBy([6.1, 4.2, 6.3], Math.floor);
     * // => { '4': 1, '6': 2 }
     *
     * // The `_.property` iteratee shorthand.
     * _.countBy(['one', 'two', 'three'], 'length');
     * // => { '3': 2, '5': 1 }
     */
    var countBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        ++result[key];
      } else {
        baseAssignValue(result, key, 1);
      }
    });

    /**
     * Checks if `predicate` returns truthy for **all** elements of `collection`.
     * Iteration is stopped once `predicate` returns falsey. The predicate is
     * invoked with three arguments: (value, index|key, collection).
     *
     * **Note:** This method returns `true` for
     * [empty collections](https://en.wikipedia.org/wiki/Empty_set) because
     * [everything is true](https://en.wikipedia.org/wiki/Vacuous_truth) of
     * elements of empty collections.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {boolean} Returns `true` if all elements pass the predicate check,
     *  else `false`.
     * @example
     *
     * _.every([true, 1, null, 'yes'], Boolean);
     * // => false
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // The `_.matches` iteratee shorthand.
     * _.every(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.every(users, ['active', false]);
     * // => true
     *
     * // The `_.property` iteratee shorthand.
     * _.every(users, 'active');
     * // => false
     */
    function every(collection, predicate, guard) {
      var func = isArray(collection) ? arrayEvery : baseEvery;
      if (guard && isIterateeCall(collection, predicate, guard)) {
        predicate = undefined;
      }
      return func(collection, getIteratee(predicate, 3));
    }

    /**
     * Iterates over elements of `collection`, returning an array of all elements
     * `predicate` returns truthy for. The predicate is invoked with three
     * arguments: (value, index|key, collection).
     *
     * **Note:** Unlike `_.remove`, this method returns a new array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     * @see _.reject
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * _.filter(users, function(o) { return !o.active; });
     * // => objects for ['fred']
     *
     * // The `_.matches` iteratee shorthand.
     * _.filter(users, { 'age': 36, 'active': true });
     * // => objects for ['barney']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.filter(users, ['active', false]);
     * // => objects for ['fred']
     *
     * // The `_.property` iteratee shorthand.
     * _.filter(users, 'active');
     * // => objects for ['barney']
     */
    function filter(collection, predicate) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      return func(collection, getIteratee(predicate, 3));
    }

    /**
     * Iterates over elements of `collection`, returning the first element
     * `predicate` returns truthy for. The predicate is invoked with three
     * arguments: (value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=0] The index to search from.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': true },
     *   { 'user': 'fred',    'age': 40, 'active': false },
     *   { 'user': 'pebbles', 'age': 1,  'active': true }
     * ];
     *
     * _.find(users, function(o) { return o.age < 40; });
     * // => object for 'barney'
     *
     * // The `_.matches` iteratee shorthand.
     * _.find(users, { 'age': 1, 'active': true });
     * // => object for 'pebbles'
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.find(users, ['active', false]);
     * // => object for 'fred'
     *
     * // The `_.property` iteratee shorthand.
     * _.find(users, 'active');
     * // => object for 'barney'
     */
    var find = createFind(findIndex);

    /**
     * This method is like `_.find` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param {number} [fromIndex=collection.length-1] The index to search from.
     * @returns {*} Returns the matched element, else `undefined`.
     * @example
     *
     * _.findLast([1, 2, 3, 4], function(n) {
     *   return n % 2 == 1;
     * });
     * // => 3
     */
    var findLast = createFind(findLastIndex);

    /**
     * Creates a flattened array of values by running each element in `collection`
     * thru `iteratee` and flattening the mapped results. The iteratee is invoked
     * with three arguments: (value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * function duplicate(n) {
     *   return [n, n];
     * }
     *
     * _.flatMap([1, 2], duplicate);
     * // => [1, 1, 2, 2]
     */
    function flatMap(collection, iteratee) {
      return baseFlatten(map(collection, iteratee), 1);
    }

    /**
     * This method is like `_.flatMap` except that it recursively flattens the
     * mapped results.
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * function duplicate(n) {
     *   return [[[n, n]]];
     * }
     *
     * _.flatMapDeep([1, 2], duplicate);
     * // => [1, 1, 2, 2]
     */
    function flatMapDeep(collection, iteratee) {
      return baseFlatten(map(collection, iteratee), INFINITY);
    }

    /**
     * This method is like `_.flatMap` except that it recursively flattens the
     * mapped results up to `depth` times.
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {number} [depth=1] The maximum recursion depth.
     * @returns {Array} Returns the new flattened array.
     * @example
     *
     * function duplicate(n) {
     *   return [[[n, n]]];
     * }
     *
     * _.flatMapDepth([1, 2], duplicate, 2);
     * // => [[1, 1], [2, 2]]
     */
    function flatMapDepth(collection, iteratee, depth) {
      depth = depth === undefined ? 1 : toInteger(depth);
      return baseFlatten(map(collection, iteratee), depth);
    }

    /**
     * Iterates over elements of `collection` and invokes `iteratee` for each element.
     * The iteratee is invoked with three arguments: (value, index|key, collection).
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * **Note:** As with other "Collections" methods, objects with a "length"
     * property are iterated like arrays. To avoid this behavior use `_.forIn`
     * or `_.forOwn` for object iteration.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @alias each
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     * @see _.forEachRight
     * @example
     *
     * _.forEach([1, 2], function(value) {
     *   console.log(value);
     * });
     * // => Logs `1` then `2`.
     *
     * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a' then 'b' (iteration order is not guaranteed).
     */
    function forEach(collection, iteratee) {
      var func = isArray(collection) ? arrayEach : baseEach;
      return func(collection, getIteratee(iteratee, 3));
    }

    /**
     * This method is like `_.forEach` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @alias eachRight
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array|Object} Returns `collection`.
     * @see _.forEach
     * @example
     *
     * _.forEachRight([1, 2], function(value) {
     *   console.log(value);
     * });
     * // => Logs `2` then `1`.
     */
    function forEachRight(collection, iteratee) {
      var func = isArray(collection) ? arrayEachRight : baseEachRight;
      return func(collection, getIteratee(iteratee, 3));
    }

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` thru `iteratee`. The order of grouped values
     * is determined by the order they occur in `collection`. The corresponding
     * value of each key is an array of elements responsible for generating the
     * key. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * _.groupBy([6.1, 4.2, 6.3], Math.floor);
     * // => { '4': [4.2], '6': [6.1, 6.3] }
     *
     * // The `_.property` iteratee shorthand.
     * _.groupBy(['one', 'two', 'three'], 'length');
     * // => { '3': ['one', 'two'], '5': ['three'] }
     */
    var groupBy = createAggregator(function(result, value, key) {
      if (hasOwnProperty.call(result, key)) {
        result[key].push(value);
      } else {
        baseAssignValue(result, key, [value]);
      }
    });

    /**
     * Checks if `value` is in `collection`. If `collection` is a string, it's
     * checked for a substring of `value`, otherwise
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * is used for equality comparisons. If `fromIndex` is negative, it's used as
     * the offset from the end of `collection`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @param {*} value The value to search for.
     * @param {number} [fromIndex=0] The index to search from.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {boolean} Returns `true` if `value` is found, else `false`.
     * @example
     *
     * _.includes([1, 2, 3], 1);
     * // => true
     *
     * _.includes([1, 2, 3], 1, 2);
     * // => false
     *
     * _.includes({ 'a': 1, 'b': 2 }, 1);
     * // => true
     *
     * _.includes('abcd', 'bc');
     * // => true
     */
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection)
        ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
        : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
    }

    /**
     * Invokes the method at `path` of each element in `collection`, returning
     * an array of the results of each invoked method. Any additional arguments
     * are provided to each invoked method. If `path` is a function, it's invoked
     * for, and `this` bound to, each element in `collection`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Array|Function|string} path The path of the method to invoke or
     *  the function invoked per iteration.
     * @param {...*} [args] The arguments to invoke each method with.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.invokeMap([[5, 1, 7], [3, 2, 1]], 'sort');
     * // => [[1, 5, 7], [1, 2, 3]]
     *
     * _.invokeMap([123, 456], String.prototype.split, '');
     * // => [['1', '2', '3'], ['4', '5', '6']]
     */
    var invokeMap = baseRest(function(collection, path, args) {
      var index = -1,
          isFunc = typeof path == 'function',
          result = isArrayLike(collection) ? Array(collection.length) : [];

      baseEach(collection, function(value) {
        result[++index] = isFunc ? apply(path, value, args) : baseInvoke(value, path, args);
      });
      return result;
    });

    /**
     * Creates an object composed of keys generated from the results of running
     * each element of `collection` thru `iteratee`. The corresponding value of
     * each key is the last element responsible for generating the key. The
     * iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
     * @returns {Object} Returns the composed aggregate object.
     * @example
     *
     * var array = [
     *   { 'dir': 'left', 'code': 97 },
     *   { 'dir': 'right', 'code': 100 }
     * ];
     *
     * _.keyBy(array, function(o) {
     *   return String.fromCharCode(o.code);
     * });
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
     *
     * _.keyBy(array, 'dir');
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }
     */
    var keyBy = createAggregator(function(result, value, key) {
      baseAssignValue(result, key, value);
    });

    /**
     * Creates an array of values by running each element in `collection` thru
     * `iteratee`. The iteratee is invoked with three arguments:
     * (value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
     *
     * The guarded methods are:
     * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
     * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
     * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
     * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new mapped array.
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * _.map([4, 8], square);
     * // => [16, 64]
     *
     * _.map({ 'a': 4, 'b': 8 }, square);
     * // => [16, 64] (iteration order is not guaranteed)
     *
     * var users = [
     *   { 'user': 'barney' },
     *   { 'user': 'fred' }
     * ];
     *
     * // The `_.property` iteratee shorthand.
     * _.map(users, 'user');
     * // => ['barney', 'fred']
     */
    function map(collection, iteratee) {
      var func = isArray(collection) ? arrayMap : baseMap;
      return func(collection, getIteratee(iteratee, 3));
    }

    /**
     * This method is like `_.sortBy` except that it allows specifying the sort
     * orders of the iteratees to sort by. If `orders` is unspecified, all values
     * are sorted in ascending order. Otherwise, specify an order of "desc" for
     * descending or "asc" for ascending sort order of corresponding values.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Array[]|Function[]|Object[]|string[]} [iteratees=[_.identity]]
     *  The iteratees to sort by.
     * @param {string[]} [orders] The sort orders of `iteratees`.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 34 },
     *   { 'user': 'fred',   'age': 40 },
     *   { 'user': 'barney', 'age': 36 }
     * ];
     *
     * // Sort by `user` in ascending order and by `age` in descending order.
     * _.orderBy(users, ['user', 'age'], ['asc', 'desc']);
     * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
     */
    function orderBy(collection, iteratees, orders, guard) {
      if (collection == null) {
        return [];
      }
      if (!isArray(iteratees)) {
        iteratees = iteratees == null ? [] : [iteratees];
      }
      orders = guard ? undefined : orders;
      if (!isArray(orders)) {
        orders = orders == null ? [] : [orders];
      }
      return baseOrderBy(collection, iteratees, orders);
    }

    /**
     * Creates an array of elements split into two groups, the first of which
     * contains elements `predicate` returns truthy for, the second of which
     * contains elements `predicate` returns falsey for. The predicate is
     * invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the array of grouped elements.
     * @example
     *
     * var users = [
     *   { 'user': 'barney',  'age': 36, 'active': false },
     *   { 'user': 'fred',    'age': 40, 'active': true },
     *   { 'user': 'pebbles', 'age': 1,  'active': false }
     * ];
     *
     * _.partition(users, function(o) { return o.active; });
     * // => objects for [['fred'], ['barney', 'pebbles']]
     *
     * // The `_.matches` iteratee shorthand.
     * _.partition(users, { 'age': 1, 'active': false });
     * // => objects for [['pebbles'], ['barney', 'fred']]
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.partition(users, ['active', false]);
     * // => objects for [['barney', 'pebbles'], ['fred']]
     *
     * // The `_.property` iteratee shorthand.
     * _.partition(users, 'active');
     * // => objects for [['fred'], ['barney', 'pebbles']]
     */
    var partition = createAggregator(function(result, value, key) {
      result[key ? 0 : 1].push(value);
    }, function() { return [[], []]; });

    /**
     * Reduces `collection` to a value which is the accumulated result of running
     * each element in `collection` thru `iteratee`, where each successive
     * invocation is supplied the return value of the previous. If `accumulator`
     * is not given, the first element of `collection` is used as the initial
     * value. The iteratee is invoked with four arguments:
     * (accumulator, value, index|key, collection).
     *
     * Many lodash methods are guarded to work as iteratees for methods like
     * `_.reduce`, `_.reduceRight`, and `_.transform`.
     *
     * The guarded methods are:
     * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
     * and `sortBy`
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @returns {*} Returns the accumulated value.
     * @see _.reduceRight
     * @example
     *
     * _.reduce([1, 2], function(sum, n) {
     *   return sum + n;
     * }, 0);
     * // => 3
     *
     * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
     *   (result[value] || (result[value] = [])).push(key);
     *   return result;
     * }, {});
     * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
     */
    function reduce(collection, iteratee, accumulator) {
      var func = isArray(collection) ? arrayReduce : baseReduce,
          initAccum = arguments.length < 3;

      return func(collection, getIteratee(iteratee, 4), accumulator, initAccum, baseEach);
    }

    /**
     * This method is like `_.reduce` except that it iterates over elements of
     * `collection` from right to left.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The initial value.
     * @returns {*} Returns the accumulated value.
     * @see _.reduce
     * @example
     *
     * var array = [[0, 1], [2, 3], [4, 5]];
     *
     * _.reduceRight(array, function(flattened, other) {
     *   return flattened.concat(other);
     * }, []);
     * // => [4, 5, 2, 3, 0, 1]
     */
    function reduceRight(collection, iteratee, accumulator) {
      var func = isArray(collection) ? arrayReduceRight : baseReduce,
          initAccum = arguments.length < 3;

      return func(collection, getIteratee(iteratee, 4), accumulator, initAccum, baseEachRight);
    }

    /**
     * The opposite of `_.filter`; this method returns the elements of `collection`
     * that `predicate` does **not** return truthy for.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the new filtered array.
     * @see _.filter
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': false },
     *   { 'user': 'fred',   'age': 40, 'active': true }
     * ];
     *
     * _.reject(users, function(o) { return !o.active; });
     * // => objects for ['fred']
     *
     * // The `_.matches` iteratee shorthand.
     * _.reject(users, { 'age': 40, 'active': true });
     * // => objects for ['barney']
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.reject(users, ['active', false]);
     * // => objects for ['fred']
     *
     * // The `_.property` iteratee shorthand.
     * _.reject(users, 'active');
     * // => objects for ['barney']
     */
    function reject(collection, predicate) {
      var func = isArray(collection) ? arrayFilter : baseFilter;
      return func(collection, negate(getIteratee(predicate, 3)));
    }

    /**
     * Gets a random element from `collection`.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to sample.
     * @returns {*} Returns the random element.
     * @example
     *
     * _.sample([1, 2, 3, 4]);
     * // => 2
     */
    function sample(collection) {
      var func = isArray(collection) ? arraySample : baseSample;
      return func(collection);
    }

    /**
     * Gets `n` random elements at unique keys from `collection` up to the
     * size of `collection`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Collection
     * @param {Array|Object} collection The collection to sample.
     * @param {number} [n=1] The number of elements to sample.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the random elements.
     * @example
     *
     * _.sampleSize([1, 2, 3], 2);
     * // => [3, 1]
     *
     * _.sampleSize([1, 2, 3], 4);
     * // => [2, 3, 1]
     */
    function sampleSize(collection, n, guard) {
      if ((guard ? isIterateeCall(collection, n, guard) : n === undefined)) {
        n = 1;
      } else {
        n = toInteger(n);
      }
      var func = isArray(collection) ? arraySampleSize : baseSampleSize;
      return func(collection, n);
    }

    /**
     * Creates an array of shuffled values, using a version of the
     * [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher-Yates_shuffle).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to shuffle.
     * @returns {Array} Returns the new shuffled array.
     * @example
     *
     * _.shuffle([1, 2, 3, 4]);
     * // => [4, 1, 3, 2]
     */
    function shuffle(collection) {
      var func = isArray(collection) ? arrayShuffle : baseShuffle;
      return func(collection);
    }

    /**
     * Gets the size of `collection` by returning its length for array-like
     * values or the number of own enumerable string keyed properties for objects.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object|string} collection The collection to inspect.
     * @returns {number} Returns the collection size.
     * @example
     *
     * _.size([1, 2, 3]);
     * // => 3
     *
     * _.size({ 'a': 1, 'b': 2 });
     * // => 2
     *
     * _.size('pebbles');
     * // => 7
     */
    function size(collection) {
      if (collection == null) {
        return 0;
      }
      if (isArrayLike(collection)) {
        return isString(collection) ? stringSize(collection) : collection.length;
      }
      var tag = getTag(collection);
      if (tag == mapTag || tag == setTag) {
        return collection.size;
      }
      return baseKeys(collection).length;
    }

    /**
     * Checks if `predicate` returns truthy for **any** element of `collection`.
     * Iteration is stopped once `predicate` returns truthy. The predicate is
     * invoked with three arguments: (value, index|key, collection).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {boolean} Returns `true` if any element passes the predicate check,
     *  else `false`.
     * @example
     *
     * _.some([null, 0, 'yes', false], Boolean);
     * // => true
     *
     * var users = [
     *   { 'user': 'barney', 'active': true },
     *   { 'user': 'fred',   'active': false }
     * ];
     *
     * // The `_.matches` iteratee shorthand.
     * _.some(users, { 'user': 'barney', 'active': false });
     * // => false
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.some(users, ['active', false]);
     * // => true
     *
     * // The `_.property` iteratee shorthand.
     * _.some(users, 'active');
     * // => true
     */
    function some(collection, predicate, guard) {
      var func = isArray(collection) ? arraySome : baseSome;
      if (guard && isIterateeCall(collection, predicate, guard)) {
        predicate = undefined;
      }
      return func(collection, getIteratee(predicate, 3));
    }

    /**
     * Creates an array of elements, sorted in ascending order by the results of
     * running each element in a collection thru each iteratee. This method
     * performs a stable sort, that is, it preserves the original sort order of
     * equal elements. The iteratees are invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Collection
     * @param {Array|Object} collection The collection to iterate over.
     * @param {...(Function|Function[])} [iteratees=[_.identity]]
     *  The iteratees to sort by.
     * @returns {Array} Returns the new sorted array.
     * @example
     *
     * var users = [
     *   { 'user': 'fred',   'age': 48 },
     *   { 'user': 'barney', 'age': 36 },
     *   { 'user': 'fred',   'age': 40 },
     *   { 'user': 'barney', 'age': 34 }
     * ];
     *
     * _.sortBy(users, [function(o) { return o.user; }]);
     * // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
     *
     * _.sortBy(users, ['user', 'age']);
     * // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]
     */
    var sortBy = baseRest(function(collection, iteratees) {
      if (collection == null) {
        return [];
      }
      var length = iteratees.length;
      if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) {
        iteratees = [];
      } else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) {
        iteratees = [iteratees[0]];
      }
      return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
    });

    /*------------------------------------------------------------------------*/

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = ctxNow || function() {
      return root.Date.now();
    };

    /*------------------------------------------------------------------------*/

    /**
     * The opposite of `_.before`; this method creates a function that invokes
     * `func` once it's called `n` or more times.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {number} n The number of calls before `func` is invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var saves = ['profile', 'settings'];
     *
     * var done = _.after(saves.length, function() {
     *   console.log('done saving!');
     * });
     *
     * _.forEach(saves, function(type) {
     *   asyncSave({ 'type': type, 'complete': done });
     * });
     * // => Logs 'done saving!' after the two async saves have completed.
     */
    function after(n, func) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n < 1) {
          return func.apply(this, arguments);
        }
      };
    }

    /**
     * Creates a function that invokes `func`, with up to `n` arguments,
     * ignoring any additional arguments.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @param {number} [n=func.length] The arity cap.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the new capped function.
     * @example
     *
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));
     * // => [6, 8, 10]
     */
    function ary(func, n, guard) {
      n = guard ? undefined : n;
      n = (func && n == null) ? func.length : n;
      return createWrap(func, WRAP_ARY_FLAG, undefined, undefined, undefined, undefined, n);
    }

    /**
     * Creates a function that invokes `func`, with the `this` binding and arguments
     * of the created function, while it's called less than `n` times. Subsequent
     * calls to the created function return the result of the last `func` invocation.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {number} n The number of calls at which `func` is no longer invoked.
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * jQuery(element).on('click', _.before(5, addContactToList));
     * // => Allows adding up to 4 contacts to the list.
     */
    function before(n, func) {
      var result;
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = undefined;
        }
        return result;
      };
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of `thisArg`
     * and `partials` prepended to the arguments it receives.
     *
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for partially applied arguments.
     *
     * **Note:** Unlike native `Function#bind`, this method doesn't set the "length"
     * property of bound functions.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to bind.
     * @param {*} thisArg The `this` binding of `func`.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * function greet(greeting, punctuation) {
     *   return greeting + ' ' + this.user + punctuation;
     * }
     *
     * var object = { 'user': 'fred' };
     *
     * var bound = _.bind(greet, object, 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * // Bound with placeholders.
     * var bound = _.bind(greet, object, _, '!');
     * bound('hi');
     * // => 'hi fred!'
     */
    var bind = baseRest(function(func, thisArg, partials) {
      var bitmask = WRAP_BIND_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, getHolder(bind));
        bitmask |= WRAP_PARTIAL_FLAG;
      }
      return createWrap(func, bitmask, thisArg, partials, holders);
    });

    /**
     * Creates a function that invokes the method at `object[key]` with `partials`
     * prepended to the arguments it receives.
     *
     * This method differs from `_.bind` by allowing bound functions to reference
     * methods that may be redefined or don't yet exist. See
     * [Peter Michaux's article](http://peter.michaux.ca/articles/lazy-function-definition-pattern)
     * for more details.
     *
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * @static
     * @memberOf _
     * @since 0.10.0
     * @category Function
     * @param {Object} object The object to invoke the method on.
     * @param {string} key The key of the method.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new bound function.
     * @example
     *
     * var object = {
     *   'user': 'fred',
     *   'greet': function(greeting, punctuation) {
     *     return greeting + ' ' + this.user + punctuation;
     *   }
     * };
     *
     * var bound = _.bindKey(object, 'greet', 'hi');
     * bound('!');
     * // => 'hi fred!'
     *
     * object.greet = function(greeting, punctuation) {
     *   return greeting + 'ya ' + this.user + punctuation;
     * };
     *
     * bound('!');
     * // => 'hiya fred!'
     *
     * // Bound with placeholders.
     * var bound = _.bindKey(object, 'greet', _, '!');
     * bound('hi');
     * // => 'hiya fred!'
     */
    var bindKey = baseRest(function(object, key, partials) {
      var bitmask = WRAP_BIND_FLAG | WRAP_BIND_KEY_FLAG;
      if (partials.length) {
        var holders = replaceHolders(partials, getHolder(bindKey));
        bitmask |= WRAP_PARTIAL_FLAG;
      }
      return createWrap(key, bitmask, object, partials, holders);
    });

    /**
     * Creates a function that accepts arguments of `func` and either invokes
     * `func` returning its result, if at least `arity` number of arguments have
     * been provided, or returns a function that accepts the remaining `func`
     * arguments, and so on. The arity of `func` may be specified if `func.length`
     * is not sufficient.
     *
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,
     * may be used as a placeholder for provided arguments.
     *
     * **Note:** This method doesn't set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curry(abc);
     *
     * curried(1)(2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2)(3);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // Curried with placeholders.
     * curried(1)(_, 3)(2);
     * // => [1, 2, 3]
     */
    function curry(func, arity, guard) {
      arity = guard ? undefined : arity;
      var result = createWrap(func, WRAP_CURRY_FLAG, undefined, undefined, undefined, undefined, undefined, arity);
      result.placeholder = curry.placeholder;
      return result;
    }

    /**
     * This method is like `_.curry` except that arguments are applied to `func`
     * in the manner of `_.partialRight` instead of `_.partial`.
     *
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for provided arguments.
     *
     * **Note:** This method doesn't set the "length" property of curried functions.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {Function} func The function to curry.
     * @param {number} [arity=func.length] The arity of `func`.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the new curried function.
     * @example
     *
     * var abc = function(a, b, c) {
     *   return [a, b, c];
     * };
     *
     * var curried = _.curryRight(abc);
     *
     * curried(3)(2)(1);
     * // => [1, 2, 3]
     *
     * curried(2, 3)(1);
     * // => [1, 2, 3]
     *
     * curried(1, 2, 3);
     * // => [1, 2, 3]
     *
     * // Curried with placeholders.
     * curried(3)(1, _)(2);
     * // => [1, 2, 3]
     */
    function curryRight(func, arity, guard) {
      arity = guard ? undefined : arity;
      var result = createWrap(func, WRAP_CURRY_RIGHT_FLAG, undefined, undefined, undefined, undefined, undefined, arity);
      result.placeholder = curryRight.placeholder;
      return result;
    }

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            timeWaiting = wait - timeSinceLastCall;

        return maxing
          ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
          : timeWaiting;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Defers invoking the `func` until the current call stack has cleared. Any
     * additional arguments are provided to `func` when it's invoked.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to defer.
     * @param {...*} [args] The arguments to invoke `func` with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.defer(function(text) {
     *   console.log(text);
     * }, 'deferred');
     * // => Logs 'deferred' after one millisecond.
     */
    var defer = baseRest(function(func, args) {
      return baseDelay(func, 1, args);
    });

    /**
     * Invokes `func` after `wait` milliseconds. Any additional arguments are
     * provided to `func` when it's invoked.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to delay.
     * @param {number} wait The number of milliseconds to delay invocation.
     * @param {...*} [args] The arguments to invoke `func` with.
     * @returns {number} Returns the timer id.
     * @example
     *
     * _.delay(function(text) {
     *   console.log(text);
     * }, 1000, 'later');
     * // => Logs 'later' after one second.
     */
    var delay = baseRest(function(func, wait, args) {
      return baseDelay(func, toNumber(wait) || 0, args);
    });

    /**
     * Creates a function that invokes `func` with arguments reversed.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to flip arguments for.
     * @returns {Function} Returns the new flipped function.
     * @example
     *
     * var flipped = _.flip(function() {
     *   return _.toArray(arguments);
     * });
     *
     * flipped('a', 'b', 'c', 'd');
     * // => ['d', 'c', 'b', 'a']
     */
    function flip(func) {
      return createWrap(func, WRAP_FLIP_FLAG);
    }

    /**
     * Creates a function that memoizes the result of `func`. If `resolver` is
     * provided, it determines the cache key for storing the result based on the
     * arguments provided to the memoized function. By default, the first argument
     * provided to the memoized function is used as the map cache key. The `func`
     * is invoked with the `this` binding of the memoized function.
     *
     * **Note:** The cache is exposed as the `cache` property on the memoized
     * function. Its creation may be customized by replacing the `_.memoize.Cache`
     * constructor with one whose instances implement the
     * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
     * method interface of `clear`, `delete`, `get`, `has`, and `set`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to have its output memoized.
     * @param {Function} [resolver] The function to resolve the cache key.
     * @returns {Function} Returns the new memoized function.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     * var other = { 'c': 3, 'd': 4 };
     *
     * var values = _.memoize(_.values);
     * values(object);
     * // => [1, 2]
     *
     * values(other);
     * // => [3, 4]
     *
     * object.a = 2;
     * values(object);
     * // => [1, 2]
     *
     * // Modify the result cache.
     * values.cache.set(object, ['a', 'b']);
     * values(object);
     * // => ['a', 'b']
     *
     * // Replace `_.memoize.Cache`.
     * _.memoize.Cache = WeakMap;
     */
    function memoize(func, resolver) {
      if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      var memoized = function() {
        var args = arguments,
            key = resolver ? resolver.apply(this, args) : args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
          return cache.get(key);
        }
        var result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new (memoize.Cache || MapCache);
      return memoized;
    }

    // Expose `MapCache`.
    memoize.Cache = MapCache;

    /**
     * Creates a function that negates the result of the predicate `func`. The
     * `func` predicate is invoked with the `this` binding and arguments of the
     * created function.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {Function} predicate The predicate to negate.
     * @returns {Function} Returns the new negated function.
     * @example
     *
     * function isEven(n) {
     *   return n % 2 == 0;
     * }
     *
     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
     * // => [1, 3, 5]
     */
    function negate(predicate) {
      if (typeof predicate != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      return function() {
        var args = arguments;
        switch (args.length) {
          case 0: return !predicate.call(this);
          case 1: return !predicate.call(this, args[0]);
          case 2: return !predicate.call(this, args[0], args[1]);
          case 3: return !predicate.call(this, args[0], args[1], args[2]);
        }
        return !predicate.apply(this, args);
      };
    }

    /**
     * Creates a function that is restricted to invoking `func` once. Repeat calls
     * to the function return the value of the first invocation. The `func` is
     * invoked with the `this` binding and arguments of the created function.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to restrict.
     * @returns {Function} Returns the new restricted function.
     * @example
     *
     * var initialize = _.once(createApplication);
     * initialize();
     * initialize();
     * // => `createApplication` is invoked once
     */
    function once(func) {
      return before(2, func);
    }

    /**
     * Creates a function that invokes `func` with its arguments transformed.
     *
     * @static
     * @since 4.0.0
     * @memberOf _
     * @category Function
     * @param {Function} func The function to wrap.
     * @param {...(Function|Function[])} [transforms=[_.identity]]
     *  The argument transforms.
     * @returns {Function} Returns the new function.
     * @example
     *
     * function doubled(n) {
     *   return n * 2;
     * }
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var func = _.overArgs(function(x, y) {
     *   return [x, y];
     * }, [square, doubled]);
     *
     * func(9, 3);
     * // => [81, 6]
     *
     * func(10, 5);
     * // => [100, 10]
     */
    var overArgs = castRest(function(func, transforms) {
      transforms = (transforms.length == 1 && isArray(transforms[0]))
        ? arrayMap(transforms[0], baseUnary(getIteratee()))
        : arrayMap(baseFlatten(transforms, 1), baseUnary(getIteratee()));

      var funcsLength = transforms.length;
      return baseRest(function(args) {
        var index = -1,
            length = nativeMin(args.length, funcsLength);

        while (++index < length) {
          args[index] = transforms[index].call(this, args[index]);
        }
        return apply(func, this, args);
      });
    });

    /**
     * Creates a function that invokes `func` with `partials` prepended to the
     * arguments it receives. This method is like `_.bind` except it does **not**
     * alter the `this` binding.
     *
     * The `_.partial.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method doesn't set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @since 0.2.0
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * function greet(greeting, name) {
     *   return greeting + ' ' + name;
     * }
     *
     * var sayHelloTo = _.partial(greet, 'hello');
     * sayHelloTo('fred');
     * // => 'hello fred'
     *
     * // Partially applied with placeholders.
     * var greetFred = _.partial(greet, _, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     */
    var partial = baseRest(function(func, partials) {
      var holders = replaceHolders(partials, getHolder(partial));
      return createWrap(func, WRAP_PARTIAL_FLAG, undefined, partials, holders);
    });

    /**
     * This method is like `_.partial` except that partially applied arguments
     * are appended to the arguments it receives.
     *
     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic
     * builds, may be used as a placeholder for partially applied arguments.
     *
     * **Note:** This method doesn't set the "length" property of partially
     * applied functions.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Function
     * @param {Function} func The function to partially apply arguments to.
     * @param {...*} [partials] The arguments to be partially applied.
     * @returns {Function} Returns the new partially applied function.
     * @example
     *
     * function greet(greeting, name) {
     *   return greeting + ' ' + name;
     * }
     *
     * var greetFred = _.partialRight(greet, 'fred');
     * greetFred('hi');
     * // => 'hi fred'
     *
     * // Partially applied with placeholders.
     * var sayHelloTo = _.partialRight(greet, 'hello', _);
     * sayHelloTo('fred');
     * // => 'hello fred'
     */
    var partialRight = baseRest(function(func, partials) {
      var holders = replaceHolders(partials, getHolder(partialRight));
      return createWrap(func, WRAP_PARTIAL_RIGHT_FLAG, undefined, partials, holders);
    });

    /**
     * Creates a function that invokes `func` with arguments arranged according
     * to the specified `indexes` where the argument value at the first index is
     * provided as the first argument, the argument value at the second index is
     * provided as the second argument, and so on.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Function
     * @param {Function} func The function to rearrange arguments for.
     * @param {...(number|number[])} indexes The arranged argument indexes.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var rearged = _.rearg(function(a, b, c) {
     *   return [a, b, c];
     * }, [2, 0, 1]);
     *
     * rearged('b', 'c', 'a')
     * // => ['a', 'b', 'c']
     */
    var rearg = flatRest(function(func, indexes) {
      return createWrap(func, WRAP_REARG_FLAG, undefined, undefined, undefined, indexes);
    });

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * created function and arguments from `start` and beyond provided as
     * an array.
     *
     * **Note:** This method is based on the
     * [rest parameter](https://mdn.io/rest_parameters).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to apply a rest parameter to.
     * @param {number} [start=func.length-1] The start position of the rest parameter.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.rest(function(what, names) {
     *   return what + ' ' + _.initial(names).join(', ') +
     *     (_.size(names) > 1 ? ', & ' : '') + _.last(names);
     * });
     *
     * say('hello', 'fred', 'barney', 'pebbles');
     * // => 'hello fred, barney, & pebbles'
     */
    function rest(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = start === undefined ? start : toInteger(start);
      return baseRest(func, start);
    }

    /**
     * Creates a function that invokes `func` with the `this` binding of the
     * create function and an array of arguments much like
     * [`Function#apply`](http://www.ecma-international.org/ecma-262/7.0/#sec-function.prototype.apply).
     *
     * **Note:** This method is based on the
     * [spread operator](https://mdn.io/spread_operator).
     *
     * @static
     * @memberOf _
     * @since 3.2.0
     * @category Function
     * @param {Function} func The function to spread arguments over.
     * @param {number} [start=0] The start position of the spread.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var say = _.spread(function(who, what) {
     *   return who + ' says ' + what;
     * });
     *
     * say(['fred', 'hello']);
     * // => 'fred says hello'
     *
     * var numbers = Promise.all([
     *   Promise.resolve(40),
     *   Promise.resolve(36)
     * ]);
     *
     * numbers.then(_.spread(function(x, y) {
     *   return x + y;
     * }));
     * // => a Promise of 76
     */
    function spread(func, start) {
      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      start = start == null ? 0 : nativeMax(toInteger(start), 0);
      return baseRest(function(args) {
        var array = args[start],
            otherArgs = castSlice(args, 0, start);

        if (array) {
          arrayPush(otherArgs, array);
        }
        return apply(func, this, otherArgs);
      });
    }

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }

    /**
     * Creates a function that accepts up to one argument, ignoring any
     * additional arguments.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Function
     * @param {Function} func The function to cap arguments for.
     * @returns {Function} Returns the new capped function.
     * @example
     *
     * _.map(['6', '8', '10'], _.unary(parseInt));
     * // => [6, 8, 10]
     */
    function unary(func) {
      return ary(func, 1);
    }

    /**
     * Creates a function that provides `value` to `wrapper` as its first
     * argument. Any additional arguments provided to the function are appended
     * to those provided to the `wrapper`. The wrapper is invoked with the `this`
     * binding of the created function.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {*} value The value to wrap.
     * @param {Function} [wrapper=identity] The wrapper function.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var p = _.wrap(_.escape, function(func, text) {
     *   return '<p>' + func(text) + '</p>';
     * });
     *
     * p('fred, barney, & pebbles');
     * // => '<p>fred, barney, &amp; pebbles</p>'
     */
    function wrap(value, wrapper) {
      return partial(castFunction(wrapper), value);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Casts `value` as an array if it's not one.
     *
     * @static
     * @memberOf _
     * @since 4.4.0
     * @category Lang
     * @param {*} value The value to inspect.
     * @returns {Array} Returns the cast array.
     * @example
     *
     * _.castArray(1);
     * // => [1]
     *
     * _.castArray({ 'a': 1 });
     * // => [{ 'a': 1 }]
     *
     * _.castArray('abc');
     * // => ['abc']
     *
     * _.castArray(null);
     * // => [null]
     *
     * _.castArray(undefined);
     * // => [undefined]
     *
     * _.castArray();
     * // => []
     *
     * var array = [1, 2, 3];
     * console.log(_.castArray(array) === array);
     * // => true
     */
    function castArray() {
      if (!arguments.length) {
        return [];
      }
      var value = arguments[0];
      return isArray(value) ? value : [value];
    }

    /**
     * Creates a shallow clone of `value`.
     *
     * **Note:** This method is loosely based on the
     * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
     * and supports cloning arrays, array buffers, booleans, date objects, maps,
     * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
     * arrays. The own enumerable properties of `arguments` objects are cloned
     * as plain objects. An empty object is returned for uncloneable values such
     * as error objects, functions, DOM nodes, and WeakMaps.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to clone.
     * @returns {*} Returns the cloned value.
     * @see _.cloneDeep
     * @example
     *
     * var objects = [{ 'a': 1 }, { 'b': 2 }];
     *
     * var shallow = _.clone(objects);
     * console.log(shallow[0] === objects[0]);
     * // => true
     */
    function clone(value) {
      return baseClone(value, CLONE_SYMBOLS_FLAG);
    }

    /**
     * This method is like `_.clone` except that it accepts `customizer` which
     * is invoked to produce the cloned value. If `customizer` returns `undefined`,
     * cloning is handled by the method instead. The `customizer` is invoked with
     * up to four arguments; (value [, index|key, object, stack]).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to clone.
     * @param {Function} [customizer] The function to customize cloning.
     * @returns {*} Returns the cloned value.
     * @see _.cloneDeepWith
     * @example
     *
     * function customizer(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(false);
     *   }
     * }
     *
     * var el = _.cloneWith(document.body, customizer);
     *
     * console.log(el === document.body);
     * // => false
     * console.log(el.nodeName);
     * // => 'BODY'
     * console.log(el.childNodes.length);
     * // => 0
     */
    function cloneWith(value, customizer) {
      customizer = typeof customizer == 'function' ? customizer : undefined;
      return baseClone(value, CLONE_SYMBOLS_FLAG, customizer);
    }

    /**
     * This method is like `_.clone` except that it recursively clones `value`.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Lang
     * @param {*} value The value to recursively clone.
     * @returns {*} Returns the deep cloned value.
     * @see _.clone
     * @example
     *
     * var objects = [{ 'a': 1 }, { 'b': 2 }];
     *
     * var deep = _.cloneDeep(objects);
     * console.log(deep[0] === objects[0]);
     * // => false
     */
    function cloneDeep(value) {
      return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
    }

    /**
     * This method is like `_.cloneWith` except that it recursively clones `value`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to recursively clone.
     * @param {Function} [customizer] The function to customize cloning.
     * @returns {*} Returns the deep cloned value.
     * @see _.cloneWith
     * @example
     *
     * function customizer(value) {
     *   if (_.isElement(value)) {
     *     return value.cloneNode(true);
     *   }
     * }
     *
     * var el = _.cloneDeepWith(document.body, customizer);
     *
     * console.log(el === document.body);
     * // => false
     * console.log(el.nodeName);
     * // => 'BODY'
     * console.log(el.childNodes.length);
     * // => 20
     */
    function cloneDeepWith(value, customizer) {
      customizer = typeof customizer == 'function' ? customizer : undefined;
      return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG, customizer);
    }

    /**
     * Checks if `object` conforms to `source` by invoking the predicate
     * properties of `source` with the corresponding property values of `object`.
     *
     * **Note:** This method is equivalent to `_.conforms` when `source` is
     * partially applied.
     *
     * @static
     * @memberOf _
     * @since 4.14.0
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property predicates to conform to.
     * @returns {boolean} Returns `true` if `object` conforms, else `false`.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     *
     * _.conformsTo(object, { 'b': function(n) { return n > 1; } });
     * // => true
     *
     * _.conformsTo(object, { 'b': function(n) { return n > 2; } });
     * // => false
     */
    function conformsTo(object, source) {
      return source == null || baseConformsTo(object, source, keys(source));
    }

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    /**
     * Checks if `value` is greater than `other`.
     *
     * @static
     * @memberOf _
     * @since 3.9.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than `other`,
     *  else `false`.
     * @see _.lt
     * @example
     *
     * _.gt(3, 1);
     * // => true
     *
     * _.gt(3, 3);
     * // => false
     *
     * _.gt(1, 3);
     * // => false
     */
    var gt = createRelationalOperation(baseGt);

    /**
     * Checks if `value` is greater than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @since 3.9.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is greater than or equal to
     *  `other`, else `false`.
     * @see _.lte
     * @example
     *
     * _.gte(3, 1);
     * // => true
     *
     * _.gte(3, 3);
     * // => true
     *
     * _.gte(1, 3);
     * // => false
     */
    var gte = createRelationalOperation(function(value, other) {
      return value >= other;
    });

    /**
     * Checks if `value` is likely an `arguments` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an `arguments` object,
     *  else `false`.
     * @example
     *
     * _.isArguments(function() { return arguments; }());
     * // => true
     *
     * _.isArguments([1, 2, 3]);
     * // => false
     */
    var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
      return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
        !propertyIsEnumerable.call(value, 'callee');
    };

    /**
     * Checks if `value` is classified as an `Array` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array, else `false`.
     * @example
     *
     * _.isArray([1, 2, 3]);
     * // => true
     *
     * _.isArray(document.body.children);
     * // => false
     *
     * _.isArray('abc');
     * // => false
     *
     * _.isArray(_.noop);
     * // => false
     */
    var isArray = Array.isArray;

    /**
     * Checks if `value` is classified as an `ArrayBuffer` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array buffer, else `false`.
     * @example
     *
     * _.isArrayBuffer(new ArrayBuffer(2));
     * // => true
     *
     * _.isArrayBuffer(new Array(2));
     * // => false
     */
    var isArrayBuffer = nodeIsArrayBuffer ? baseUnary(nodeIsArrayBuffer) : baseIsArrayBuffer;

    /**
     * Checks if `value` is array-like. A value is considered array-like if it's
     * not a function and has a `value.length` that's an integer greater than or
     * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
     * @example
     *
     * _.isArrayLike([1, 2, 3]);
     * // => true
     *
     * _.isArrayLike(document.body.children);
     * // => true
     *
     * _.isArrayLike('abc');
     * // => true
     *
     * _.isArrayLike(_.noop);
     * // => false
     */
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    /**
     * This method is like `_.isArrayLike` except that it also checks if `value`
     * is an object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an array-like object,
     *  else `false`.
     * @example
     *
     * _.isArrayLikeObject([1, 2, 3]);
     * // => true
     *
     * _.isArrayLikeObject(document.body.children);
     * // => true
     *
     * _.isArrayLikeObject('abc');
     * // => false
     *
     * _.isArrayLikeObject(_.noop);
     * // => false
     */
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }

    /**
     * Checks if `value` is classified as a boolean primitive or object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
     * @example
     *
     * _.isBoolean(false);
     * // => true
     *
     * _.isBoolean(null);
     * // => false
     */
    function isBoolean(value) {
      return value === true || value === false ||
        (isObjectLike(value) && baseGetTag(value) == boolTag);
    }

    /**
     * Checks if `value` is a buffer.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
     * @example
     *
     * _.isBuffer(new Buffer(2));
     * // => true
     *
     * _.isBuffer(new Uint8Array(2));
     * // => false
     */
    var isBuffer = nativeIsBuffer || stubFalse;

    /**
     * Checks if `value` is classified as a `Date` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a date object, else `false`.
     * @example
     *
     * _.isDate(new Date);
     * // => true
     *
     * _.isDate('Mon April 23 2012');
     * // => false
     */
    var isDate = nodeIsDate ? baseUnary(nodeIsDate) : baseIsDate;

    /**
     * Checks if `value` is likely a DOM element.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.
     * @example
     *
     * _.isElement(document.body);
     * // => true
     *
     * _.isElement('<body>');
     * // => false
     */
    function isElement(value) {
      return isObjectLike(value) && value.nodeType === 1 && !isPlainObject(value);
    }

    /**
     * Checks if `value` is an empty object, collection, map, or set.
     *
     * Objects are considered empty if they have no own enumerable string keyed
     * properties.
     *
     * Array-like values such as `arguments` objects, arrays, buffers, strings, or
     * jQuery-like collections are considered empty if they have a `length` of `0`.
     * Similarly, maps and sets are considered empty if they have a `size` of `0`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is empty, else `false`.
     * @example
     *
     * _.isEmpty(null);
     * // => true
     *
     * _.isEmpty(true);
     * // => true
     *
     * _.isEmpty(1);
     * // => true
     *
     * _.isEmpty([1, 2, 3]);
     * // => false
     *
     * _.isEmpty({ 'a': 1 });
     * // => false
     */
    function isEmpty(value) {
      if (value == null) {
        return true;
      }
      if (isArrayLike(value) &&
          (isArray(value) || typeof value == 'string' || typeof value.splice == 'function' ||
            isBuffer(value) || isTypedArray(value) || isArguments(value))) {
        return !value.length;
      }
      var tag = getTag(value);
      if (tag == mapTag || tag == setTag) {
        return !value.size;
      }
      if (isPrototype(value)) {
        return !baseKeys(value).length;
      }
      for (var key in value) {
        if (hasOwnProperty.call(value, key)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Performs a deep comparison between two values to determine if they are
     * equivalent.
     *
     * **Note:** This method supports comparing arrays, array buffers, booleans,
     * date objects, error objects, maps, numbers, `Object` objects, regexes,
     * sets, strings, symbols, and typed arrays. `Object` objects are compared
     * by their own, not inherited, enumerable properties. Functions and DOM
     * nodes are compared by strict equality, i.e. `===`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.isEqual(object, other);
     * // => true
     *
     * object === other;
     * // => false
     */
    function isEqual(value, other) {
      return baseIsEqual(value, other);
    }

    /**
     * This method is like `_.isEqual` except that it accepts `customizer` which
     * is invoked to compare values. If `customizer` returns `undefined`, comparisons
     * are handled by the method instead. The `customizer` is invoked with up to
     * six arguments: (objValue, othValue [, index|key, object, other, stack]).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @param {Function} [customizer] The function to customize comparisons.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * function isGreeting(value) {
     *   return /^h(?:i|ello)$/.test(value);
     * }
     *
     * function customizer(objValue, othValue) {
     *   if (isGreeting(objValue) && isGreeting(othValue)) {
     *     return true;
     *   }
     * }
     *
     * var array = ['hello', 'goodbye'];
     * var other = ['hi', 'goodbye'];
     *
     * _.isEqualWith(array, other, customizer);
     * // => true
     */
    function isEqualWith(value, other, customizer) {
      customizer = typeof customizer == 'function' ? customizer : undefined;
      var result = customizer ? customizer(value, other) : undefined;
      return result === undefined ? baseIsEqual(value, other, undefined, customizer) : !!result;
    }

    /**
     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,
     * `SyntaxError`, `TypeError`, or `URIError` object.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.
     * @example
     *
     * _.isError(new Error);
     * // => true
     *
     * _.isError(Error);
     * // => false
     */
    function isError(value) {
      if (!isObjectLike(value)) {
        return false;
      }
      var tag = baseGetTag(value);
      return tag == errorTag || tag == domExcTag ||
        (typeof value.message == 'string' && typeof value.name == 'string' && !isPlainObject(value));
    }

    /**
     * Checks if `value` is a finite primitive number.
     *
     * **Note:** This method is based on
     * [`Number.isFinite`](https://mdn.io/Number/isFinite).
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.
     * @example
     *
     * _.isFinite(3);
     * // => true
     *
     * _.isFinite(Number.MIN_VALUE);
     * // => true
     *
     * _.isFinite(Infinity);
     * // => false
     *
     * _.isFinite('3');
     * // => false
     */
    function isFinite(value) {
      return typeof value == 'number' && nativeIsFinite(value);
    }

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }

    /**
     * Checks if `value` is an integer.
     *
     * **Note:** This method is based on
     * [`Number.isInteger`](https://mdn.io/Number/isInteger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an integer, else `false`.
     * @example
     *
     * _.isInteger(3);
     * // => true
     *
     * _.isInteger(Number.MIN_VALUE);
     * // => false
     *
     * _.isInteger(Infinity);
     * // => false
     *
     * _.isInteger('3');
     * // => false
     */
    function isInteger(value) {
      return typeof value == 'number' && value == toInteger(value);
    }

    /**
     * Checks if `value` is a valid array-like length.
     *
     * **Note:** This method is loosely based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
     * @example
     *
     * _.isLength(3);
     * // => true
     *
     * _.isLength(Number.MIN_VALUE);
     * // => false
     *
     * _.isLength(Infinity);
     * // => false
     *
     * _.isLength('3');
     * // => false
     */
    function isLength(value) {
      return typeof value == 'number' &&
        value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Map` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a map, else `false`.
     * @example
     *
     * _.isMap(new Map);
     * // => true
     *
     * _.isMap(new WeakMap);
     * // => false
     */
    var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;

    /**
     * Performs a partial deep comparison between `object` and `source` to
     * determine if `object` contains equivalent property values.
     *
     * **Note:** This method is equivalent to `_.matches` when `source` is
     * partially applied.
     *
     * Partial comparisons will match empty array and empty object `source`
     * values against any array or object value, respectively. See `_.isEqual`
     * for a list of supported value comparisons.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     * @example
     *
     * var object = { 'a': 1, 'b': 2 };
     *
     * _.isMatch(object, { 'b': 2 });
     * // => true
     *
     * _.isMatch(object, { 'b': 1 });
     * // => false
     */
    function isMatch(object, source) {
      return object === source || baseIsMatch(object, source, getMatchData(source));
    }

    /**
     * This method is like `_.isMatch` except that it accepts `customizer` which
     * is invoked to compare values. If `customizer` returns `undefined`, comparisons
     * are handled by the method instead. The `customizer` is invoked with five
     * arguments: (objValue, srcValue, index|key, object, source).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {Object} object The object to inspect.
     * @param {Object} source The object of property values to match.
     * @param {Function} [customizer] The function to customize comparisons.
     * @returns {boolean} Returns `true` if `object` is a match, else `false`.
     * @example
     *
     * function isGreeting(value) {
     *   return /^h(?:i|ello)$/.test(value);
     * }
     *
     * function customizer(objValue, srcValue) {
     *   if (isGreeting(objValue) && isGreeting(srcValue)) {
     *     return true;
     *   }
     * }
     *
     * var object = { 'greeting': 'hello' };
     * var source = { 'greeting': 'hi' };
     *
     * _.isMatchWith(object, source, customizer);
     * // => true
     */
    function isMatchWith(object, source, customizer) {
      customizer = typeof customizer == 'function' ? customizer : undefined;
      return baseIsMatch(object, source, getMatchData(source), customizer);
    }

    /**
     * Checks if `value` is `NaN`.
     *
     * **Note:** This method is based on
     * [`Number.isNaN`](https://mdn.io/Number/isNaN) and is not the same as
     * global [`isNaN`](https://mdn.io/isNaN) which returns `true` for
     * `undefined` and other non-number values.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     * @example
     *
     * _.isNaN(NaN);
     * // => true
     *
     * _.isNaN(new Number(NaN));
     * // => true
     *
     * isNaN(undefined);
     * // => true
     *
     * _.isNaN(undefined);
     * // => false
     */
    function isNaN(value) {
      // An `NaN` primitive is the only value that is not equal to itself.
      // Perform the `toStringTag` check first to avoid errors with some
      // ActiveX objects in IE.
      return isNumber(value) && value != +value;
    }

    /**
     * Checks if `value` is a pristine native function.
     *
     * **Note:** This method can't reliably detect native functions in the presence
     * of the core-js package because core-js circumvents this kind of detection.
     * Despite multiple requests, the core-js maintainer has made it clear: any
     * attempt to fix the detection will be obstructed. As a result, we're left
     * with little choice but to throw an error. Unfortunately, this also affects
     * packages, like [babel-polyfill](https://www.npmjs.com/package/babel-polyfill),
     * which rely on core-js.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     * @example
     *
     * _.isNative(Array.prototype.push);
     * // => true
     *
     * _.isNative(_);
     * // => false
     */
    function isNative(value) {
      if (isMaskable(value)) {
        throw new Error(CORE_ERROR_TEXT);
      }
      return baseIsNative(value);
    }

    /**
     * Checks if `value` is `null`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.
     * @example
     *
     * _.isNull(null);
     * // => true
     *
     * _.isNull(void 0);
     * // => false
     */
    function isNull(value) {
      return value === null;
    }

    /**
     * Checks if `value` is `null` or `undefined`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is nullish, else `false`.
     * @example
     *
     * _.isNil(null);
     * // => true
     *
     * _.isNil(void 0);
     * // => true
     *
     * _.isNil(NaN);
     * // => false
     */
    function isNil(value) {
      return value == null;
    }

    /**
     * Checks if `value` is classified as a `Number` primitive or object.
     *
     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
     * classified as numbers, use the `_.isFinite` method.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a number, else `false`.
     * @example
     *
     * _.isNumber(3);
     * // => true
     *
     * _.isNumber(Number.MIN_VALUE);
     * // => true
     *
     * _.isNumber(Infinity);
     * // => true
     *
     * _.isNumber('3');
     * // => false
     */
    function isNumber(value) {
      return typeof value == 'number' ||
        (isObjectLike(value) && baseGetTag(value) == numberTag);
    }

    /**
     * Checks if `value` is a plain object, that is, an object created by the
     * `Object` constructor or one with a `[[Prototype]]` of `null`.
     *
     * @static
     * @memberOf _
     * @since 0.8.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * _.isPlainObject(new Foo);
     * // => false
     *
     * _.isPlainObject([1, 2, 3]);
     * // => false
     *
     * _.isPlainObject({ 'x': 0, 'y': 0 });
     * // => true
     *
     * _.isPlainObject(Object.create(null));
     * // => true
     */
    function isPlainObject(value) {
      if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
      return typeof Ctor == 'function' && Ctor instanceof Ctor &&
        funcToString.call(Ctor) == objectCtorString;
    }

    /**
     * Checks if `value` is classified as a `RegExp` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
     * @example
     *
     * _.isRegExp(/abc/);
     * // => true
     *
     * _.isRegExp('/abc/');
     * // => false
     */
    var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;

    /**
     * Checks if `value` is a safe integer. An integer is safe if it's an IEEE-754
     * double precision number which isn't the result of a rounded unsafe integer.
     *
     * **Note:** This method is based on
     * [`Number.isSafeInteger`](https://mdn.io/Number/isSafeInteger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a safe integer, else `false`.
     * @example
     *
     * _.isSafeInteger(3);
     * // => true
     *
     * _.isSafeInteger(Number.MIN_VALUE);
     * // => false
     *
     * _.isSafeInteger(Infinity);
     * // => false
     *
     * _.isSafeInteger('3');
     * // => false
     */
    function isSafeInteger(value) {
      return isInteger(value) && value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER;
    }

    /**
     * Checks if `value` is classified as a `Set` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a set, else `false`.
     * @example
     *
     * _.isSet(new Set);
     * // => true
     *
     * _.isSet(new WeakSet);
     * // => false
     */
    var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;

    /**
     * Checks if `value` is classified as a `String` primitive or object.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a string, else `false`.
     * @example
     *
     * _.isString('abc');
     * // => true
     *
     * _.isString(1);
     * // => false
     */
    function isString(value) {
      return typeof value == 'string' ||
        (!isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag);
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && baseGetTag(value) == symbolTag);
    }

    /**
     * Checks if `value` is classified as a typed array.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
     * @example
     *
     * _.isTypedArray(new Uint8Array);
     * // => true
     *
     * _.isTypedArray([]);
     * // => false
     */
    var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

    /**
     * Checks if `value` is `undefined`.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.
     * @example
     *
     * _.isUndefined(void 0);
     * // => true
     *
     * _.isUndefined(null);
     * // => false
     */
    function isUndefined(value) {
      return value === undefined;
    }

    /**
     * Checks if `value` is classified as a `WeakMap` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a weak map, else `false`.
     * @example
     *
     * _.isWeakMap(new WeakMap);
     * // => true
     *
     * _.isWeakMap(new Map);
     * // => false
     */
    function isWeakMap(value) {
      return isObjectLike(value) && getTag(value) == weakMapTag;
    }

    /**
     * Checks if `value` is classified as a `WeakSet` object.
     *
     * @static
     * @memberOf _
     * @since 4.3.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a weak set, else `false`.
     * @example
     *
     * _.isWeakSet(new WeakSet);
     * // => true
     *
     * _.isWeakSet(new Set);
     * // => false
     */
    function isWeakSet(value) {
      return isObjectLike(value) && baseGetTag(value) == weakSetTag;
    }

    /**
     * Checks if `value` is less than `other`.
     *
     * @static
     * @memberOf _
     * @since 3.9.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than `other`,
     *  else `false`.
     * @see _.gt
     * @example
     *
     * _.lt(1, 3);
     * // => true
     *
     * _.lt(3, 3);
     * // => false
     *
     * _.lt(3, 1);
     * // => false
     */
    var lt = createRelationalOperation(baseLt);

    /**
     * Checks if `value` is less than or equal to `other`.
     *
     * @static
     * @memberOf _
     * @since 3.9.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if `value` is less than or equal to
     *  `other`, else `false`.
     * @see _.gte
     * @example
     *
     * _.lte(1, 3);
     * // => true
     *
     * _.lte(3, 3);
     * // => true
     *
     * _.lte(3, 1);
     * // => false
     */
    var lte = createRelationalOperation(function(value, other) {
      return value <= other;
    });

    /**
     * Converts `value` to an array.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Array} Returns the converted array.
     * @example
     *
     * _.toArray({ 'a': 1, 'b': 2 });
     * // => [1, 2]
     *
     * _.toArray('abc');
     * // => ['a', 'b', 'c']
     *
     * _.toArray(1);
     * // => []
     *
     * _.toArray(null);
     * // => []
     */
    function toArray(value) {
      if (!value) {
        return [];
      }
      if (isArrayLike(value)) {
        return isString(value) ? stringToArray(value) : copyArray(value);
      }
      if (symIterator && value[symIterator]) {
        return iteratorToArray(value[symIterator]());
      }
      var tag = getTag(value),
          func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values);

      return func(value);
    }

    /**
     * Converts `value` to a finite number.
     *
     * @static
     * @memberOf _
     * @since 4.12.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted number.
     * @example
     *
     * _.toFinite(3.2);
     * // => 3.2
     *
     * _.toFinite(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toFinite(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toFinite('3.2');
     * // => 3.2
     */
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = (value < 0 ? -1 : 1);
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }

    /**
     * Converts `value` to an integer.
     *
     * **Note:** This method is loosely based on
     * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toInteger(3.2);
     * // => 3
     *
     * _.toInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toInteger(Infinity);
     * // => 1.7976931348623157e+308
     *
     * _.toInteger('3.2');
     * // => 3
     */
    function toInteger(value) {
      var result = toFinite(value),
          remainder = result % 1;

      return result === result ? (remainder ? result - remainder : result) : 0;
    }

    /**
     * Converts `value` to an integer suitable for use as the length of an
     * array-like object.
     *
     * **Note:** This method is based on
     * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toLength(3.2);
     * // => 3
     *
     * _.toLength(Number.MIN_VALUE);
     * // => 0
     *
     * _.toLength(Infinity);
     * // => 4294967295
     *
     * _.toLength('3.2');
     * // => 3
     */
    function toLength(value) {
      return value ? baseClamp(toInteger(value), 0, MAX_ARRAY_LENGTH) : 0;
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    /**
     * Converts `value` to a plain object flattening inherited enumerable string
     * keyed properties of `value` to own properties of the plain object.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {Object} Returns the converted plain object.
     * @example
     *
     * function Foo() {
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.assign({ 'a': 1 }, new Foo);
     * // => { 'a': 1, 'b': 2 }
     *
     * _.assign({ 'a': 1 }, _.toPlainObject(new Foo));
     * // => { 'a': 1, 'b': 2, 'c': 3 }
     */
    function toPlainObject(value) {
      return copyObject(value, keysIn(value));
    }

    /**
     * Converts `value` to a safe integer. A safe integer can be compared and
     * represented correctly.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.toSafeInteger(3.2);
     * // => 3
     *
     * _.toSafeInteger(Number.MIN_VALUE);
     * // => 0
     *
     * _.toSafeInteger(Infinity);
     * // => 9007199254740991
     *
     * _.toSafeInteger('3.2');
     * // => 3
     */
    function toSafeInteger(value) {
      return value
        ? baseClamp(toInteger(value), -MAX_SAFE_INTEGER, MAX_SAFE_INTEGER)
        : (value === 0 ? value : 0);
    }

    /**
     * Converts `value` to a string. An empty string is returned for `null`
     * and `undefined` values. The sign of `-0` is preserved.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     * @example
     *
     * _.toString(null);
     * // => ''
     *
     * _.toString(-0);
     * // => '-0'
     *
     * _.toString([1, 2, 3]);
     * // => '1,2,3'
     */
    function toString(value) {
      return value == null ? '' : baseToString(value);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Assigns own enumerable string keyed properties of source objects to the
     * destination object. Source objects are applied from left to right.
     * Subsequent sources overwrite property assignments of previous sources.
     *
     * **Note:** This method mutates `object` and is loosely based on
     * [`Object.assign`](https://mdn.io/Object/assign).
     *
     * @static
     * @memberOf _
     * @since 0.10.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @see _.assignIn
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * function Bar() {
     *   this.c = 3;
     * }
     *
     * Foo.prototype.b = 2;
     * Bar.prototype.d = 4;
     *
     * _.assign({ 'a': 0 }, new Foo, new Bar);
     * // => { 'a': 1, 'c': 3 }
     */
    var assign = createAssigner(function(object, source) {
      if (isPrototype(source) || isArrayLike(source)) {
        copyObject(source, keys(source), object);
        return;
      }
      for (var key in source) {
        if (hasOwnProperty.call(source, key)) {
          assignValue(object, key, source[key]);
        }
      }
    });

    /**
     * This method is like `_.assign` except that it iterates over own and
     * inherited source properties.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @alias extend
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @see _.assign
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     * }
     *
     * function Bar() {
     *   this.c = 3;
     * }
     *
     * Foo.prototype.b = 2;
     * Bar.prototype.d = 4;
     *
     * _.assignIn({ 'a': 0 }, new Foo, new Bar);
     * // => { 'a': 1, 'b': 2, 'c': 3, 'd': 4 }
     */
    var assignIn = createAssigner(function(object, source) {
      copyObject(source, keysIn(source), object);
    });

    /**
     * This method is like `_.assignIn` except that it accepts `customizer`
     * which is invoked to produce the assigned values. If `customizer` returns
     * `undefined`, assignment is handled by the method instead. The `customizer`
     * is invoked with five arguments: (objValue, srcValue, key, object, source).
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @alias extendWith
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} sources The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @returns {Object} Returns `object`.
     * @see _.assignWith
     * @example
     *
     * function customizer(objValue, srcValue) {
     *   return _.isUndefined(objValue) ? srcValue : objValue;
     * }
     *
     * var defaults = _.partialRight(_.assignInWith, customizer);
     *
     * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
     * // => { 'a': 1, 'b': 2 }
     */
    var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
      copyObject(source, keysIn(source), object, customizer);
    });

    /**
     * This method is like `_.assign` except that it accepts `customizer`
     * which is invoked to produce the assigned values. If `customizer` returns
     * `undefined`, assignment is handled by the method instead. The `customizer`
     * is invoked with five arguments: (objValue, srcValue, key, object, source).
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} sources The source objects.
     * @param {Function} [customizer] The function to customize assigned values.
     * @returns {Object} Returns `object`.
     * @see _.assignInWith
     * @example
     *
     * function customizer(objValue, srcValue) {
     *   return _.isUndefined(objValue) ? srcValue : objValue;
     * }
     *
     * var defaults = _.partialRight(_.assignWith, customizer);
     *
     * defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
     * // => { 'a': 1, 'b': 2 }
     */
    var assignWith = createAssigner(function(object, source, srcIndex, customizer) {
      copyObject(source, keys(source), object, customizer);
    });

    /**
     * Creates an array of values corresponding to `paths` of `object`.
     *
     * @static
     * @memberOf _
     * @since 1.0.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {...(string|string[])} [paths] The property paths to pick.
     * @returns {Array} Returns the picked values.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }, 4] };
     *
     * _.at(object, ['a[0].b.c', 'a[1]']);
     * // => [3, 4]
     */
    var at = flatRest(baseAt);

    /**
     * Creates an object that inherits from the `prototype` object. If a
     * `properties` object is given, its own enumerable string keyed properties
     * are assigned to the created object.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Object
     * @param {Object} prototype The object to inherit from.
     * @param {Object} [properties] The properties to assign to the object.
     * @returns {Object} Returns the new object.
     * @example
     *
     * function Shape() {
     *   this.x = 0;
     *   this.y = 0;
     * }
     *
     * function Circle() {
     *   Shape.call(this);
     * }
     *
     * Circle.prototype = _.create(Shape.prototype, {
     *   'constructor': Circle
     * });
     *
     * var circle = new Circle;
     * circle instanceof Circle;
     * // => true
     *
     * circle instanceof Shape;
     * // => true
     */
    function create(prototype, properties) {
      var result = baseCreate(prototype);
      return properties == null ? result : baseAssign(result, properties);
    }

    /**
     * Assigns own and inherited enumerable string keyed properties of source
     * objects to the destination object for all destination properties that
     * resolve to `undefined`. Source objects are applied from left to right.
     * Once a property is set, additional values of the same property are ignored.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @see _.defaultsDeep
     * @example
     *
     * _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
     * // => { 'a': 1, 'b': 2 }
     */
    var defaults = baseRest(function(object, sources) {
      object = Object(object);

      var index = -1;
      var length = sources.length;
      var guard = length > 2 ? sources[2] : undefined;

      if (guard && isIterateeCall(sources[0], sources[1], guard)) {
        length = 1;
      }

      while (++index < length) {
        var source = sources[index];
        var props = keysIn(source);
        var propsIndex = -1;
        var propsLength = props.length;

        while (++propsIndex < propsLength) {
          var key = props[propsIndex];
          var value = object[key];

          if (value === undefined ||
              (eq(value, objectProto[key]) && !hasOwnProperty.call(object, key))) {
            object[key] = source[key];
          }
        }
      }

      return object;
    });

    /**
     * This method is like `_.defaults` except that it recursively assigns
     * default properties.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 3.10.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @see _.defaults
     * @example
     *
     * _.defaultsDeep({ 'a': { 'b': 2 } }, { 'a': { 'b': 1, 'c': 3 } });
     * // => { 'a': { 'b': 2, 'c': 3 } }
     */
    var defaultsDeep = baseRest(function(args) {
      args.push(undefined, customDefaultsMerge);
      return apply(mergeWith, undefined, args);
    });

    /**
     * This method is like `_.find` except that it returns the key of the first
     * element `predicate` returns truthy for instead of the element itself.
     *
     * @static
     * @memberOf _
     * @since 1.1.0
     * @category Object
     * @param {Object} object The object to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {string|undefined} Returns the key of the matched element,
     *  else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findKey(users, function(o) { return o.age < 40; });
     * // => 'barney' (iteration order is not guaranteed)
     *
     * // The `_.matches` iteratee shorthand.
     * _.findKey(users, { 'age': 1, 'active': true });
     * // => 'pebbles'
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.findKey(users, ['active', false]);
     * // => 'fred'
     *
     * // The `_.property` iteratee shorthand.
     * _.findKey(users, 'active');
     * // => 'barney'
     */
    function findKey(object, predicate) {
      return baseFindKey(object, getIteratee(predicate, 3), baseForOwn);
    }

    /**
     * This method is like `_.findKey` except that it iterates over elements of
     * a collection in the opposite order.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Object
     * @param {Object} object The object to inspect.
     * @param {Function} [predicate=_.identity] The function invoked per iteration.
     * @returns {string|undefined} Returns the key of the matched element,
     *  else `undefined`.
     * @example
     *
     * var users = {
     *   'barney':  { 'age': 36, 'active': true },
     *   'fred':    { 'age': 40, 'active': false },
     *   'pebbles': { 'age': 1,  'active': true }
     * };
     *
     * _.findLastKey(users, function(o) { return o.age < 40; });
     * // => returns 'pebbles' assuming `_.findKey` returns 'barney'
     *
     * // The `_.matches` iteratee shorthand.
     * _.findLastKey(users, { 'age': 36, 'active': true });
     * // => 'barney'
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.findLastKey(users, ['active', false]);
     * // => 'fred'
     *
     * // The `_.property` iteratee shorthand.
     * _.findLastKey(users, 'active');
     * // => 'pebbles'
     */
    function findLastKey(object, predicate) {
      return baseFindKey(object, getIteratee(predicate, 3), baseForOwnRight);
    }

    /**
     * Iterates over own and inherited enumerable string keyed properties of an
     * object and invokes `iteratee` for each property. The iteratee is invoked
     * with three arguments: (value, key, object). Iteratee functions may exit
     * iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @since 0.3.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns `object`.
     * @see _.forInRight
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forIn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a', 'b', then 'c' (iteration order is not guaranteed).
     */
    function forIn(object, iteratee) {
      return object == null
        ? object
        : baseFor(object, getIteratee(iteratee, 3), keysIn);
    }

    /**
     * This method is like `_.forIn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns `object`.
     * @see _.forIn
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forInRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'c', 'b', then 'a' assuming `_.forIn` logs 'a', 'b', then 'c'.
     */
    function forInRight(object, iteratee) {
      return object == null
        ? object
        : baseForRight(object, getIteratee(iteratee, 3), keysIn);
    }

    /**
     * Iterates over own enumerable string keyed properties of an object and
     * invokes `iteratee` for each property. The iteratee is invoked with three
     * arguments: (value, key, object). Iteratee functions may exit iteration
     * early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @since 0.3.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns `object`.
     * @see _.forOwnRight
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwn(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'a' then 'b' (iteration order is not guaranteed).
     */
    function forOwn(object, iteratee) {
      return object && baseForOwn(object, getIteratee(iteratee, 3));
    }

    /**
     * This method is like `_.forOwn` except that it iterates over properties of
     * `object` in the opposite order.
     *
     * @static
     * @memberOf _
     * @since 2.0.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns `object`.
     * @see _.forOwn
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.forOwnRight(new Foo, function(value, key) {
     *   console.log(key);
     * });
     * // => Logs 'b' then 'a' assuming `_.forOwn` logs 'a' then 'b'.
     */
    function forOwnRight(object, iteratee) {
      return object && baseForOwnRight(object, getIteratee(iteratee, 3));
    }

    /**
     * Creates an array of function property names from own enumerable properties
     * of `object`.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns the function names.
     * @see _.functionsIn
     * @example
     *
     * function Foo() {
     *   this.a = _.constant('a');
     *   this.b = _.constant('b');
     * }
     *
     * Foo.prototype.c = _.constant('c');
     *
     * _.functions(new Foo);
     * // => ['a', 'b']
     */
    function functions(object) {
      return object == null ? [] : baseFunctions(object, keys(object));
    }

    /**
     * Creates an array of function property names from own and inherited
     * enumerable properties of `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to inspect.
     * @returns {Array} Returns the function names.
     * @see _.functions
     * @example
     *
     * function Foo() {
     *   this.a = _.constant('a');
     *   this.b = _.constant('b');
     * }
     *
     * Foo.prototype.c = _.constant('c');
     *
     * _.functionsIn(new Foo);
     * // => ['a', 'b', 'c']
     */
    function functionsIn(object) {
      return object == null ? [] : baseFunctions(object, keysIn(object));
    }

    /**
     * Gets the value at `path` of `object`. If the resolved value is
     * `undefined`, the `defaultValue` is returned in its place.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to get.
     * @param {*} [defaultValue] The value returned for `undefined` resolved values.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.get(object, 'a[0].b.c');
     * // => 3
     *
     * _.get(object, ['a', '0', 'b', 'c']);
     * // => 3
     *
     * _.get(object, 'a.b.c', 'default');
     * // => 'default'
     */
    function get(object, path, defaultValue) {
      var result = object == null ? undefined : baseGet(object, path);
      return result === undefined ? defaultValue : result;
    }

    /**
     * Checks if `path` is a direct property of `object`.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     * @example
     *
     * var object = { 'a': { 'b': 2 } };
     * var other = _.create({ 'a': _.create({ 'b': 2 }) });
     *
     * _.has(object, 'a');
     * // => true
     *
     * _.has(object, 'a.b');
     * // => true
     *
     * _.has(object, ['a', 'b']);
     * // => true
     *
     * _.has(other, 'a');
     * // => false
     */
    function has(object, path) {
      return object != null && hasPath(object, path, baseHas);
    }

    /**
     * Checks if `path` is a direct or inherited property of `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path to check.
     * @returns {boolean} Returns `true` if `path` exists, else `false`.
     * @example
     *
     * var object = _.create({ 'a': _.create({ 'b': 2 }) });
     *
     * _.hasIn(object, 'a');
     * // => true
     *
     * _.hasIn(object, 'a.b');
     * // => true
     *
     * _.hasIn(object, ['a', 'b']);
     * // => true
     *
     * _.hasIn(object, 'b');
     * // => false
     */
    function hasIn(object, path) {
      return object != null && hasPath(object, path, baseHasIn);
    }

    /**
     * Creates an object composed of the inverted keys and values of `object`.
     * If `object` contains duplicate values, subsequent values overwrite
     * property assignments of previous values.
     *
     * @static
     * @memberOf _
     * @since 0.7.0
     * @category Object
     * @param {Object} object The object to invert.
     * @returns {Object} Returns the new inverted object.
     * @example
     *
     * var object = { 'a': 1, 'b': 2, 'c': 1 };
     *
     * _.invert(object);
     * // => { '1': 'c', '2': 'b' }
     */
    var invert = createInverter(function(result, value, key) {
      if (value != null &&
          typeof value.toString != 'function') {
        value = nativeObjectToString.call(value);
      }

      result[value] = key;
    }, constant(identity));

    /**
     * This method is like `_.invert` except that the inverted object is generated
     * from the results of running each element of `object` thru `iteratee`. The
     * corresponding inverted value of each inverted key is an array of keys
     * responsible for generating the inverted value. The iteratee is invoked
     * with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.1.0
     * @category Object
     * @param {Object} object The object to invert.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {Object} Returns the new inverted object.
     * @example
     *
     * var object = { 'a': 1, 'b': 2, 'c': 1 };
     *
     * _.invertBy(object);
     * // => { '1': ['a', 'c'], '2': ['b'] }
     *
     * _.invertBy(object, function(value) {
     *   return 'group' + value;
     * });
     * // => { 'group1': ['a', 'c'], 'group2': ['b'] }
     */
    var invertBy = createInverter(function(result, value, key) {
      if (value != null &&
          typeof value.toString != 'function') {
        value = nativeObjectToString.call(value);
      }

      if (hasOwnProperty.call(result, value)) {
        result[value].push(key);
      } else {
        result[value] = [key];
      }
    }, getIteratee);

    /**
     * Invokes the method at `path` of `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the method to invoke.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {*} Returns the result of the invoked method.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': [1, 2, 3, 4] } }] };
     *
     * _.invoke(object, 'a[0].b.c.slice', 1, 3);
     * // => [2, 3]
     */
    var invoke = baseRest(baseInvoke);

    /**
     * Creates an array of the own enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects. See the
     * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
     * for more details.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keys(new Foo);
     * // => ['a', 'b'] (iteration order is not guaranteed)
     *
     * _.keys('hi');
     * // => ['0', '1']
     */
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }

    /**
     * Creates an array of the own and inherited enumerable property names of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property names.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.keysIn(new Foo);
     * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
     */
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }

    /**
     * The opposite of `_.mapValues`; this method creates an object with the
     * same values as `object` and keys generated by running each own enumerable
     * string keyed property of `object` thru `iteratee`. The iteratee is invoked
     * with three arguments: (value, key, object).
     *
     * @static
     * @memberOf _
     * @since 3.8.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns the new mapped object.
     * @see _.mapValues
     * @example
     *
     * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
     *   return key + value;
     * });
     * // => { 'a1': 1, 'b2': 2 }
     */
    function mapKeys(object, iteratee) {
      var result = {};
      iteratee = getIteratee(iteratee, 3);

      baseForOwn(object, function(value, key, object) {
        baseAssignValue(result, iteratee(value, key, object), value);
      });
      return result;
    }

    /**
     * Creates an object with the same keys as `object` and values generated
     * by running each own enumerable string keyed property of `object` thru
     * `iteratee`. The iteratee is invoked with three arguments:
     * (value, key, object).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Object} Returns the new mapped object.
     * @see _.mapKeys
     * @example
     *
     * var users = {
     *   'fred':    { 'user': 'fred',    'age': 40 },
     *   'pebbles': { 'user': 'pebbles', 'age': 1 }
     * };
     *
     * _.mapValues(users, function(o) { return o.age; });
     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
     *
     * // The `_.property` iteratee shorthand.
     * _.mapValues(users, 'age');
     * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
     */
    function mapValues(object, iteratee) {
      var result = {};
      iteratee = getIteratee(iteratee, 3);

      baseForOwn(object, function(value, key, object) {
        baseAssignValue(result, key, iteratee(value, key, object));
      });
      return result;
    }

    /**
     * This method is like `_.assign` except that it recursively merges own and
     * inherited enumerable string keyed properties of source objects into the
     * destination object. Source properties that resolve to `undefined` are
     * skipped if a destination value exists. Array and plain object properties
     * are merged recursively. Other objects and value types are overridden by
     * assignment. Source objects are applied from left to right. Subsequent
     * sources overwrite property assignments of previous sources.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 0.5.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} [sources] The source objects.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = {
     *   'a': [{ 'b': 2 }, { 'd': 4 }]
     * };
     *
     * var other = {
     *   'a': [{ 'c': 3 }, { 'e': 5 }]
     * };
     *
     * _.merge(object, other);
     * // => { 'a': [{ 'b': 2, 'c': 3 }, { 'd': 4, 'e': 5 }] }
     */
    var merge = createAssigner(function(object, source, srcIndex) {
      baseMerge(object, source, srcIndex);
    });

    /**
     * This method is like `_.merge` except that it accepts `customizer` which
     * is invoked to produce the merged values of the destination and source
     * properties. If `customizer` returns `undefined`, merging is handled by the
     * method instead. The `customizer` is invoked with six arguments:
     * (objValue, srcValue, key, object, source, stack).
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The destination object.
     * @param {...Object} sources The source objects.
     * @param {Function} customizer The function to customize assigned values.
     * @returns {Object} Returns `object`.
     * @example
     *
     * function customizer(objValue, srcValue) {
     *   if (_.isArray(objValue)) {
     *     return objValue.concat(srcValue);
     *   }
     * }
     *
     * var object = { 'a': [1], 'b': [2] };
     * var other = { 'a': [3], 'b': [4] };
     *
     * _.mergeWith(object, other, customizer);
     * // => { 'a': [1, 3], 'b': [2, 4] }
     */
    var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
      baseMerge(object, source, srcIndex, customizer);
    });

    /**
     * The opposite of `_.pick`; this method creates an object composed of the
     * own and inherited enumerable property paths of `object` that are not omitted.
     *
     * **Note:** This method is considerably slower than `_.pick`.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {...(string|string[])} [paths] The property paths to omit.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'a': 1, 'b': '2', 'c': 3 };
     *
     * _.omit(object, ['a', 'c']);
     * // => { 'b': '2' }
     */
    var omit = flatRest(function(object, paths) {
      var result = {};
      if (object == null) {
        return result;
      }
      var isDeep = false;
      paths = arrayMap(paths, function(path) {
        path = castPath(path, object);
        isDeep || (isDeep = path.length > 1);
        return path;
      });
      copyObject(object, getAllKeysIn(object), result);
      if (isDeep) {
        result = baseClone(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
      }
      var length = paths.length;
      while (length--) {
        baseUnset(result, paths[length]);
      }
      return result;
    });

    /**
     * The opposite of `_.pickBy`; this method creates an object composed of
     * the own and inherited enumerable string keyed properties of `object` that
     * `predicate` doesn't return truthy for. The predicate is invoked with two
     * arguments: (value, key).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The source object.
     * @param {Function} [predicate=_.identity] The function invoked per property.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'a': 1, 'b': '2', 'c': 3 };
     *
     * _.omitBy(object, _.isNumber);
     * // => { 'b': '2' }
     */
    function omitBy(object, predicate) {
      return pickBy(object, negate(getIteratee(predicate)));
    }

    /**
     * Creates an object composed of the picked `object` properties.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The source object.
     * @param {...(string|string[])} [paths] The property paths to pick.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'a': 1, 'b': '2', 'c': 3 };
     *
     * _.pick(object, ['a', 'c']);
     * // => { 'a': 1, 'c': 3 }
     */
    var pick = flatRest(function(object, paths) {
      return object == null ? {} : basePick(object, paths);
    });

    /**
     * Creates an object composed of the `object` properties `predicate` returns
     * truthy for. The predicate is invoked with two arguments: (value, key).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The source object.
     * @param {Function} [predicate=_.identity] The function invoked per property.
     * @returns {Object} Returns the new object.
     * @example
     *
     * var object = { 'a': 1, 'b': '2', 'c': 3 };
     *
     * _.pickBy(object, _.isNumber);
     * // => { 'a': 1, 'c': 3 }
     */
    function pickBy(object, predicate) {
      if (object == null) {
        return {};
      }
      var props = arrayMap(getAllKeysIn(object), function(prop) {
        return [prop];
      });
      predicate = getIteratee(predicate);
      return basePickBy(object, props, function(value, path) {
        return predicate(value, path[0]);
      });
    }

    /**
     * This method is like `_.get` except that if the resolved value is a
     * function it's invoked with the `this` binding of its parent object and
     * its result is returned.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @param {Array|string} path The path of the property to resolve.
     * @param {*} [defaultValue] The value returned for `undefined` resolved values.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
     *
     * _.result(object, 'a[0].b.c1');
     * // => 3
     *
     * _.result(object, 'a[0].b.c2');
     * // => 4
     *
     * _.result(object, 'a[0].b.c3', 'default');
     * // => 'default'
     *
     * _.result(object, 'a[0].b.c3', _.constant('default'));
     * // => 'default'
     */
    function result(object, path, defaultValue) {
      path = castPath(path, object);

      var index = -1,
          length = path.length;

      // Ensure the loop is entered when path is empty.
      if (!length) {
        length = 1;
        object = undefined;
      }
      while (++index < length) {
        var value = object == null ? undefined : object[toKey(path[index])];
        if (value === undefined) {
          index = length;
          value = defaultValue;
        }
        object = isFunction(value) ? value.call(object) : value;
      }
      return object;
    }

    /**
     * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
     * it's created. Arrays are created for missing index properties while objects
     * are created for all other missing properties. Use `_.setWith` to customize
     * `path` creation.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.set(object, 'a[0].b.c', 4);
     * console.log(object.a[0].b.c);
     * // => 4
     *
     * _.set(object, ['x', '0', 'y', 'z'], 5);
     * console.log(object.x[0].y.z);
     * // => 5
     */
    function set(object, path, value) {
      return object == null ? object : baseSet(object, path, value);
    }

    /**
     * This method is like `_.set` except that it accepts `customizer` which is
     * invoked to produce the objects of `path`.  If `customizer` returns `undefined`
     * path creation is handled by the method instead. The `customizer` is invoked
     * with three arguments: (nsValue, key, nsObject).
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {*} value The value to set.
     * @param {Function} [customizer] The function to customize assigned values.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = {};
     *
     * _.setWith(object, '[0][1]', 'a', Object);
     * // => { '0': { '1': 'a' } }
     */
    function setWith(object, path, value, customizer) {
      customizer = typeof customizer == 'function' ? customizer : undefined;
      return object == null ? object : baseSet(object, path, value, customizer);
    }

    /**
     * Creates an array of own enumerable string keyed-value pairs for `object`
     * which can be consumed by `_.fromPairs`. If `object` is a map or set, its
     * entries are returned.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @alias entries
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the key-value pairs.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.toPairs(new Foo);
     * // => [['a', 1], ['b', 2]] (iteration order is not guaranteed)
     */
    var toPairs = createToPairs(keys);

    /**
     * Creates an array of own and inherited enumerable string keyed-value pairs
     * for `object` which can be consumed by `_.fromPairs`. If `object` is a map
     * or set, its entries are returned.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @alias entriesIn
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the key-value pairs.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.toPairsIn(new Foo);
     * // => [['a', 1], ['b', 2], ['c', 3]] (iteration order is not guaranteed)
     */
    var toPairsIn = createToPairs(keysIn);

    /**
     * An alternative to `_.reduce`; this method transforms `object` to a new
     * `accumulator` object which is the result of running each of its own
     * enumerable string keyed properties thru `iteratee`, with each invocation
     * potentially mutating the `accumulator` object. If `accumulator` is not
     * provided, a new object with the same `[[Prototype]]` will be used. The
     * iteratee is invoked with four arguments: (accumulator, value, key, object).
     * Iteratee functions may exit iteration early by explicitly returning `false`.
     *
     * @static
     * @memberOf _
     * @since 1.3.0
     * @category Object
     * @param {Object} object The object to iterate over.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @param {*} [accumulator] The custom accumulator value.
     * @returns {*} Returns the accumulated value.
     * @example
     *
     * _.transform([2, 3, 4], function(result, n) {
     *   result.push(n *= n);
     *   return n % 2 == 0;
     * }, []);
     * // => [4, 9]
     *
     * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
     *   (result[value] || (result[value] = [])).push(key);
     * }, {});
     * // => { '1': ['a', 'c'], '2': ['b'] }
     */
    function transform(object, iteratee, accumulator) {
      var isArr = isArray(object),
          isArrLike = isArr || isBuffer(object) || isTypedArray(object);

      iteratee = getIteratee(iteratee, 4);
      if (accumulator == null) {
        var Ctor = object && object.constructor;
        if (isArrLike) {
          accumulator = isArr ? new Ctor : [];
        }
        else if (isObject(object)) {
          accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
        }
        else {
          accumulator = {};
        }
      }
      (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object) {
        return iteratee(accumulator, value, index, object);
      });
      return accumulator;
    }

    /**
     * Removes the property at `path` of `object`.
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to unset.
     * @returns {boolean} Returns `true` if the property is deleted, else `false`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 7 } }] };
     * _.unset(object, 'a[0].b.c');
     * // => true
     *
     * console.log(object);
     * // => { 'a': [{ 'b': {} }] };
     *
     * _.unset(object, ['a', '0', 'b', 'c']);
     * // => true
     *
     * console.log(object);
     * // => { 'a': [{ 'b': {} }] };
     */
    function unset(object, path) {
      return object == null ? true : baseUnset(object, path);
    }

    /**
     * This method is like `_.set` except that accepts `updater` to produce the
     * value to set. Use `_.updateWith` to customize `path` creation. The `updater`
     * is invoked with one argument: (value).
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.6.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {Function} updater The function to produce the updated value.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
     *
     * _.update(object, 'a[0].b.c', function(n) { return n * n; });
     * console.log(object.a[0].b.c);
     * // => 9
     *
     * _.update(object, 'x[0].y.z', function(n) { return n ? n + 1 : 0; });
     * console.log(object.x[0].y.z);
     * // => 0
     */
    function update(object, path, updater) {
      return object == null ? object : baseUpdate(object, path, castFunction(updater));
    }

    /**
     * This method is like `_.update` except that it accepts `customizer` which is
     * invoked to produce the objects of `path`.  If `customizer` returns `undefined`
     * path creation is handled by the method instead. The `customizer` is invoked
     * with three arguments: (nsValue, key, nsObject).
     *
     * **Note:** This method mutates `object`.
     *
     * @static
     * @memberOf _
     * @since 4.6.0
     * @category Object
     * @param {Object} object The object to modify.
     * @param {Array|string} path The path of the property to set.
     * @param {Function} updater The function to produce the updated value.
     * @param {Function} [customizer] The function to customize assigned values.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var object = {};
     *
     * _.updateWith(object, '[0][1]', _.constant('a'), Object);
     * // => { '0': { '1': 'a' } }
     */
    function updateWith(object, path, updater, customizer) {
      customizer = typeof customizer == 'function' ? customizer : undefined;
      return object == null ? object : baseUpdate(object, path, castFunction(updater), customizer);
    }

    /**
     * Creates an array of the own enumerable string keyed property values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.values(new Foo);
     * // => [1, 2] (iteration order is not guaranteed)
     *
     * _.values('hi');
     * // => ['h', 'i']
     */
    function values(object) {
      return object == null ? [] : baseValues(object, keys(object));
    }

    /**
     * Creates an array of the own and inherited enumerable string keyed property
     * values of `object`.
     *
     * **Note:** Non-object values are coerced to objects.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Object
     * @param {Object} object The object to query.
     * @returns {Array} Returns the array of property values.
     * @example
     *
     * function Foo() {
     *   this.a = 1;
     *   this.b = 2;
     * }
     *
     * Foo.prototype.c = 3;
     *
     * _.valuesIn(new Foo);
     * // => [1, 2, 3] (iteration order is not guaranteed)
     */
    function valuesIn(object) {
      return object == null ? [] : baseValues(object, keysIn(object));
    }

    /*------------------------------------------------------------------------*/

    /**
     * Clamps `number` within the inclusive `lower` and `upper` bounds.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Number
     * @param {number} number The number to clamp.
     * @param {number} [lower] The lower bound.
     * @param {number} upper The upper bound.
     * @returns {number} Returns the clamped number.
     * @example
     *
     * _.clamp(-10, -5, 5);
     * // => -5
     *
     * _.clamp(10, -5, 5);
     * // => 5
     */
    function clamp(number, lower, upper) {
      if (upper === undefined) {
        upper = lower;
        lower = undefined;
      }
      if (upper !== undefined) {
        upper = toNumber(upper);
        upper = upper === upper ? upper : 0;
      }
      if (lower !== undefined) {
        lower = toNumber(lower);
        lower = lower === lower ? lower : 0;
      }
      return baseClamp(toNumber(number), lower, upper);
    }

    /**
     * Checks if `n` is between `start` and up to, but not including, `end`. If
     * `end` is not specified, it's set to `start` with `start` then set to `0`.
     * If `start` is greater than `end` the params are swapped to support
     * negative ranges.
     *
     * @static
     * @memberOf _
     * @since 3.3.0
     * @category Number
     * @param {number} number The number to check.
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @returns {boolean} Returns `true` if `number` is in the range, else `false`.
     * @see _.range, _.rangeRight
     * @example
     *
     * _.inRange(3, 2, 4);
     * // => true
     *
     * _.inRange(4, 8);
     * // => true
     *
     * _.inRange(4, 2);
     * // => false
     *
     * _.inRange(2, 2);
     * // => false
     *
     * _.inRange(1.2, 2);
     * // => true
     *
     * _.inRange(5.2, 4);
     * // => false
     *
     * _.inRange(-3, -2, -6);
     * // => true
     */
    function inRange(number, start, end) {
      start = toFinite(start);
      if (end === undefined) {
        end = start;
        start = 0;
      } else {
        end = toFinite(end);
      }
      number = toNumber(number);
      return baseInRange(number, start, end);
    }

    /**
     * Produces a random number between the inclusive `lower` and `upper` bounds.
     * If only one argument is provided a number between `0` and the given number
     * is returned. If `floating` is `true`, or either `lower` or `upper` are
     * floats, a floating-point number is returned instead of an integer.
     *
     * **Note:** JavaScript follows the IEEE-754 standard for resolving
     * floating-point values which can produce unexpected results.
     *
     * @static
     * @memberOf _
     * @since 0.7.0
     * @category Number
     * @param {number} [lower=0] The lower bound.
     * @param {number} [upper=1] The upper bound.
     * @param {boolean} [floating] Specify returning a floating-point number.
     * @returns {number} Returns the random number.
     * @example
     *
     * _.random(0, 5);
     * // => an integer between 0 and 5
     *
     * _.random(5);
     * // => also an integer between 0 and 5
     *
     * _.random(5, true);
     * // => a floating-point number between 0 and 5
     *
     * _.random(1.2, 5.2);
     * // => a floating-point number between 1.2 and 5.2
     */
    function random(lower, upper, floating) {
      if (floating && typeof floating != 'boolean' && isIterateeCall(lower, upper, floating)) {
        upper = floating = undefined;
      }
      if (floating === undefined) {
        if (typeof upper == 'boolean') {
          floating = upper;
          upper = undefined;
        }
        else if (typeof lower == 'boolean') {
          floating = lower;
          lower = undefined;
        }
      }
      if (lower === undefined && upper === undefined) {
        lower = 0;
        upper = 1;
      }
      else {
        lower = toFinite(lower);
        if (upper === undefined) {
          upper = lower;
          lower = 0;
        } else {
          upper = toFinite(upper);
        }
      }
      if (lower > upper) {
        var temp = lower;
        lower = upper;
        upper = temp;
      }
      if (floating || lower % 1 || upper % 1) {
        var rand = nativeRandom();
        return nativeMin(lower + (rand * (upper - lower + freeParseFloat('1e-' + ((rand + '').length - 1)))), upper);
      }
      return baseRandom(lower, upper);
    }

    /*------------------------------------------------------------------------*/

    /**
     * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the camel cased string.
     * @example
     *
     * _.camelCase('Foo Bar');
     * // => 'fooBar'
     *
     * _.camelCase('--foo-bar--');
     * // => 'fooBar'
     *
     * _.camelCase('__FOO_BAR__');
     * // => 'fooBar'
     */
    var camelCase = createCompounder(function(result, word, index) {
      word = word.toLowerCase();
      return result + (index ? capitalize(word) : word);
    });

    /**
     * Converts the first character of `string` to upper case and the remaining
     * to lower case.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to capitalize.
     * @returns {string} Returns the capitalized string.
     * @example
     *
     * _.capitalize('FRED');
     * // => 'Fred'
     */
    function capitalize(string) {
      return upperFirst(toString(string).toLowerCase());
    }

    /**
     * Deburrs `string` by converting
     * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
     * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
     * letters to basic Latin letters and removing
     * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to deburr.
     * @returns {string} Returns the deburred string.
     * @example
     *
     * _.deburr('déjà vu');
     * // => 'deja vu'
     */
    function deburr(string) {
      string = toString(string);
      return string && string.replace(reLatin, deburrLetter).replace(reComboMark, '');
    }

    /**
     * Checks if `string` ends with the given target string.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {string} [target] The string to search for.
     * @param {number} [position=string.length] The position to search up to.
     * @returns {boolean} Returns `true` if `string` ends with `target`,
     *  else `false`.
     * @example
     *
     * _.endsWith('abc', 'c');
     * // => true
     *
     * _.endsWith('abc', 'b');
     * // => false
     *
     * _.endsWith('abc', 'b', 2);
     * // => true
     */
    function endsWith(string, target, position) {
      string = toString(string);
      target = baseToString(target);

      var length = string.length;
      position = position === undefined
        ? length
        : baseClamp(toInteger(position), 0, length);

      var end = position;
      position -= target.length;
      return position >= 0 && string.slice(position, end) == target;
    }

    /**
     * Converts the characters "&", "<", ">", '"', and "'" in `string` to their
     * corresponding HTML entities.
     *
     * **Note:** No other characters are escaped. To escape additional
     * characters use a third-party library like [_he_](https://mths.be/he).
     *
     * Though the ">" character is escaped for symmetry, characters like
     * ">" and "/" don't need escaping in HTML and have no special meaning
     * unless they're part of a tag or unquoted attribute value. See
     * [Mathias Bynens's article](https://mathiasbynens.be/notes/ambiguous-ampersands)
     * (under "semi-related fun fact") for more details.
     *
     * When working with HTML you should always
     * [quote attribute values](http://wonko.com/post/html-escaping) to reduce
     * XSS vectors.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escape('fred, barney, & pebbles');
     * // => 'fred, barney, &amp; pebbles'
     */
    function escape(string) {
      string = toString(string);
      return (string && reHasUnescapedHtml.test(string))
        ? string.replace(reUnescapedHtml, escapeHtmlChar)
        : string;
    }

    /**
     * Escapes the `RegExp` special characters "^", "$", "\", ".", "*", "+",
     * "?", "(", ")", "[", "]", "{", "}", and "|" in `string`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to escape.
     * @returns {string} Returns the escaped string.
     * @example
     *
     * _.escapeRegExp('[lodash](https://lodash.com/)');
     * // => '\[lodash\]\(https://lodash\.com/\)'
     */
    function escapeRegExp(string) {
      string = toString(string);
      return (string && reHasRegExpChar.test(string))
        ? string.replace(reRegExpChar, '\\$&')
        : string;
    }

    /**
     * Converts `string` to
     * [kebab case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the kebab cased string.
     * @example
     *
     * _.kebabCase('Foo Bar');
     * // => 'foo-bar'
     *
     * _.kebabCase('fooBar');
     * // => 'foo-bar'
     *
     * _.kebabCase('__FOO_BAR__');
     * // => 'foo-bar'
     */
    var kebabCase = createCompounder(function(result, word, index) {
      return result + (index ? '-' : '') + word.toLowerCase();
    });

    /**
     * Converts `string`, as space separated words, to lower case.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the lower cased string.
     * @example
     *
     * _.lowerCase('--Foo-Bar--');
     * // => 'foo bar'
     *
     * _.lowerCase('fooBar');
     * // => 'foo bar'
     *
     * _.lowerCase('__FOO_BAR__');
     * // => 'foo bar'
     */
    var lowerCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + word.toLowerCase();
    });

    /**
     * Converts the first character of `string` to lower case.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the converted string.
     * @example
     *
     * _.lowerFirst('Fred');
     * // => 'fred'
     *
     * _.lowerFirst('FRED');
     * // => 'fRED'
     */
    var lowerFirst = createCaseFirst('toLowerCase');

    /**
     * Pads `string` on the left and right sides if it's shorter than `length`.
     * Padding characters are truncated if they can't be evenly divided by `length`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.pad('abc', 8);
     * // => '  abc   '
     *
     * _.pad('abc', 8, '_-');
     * // => '_-abc_-_'
     *
     * _.pad('abc', 3);
     * // => 'abc'
     */
    function pad(string, length, chars) {
      string = toString(string);
      length = toInteger(length);

      var strLength = length ? stringSize(string) : 0;
      if (!length || strLength >= length) {
        return string;
      }
      var mid = (length - strLength) / 2;
      return (
        createPadding(nativeFloor(mid), chars) +
        string +
        createPadding(nativeCeil(mid), chars)
      );
    }

    /**
     * Pads `string` on the right side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padEnd('abc', 6);
     * // => 'abc   '
     *
     * _.padEnd('abc', 6, '_-');
     * // => 'abc_-_'
     *
     * _.padEnd('abc', 3);
     * // => 'abc'
     */
    function padEnd(string, length, chars) {
      string = toString(string);
      length = toInteger(length);

      var strLength = length ? stringSize(string) : 0;
      return (length && strLength < length)
        ? (string + createPadding(length - strLength, chars))
        : string;
    }

    /**
     * Pads `string` on the left side if it's shorter than `length`. Padding
     * characters are truncated if they exceed `length`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to pad.
     * @param {number} [length=0] The padding length.
     * @param {string} [chars=' '] The string used as padding.
     * @returns {string} Returns the padded string.
     * @example
     *
     * _.padStart('abc', 6);
     * // => '   abc'
     *
     * _.padStart('abc', 6, '_-');
     * // => '_-_abc'
     *
     * _.padStart('abc', 3);
     * // => 'abc'
     */
    function padStart(string, length, chars) {
      string = toString(string);
      length = toInteger(length);

      var strLength = length ? stringSize(string) : 0;
      return (length && strLength < length)
        ? (createPadding(length - strLength, chars) + string)
        : string;
    }

    /**
     * Converts `string` to an integer of the specified radix. If `radix` is
     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a
     * hexadecimal, in which case a `radix` of `16` is used.
     *
     * **Note:** This method aligns with the
     * [ES5 implementation](https://es5.github.io/#x15.1.2.2) of `parseInt`.
     *
     * @static
     * @memberOf _
     * @since 1.1.0
     * @category String
     * @param {string} string The string to convert.
     * @param {number} [radix=10] The radix to interpret `value` by.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {number} Returns the converted integer.
     * @example
     *
     * _.parseInt('08');
     * // => 8
     *
     * _.map(['6', '08', '10'], _.parseInt);
     * // => [6, 8, 10]
     */
    function parseInt(string, radix, guard) {
      if (guard || radix == null) {
        radix = 0;
      } else if (radix) {
        radix = +radix;
      }
      return nativeParseInt(toString(string).replace(reTrimStart, ''), radix || 0);
    }

    /**
     * Repeats the given string `n` times.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to repeat.
     * @param {number} [n=1] The number of times to repeat the string.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {string} Returns the repeated string.
     * @example
     *
     * _.repeat('*', 3);
     * // => '***'
     *
     * _.repeat('abc', 2);
     * // => 'abcabc'
     *
     * _.repeat('abc', 0);
     * // => ''
     */
    function repeat(string, n, guard) {
      if ((guard ? isIterateeCall(string, n, guard) : n === undefined)) {
        n = 1;
      } else {
        n = toInteger(n);
      }
      return baseRepeat(toString(string), n);
    }

    /**
     * Replaces matches for `pattern` in `string` with `replacement`.
     *
     * **Note:** This method is based on
     * [`String#replace`](https://mdn.io/String/replace).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to modify.
     * @param {RegExp|string} pattern The pattern to replace.
     * @param {Function|string} replacement The match replacement.
     * @returns {string} Returns the modified string.
     * @example
     *
     * _.replace('Hi Fred', 'Fred', 'Barney');
     * // => 'Hi Barney'
     */
    function replace() {
      var args = arguments,
          string = toString(args[0]);

      return args.length < 3 ? string : string.replace(args[1], args[2]);
    }

    /**
     * Converts `string` to
     * [snake case](https://en.wikipedia.org/wiki/Snake_case).
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the snake cased string.
     * @example
     *
     * _.snakeCase('Foo Bar');
     * // => 'foo_bar'
     *
     * _.snakeCase('fooBar');
     * // => 'foo_bar'
     *
     * _.snakeCase('--FOO-BAR--');
     * // => 'foo_bar'
     */
    var snakeCase = createCompounder(function(result, word, index) {
      return result + (index ? '_' : '') + word.toLowerCase();
    });

    /**
     * Splits `string` by `separator`.
     *
     * **Note:** This method is based on
     * [`String#split`](https://mdn.io/String/split).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to split.
     * @param {RegExp|string} separator The separator pattern to split by.
     * @param {number} [limit] The length to truncate results to.
     * @returns {Array} Returns the string segments.
     * @example
     *
     * _.split('a-b-c', '-', 2);
     * // => ['a', 'b']
     */
    function split(string, separator, limit) {
      if (limit && typeof limit != 'number' && isIterateeCall(string, separator, limit)) {
        separator = limit = undefined;
      }
      limit = limit === undefined ? MAX_ARRAY_LENGTH : limit >>> 0;
      if (!limit) {
        return [];
      }
      string = toString(string);
      if (string && (
            typeof separator == 'string' ||
            (separator != null && !isRegExp(separator))
          )) {
        separator = baseToString(separator);
        if (!separator && hasUnicode(string)) {
          return castSlice(stringToArray(string), 0, limit);
        }
      }
      return string.split(separator, limit);
    }

    /**
     * Converts `string` to
     * [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
     *
     * @static
     * @memberOf _
     * @since 3.1.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the start cased string.
     * @example
     *
     * _.startCase('--foo-bar--');
     * // => 'Foo Bar'
     *
     * _.startCase('fooBar');
     * // => 'Foo Bar'
     *
     * _.startCase('__FOO_BAR__');
     * // => 'FOO BAR'
     */
    var startCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + upperFirst(word);
    });

    /**
     * Checks if `string` starts with the given target string.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {string} [target] The string to search for.
     * @param {number} [position=0] The position to search from.
     * @returns {boolean} Returns `true` if `string` starts with `target`,
     *  else `false`.
     * @example
     *
     * _.startsWith('abc', 'a');
     * // => true
     *
     * _.startsWith('abc', 'b');
     * // => false
     *
     * _.startsWith('abc', 'b', 1);
     * // => true
     */
    function startsWith(string, target, position) {
      string = toString(string);
      position = position == null
        ? 0
        : baseClamp(toInteger(position), 0, string.length);

      target = baseToString(target);
      return string.slice(position, position + target.length) == target;
    }

    /**
     * Creates a compiled template function that can interpolate data properties
     * in "interpolate" delimiters, HTML-escape interpolated data properties in
     * "escape" delimiters, and execute JavaScript in "evaluate" delimiters. Data
     * properties may be accessed as free variables in the template. If a setting
     * object is given, it takes precedence over `_.templateSettings` values.
     *
     * **Note:** In the development build `_.template` utilizes
     * [sourceURLs](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)
     * for easier debugging.
     *
     * For more information on precompiling templates see
     * [lodash's custom builds documentation](https://lodash.com/custom-builds).
     *
     * For more information on Chrome extension sandboxes see
     * [Chrome's extensions documentation](https://developer.chrome.com/extensions/sandboxingEval).
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category String
     * @param {string} [string=''] The template string.
     * @param {Object} [options={}] The options object.
     * @param {RegExp} [options.escape=_.templateSettings.escape]
     *  The HTML "escape" delimiter.
     * @param {RegExp} [options.evaluate=_.templateSettings.evaluate]
     *  The "evaluate" delimiter.
     * @param {Object} [options.imports=_.templateSettings.imports]
     *  An object to import into the template as free variables.
     * @param {RegExp} [options.interpolate=_.templateSettings.interpolate]
     *  The "interpolate" delimiter.
     * @param {string} [options.sourceURL='lodash.templateSources[n]']
     *  The sourceURL of the compiled template.
     * @param {string} [options.variable='obj']
     *  The data object variable name.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Function} Returns the compiled template function.
     * @example
     *
     * // Use the "interpolate" delimiter to create a compiled template.
     * var compiled = _.template('hello <%= user %>!');
     * compiled({ 'user': 'fred' });
     * // => 'hello fred!'
     *
     * // Use the HTML "escape" delimiter to escape data property values.
     * var compiled = _.template('<b><%- value %></b>');
     * compiled({ 'value': '<script>' });
     * // => '<b>&lt;script&gt;</b>'
     *
     * // Use the "evaluate" delimiter to execute JavaScript and generate HTML.
     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // Use the internal `print` function in "evaluate" delimiters.
     * var compiled = _.template('<% print("hello " + user); %>!');
     * compiled({ 'user': 'barney' });
     * // => 'hello barney!'
     *
     * // Use the ES template literal delimiter as an "interpolate" delimiter.
     * // Disable support by replacing the "interpolate" delimiter.
     * var compiled = _.template('hello ${ user }!');
     * compiled({ 'user': 'pebbles' });
     * // => 'hello pebbles!'
     *
     * // Use backslashes to treat delimiters as plain text.
     * var compiled = _.template('<%= "\\<%- value %\\>" %>');
     * compiled({ 'value': 'ignored' });
     * // => '<%- value %>'
     *
     * // Use the `imports` option to import `jQuery` as `jq`.
     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';
     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });
     * compiled({ 'users': ['fred', 'barney'] });
     * // => '<li>fred</li><li>barney</li>'
     *
     * // Use the `sourceURL` option to specify a custom sourceURL for the template.
     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });
     * compiled(data);
     * // => Find the source of "greeting.jst" under the Sources tab or Resources panel of the web inspector.
     *
     * // Use the `variable` option to ensure a with-statement isn't used in the compiled template.
     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });
     * compiled.source;
     * // => function(data) {
     * //   var __t, __p = '';
     * //   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';
     * //   return __p;
     * // }
     *
     * // Use custom template delimiters.
     * _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
     * var compiled = _.template('hello {{ user }}!');
     * compiled({ 'user': 'mustache' });
     * // => 'hello mustache!'
     *
     * // Use the `source` property to inline compiled templates for meaningful
     * // line numbers in error messages and stack traces.
     * fs.writeFileSync(path.join(process.cwd(), 'jst.js'), '\
     *   var JST = {\
     *     "main": ' + _.template(mainText).source + '\
     *   };\
     * ');
     */
    function template(string, options, guard) {
      // Based on John Resig's `tmpl` implementation
      // (http://ejohn.org/blog/javascript-micro-templating/)
      // and Laura Doktorova's doT.js (https://github.com/olado/doT).
      var settings = lodash.templateSettings;

      if (guard && isIterateeCall(string, options, guard)) {
        options = undefined;
      }
      string = toString(string);
      options = assignInWith({}, options, settings, customDefaultsAssignIn);

      var imports = assignInWith({}, options.imports, settings.imports, customDefaultsAssignIn),
          importsKeys = keys(imports),
          importsValues = baseValues(imports, importsKeys);

      var isEscaping,
          isEvaluating,
          index = 0,
          interpolate = options.interpolate || reNoMatch,
          source = "__p += '";

      // Compile the regexp to match each delimiter.
      var reDelimiters = RegExp(
        (options.escape || reNoMatch).source + '|' +
        interpolate.source + '|' +
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +
        (options.evaluate || reNoMatch).source + '|$'
      , 'g');

      // Use a sourceURL for easier debugging.
      var sourceURL = '//# sourceURL=' +
        ('sourceURL' in options
          ? options.sourceURL
          : ('lodash.templateSources[' + (++templateCounter) + ']')
        ) + '\n';

      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {
        interpolateValue || (interpolateValue = esTemplateValue);

        // Escape characters that can't be included in string literals.
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);

        // Replace delimiters with snippets.
        if (escapeValue) {
          isEscaping = true;
          source += "' +\n__e(" + escapeValue + ") +\n'";
        }
        if (evaluateValue) {
          isEvaluating = true;
          source += "';\n" + evaluateValue + ";\n__p += '";
        }
        if (interpolateValue) {
          source += "' +\n((__t = (" + interpolateValue + ")) == null ? '' : __t) +\n'";
        }
        index = offset + match.length;

        // The JS engine embedded in Adobe products needs `match` returned in
        // order to produce the correct `offset` value.
        return match;
      });

      source += "';\n";

      // If `variable` is not specified wrap a with-statement around the generated
      // code to add the data object to the top of the scope chain.
      var variable = options.variable;
      if (!variable) {
        source = 'with (obj) {\n' + source + '\n}\n';
      }
      // Cleanup code by stripping empty strings.
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)
        .replace(reEmptyStringMiddle, '$1')
        .replace(reEmptyStringTrailing, '$1;');

      // Frame code as the function body.
      source = 'function(' + (variable || 'obj') + ') {\n' +
        (variable
          ? ''
          : 'obj || (obj = {});\n'
        ) +
        "var __t, __p = ''" +
        (isEscaping
           ? ', __e = _.escape'
           : ''
        ) +
        (isEvaluating
          ? ', __j = Array.prototype.join;\n' +
            "function print() { __p += __j.call(arguments, '') }\n"
          : ';\n'
        ) +
        source +
        'return __p\n}';

      var result = attempt(function() {
        return Function(importsKeys, sourceURL + 'return ' + source)
          .apply(undefined, importsValues);
      });

      // Provide the compiled function's source by its `toString` method or
      // the `source` property as a convenience for inlining compiled templates.
      result.source = source;
      if (isError(result)) {
        throw result;
      }
      return result;
    }

    /**
     * Converts `string`, as a whole, to lower case just like
     * [String#toLowerCase](https://mdn.io/toLowerCase).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the lower cased string.
     * @example
     *
     * _.toLower('--Foo-Bar--');
     * // => '--foo-bar--'
     *
     * _.toLower('fooBar');
     * // => 'foobar'
     *
     * _.toLower('__FOO_BAR__');
     * // => '__foo_bar__'
     */
    function toLower(value) {
      return toString(value).toLowerCase();
    }

    /**
     * Converts `string`, as a whole, to upper case just like
     * [String#toUpperCase](https://mdn.io/toUpperCase).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the upper cased string.
     * @example
     *
     * _.toUpper('--foo-bar--');
     * // => '--FOO-BAR--'
     *
     * _.toUpper('fooBar');
     * // => 'FOOBAR'
     *
     * _.toUpper('__foo_bar__');
     * // => '__FOO_BAR__'
     */
    function toUpper(value) {
      return toString(value).toUpperCase();
    }

    /**
     * Removes leading and trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trim('  abc  ');
     * // => 'abc'
     *
     * _.trim('-_-abc-_-', '_-');
     * // => 'abc'
     *
     * _.map(['  foo  ', '  bar  '], _.trim);
     * // => ['foo', 'bar']
     */
    function trim(string, chars, guard) {
      string = toString(string);
      if (string && (guard || chars === undefined)) {
        return string.replace(reTrim, '');
      }
      if (!string || !(chars = baseToString(chars))) {
        return string;
      }
      var strSymbols = stringToArray(string),
          chrSymbols = stringToArray(chars),
          start = charsStartIndex(strSymbols, chrSymbols),
          end = charsEndIndex(strSymbols, chrSymbols) + 1;

      return castSlice(strSymbols, start, end).join('');
    }

    /**
     * Removes trailing whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimEnd('  abc  ');
     * // => '  abc'
     *
     * _.trimEnd('-_-abc-_-', '_-');
     * // => '-_-abc'
     */
    function trimEnd(string, chars, guard) {
      string = toString(string);
      if (string && (guard || chars === undefined)) {
        return string.replace(reTrimEnd, '');
      }
      if (!string || !(chars = baseToString(chars))) {
        return string;
      }
      var strSymbols = stringToArray(string),
          end = charsEndIndex(strSymbols, stringToArray(chars)) + 1;

      return castSlice(strSymbols, 0, end).join('');
    }

    /**
     * Removes leading whitespace or specified characters from `string`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to trim.
     * @param {string} [chars=whitespace] The characters to trim.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {string} Returns the trimmed string.
     * @example
     *
     * _.trimStart('  abc  ');
     * // => 'abc  '
     *
     * _.trimStart('-_-abc-_-', '_-');
     * // => 'abc-_-'
     */
    function trimStart(string, chars, guard) {
      string = toString(string);
      if (string && (guard || chars === undefined)) {
        return string.replace(reTrimStart, '');
      }
      if (!string || !(chars = baseToString(chars))) {
        return string;
      }
      var strSymbols = stringToArray(string),
          start = charsStartIndex(strSymbols, stringToArray(chars));

      return castSlice(strSymbols, start).join('');
    }

    /**
     * Truncates `string` if it's longer than the given maximum string length.
     * The last characters of the truncated string are replaced with the omission
     * string which defaults to "...".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to truncate.
     * @param {Object} [options={}] The options object.
     * @param {number} [options.length=30] The maximum string length.
     * @param {string} [options.omission='...'] The string to indicate text is omitted.
     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.
     * @returns {string} Returns the truncated string.
     * @example
     *
     * _.truncate('hi-diddly-ho there, neighborino');
     * // => 'hi-diddly-ho there, neighbo...'
     *
     * _.truncate('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': ' '
     * });
     * // => 'hi-diddly-ho there,...'
     *
     * _.truncate('hi-diddly-ho there, neighborino', {
     *   'length': 24,
     *   'separator': /,? +/
     * });
     * // => 'hi-diddly-ho there...'
     *
     * _.truncate('hi-diddly-ho there, neighborino', {
     *   'omission': ' [...]'
     * });
     * // => 'hi-diddly-ho there, neig [...]'
     */
    function truncate(string, options) {
      var length = DEFAULT_TRUNC_LENGTH,
          omission = DEFAULT_TRUNC_OMISSION;

      if (isObject(options)) {
        var separator = 'separator' in options ? options.separator : separator;
        length = 'length' in options ? toInteger(options.length) : length;
        omission = 'omission' in options ? baseToString(options.omission) : omission;
      }
      string = toString(string);

      var strLength = string.length;
      if (hasUnicode(string)) {
        var strSymbols = stringToArray(string);
        strLength = strSymbols.length;
      }
      if (length >= strLength) {
        return string;
      }
      var end = length - stringSize(omission);
      if (end < 1) {
        return omission;
      }
      var result = strSymbols
        ? castSlice(strSymbols, 0, end).join('')
        : string.slice(0, end);

      if (separator === undefined) {
        return result + omission;
      }
      if (strSymbols) {
        end += (result.length - end);
      }
      if (isRegExp(separator)) {
        if (string.slice(end).search(separator)) {
          var match,
              substring = result;

          if (!separator.global) {
            separator = RegExp(separator.source, toString(reFlags.exec(separator)) + 'g');
          }
          separator.lastIndex = 0;
          while ((match = separator.exec(substring))) {
            var newEnd = match.index;
          }
          result = result.slice(0, newEnd === undefined ? end : newEnd);
        }
      } else if (string.indexOf(baseToString(separator), end) != end) {
        var index = result.lastIndexOf(separator);
        if (index > -1) {
          result = result.slice(0, index);
        }
      }
      return result + omission;
    }

    /**
     * The inverse of `_.escape`; this method converts the HTML entities
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to
     * their corresponding characters.
     *
     * **Note:** No other HTML entities are unescaped. To unescape additional
     * HTML entities use a third-party library like [_he_](https://mths.be/he).
     *
     * @static
     * @memberOf _
     * @since 0.6.0
     * @category String
     * @param {string} [string=''] The string to unescape.
     * @returns {string} Returns the unescaped string.
     * @example
     *
     * _.unescape('fred, barney, &amp; pebbles');
     * // => 'fred, barney, & pebbles'
     */
    function unescape(string) {
      string = toString(string);
      return (string && reHasEscapedHtml.test(string))
        ? string.replace(reEscapedHtml, unescapeHtmlChar)
        : string;
    }

    /**
     * Converts `string`, as space separated words, to upper case.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the upper cased string.
     * @example
     *
     * _.upperCase('--foo-bar');
     * // => 'FOO BAR'
     *
     * _.upperCase('fooBar');
     * // => 'FOO BAR'
     *
     * _.upperCase('__foo_bar__');
     * // => 'FOO BAR'
     */
    var upperCase = createCompounder(function(result, word, index) {
      return result + (index ? ' ' : '') + word.toUpperCase();
    });

    /**
     * Converts the first character of `string` to upper case.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category String
     * @param {string} [string=''] The string to convert.
     * @returns {string} Returns the converted string.
     * @example
     *
     * _.upperFirst('fred');
     * // => 'Fred'
     *
     * _.upperFirst('FRED');
     * // => 'FRED'
     */
    var upperFirst = createCaseFirst('toUpperCase');

    /**
     * Splits `string` into an array of its words.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category String
     * @param {string} [string=''] The string to inspect.
     * @param {RegExp|string} [pattern] The pattern to match words.
     * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
     * @returns {Array} Returns the words of `string`.
     * @example
     *
     * _.words('fred, barney, & pebbles');
     * // => ['fred', 'barney', 'pebbles']
     *
     * _.words('fred, barney, & pebbles', /[^, ]+/g);
     * // => ['fred', 'barney', '&', 'pebbles']
     */
    function words(string, pattern, guard) {
      string = toString(string);
      pattern = guard ? undefined : pattern;

      if (pattern === undefined) {
        return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
      }
      return string.match(pattern) || [];
    }

    /*------------------------------------------------------------------------*/

    /**
     * Attempts to invoke `func`, returning either the result or the caught error
     * object. Any additional arguments are provided to `func` when it's invoked.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Util
     * @param {Function} func The function to attempt.
     * @param {...*} [args] The arguments to invoke `func` with.
     * @returns {*} Returns the `func` result or error object.
     * @example
     *
     * // Avoid throwing errors for invalid selectors.
     * var elements = _.attempt(function(selector) {
     *   return document.querySelectorAll(selector);
     * }, '>_>');
     *
     * if (_.isError(elements)) {
     *   elements = [];
     * }
     */
    var attempt = baseRest(function(func, args) {
      try {
        return apply(func, undefined, args);
      } catch (e) {
        return isError(e) ? e : new Error(e);
      }
    });

    /**
     * Binds methods of an object to the object itself, overwriting the existing
     * method.
     *
     * **Note:** This method doesn't set the "length" property of bound functions.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {Object} object The object to bind and assign the bound methods to.
     * @param {...(string|string[])} methodNames The object method names to bind.
     * @returns {Object} Returns `object`.
     * @example
     *
     * var view = {
     *   'label': 'docs',
     *   'click': function() {
     *     console.log('clicked ' + this.label);
     *   }
     * };
     *
     * _.bindAll(view, ['click']);
     * jQuery(element).on('click', view.click);
     * // => Logs 'clicked docs' when clicked.
     */
    var bindAll = flatRest(function(object, methodNames) {
      arrayEach(methodNames, function(key) {
        key = toKey(key);
        baseAssignValue(object, key, bind(object[key], object));
      });
      return object;
    });

    /**
     * Creates a function that iterates over `pairs` and invokes the corresponding
     * function of the first predicate to return truthy. The predicate-function
     * pairs are invoked with the `this` binding and arguments of the created
     * function.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {Array} pairs The predicate-function pairs.
     * @returns {Function} Returns the new composite function.
     * @example
     *
     * var func = _.cond([
     *   [_.matches({ 'a': 1 }),           _.constant('matches A')],
     *   [_.conforms({ 'b': _.isNumber }), _.constant('matches B')],
     *   [_.stubTrue,                      _.constant('no match')]
     * ]);
     *
     * func({ 'a': 1, 'b': 2 });
     * // => 'matches A'
     *
     * func({ 'a': 0, 'b': 1 });
     * // => 'matches B'
     *
     * func({ 'a': '1', 'b': '2' });
     * // => 'no match'
     */
    function cond(pairs) {
      var length = pairs == null ? 0 : pairs.length,
          toIteratee = getIteratee();

      pairs = !length ? [] : arrayMap(pairs, function(pair) {
        if (typeof pair[1] != 'function') {
          throw new TypeError(FUNC_ERROR_TEXT);
        }
        return [toIteratee(pair[0]), pair[1]];
      });

      return baseRest(function(args) {
        var index = -1;
        while (++index < length) {
          var pair = pairs[index];
          if (apply(pair[0], this, args)) {
            return apply(pair[1], this, args);
          }
        }
      });
    }

    /**
     * Creates a function that invokes the predicate properties of `source` with
     * the corresponding property values of a given object, returning `true` if
     * all predicates return truthy, else `false`.
     *
     * **Note:** The created function is equivalent to `_.conformsTo` with
     * `source` partially applied.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {Object} source The object of property predicates to conform to.
     * @returns {Function} Returns the new spec function.
     * @example
     *
     * var objects = [
     *   { 'a': 2, 'b': 1 },
     *   { 'a': 1, 'b': 2 }
     * ];
     *
     * _.filter(objects, _.conforms({ 'b': function(n) { return n > 1; } }));
     * // => [{ 'a': 1, 'b': 2 }]
     */
    function conforms(source) {
      return baseConforms(baseClone(source, CLONE_DEEP_FLAG));
    }

    /**
     * Creates a function that returns `value`.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {*} value The value to return from the new function.
     * @returns {Function} Returns the new constant function.
     * @example
     *
     * var objects = _.times(2, _.constant({ 'a': 1 }));
     *
     * console.log(objects);
     * // => [{ 'a': 1 }, { 'a': 1 }]
     *
     * console.log(objects[0] === objects[1]);
     * // => true
     */
    function constant(value) {
      return function() {
        return value;
      };
    }

    /**
     * Checks `value` to determine whether a default value should be returned in
     * its place. The `defaultValue` is returned if `value` is `NaN`, `null`,
     * or `undefined`.
     *
     * @static
     * @memberOf _
     * @since 4.14.0
     * @category Util
     * @param {*} value The value to check.
     * @param {*} defaultValue The default value.
     * @returns {*} Returns the resolved value.
     * @example
     *
     * _.defaultTo(1, 10);
     * // => 1
     *
     * _.defaultTo(undefined, 10);
     * // => 10
     */
    function defaultTo(value, defaultValue) {
      return (value == null || value !== value) ? defaultValue : value;
    }

    /**
     * Creates a function that returns the result of invoking the given functions
     * with the `this` binding of the created function, where each successive
     * invocation is supplied the return value of the previous.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Util
     * @param {...(Function|Function[])} [funcs] The functions to invoke.
     * @returns {Function} Returns the new composite function.
     * @see _.flowRight
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flow([_.add, square]);
     * addSquare(1, 2);
     * // => 9
     */
    var flow = createFlow();

    /**
     * This method is like `_.flow` except that it creates a function that
     * invokes the given functions from right to left.
     *
     * @static
     * @since 3.0.0
     * @memberOf _
     * @category Util
     * @param {...(Function|Function[])} [funcs] The functions to invoke.
     * @returns {Function} Returns the new composite function.
     * @see _.flow
     * @example
     *
     * function square(n) {
     *   return n * n;
     * }
     *
     * var addSquare = _.flowRight([square, _.add]);
     * addSquare(1, 2);
     * // => 9
     */
    var flowRight = createFlow(true);

    /**
     * This method returns the first argument it receives.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {*} value Any value.
     * @returns {*} Returns `value`.
     * @example
     *
     * var object = { 'a': 1 };
     *
     * console.log(_.identity(object) === object);
     * // => true
     */
    function identity(value) {
      return value;
    }

    /**
     * Creates a function that invokes `func` with the arguments of the created
     * function. If `func` is a property name, the created function returns the
     * property value for a given element. If `func` is an array or object, the
     * created function returns `true` for elements that contain the equivalent
     * source properties, otherwise it returns `false`.
     *
     * @static
     * @since 4.0.0
     * @memberOf _
     * @category Util
     * @param {*} [func=_.identity] The value to convert to a callback.
     * @returns {Function} Returns the callback.
     * @example
     *
     * var users = [
     *   { 'user': 'barney', 'age': 36, 'active': true },
     *   { 'user': 'fred',   'age': 40, 'active': false }
     * ];
     *
     * // The `_.matches` iteratee shorthand.
     * _.filter(users, _.iteratee({ 'user': 'barney', 'active': true }));
     * // => [{ 'user': 'barney', 'age': 36, 'active': true }]
     *
     * // The `_.matchesProperty` iteratee shorthand.
     * _.filter(users, _.iteratee(['user', 'fred']));
     * // => [{ 'user': 'fred', 'age': 40 }]
     *
     * // The `_.property` iteratee shorthand.
     * _.map(users, _.iteratee('user'));
     * // => ['barney', 'fred']
     *
     * // Create custom iteratee shorthands.
     * _.iteratee = _.wrap(_.iteratee, function(iteratee, func) {
     *   return !_.isRegExp(func) ? iteratee(func) : function(string) {
     *     return func.test(string);
     *   };
     * });
     *
     * _.filter(['abc', 'def'], /ef/);
     * // => ['def']
     */
    function iteratee(func) {
      return baseIteratee(typeof func == 'function' ? func : baseClone(func, CLONE_DEEP_FLAG));
    }

    /**
     * Creates a function that performs a partial deep comparison between a given
     * object and `source`, returning `true` if the given object has equivalent
     * property values, else `false`.
     *
     * **Note:** The created function is equivalent to `_.isMatch` with `source`
     * partially applied.
     *
     * Partial comparisons will match empty array and empty object `source`
     * values against any array or object value, respectively. See `_.isEqual`
     * for a list of supported value comparisons.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Util
     * @param {Object} source The object of property values to match.
     * @returns {Function} Returns the new spec function.
     * @example
     *
     * var objects = [
     *   { 'a': 1, 'b': 2, 'c': 3 },
     *   { 'a': 4, 'b': 5, 'c': 6 }
     * ];
     *
     * _.filter(objects, _.matches({ 'a': 4, 'c': 6 }));
     * // => [{ 'a': 4, 'b': 5, 'c': 6 }]
     */
    function matches(source) {
      return baseMatches(baseClone(source, CLONE_DEEP_FLAG));
    }

    /**
     * Creates a function that performs a partial deep comparison between the
     * value at `path` of a given object to `srcValue`, returning `true` if the
     * object value is equivalent, else `false`.
     *
     * **Note:** Partial comparisons will match empty array and empty object
     * `srcValue` values against any array or object value, respectively. See
     * `_.isEqual` for a list of supported value comparisons.
     *
     * @static
     * @memberOf _
     * @since 3.2.0
     * @category Util
     * @param {Array|string} path The path of the property to get.
     * @param {*} srcValue The value to match.
     * @returns {Function} Returns the new spec function.
     * @example
     *
     * var objects = [
     *   { 'a': 1, 'b': 2, 'c': 3 },
     *   { 'a': 4, 'b': 5, 'c': 6 }
     * ];
     *
     * _.find(objects, _.matchesProperty('a', 4));
     * // => { 'a': 4, 'b': 5, 'c': 6 }
     */
    function matchesProperty(path, srcValue) {
      return baseMatchesProperty(path, baseClone(srcValue, CLONE_DEEP_FLAG));
    }

    /**
     * Creates a function that invokes the method at `path` of a given object.
     * Any additional arguments are provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Util
     * @param {Array|string} path The path of the method to invoke.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new invoker function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': _.constant(2) } },
     *   { 'a': { 'b': _.constant(1) } }
     * ];
     *
     * _.map(objects, _.method('a.b'));
     * // => [2, 1]
     *
     * _.map(objects, _.method(['a', 'b']));
     * // => [2, 1]
     */
    var method = baseRest(function(path, args) {
      return function(object) {
        return baseInvoke(object, path, args);
      };
    });

    /**
     * The opposite of `_.method`; this method creates a function that invokes
     * the method at a given path of `object`. Any additional arguments are
     * provided to the invoked method.
     *
     * @static
     * @memberOf _
     * @since 3.7.0
     * @category Util
     * @param {Object} object The object to query.
     * @param {...*} [args] The arguments to invoke the method with.
     * @returns {Function} Returns the new invoker function.
     * @example
     *
     * var array = _.times(3, _.constant),
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.methodOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.methodOf(object));
     * // => [2, 0]
     */
    var methodOf = baseRest(function(object, args) {
      return function(path) {
        return baseInvoke(object, path, args);
      };
    });

    /**
     * Adds all own enumerable string keyed function properties of a source
     * object to the destination object. If `object` is a function, then methods
     * are added to its prototype as well.
     *
     * **Note:** Use `_.runInContext` to create a pristine `lodash` function to
     * avoid conflicts caused by modifying the original.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {Function|Object} [object=lodash] The destination object.
     * @param {Object} source The object of functions to add.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.chain=true] Specify whether mixins are chainable.
     * @returns {Function|Object} Returns `object`.
     * @example
     *
     * function vowels(string) {
     *   return _.filter(string, function(v) {
     *     return /[aeiou]/i.test(v);
     *   });
     * }
     *
     * _.mixin({ 'vowels': vowels });
     * _.vowels('fred');
     * // => ['e']
     *
     * _('fred').vowels().value();
     * // => ['e']
     *
     * _.mixin({ 'vowels': vowels }, { 'chain': false });
     * _('fred').vowels();
     * // => ['e']
     */
    function mixin(object, source, options) {
      var props = keys(source),
          methodNames = baseFunctions(source, props);

      if (options == null &&
          !(isObject(source) && (methodNames.length || !props.length))) {
        options = source;
        source = object;
        object = this;
        methodNames = baseFunctions(source, keys(source));
      }
      var chain = !(isObject(options) && 'chain' in options) || !!options.chain,
          isFunc = isFunction(object);

      arrayEach(methodNames, function(methodName) {
        var func = source[methodName];
        object[methodName] = func;
        if (isFunc) {
          object.prototype[methodName] = function() {
            var chainAll = this.__chain__;
            if (chain || chainAll) {
              var result = object(this.__wrapped__),
                  actions = result.__actions__ = copyArray(this.__actions__);

              actions.push({ 'func': func, 'args': arguments, 'thisArg': object });
              result.__chain__ = chainAll;
              return result;
            }
            return func.apply(object, arrayPush([this.value()], arguments));
          };
        }
      });

      return object;
    }

    /**
     * Reverts the `_` variable to its previous value and returns a reference to
     * the `lodash` function.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @returns {Function} Returns the `lodash` function.
     * @example
     *
     * var lodash = _.noConflict();
     */
    function noConflict() {
      if (root._ === this) {
        root._ = oldDash;
      }
      return this;
    }

    /**
     * This method returns `undefined`.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Util
     * @example
     *
     * _.times(2, _.noop);
     * // => [undefined, undefined]
     */
    function noop() {
      // No operation performed.
    }

    /**
     * Creates a function that gets the argument at index `n`. If `n` is negative,
     * the nth argument from the end is returned.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {number} [n=0] The index of the argument to return.
     * @returns {Function} Returns the new pass-thru function.
     * @example
     *
     * var func = _.nthArg(1);
     * func('a', 'b', 'c', 'd');
     * // => 'b'
     *
     * var func = _.nthArg(-2);
     * func('a', 'b', 'c', 'd');
     * // => 'c'
     */
    function nthArg(n) {
      n = toInteger(n);
      return baseRest(function(args) {
        return baseNth(args, n);
      });
    }

    /**
     * Creates a function that invokes `iteratees` with the arguments it receives
     * and returns their results.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {...(Function|Function[])} [iteratees=[_.identity]]
     *  The iteratees to invoke.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var func = _.over([Math.max, Math.min]);
     *
     * func(1, 2, 3, 4);
     * // => [4, 1]
     */
    var over = createOver(arrayMap);

    /**
     * Creates a function that checks if **all** of the `predicates` return
     * truthy when invoked with the arguments it receives.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {...(Function|Function[])} [predicates=[_.identity]]
     *  The predicates to check.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var func = _.overEvery([Boolean, isFinite]);
     *
     * func('1');
     * // => true
     *
     * func(null);
     * // => false
     *
     * func(NaN);
     * // => false
     */
    var overEvery = createOver(arrayEvery);

    /**
     * Creates a function that checks if **any** of the `predicates` return
     * truthy when invoked with the arguments it receives.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {...(Function|Function[])} [predicates=[_.identity]]
     *  The predicates to check.
     * @returns {Function} Returns the new function.
     * @example
     *
     * var func = _.overSome([Boolean, isFinite]);
     *
     * func('1');
     * // => true
     *
     * func(null);
     * // => true
     *
     * func(NaN);
     * // => false
     */
    var overSome = createOver(arraySome);

    /**
     * Creates a function that returns the value at `path` of a given object.
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Util
     * @param {Array|string} path The path of the property to get.
     * @returns {Function} Returns the new accessor function.
     * @example
     *
     * var objects = [
     *   { 'a': { 'b': 2 } },
     *   { 'a': { 'b': 1 } }
     * ];
     *
     * _.map(objects, _.property('a.b'));
     * // => [2, 1]
     *
     * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
     * // => [1, 2]
     */
    function property(path) {
      return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
    }

    /**
     * The opposite of `_.property`; this method creates a function that returns
     * the value at a given path of `object`.
     *
     * @static
     * @memberOf _
     * @since 3.0.0
     * @category Util
     * @param {Object} object The object to query.
     * @returns {Function} Returns the new accessor function.
     * @example
     *
     * var array = [0, 1, 2],
     *     object = { 'a': array, 'b': array, 'c': array };
     *
     * _.map(['a[2]', 'c[0]'], _.propertyOf(object));
     * // => [2, 0]
     *
     * _.map([['a', '2'], ['c', '0']], _.propertyOf(object));
     * // => [2, 0]
     */
    function propertyOf(object) {
      return function(path) {
        return object == null ? undefined : baseGet(object, path);
      };
    }

    /**
     * Creates an array of numbers (positive and/or negative) progressing from
     * `start` up to, but not including, `end`. A step of `-1` is used if a negative
     * `start` is specified without an `end` or `step`. If `end` is not specified,
     * it's set to `start` with `start` then set to `0`.
     *
     * **Note:** JavaScript follows the IEEE-754 standard for resolving
     * floating-point values which can produce unexpected results.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the range of numbers.
     * @see _.inRange, _.rangeRight
     * @example
     *
     * _.range(4);
     * // => [0, 1, 2, 3]
     *
     * _.range(-4);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 5);
     * // => [1, 2, 3, 4]
     *
     * _.range(0, 20, 5);
     * // => [0, 5, 10, 15]
     *
     * _.range(0, -4, -1);
     * // => [0, -1, -2, -3]
     *
     * _.range(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.range(0);
     * // => []
     */
    var range = createRange();

    /**
     * This method is like `_.range` except that it populates values in
     * descending order.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {number} [start=0] The start of the range.
     * @param {number} end The end of the range.
     * @param {number} [step=1] The value to increment or decrement by.
     * @returns {Array} Returns the range of numbers.
     * @see _.inRange, _.range
     * @example
     *
     * _.rangeRight(4);
     * // => [3, 2, 1, 0]
     *
     * _.rangeRight(-4);
     * // => [-3, -2, -1, 0]
     *
     * _.rangeRight(1, 5);
     * // => [4, 3, 2, 1]
     *
     * _.rangeRight(0, 20, 5);
     * // => [15, 10, 5, 0]
     *
     * _.rangeRight(0, -4, -1);
     * // => [-3, -2, -1, 0]
     *
     * _.rangeRight(1, 4, 0);
     * // => [1, 1, 1]
     *
     * _.rangeRight(0);
     * // => []
     */
    var rangeRight = createRange(true);

    /**
     * This method returns a new empty array.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Array} Returns the new empty array.
     * @example
     *
     * var arrays = _.times(2, _.stubArray);
     *
     * console.log(arrays);
     * // => [[], []]
     *
     * console.log(arrays[0] === arrays[1]);
     * // => false
     */
    function stubArray() {
      return [];
    }

    /**
     * This method returns `false`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `false`.
     * @example
     *
     * _.times(2, _.stubFalse);
     * // => [false, false]
     */
    function stubFalse() {
      return false;
    }

    /**
     * This method returns a new empty object.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {Object} Returns the new empty object.
     * @example
     *
     * var objects = _.times(2, _.stubObject);
     *
     * console.log(objects);
     * // => [{}, {}]
     *
     * console.log(objects[0] === objects[1]);
     * // => false
     */
    function stubObject() {
      return {};
    }

    /**
     * This method returns an empty string.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {string} Returns the empty string.
     * @example
     *
     * _.times(2, _.stubString);
     * // => ['', '']
     */
    function stubString() {
      return '';
    }

    /**
     * This method returns `true`.
     *
     * @static
     * @memberOf _
     * @since 4.13.0
     * @category Util
     * @returns {boolean} Returns `true`.
     * @example
     *
     * _.times(2, _.stubTrue);
     * // => [true, true]
     */
    function stubTrue() {
      return true;
    }

    /**
     * Invokes the iteratee `n` times, returning an array of the results of
     * each invocation. The iteratee is invoked with one argument; (index).
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {number} n The number of times to invoke `iteratee`.
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.
     * @returns {Array} Returns the array of results.
     * @example
     *
     * _.times(3, String);
     * // => ['0', '1', '2']
     *
     *  _.times(4, _.constant(0));
     * // => [0, 0, 0, 0]
     */
    function times(n, iteratee) {
      n = toInteger(n);
      if (n < 1 || n > MAX_SAFE_INTEGER) {
        return [];
      }
      var index = MAX_ARRAY_LENGTH,
          length = nativeMin(n, MAX_ARRAY_LENGTH);

      iteratee = getIteratee(iteratee);
      n -= MAX_ARRAY_LENGTH;

      var result = baseTimes(length, iteratee);
      while (++index < n) {
        iteratee(index);
      }
      return result;
    }

    /**
     * Converts `value` to a property path array.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Util
     * @param {*} value The value to convert.
     * @returns {Array} Returns the new property path array.
     * @example
     *
     * _.toPath('a.b.c');
     * // => ['a', 'b', 'c']
     *
     * _.toPath('a[0].b.c');
     * // => ['a', '0', 'b', 'c']
     */
    function toPath(value) {
      if (isArray(value)) {
        return arrayMap(value, toKey);
      }
      return isSymbol(value) ? [value] : copyArray(stringToPath(toString(value)));
    }

    /**
     * Generates a unique ID. If `prefix` is given, the ID is appended to it.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Util
     * @param {string} [prefix=''] The value to prefix the ID with.
     * @returns {string} Returns the unique ID.
     * @example
     *
     * _.uniqueId('contact_');
     * // => 'contact_104'
     *
     * _.uniqueId();
     * // => '105'
     */
    function uniqueId(prefix) {
      var id = ++idCounter;
      return toString(prefix) + id;
    }

    /*------------------------------------------------------------------------*/

    /**
     * Adds two numbers.
     *
     * @static
     * @memberOf _
     * @since 3.4.0
     * @category Math
     * @param {number} augend The first number in an addition.
     * @param {number} addend The second number in an addition.
     * @returns {number} Returns the total.
     * @example
     *
     * _.add(6, 4);
     * // => 10
     */
    var add = createMathOperation(function(augend, addend) {
      return augend + addend;
    }, 0);

    /**
     * Computes `number` rounded up to `precision`.
     *
     * @static
     * @memberOf _
     * @since 3.10.0
     * @category Math
     * @param {number} number The number to round up.
     * @param {number} [precision=0] The precision to round up to.
     * @returns {number} Returns the rounded up number.
     * @example
     *
     * _.ceil(4.006);
     * // => 5
     *
     * _.ceil(6.004, 2);
     * // => 6.01
     *
     * _.ceil(6040, -2);
     * // => 6100
     */
    var ceil = createRound('ceil');

    /**
     * Divide two numbers.
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Math
     * @param {number} dividend The first number in a division.
     * @param {number} divisor The second number in a division.
     * @returns {number} Returns the quotient.
     * @example
     *
     * _.divide(6, 4);
     * // => 1.5
     */
    var divide = createMathOperation(function(dividend, divisor) {
      return dividend / divisor;
    }, 1);

    /**
     * Computes `number` rounded down to `precision`.
     *
     * @static
     * @memberOf _
     * @since 3.10.0
     * @category Math
     * @param {number} number The number to round down.
     * @param {number} [precision=0] The precision to round down to.
     * @returns {number} Returns the rounded down number.
     * @example
     *
     * _.floor(4.006);
     * // => 4
     *
     * _.floor(0.046, 2);
     * // => 0.04
     *
     * _.floor(4060, -2);
     * // => 4000
     */
    var floor = createRound('floor');

    /**
     * Computes the maximum value of `array`. If `array` is empty or falsey,
     * `undefined` is returned.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Math
     * @param {Array} array The array to iterate over.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * _.max([4, 2, 8, 6]);
     * // => 8
     *
     * _.max([]);
     * // => undefined
     */
    function max(array) {
      return (array && array.length)
        ? baseExtremum(array, identity, baseGt)
        : undefined;
    }

    /**
     * This method is like `_.max` except that it accepts `iteratee` which is
     * invoked for each element in `array` to generate the criterion by which
     * the value is ranked. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Math
     * @param {Array} array The array to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {*} Returns the maximum value.
     * @example
     *
     * var objects = [{ 'n': 1 }, { 'n': 2 }];
     *
     * _.maxBy(objects, function(o) { return o.n; });
     * // => { 'n': 2 }
     *
     * // The `_.property` iteratee shorthand.
     * _.maxBy(objects, 'n');
     * // => { 'n': 2 }
     */
    function maxBy(array, iteratee) {
      return (array && array.length)
        ? baseExtremum(array, getIteratee(iteratee, 2), baseGt)
        : undefined;
    }

    /**
     * Computes the mean of the values in `array`.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Math
     * @param {Array} array The array to iterate over.
     * @returns {number} Returns the mean.
     * @example
     *
     * _.mean([4, 2, 8, 6]);
     * // => 5
     */
    function mean(array) {
      return baseMean(array, identity);
    }

    /**
     * This method is like `_.mean` except that it accepts `iteratee` which is
     * invoked for each element in `array` to generate the value to be averaged.
     * The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Math
     * @param {Array} array The array to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {number} Returns the mean.
     * @example
     *
     * var objects = [{ 'n': 4 }, { 'n': 2 }, { 'n': 8 }, { 'n': 6 }];
     *
     * _.meanBy(objects, function(o) { return o.n; });
     * // => 5
     *
     * // The `_.property` iteratee shorthand.
     * _.meanBy(objects, 'n');
     * // => 5
     */
    function meanBy(array, iteratee) {
      return baseMean(array, getIteratee(iteratee, 2));
    }

    /**
     * Computes the minimum value of `array`. If `array` is empty or falsey,
     * `undefined` is returned.
     *
     * @static
     * @since 0.1.0
     * @memberOf _
     * @category Math
     * @param {Array} array The array to iterate over.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * _.min([4, 2, 8, 6]);
     * // => 2
     *
     * _.min([]);
     * // => undefined
     */
    function min(array) {
      return (array && array.length)
        ? baseExtremum(array, identity, baseLt)
        : undefined;
    }

    /**
     * This method is like `_.min` except that it accepts `iteratee` which is
     * invoked for each element in `array` to generate the criterion by which
     * the value is ranked. The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Math
     * @param {Array} array The array to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {*} Returns the minimum value.
     * @example
     *
     * var objects = [{ 'n': 1 }, { 'n': 2 }];
     *
     * _.minBy(objects, function(o) { return o.n; });
     * // => { 'n': 1 }
     *
     * // The `_.property` iteratee shorthand.
     * _.minBy(objects, 'n');
     * // => { 'n': 1 }
     */
    function minBy(array, iteratee) {
      return (array && array.length)
        ? baseExtremum(array, getIteratee(iteratee, 2), baseLt)
        : undefined;
    }

    /**
     * Multiply two numbers.
     *
     * @static
     * @memberOf _
     * @since 4.7.0
     * @category Math
     * @param {number} multiplier The first number in a multiplication.
     * @param {number} multiplicand The second number in a multiplication.
     * @returns {number} Returns the product.
     * @example
     *
     * _.multiply(6, 4);
     * // => 24
     */
    var multiply = createMathOperation(function(multiplier, multiplicand) {
      return multiplier * multiplicand;
    }, 1);

    /**
     * Computes `number` rounded to `precision`.
     *
     * @static
     * @memberOf _
     * @since 3.10.0
     * @category Math
     * @param {number} number The number to round.
     * @param {number} [precision=0] The precision to round to.
     * @returns {number} Returns the rounded number.
     * @example
     *
     * _.round(4.006);
     * // => 4
     *
     * _.round(4.006, 2);
     * // => 4.01
     *
     * _.round(4060, -2);
     * // => 4100
     */
    var round = createRound('round');

    /**
     * Subtract two numbers.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Math
     * @param {number} minuend The first number in a subtraction.
     * @param {number} subtrahend The second number in a subtraction.
     * @returns {number} Returns the difference.
     * @example
     *
     * _.subtract(6, 4);
     * // => 2
     */
    var subtract = createMathOperation(function(minuend, subtrahend) {
      return minuend - subtrahend;
    }, 0);

    /**
     * Computes the sum of the values in `array`.
     *
     * @static
     * @memberOf _
     * @since 3.4.0
     * @category Math
     * @param {Array} array The array to iterate over.
     * @returns {number} Returns the sum.
     * @example
     *
     * _.sum([4, 2, 8, 6]);
     * // => 20
     */
    function sum(array) {
      return (array && array.length)
        ? baseSum(array, identity)
        : 0;
    }

    /**
     * This method is like `_.sum` except that it accepts `iteratee` which is
     * invoked for each element in `array` to generate the value to be summed.
     * The iteratee is invoked with one argument: (value).
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Math
     * @param {Array} array The array to iterate over.
     * @param {Function} [iteratee=_.identity] The iteratee invoked per element.
     * @returns {number} Returns the sum.
     * @example
     *
     * var objects = [{ 'n': 4 }, { 'n': 2 }, { 'n': 8 }, { 'n': 6 }];
     *
     * _.sumBy(objects, function(o) { return o.n; });
     * // => 20
     *
     * // The `_.property` iteratee shorthand.
     * _.sumBy(objects, 'n');
     * // => 20
     */
    function sumBy(array, iteratee) {
      return (array && array.length)
        ? baseSum(array, getIteratee(iteratee, 2))
        : 0;
    }

    /*------------------------------------------------------------------------*/

    // Add methods that return wrapped values in chain sequences.
    lodash.after = after;
    lodash.ary = ary;
    lodash.assign = assign;
    lodash.assignIn = assignIn;
    lodash.assignInWith = assignInWith;
    lodash.assignWith = assignWith;
    lodash.at = at;
    lodash.before = before;
    lodash.bind = bind;
    lodash.bindAll = bindAll;
    lodash.bindKey = bindKey;
    lodash.castArray = castArray;
    lodash.chain = chain;
    lodash.chunk = chunk;
    lodash.compact = compact;
    lodash.concat = concat;
    lodash.cond = cond;
    lodash.conforms = conforms;
    lodash.constant = constant;
    lodash.countBy = countBy;
    lodash.create = create;
    lodash.curry = curry;
    lodash.curryRight = curryRight;
    lodash.debounce = debounce;
    lodash.defaults = defaults;
    lodash.defaultsDeep = defaultsDeep;
    lodash.defer = defer;
    lodash.delay = delay;
    lodash.difference = difference;
    lodash.differenceBy = differenceBy;
    lodash.differenceWith = differenceWith;
    lodash.drop = drop;
    lodash.dropRight = dropRight;
    lodash.dropRightWhile = dropRightWhile;
    lodash.dropWhile = dropWhile;
    lodash.fill = fill;
    lodash.filter = filter;
    lodash.flatMap = flatMap;
    lodash.flatMapDeep = flatMapDeep;
    lodash.flatMapDepth = flatMapDepth;
    lodash.flatten = flatten;
    lodash.flattenDeep = flattenDeep;
    lodash.flattenDepth = flattenDepth;
    lodash.flip = flip;
    lodash.flow = flow;
    lodash.flowRight = flowRight;
    lodash.fromPairs = fromPairs;
    lodash.functions = functions;
    lodash.functionsIn = functionsIn;
    lodash.groupBy = groupBy;
    lodash.initial = initial;
    lodash.intersection = intersection;
    lodash.intersectionBy = intersectionBy;
    lodash.intersectionWith = intersectionWith;
    lodash.invert = invert;
    lodash.invertBy = invertBy;
    lodash.invokeMap = invokeMap;
    lodash.iteratee = iteratee;
    lodash.keyBy = keyBy;
    lodash.keys = keys;
    lodash.keysIn = keysIn;
    lodash.map = map;
    lodash.mapKeys = mapKeys;
    lodash.mapValues = mapValues;
    lodash.matches = matches;
    lodash.matchesProperty = matchesProperty;
    lodash.memoize = memoize;
    lodash.merge = merge;
    lodash.mergeWith = mergeWith;
    lodash.method = method;
    lodash.methodOf = methodOf;
    lodash.mixin = mixin;
    lodash.negate = negate;
    lodash.nthArg = nthArg;
    lodash.omit = omit;
    lodash.omitBy = omitBy;
    lodash.once = once;
    lodash.orderBy = orderBy;
    lodash.over = over;
    lodash.overArgs = overArgs;
    lodash.overEvery = overEvery;
    lodash.overSome = overSome;
    lodash.partial = partial;
    lodash.partialRight = partialRight;
    lodash.partition = partition;
    lodash.pick = pick;
    lodash.pickBy = pickBy;
    lodash.property = property;
    lodash.propertyOf = propertyOf;
    lodash.pull = pull;
    lodash.pullAll = pullAll;
    lodash.pullAllBy = pullAllBy;
    lodash.pullAllWith = pullAllWith;
    lodash.pullAt = pullAt;
    lodash.range = range;
    lodash.rangeRight = rangeRight;
    lodash.rearg = rearg;
    lodash.reject = reject;
    lodash.remove = remove;
    lodash.rest = rest;
    lodash.reverse = reverse;
    lodash.sampleSize = sampleSize;
    lodash.set = set;
    lodash.setWith = setWith;
    lodash.shuffle = shuffle;
    lodash.slice = slice;
    lodash.sortBy = sortBy;
    lodash.sortedUniq = sortedUniq;
    lodash.sortedUniqBy = sortedUniqBy;
    lodash.split = split;
    lodash.spread = spread;
    lodash.tail = tail;
    lodash.take = take;
    lodash.takeRight = takeRight;
    lodash.takeRightWhile = takeRightWhile;
    lodash.takeWhile = takeWhile;
    lodash.tap = tap;
    lodash.throttle = throttle;
    lodash.thru = thru;
    lodash.toArray = toArray;
    lodash.toPairs = toPairs;
    lodash.toPairsIn = toPairsIn;
    lodash.toPath = toPath;
    lodash.toPlainObject = toPlainObject;
    lodash.transform = transform;
    lodash.unary = unary;
    lodash.union = union;
    lodash.unionBy = unionBy;
    lodash.unionWith = unionWith;
    lodash.uniq = uniq;
    lodash.uniqBy = uniqBy;
    lodash.uniqWith = uniqWith;
    lodash.unset = unset;
    lodash.unzip = unzip;
    lodash.unzipWith = unzipWith;
    lodash.update = update;
    lodash.updateWith = updateWith;
    lodash.values = values;
    lodash.valuesIn = valuesIn;
    lodash.without = without;
    lodash.words = words;
    lodash.wrap = wrap;
    lodash.xor = xor;
    lodash.xorBy = xorBy;
    lodash.xorWith = xorWith;
    lodash.zip = zip;
    lodash.zipObject = zipObject;
    lodash.zipObjectDeep = zipObjectDeep;
    lodash.zipWith = zipWith;

    // Add aliases.
    lodash.entries = toPairs;
    lodash.entriesIn = toPairsIn;
    lodash.extend = assignIn;
    lodash.extendWith = assignInWith;

    // Add methods to `lodash.prototype`.
    mixin(lodash, lodash);

    /*------------------------------------------------------------------------*/

    // Add methods that return unwrapped values in chain sequences.
    lodash.add = add;
    lodash.attempt = attempt;
    lodash.camelCase = camelCase;
    lodash.capitalize = capitalize;
    lodash.ceil = ceil;
    lodash.clamp = clamp;
    lodash.clone = clone;
    lodash.cloneDeep = cloneDeep;
    lodash.cloneDeepWith = cloneDeepWith;
    lodash.cloneWith = cloneWith;
    lodash.conformsTo = conformsTo;
    lodash.deburr = deburr;
    lodash.defaultTo = defaultTo;
    lodash.divide = divide;
    lodash.endsWith = endsWith;
    lodash.eq = eq;
    lodash.escape = escape;
    lodash.escapeRegExp = escapeRegExp;
    lodash.every = every;
    lodash.find = find;
    lodash.findIndex = findIndex;
    lodash.findKey = findKey;
    lodash.findLast = findLast;
    lodash.findLastIndex = findLastIndex;
    lodash.findLastKey = findLastKey;
    lodash.floor = floor;
    lodash.forEach = forEach;
    lodash.forEachRight = forEachRight;
    lodash.forIn = forIn;
    lodash.forInRight = forInRight;
    lodash.forOwn = forOwn;
    lodash.forOwnRight = forOwnRight;
    lodash.get = get;
    lodash.gt = gt;
    lodash.gte = gte;
    lodash.has = has;
    lodash.hasIn = hasIn;
    lodash.head = head;
    lodash.identity = identity;
    lodash.includes = includes;
    lodash.indexOf = indexOf;
    lodash.inRange = inRange;
    lodash.invoke = invoke;
    lodash.isArguments = isArguments;
    lodash.isArray = isArray;
    lodash.isArrayBuffer = isArrayBuffer;
    lodash.isArrayLike = isArrayLike;
    lodash.isArrayLikeObject = isArrayLikeObject;
    lodash.isBoolean = isBoolean;
    lodash.isBuffer = isBuffer;
    lodash.isDate = isDate;
    lodash.isElement = isElement;
    lodash.isEmpty = isEmpty;
    lodash.isEqual = isEqual;
    lodash.isEqualWith = isEqualWith;
    lodash.isError = isError;
    lodash.isFinite = isFinite;
    lodash.isFunction = isFunction;
    lodash.isInteger = isInteger;
    lodash.isLength = isLength;
    lodash.isMap = isMap;
    lodash.isMatch = isMatch;
    lodash.isMatchWith = isMatchWith;
    lodash.isNaN = isNaN;
    lodash.isNative = isNative;
    lodash.isNil = isNil;
    lodash.isNull = isNull;
    lodash.isNumber = isNumber;
    lodash.isObject = isObject;
    lodash.isObjectLike = isObjectLike;
    lodash.isPlainObject = isPlainObject;
    lodash.isRegExp = isRegExp;
    lodash.isSafeInteger = isSafeInteger;
    lodash.isSet = isSet;
    lodash.isString = isString;
    lodash.isSymbol = isSymbol;
    lodash.isTypedArray = isTypedArray;
    lodash.isUndefined = isUndefined;
    lodash.isWeakMap = isWeakMap;
    lodash.isWeakSet = isWeakSet;
    lodash.join = join;
    lodash.kebabCase = kebabCase;
    lodash.last = last;
    lodash.lastIndexOf = lastIndexOf;
    lodash.lowerCase = lowerCase;
    lodash.lowerFirst = lowerFirst;
    lodash.lt = lt;
    lodash.lte = lte;
    lodash.max = max;
    lodash.maxBy = maxBy;
    lodash.mean = mean;
    lodash.meanBy = meanBy;
    lodash.min = min;
    lodash.minBy = minBy;
    lodash.stubArray = stubArray;
    lodash.stubFalse = stubFalse;
    lodash.stubObject = stubObject;
    lodash.stubString = stubString;
    lodash.stubTrue = stubTrue;
    lodash.multiply = multiply;
    lodash.nth = nth;
    lodash.noConflict = noConflict;
    lodash.noop = noop;
    lodash.now = now;
    lodash.pad = pad;
    lodash.padEnd = padEnd;
    lodash.padStart = padStart;
    lodash.parseInt = parseInt;
    lodash.random = random;
    lodash.reduce = reduce;
    lodash.reduceRight = reduceRight;
    lodash.repeat = repeat;
    lodash.replace = replace;
    lodash.result = result;
    lodash.round = round;
    lodash.runInContext = runInContext;
    lodash.sample = sample;
    lodash.size = size;
    lodash.snakeCase = snakeCase;
    lodash.some = some;
    lodash.sortedIndex = sortedIndex;
    lodash.sortedIndexBy = sortedIndexBy;
    lodash.sortedIndexOf = sortedIndexOf;
    lodash.sortedLastIndex = sortedLastIndex;
    lodash.sortedLastIndexBy = sortedLastIndexBy;
    lodash.sortedLastIndexOf = sortedLastIndexOf;
    lodash.startCase = startCase;
    lodash.startsWith = startsWith;
    lodash.subtract = subtract;
    lodash.sum = sum;
    lodash.sumBy = sumBy;
    lodash.template = template;
    lodash.times = times;
    lodash.toFinite = toFinite;
    lodash.toInteger = toInteger;
    lodash.toLength = toLength;
    lodash.toLower = toLower;
    lodash.toNumber = toNumber;
    lodash.toSafeInteger = toSafeInteger;
    lodash.toString = toString;
    lodash.toUpper = toUpper;
    lodash.trim = trim;
    lodash.trimEnd = trimEnd;
    lodash.trimStart = trimStart;
    lodash.truncate = truncate;
    lodash.unescape = unescape;
    lodash.uniqueId = uniqueId;
    lodash.upperCase = upperCase;
    lodash.upperFirst = upperFirst;

    // Add aliases.
    lodash.each = forEach;
    lodash.eachRight = forEachRight;
    lodash.first = head;

    mixin(lodash, (function() {
      var source = {};
      baseForOwn(lodash, function(func, methodName) {
        if (!hasOwnProperty.call(lodash.prototype, methodName)) {
          source[methodName] = func;
        }
      });
      return source;
    }()), { 'chain': false });

    /*------------------------------------------------------------------------*/

    /**
     * The semantic version number.
     *
     * @static
     * @memberOf _
     * @type {string}
     */
    lodash.VERSION = VERSION;

    // Assign default placeholders.
    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {
      lodash[methodName].placeholder = lodash;
    });

    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.
    arrayEach(['drop', 'take'], function(methodName, index) {
      LazyWrapper.prototype[methodName] = function(n) {
        n = n === undefined ? 1 : nativeMax(toInteger(n), 0);

        var result = (this.__filtered__ && !index)
          ? new LazyWrapper(this)
          : this.clone();

        if (result.__filtered__) {
          result.__takeCount__ = nativeMin(n, result.__takeCount__);
        } else {
          result.__views__.push({
            'size': nativeMin(n, MAX_ARRAY_LENGTH),
            'type': methodName + (result.__dir__ < 0 ? 'Right' : '')
          });
        }
        return result;
      };

      LazyWrapper.prototype[methodName + 'Right'] = function(n) {
        return this.reverse()[methodName](n).reverse();
      };
    });

    // Add `LazyWrapper` methods that accept an `iteratee` value.
    arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {
      var type = index + 1,
          isFilter = type == LAZY_FILTER_FLAG || type == LAZY_WHILE_FLAG;

      LazyWrapper.prototype[methodName] = function(iteratee) {
        var result = this.clone();
        result.__iteratees__.push({
          'iteratee': getIteratee(iteratee, 3),
          'type': type
        });
        result.__filtered__ = result.__filtered__ || isFilter;
        return result;
      };
    });

    // Add `LazyWrapper` methods for `_.head` and `_.last`.
    arrayEach(['head', 'last'], function(methodName, index) {
      var takeName = 'take' + (index ? 'Right' : '');

      LazyWrapper.prototype[methodName] = function() {
        return this[takeName](1).value()[0];
      };
    });

    // Add `LazyWrapper` methods for `_.initial` and `_.tail`.
    arrayEach(['initial', 'tail'], function(methodName, index) {
      var dropName = 'drop' + (index ? '' : 'Right');

      LazyWrapper.prototype[methodName] = function() {
        return this.__filtered__ ? new LazyWrapper(this) : this[dropName](1);
      };
    });

    LazyWrapper.prototype.compact = function() {
      return this.filter(identity);
    };

    LazyWrapper.prototype.find = function(predicate) {
      return this.filter(predicate).head();
    };

    LazyWrapper.prototype.findLast = function(predicate) {
      return this.reverse().find(predicate);
    };

    LazyWrapper.prototype.invokeMap = baseRest(function(path, args) {
      if (typeof path == 'function') {
        return new LazyWrapper(this);
      }
      return this.map(function(value) {
        return baseInvoke(value, path, args);
      });
    });

    LazyWrapper.prototype.reject = function(predicate) {
      return this.filter(negate(getIteratee(predicate)));
    };

    LazyWrapper.prototype.slice = function(start, end) {
      start = toInteger(start);

      var result = this;
      if (result.__filtered__ && (start > 0 || end < 0)) {
        return new LazyWrapper(result);
      }
      if (start < 0) {
        result = result.takeRight(-start);
      } else if (start) {
        result = result.drop(start);
      }
      if (end !== undefined) {
        end = toInteger(end);
        result = end < 0 ? result.dropRight(-end) : result.take(end - start);
      }
      return result;
    };

    LazyWrapper.prototype.takeRightWhile = function(predicate) {
      return this.reverse().takeWhile(predicate).reverse();
    };

    LazyWrapper.prototype.toArray = function() {
      return this.take(MAX_ARRAY_LENGTH);
    };

    // Add `LazyWrapper` methods to `lodash.prototype`.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var checkIteratee = /^(?:filter|find|map|reject)|While$/.test(methodName),
          isTaker = /^(?:head|last)$/.test(methodName),
          lodashFunc = lodash[isTaker ? ('take' + (methodName == 'last' ? 'Right' : '')) : methodName],
          retUnwrapped = isTaker || /^find/.test(methodName);

      if (!lodashFunc) {
        return;
      }
      lodash.prototype[methodName] = function() {
        var value = this.__wrapped__,
            args = isTaker ? [1] : arguments,
            isLazy = value instanceof LazyWrapper,
            iteratee = args[0],
            useLazy = isLazy || isArray(value);

        var interceptor = function(value) {
          var result = lodashFunc.apply(lodash, arrayPush([value], args));
          return (isTaker && chainAll) ? result[0] : result;
        };

        if (useLazy && checkIteratee && typeof iteratee == 'function' && iteratee.length != 1) {
          // Avoid lazy use if the iteratee has a "length" value other than `1`.
          isLazy = useLazy = false;
        }
        var chainAll = this.__chain__,
            isHybrid = !!this.__actions__.length,
            isUnwrapped = retUnwrapped && !chainAll,
            onlyLazy = isLazy && !isHybrid;

        if (!retUnwrapped && useLazy) {
          value = onlyLazy ? value : new LazyWrapper(this);
          var result = func.apply(value, args);
          result.__actions__.push({ 'func': thru, 'args': [interceptor], 'thisArg': undefined });
          return new LodashWrapper(result, chainAll);
        }
        if (isUnwrapped && onlyLazy) {
          return func.apply(this, args);
        }
        result = this.thru(interceptor);
        return isUnwrapped ? (isTaker ? result.value()[0] : result.value()) : result;
      };
    });

    // Add `Array` methods to `lodash.prototype`.
    arrayEach(['pop', 'push', 'shift', 'sort', 'splice', 'unshift'], function(methodName) {
      var func = arrayProto[methodName],
          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',
          retUnwrapped = /^(?:pop|shift)$/.test(methodName);

      lodash.prototype[methodName] = function() {
        var args = arguments;
        if (retUnwrapped && !this.__chain__) {
          var value = this.value();
          return func.apply(isArray(value) ? value : [], args);
        }
        return this[chainName](function(value) {
          return func.apply(isArray(value) ? value : [], args);
        });
      };
    });

    // Map minified method names to their real names.
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {
      var lodashFunc = lodash[methodName];
      if (lodashFunc) {
        var key = (lodashFunc.name + ''),
            names = realNames[key] || (realNames[key] = []);

        names.push({ 'name': methodName, 'func': lodashFunc });
      }
    });

    realNames[createHybrid(undefined, WRAP_BIND_KEY_FLAG).name] = [{
      'name': 'wrapper',
      'func': undefined
    }];

    // Add methods to `LazyWrapper`.
    LazyWrapper.prototype.clone = lazyClone;
    LazyWrapper.prototype.reverse = lazyReverse;
    LazyWrapper.prototype.value = lazyValue;

    // Add chain sequence methods to the `lodash` wrapper.
    lodash.prototype.at = wrapperAt;
    lodash.prototype.chain = wrapperChain;
    lodash.prototype.commit = wrapperCommit;
    lodash.prototype.next = wrapperNext;
    lodash.prototype.plant = wrapperPlant;
    lodash.prototype.reverse = wrapperReverse;
    lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;

    // Add lazy aliases.
    lodash.prototype.first = lodash.prototype.head;

    if (symIterator) {
      lodash.prototype[symIterator] = wrapperToIterator;
    }
    return lodash;
  });

  /*--------------------------------------------------------------------------*/

  // Export lodash.
  var _ = runInContext();

  // Some AMD build optimizers, like r.js, check for condition patterns like:
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lodash on the global object to prevent errors when Lodash is
    // loaded by a script tag in the presence of an AMD loader.
    // See http://requirejs.org/docs/errors.html#mismatch for more details.
    // Use `_.noConflict` to remove Lodash from the global object.
    root._ = _;

    // Define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module.
    define(function() {
      return _;
    });
  }
  // Check for `exports` after `define` in case a build optimizer adds it.
  else if (freeModule) {
    // Export for Node.js.
    (freeModule.exports = _)._ = _;
    // Export for CommonJS support.
    freeExports._ = _;
  }
  else {
    // Export to the global object.
    root._ = _;
  }
}.call(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],92:[function(require,module,exports){
'use strict';

module.exports = metaphone;

var SH = 'X';
var TH = '0';

/* Get the phonetics according to the original Metaphone
 * algorithm from a value. */
function metaphone(value) {
  var phonized = '';
  var index = 0;
  var skip;
  var next;
  var current;
  var prev;

  /* Add `characters` to `phonized`. */
  function phonize(characters) {
    phonized += characters;
  }

  /* Get the character offset by `offset` from the
   * current character. */
  function at(offset) {
    return value.charAt(index + offset).toUpperCase();
  }

  /* Create an `at` function with a bound `offset`. */
  function atFactory(offset) {
    return function () {
      return at(offset);
    };
  }

  value = String(value || '');

  if (!value) {
    return '';
  }

  next = atFactory(1);
  current = atFactory(0);
  prev = atFactory(-1);

  /* Find our first letter */
  while (!alpha(current())) {
    if (!current()) {
      return '';
    }

    index++;
  }

  switch (current()) {
    case 'A':
      /* AE becomes E */
      if (next() === 'E') {
        phonize('E');
        index += 2;
      } else {
        /* Remember, preserve vowels at the beginning */
        phonize('A');
        index++;
      }

      break;
    /* [GKP]N becomes N */
    case 'G':
    case 'K':
    case 'P':
      if (next() === 'N') {
        phonize('N');
        index += 2;
      }

      break;

    /* WH becomes H,
       WR becomes R
       W if followed by a vowel */
    case 'W':
      if (next() === 'R') {
        phonize(next());
        index += 2;
      } else if (next() === 'H') {
        phonize(current());
        index += 2;
      } else if (vowel(next())) {
        phonize('W');
        index += 2;
      }
      /* Else ignore */
      break;
    /* X becomes S */
    case 'X':
      phonize('S');
      index++;

      break;
    /* Vowels are kept */
    /* We did A already
    case 'A':
    case 'a': */
    case 'E':
    case 'I':
    case 'O':
    case 'U':
      phonize(current());
      index++;
      break;
    default:
      /* Do nothing */
      break;
  }

  /* On to the metaphoning */
  while (current()) {
    /* How many letters to skip because an eariler encoding handled
     * multiple letters */
    skip = 1;

    /* Ignore non-alphas */
    if (!alpha(current()) || (current() === prev() && current() !== 'C')) {
      index += skip;
      continue;
    }

    // eslint-disable-next-line default-case
    switch (current()) {
      /* B -> B unless in MB */
      case 'B':
        if (prev() !== 'M') {
          phonize('B');
        }

        break;
      /* 'sh' if -CIA- or -CH, but not SCH, except SCHW.
       * (SCHW is handled in S)
       *  S if -CI-, -CE- or -CY-
       *  dropped if -SCI-, SCE-, -SCY- (handed in S)
       *  else K */
      case 'C':
        if (soft(next())) {
          /* C[IEY] */
          if (next() === 'I' && at(2) === 'A') {
            /* CIA */
            phonize(SH);
          } else if (prev() !== 'S') {
            phonize('S');
          }
        } else if (next() === 'H') {
          phonize(SH);
          skip++;
        } else {
          /* C */
          phonize('K');
        }

        break;
      /* J if in -DGE-, -DGI- or -DGY-
       * else T. */
      case 'D':
        if (next() === 'G' && soft(at(2))) {
          phonize('J');
          skip++;
        } else {
          phonize('T');
        }

        break;
      /* F if in -GH and not B--GH, D--GH, -H--GH, -H---GH
       * else dropped if -GNED, -GN,
       * else dropped if -DGE-, -DGI- or -DGY- (handled in D)
       * else J if in -GE-, -GI, -GY and not GG
       * else K. */
      case 'G':
        if (next() === 'H') {
          if (!(noGHToF(at(-3)) || at(-4) === 'H')) {
            phonize('F');
            skip++;
          }
        } else if (next() === 'N') {
          if (!(!alpha(at(2)) || (at(2) === 'E' && at(3) === 'D'))) {
            phonize('K');
          }
        } else if (soft(next()) && prev() !== 'G') {
          phonize('J');
        } else {
          phonize('K');
        }

        break;

      /* H if before a vowel and not after C,G,P,S,T */
      case 'H':
        if (vowel(next()) && !dipthongH(prev())) {
          phonize('H');
        }

        break;
      /* Dropped if after C
       * else K. */
      case 'K':
        if (prev() !== 'C') {
          phonize('K');
        }

        break;
      /* F if before H
       * else P. */
      case 'P':
        if (next() === 'H') {
          phonize('F');
        } else {
          phonize('P');
        }

        break;
      /* K */
      case 'Q':
        phonize('K');
        break;
      /* 'sh' in -SH-, -SIO- or -SIA- or -SCHW-
       * else S */
      case 'S':
        if (next() === 'I' && (at(2) === 'O' || at(2) === 'A')) {
          phonize(SH);
        } else if (next() === 'H') {
          phonize(SH);
          skip++;
        } else {
          phonize('S');
        }

        break;
      /* 'sh' in -TIA- or -TIO-
       * else 'th' before H
       * else T. */
      case 'T':
        if (next() === 'I' && (at(2) === 'O' || at(2) === 'A')) {
          phonize(SH);
        } else if (next() === 'H') {
          phonize(TH);
          skip++;
        } else if (!(next() === 'C' && at(2) === 'H')) {
          phonize('T');
        }

        break;
      /* F */
      case 'V':
        phonize('F');
        break;
      case 'W':
        if (vowel(next())) {
          phonize('W');
        }

        break;
      /* KS */
      case 'X':
        phonize('KS');
        break;
      /* Y if followed by a vowel */
      case 'Y':
        if (vowel(next())) {
          phonize('Y');
        }

        break;
      /* S */
      case 'Z':
        phonize('S');
        break;
      /* No transformation */
      case 'F':
      case 'J':
      case 'L':
      case 'M':
      case 'N':
      case 'R':
        phonize(current());
        break;
    }

    index += skip;
  }

  return phonized;
}

/* Check whether `character` would make `'GH'` an `'F'`. */
function noGHToF(character) {
  character = char(character);

  return character === 'B' ||
    character === 'D' ||
    character === 'H';
}

/* Check whether `character` would make a `'C'` or `'G'`
 * soft. */
function soft(character) {
  character = char(character);
  return character === 'E' || character === 'I' || character === 'Y';
}

/* Check whether `character` is a vowel. */
function vowel(character) {
  character = char(character);

  return character === 'A' ||
    character === 'E' ||
    character === 'I' ||
    character === 'O' ||
    character === 'U';
}

/* Check whether `character` forms a dipthong when
 * preceding H. */
function dipthongH(character) {
  character = char(character);

  return character === 'C' ||
    character === 'G' ||
    character === 'P' ||
    character === 'S' ||
    character === 'T';
}

/* Check whether `character` is in the alphabet. */
function alpha(character) {
  var code = charCode(character);
  return code >= 65 && code <= 90;
}

/* Get the upper-case character code of the first character
 * in `character`. */
function charCode(character) {
  return char(character).charCodeAt(0);
}

/* Turn `character` into a single, upper-case character. */
function char(character) {
  return String(character).charAt(0).toUpperCase();
}

},{}],93:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],94:[function(require,module,exports){
(function (global){
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global global, define, System, Reflect, Promise */
var __extends;
var __assign;
var __rest;
var __decorate;
var __param;
var __metadata;
var __awaiter;
var __generator;
var __exportStar;
var __values;
var __read;
var __spread;
var __await;
var __asyncGenerator;
var __asyncDelegator;
var __asyncValues;
var __makeTemplateObject;
var __importStar;
var __importDefault;
(function (factory) {
    var root = typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : {};
    if (typeof define === "function" && define.amd) {
        define("tslib", ["exports"], function (exports) { factory(createExporter(root, createExporter(exports))); });
    }
    else if (typeof module === "object" && typeof module.exports === "object") {
        factory(createExporter(root, createExporter(module.exports)));
    }
    else {
        factory(createExporter(root));
    }
    function createExporter(exports, previous) {
        if (exports !== root) {
            if (typeof Object.create === "function") {
                Object.defineProperty(exports, "__esModule", { value: true });
            }
            else {
                exports.__esModule = true;
            }
        }
        return function (id, v) { return exports[id] = previous ? previous(id, v) : v; };
    }
})
(function (exporter) {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

    __extends = function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };

    __assign = Object.assign || function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };

    __rest = function (s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
                t[p[i]] = s[p[i]];
        return t;
    };

    __decorate = function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };

    __param = function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };

    __metadata = function (metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
    };

    __awaiter = function (thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };

    __generator = function (thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [0, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    };

    __exportStar = function (m, exports) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    };

    __values = function (o) {
        var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
        if (m) return m.call(o);
        return {
            next: function () {
                if (o && i >= o.length) o = void 0;
                return { value: o && o[i++], done: !o };
            }
        };
    };

    __read = function (o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    };

    __spread = function () {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    };

    __await = function (v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    };

    __asyncGenerator = function (thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);  }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
    };

    __asyncDelegator = function (o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { if (o[n]) i[n] = function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; }; }
    };

    __asyncValues = function (o) {
        if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator];
        return m ? m.call(o) : typeof __values === "function" ? __values(o) : o[Symbol.iterator]();
    };

    __makeTemplateObject = function (cooked, raw) {
        if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
        return cooked;
    };

    __importStar = function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
        result["default"] = mod;
        return result;
    };

    __importDefault = function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };

    exporter("__extends", __extends);
    exporter("__assign", __assign);
    exporter("__rest", __rest);
    exporter("__decorate", __decorate);
    exporter("__param", __param);
    exporter("__metadata", __metadata);
    exporter("__awaiter", __awaiter);
    exporter("__generator", __generator);
    exporter("__exportStar", __exportStar);
    exporter("__values", __values);
    exporter("__read", __read);
    exporter("__spread", __spread);
    exporter("__await", __await);
    exporter("__asyncGenerator", __asyncGenerator);
    exporter("__asyncDelegator", __asyncDelegator);
    exporter("__asyncValues", __asyncValues);
    exporter("__makeTemplateObject", __makeTemplateObject);
    exporter("__importStar", __importStar);
    exporter("__importDefault", __importDefault);
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],95:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],96:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":95,"_process":93,"inherits":87}],97:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('./util');

var _constants = require('./constants');

var getNumber = function getNumber(region) {
  var sum = 0;
  region.subRegions.forEach(function (_ref) {
    var tokens = _ref.tokens;
    var type = _ref.type;

    var subRegionSum = 0;
    switch (type) {
      case _constants.TOKEN_TYPE.MAGNITUDE:
        {
          subRegionSum = 1;
          tokens.forEach(function (token) {
            subRegionSum *= _constants.NUMBER[token.lowerCaseValue];
          });
          break;
        }
      case _constants.TOKEN_TYPE.UNIT:
      case _constants.TOKEN_TYPE.TEN:
        {
          tokens.forEach(function (token) {
            subRegionSum += _constants.NUMBER[token.lowerCaseValue];
          });
          break;
        }
      case _constants.TOKEN_TYPE.DECIMAL:
        {
          tokens.forEach(function (token, i) {
            if (!_constants.DECIMALS.includes(token.lowerCaseValue)) {
              subRegionSum += _constants.NUMBER[token.lowerCaseValue] / Math.pow(10, i);
            }
          });
          break;
        }
      // no default
    }
    sum += subRegionSum;
  });
  return sum;
};

var replaceRegionsInText = function replaceRegionsInText(regions, text) {
  var replaced = text;
  var offset = 0;
  regions.forEach(function (region) {
    var length = region.end - region.start + 1;
    var replaceWith = getNumber(region);
    replaced = (0, _util.splice)(replaced, region.start + offset, length, replaceWith);
    offset -= length - ('' + replaceWith).length;
  });
  return replaced;
};

exports.default = function (_ref2) {
  var regions = _ref2.regions;
  var text = _ref2.text;

  if (!regions) return text;
  if (regions[0].end - regions[0].start === text.length - 1) return getNumber(regions[0]);
  return replaceRegionsInText(regions, text);
};
},{"./constants":98,"./util":102}],98:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BLACKLIST_SINGULAR_WORDS = exports.ALL_WORDS = exports.TOKEN_TYPE = exports.PUNCTUATION = exports.DECIMALS = exports.JOINERS = exports.NUMBER_WORDS = exports.MAGNITUDE_KEYS = exports.TEN_KEYS = exports.UNIT_KEYS = exports.NUMBER = exports.MAGNITUDE = exports.TEN = exports.UNIT = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UNIT = exports.UNIT = {
  zero: 0,
  first: 1,
  one: 1,
  second: 2,
  two: 2,
  third: 3,
  thirteenth: 13,
  thirteen: 13,
  three: 3,
  fourth: 4,
  fourteenth: 14,
  fourteen: 14,
  four: 4,
  fifteenth: 15,
  fifteen: 15,
  fifth: 5,
  five: 5,
  sixth: 6,
  sixteenth: 16,
  sixteen: 16,
  six: 6,
  seventeenth: 17,
  seventeen: 17,
  seventh: 7,
  seven: 7,
  eighteenth: 18,
  eighteen: 18,
  eighth: 8,
  eight: 8,
  nineteenth: 19,
  nineteen: 19,
  ninth: 9,
  nine: 9,
  tenth: 10,
  ten: 10,
  eleventh: 11,
  eleven: 11,
  twelfth: 12,
  twelve: 12,
  a: 1
};

var TEN = exports.TEN = {
  twenty: 20,
  twentieth: 20,
  thirty: 30,
  thirtieth: 30,
  forty: 40,
  fortieth: 40,
  fifty: 50,
  fiftieth: 50,
  sixty: 60,
  sixtieth: 60,
  seventy: 70,
  seventieth: 70,
  eighty: 80,
  eightieth: 80,
  ninety: 90,
  ninetieth: 90
};

var MAGNITUDE = exports.MAGNITUDE = {
  hundred: 100,
  hundredth: 100,
  thousand: 1000,
  million: 1000000,
  billion: 1000000000,
  trillion: 1000000000000,
  quadrillion: 1000000000000000,
  quintillion: 1000000000000000000,
  sextillion: 1000000000000000000000,
  septillion: 1000000000000000000000000,
  octillion: 1000000000000000000000000000,
  nonillion: 1000000000000000000000000000000,
  decillion: 1000000000000000000000000000000000
};

var NUMBER = exports.NUMBER = (0, _extends3.default)({}, UNIT, TEN, MAGNITUDE);

var UNIT_KEYS = exports.UNIT_KEYS = (0, _keys2.default)(UNIT);
var TEN_KEYS = exports.TEN_KEYS = (0, _keys2.default)(TEN);
var MAGNITUDE_KEYS = exports.MAGNITUDE_KEYS = (0, _keys2.default)(MAGNITUDE);

var NUMBER_WORDS = exports.NUMBER_WORDS = [].concat((0, _toConsumableArray3.default)(UNIT_KEYS), (0, _toConsumableArray3.default)(TEN_KEYS), (0, _toConsumableArray3.default)(MAGNITUDE_KEYS));

var JOINERS = exports.JOINERS = ['and'];
var DECIMALS = exports.DECIMALS = ['point', 'dot'];

var PUNCTUATION = exports.PUNCTUATION = ['.', ',', '\\', '#', '!', '$', '%', '^', '&', '/', '*', ';', ':', '{', '}', '=', '-', '_', '`', '~', '(', ')', ' '];

var TOKEN_TYPE = exports.TOKEN_TYPE = {
  UNIT: 0,
  TEN: 1,
  MAGNITUDE: 2,
  DECIMAL: 5
};

var ALL_WORDS = exports.ALL_WORDS = [].concat((0, _toConsumableArray3.default)(NUMBER_WORDS), JOINERS, DECIMALS);

var BLACKLIST_SINGULAR_WORDS = exports.BLACKLIST_SINGULAR_WORDS = ['a'];
},{"babel-runtime/core-js/object/keys":23,"babel-runtime/helpers/extends":24,"babel-runtime/helpers/toConsumableArray":25}],99:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cljFuzzy = require('clj-fuzzy');

var _cljFuzzy2 = _interopRequireDefault(_cljFuzzy);

var _itsSet = require('its-set');

var _itsSet2 = _interopRequireDefault(_itsSet);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (word, haystack) {
  return (haystack || _constants.ALL_WORDS).map(function (numberWord) {
    return {
      word: numberWord,
      score: _cljFuzzy2.default.metrics.jaro(numberWord, word)
    };
  }).reduce(function (acc, stat) {
    return !(0, _itsSet2.default)(acc.score) || stat.score > acc.score ? stat : acc;
  }, {}).word;
};
},{"./constants":98,"clj-fuzzy":26,"its-set":88}],100:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wordsToNumbers = wordsToNumbers;

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _compiler = require('./compiler');

var _compiler2 = _interopRequireDefault(_compiler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function wordsToNumbers(text) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var regions = (0, _parser2.default)(text, options);
  if (!regions.length) return text;
  var compiled = (0, _compiler2.default)({ text: text, regions: regions }, options);
  return compiled;
}

exports.default = wordsToNumbers;
},{"./compiler":97,"./parser":101}],101:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _constants = require('./constants');

var _fuzzy = require('./fuzzy');

var _fuzzy2 = _interopRequireDefault(_fuzzy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SKIP = 0;
var ADD = 1;
var START_NEW_REGION = 2;
var NOPE = 3;

var canAddTokenToEndOfSubRegion = function canAddTokenToEndOfSubRegion(subRegion, token) {
  var tokens = subRegion.tokens;
  var type = token.type;

  var prevToken = tokens[0];
  if (!prevToken) return true;
  if (prevToken.type === _constants.TOKEN_TYPE.MAGNITUDE && type === _constants.TOKEN_TYPE.UNIT) return true;
  if (prevToken.type === _constants.TOKEN_TYPE.MAGNITUDE && type === _constants.TOKEN_TYPE.TEN) return true;
  if (prevToken.type === _constants.TOKEN_TYPE.TEN && type === _constants.TOKEN_TYPE.UNIT) return true;
  if (prevToken.type === _constants.TOKEN_TYPE.MAGNITUDE && type === _constants.TOKEN_TYPE.MAGNITUDE) return true;
  return false;
};

var getSubRegionType = function getSubRegionType(subRegion, currentToken) {
  if (!subRegion) {
    return currentToken.type;
  }
  if (subRegion.type === _constants.TOKEN_TYPE.MAGNITUDE) return _constants.TOKEN_TYPE.MAGNITUDE;
  return currentToken.type;
};

var checkIfTokenFitsSubRegion = function checkIfTokenFitsSubRegion(subRegion, token) {
  if (!subRegion) return { action: START_NEW_REGION, type: getSubRegionType(subRegion, token) };
  if (canAddTokenToEndOfSubRegion(subRegion, token)) {
    return { action: ADD, type: getSubRegionType(subRegion, token) };
  }
  return { action: START_NEW_REGION, type: getSubRegionType(subRegion, token) };
};

var getSubRegions = function getSubRegions(region) {
  var subRegions = [];
  var currentSubRegion = void 0;
  var tokensCount = region.tokens.length;
  var i = tokensCount - 1;
  while (i >= 0) {
    var token = region.tokens[i];

    var _checkIfTokenFitsSubR = checkIfTokenFitsSubRegion(currentSubRegion, token);

    var action = _checkIfTokenFitsSubR.action;
    var type = _checkIfTokenFitsSubR.type;

    switch (action) {
      case ADD:
        {
          currentSubRegion.type = type;
          currentSubRegion.tokens.unshift(token);
          break;
        }
      case START_NEW_REGION:
        {
          currentSubRegion = {
            tokens: [token],
            type: type
          };
          subRegions.unshift(currentSubRegion);
          break;
        }
      // no default
    }
    i--;
  }
  return subRegions;
};

var canAddTokenToEndOfRegion = function canAddTokenToEndOfRegion(region, token) {
  var tokens = region.tokens;
  var type = token.type;

  var prevToken = tokens[tokens.length - 1];
  if (prevToken.type === _constants.TOKEN_TYPE.UNIT && type === _constants.TOKEN_TYPE.UNIT) return false;
  if (prevToken.type === _constants.TOKEN_TYPE.UNIT && type === _constants.TOKEN_TYPE.TEN) return false;
  if (prevToken.type === _constants.TOKEN_TYPE.TEN && type === _constants.TOKEN_TYPE.TEN) return false;
  return true;
};

var checkIfTokenFitsRegion = function checkIfTokenFitsRegion(region, token) {
  var isPunctuation = _constants.PUNCTUATION.includes(token.lowerCaseValue);
  if (isPunctuation) return SKIP;
  var isJoiner = _constants.JOINERS.includes(token.lowerCaseValue);
  if (isJoiner) return SKIP;
  var isDecimal = _constants.DECIMALS.includes(token.lowerCaseValue);
  if (isDecimal) return ADD;
  var isNumberWord = _constants.NUMBER_WORDS.includes(token.lowerCaseValue);
  if (isNumberWord) {
    if (!region) return START_NEW_REGION;
    if (canAddTokenToEndOfRegion(region, token)) {
      return ADD;
    }
    return START_NEW_REGION;
  }
  return NOPE;
};

var regionIsValid = function regionIsValid(region) {
  if (region.tokens.length === 1) {
    if (['a'].includes(region.tokens[0].lowerCaseValue)) return false;
  }
  return true;
};

var getDecimalTokenIndex = function getDecimalTokenIndex(tokens) {
  return tokens.reduce(function (acc, token, i) {
    return _constants.DECIMALS.includes(token.lowerCaseValue) ? i : acc;
  }, -1);
};

var getDecimalSubRegion = function getDecimalSubRegion(tokens) {
  return {
    start: tokens[0].start,
    end: tokens[tokens.length - 1].end,
    tokens: tokens.reduce(function (acc, token) {
      return _constants.NUMBER_WORDS.concat(_constants.DECIMALS).includes(token.lowerCaseValue) ? acc.concat(token) : acc;
    }, []),
    type: _constants.TOKEN_TYPE.DECIMAL
  };
};

var checkBlacklist = function checkBlacklist(tokens) {
  return tokens.length === 1 && _constants.BLACKLIST_SINGULAR_WORDS.includes(tokens[0].lowerCaseValue);
};

var matchRegions = function matchRegions(tokens) {
  var regions = [];

  if (checkBlacklist(tokens)) return regions;

  var i = 0;
  var currentRegion = void 0;
  var tokensCount = tokens.length;
  var decimalIndex = getDecimalTokenIndex(tokens);
  while (i < (decimalIndex === -1 ? tokensCount : decimalIndex)) {
    var token = tokens[i];
    var tokenFits = checkIfTokenFitsRegion(currentRegion, token);
    switch (tokenFits) {
      case SKIP:
        {
          break;
        }
      case ADD:
        {
          currentRegion.end = token.end;
          currentRegion.tokens.push(token);
          break;
        }
      case START_NEW_REGION:
        {
          currentRegion = {
            start: token.start,
            end: token.end,
            tokens: [token]
          };
          regions.push(currentRegion);
          break;
        }
      case NOPE:
      default:
        {
          currentRegion = null;
          break;
        }
    }
    i++;
  }
  return regions.reduce(function (acc, region) {
    var decimalRegion = decimalIndex !== -1 ? getDecimalSubRegion(tokens.slice(decimalIndex)) : { tokens: [] };
    var subRegions = getSubRegions(region);
    if (decimalRegion.tokens.length) {
      subRegions = subRegions.concat(decimalRegion);
    }
    var regionWithDecimal = (0, _extends3.default)({}, region, {
      subRegions: subRegions
    });
    regionWithDecimal.tokens = [].concat((0, _toConsumableArray3.default)(regionWithDecimal.tokens), (0, _toConsumableArray3.default)(decimalRegion.tokens));
    if (regionWithDecimal.tokens.length) {
      regionWithDecimal.end = regionWithDecimal.tokens[regionWithDecimal.tokens.length - 1].end;
    }
    return regionIsValid(decimalRegion) ? acc.concat(regionWithDecimal) : acc;
  }, []);
};

var getTokenType = function getTokenType(chunk) {
  if (_constants.UNIT_KEYS.includes(chunk.toLowerCase())) return _constants.TOKEN_TYPE.UNIT;
  if (_constants.TEN_KEYS.includes(chunk.toLowerCase())) return _constants.TOKEN_TYPE.TEN;
  if (_constants.MAGNITUDE_KEYS.includes(chunk.toLowerCase())) return _constants.TOKEN_TYPE.MAGNITUDE;
  if (_constants.DECIMALS.includes(chunk.toLowerCase())) return _constants.TOKEN_TYPE.DECIMAL;
};

exports.default = function (text, options) {
  var tokens = text.split(/(\w+|\s|[[:punct:]])/i).reduce(function (acc, chunk) {
    var unfuzzyChunk = chunk.length && options.fuzzy && !_constants.PUNCTUATION.includes(chunk) ? (0, _fuzzy2.default)(chunk) : chunk;
    var start = acc.length ? acc[acc.length - 1].end + 1 : 0;
    var end = start + chunk.length;
    return end !== start ? acc.concat({
      start: start,
      end: end - 1,
      value: unfuzzyChunk,
      lowerCaseValue: unfuzzyChunk.toLowerCase(),
      type: getTokenType(unfuzzyChunk, options)
    }) : acc;
  }, []);
  var regions = matchRegions(tokens, options);
  return regions;
};
},{"./constants":98,"./fuzzy":99,"babel-runtime/helpers/extends":24,"babel-runtime/helpers/toConsumableArray":25}],102:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var splice = exports.splice = function splice(str, index, count, add) {
  var i = index;
  if (i < 0) {
    i = str.length + i;
    if (i < 0) {
      i = 0;
    }
  }
  return str.slice(0, i) + (add || '') + str.slice(i + count);
};
},{}],103:[function(require,module,exports){
module.exports = require('./dist/index');
},{"./dist/index":100}]},{},[1])(1)
});
