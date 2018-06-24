const timers = {};

const ensureStopped = (name) => {
    timer = timers[name];
    if (timer) {
        clearTimeout(timer.ref);
        delete timers[name];
    }
    return timer;
}

const startTimer = (name, millis, callbackFunc) => {
    ensureStopped(name);
    const now = (new Date()).getTime();
    const timer = {
        ref: setTimeout(callbackFunc, millis),
        started: now,
        ending: (now + millis),
    };
    timers[name] = timer;
};

const stopTimer = (name) => {
    ensureStopped(name);
};

/*export const getSecsRemaining = (name) => {
    const timer = timers[name];
    if (!timer) {
        return Number.NaN;
    }
    return (timer.ending - (new Date()).getTime()) / 1000;
};

export const getTimerStats = () => {
    return Object.keys(timers).map(name => getSecsRemaining(name));
};*/

module.exports = {
    startTimer,
    stopTimer,
};
