// ---------- Unamed notes (logs) ----------------

export interface Log {
    date: Date,
    note: string,
}

export interface Logger {
    log(note: string): void,
    recentLogs(count: number): Log[],
    popLastLog(): Log | null,
}

export const newLogger = (): Logger => {
    const logs: Log[] = []

    const log = (note: string) => {
        logs.push({
            date: new Date(),
            note,
        })
    }

    const recentLogs = (count: number): Log[] => {
        return logs.slice(Math.max(0, logs.length - count))
            .reverse()
    }

    const popLastLog = (): Log | undefined => {
        return logs.pop()
    }

    return {
        log,
        recentLogs,
        popLastLog,
    }
}

// -------------- Named Notes -------------------

export interface Note {
    name: string,
    note: string,
    date: Date,
}

export interface NoteMap {
    [index: string]: Note
}

export interface Notes {
    saveNote(name: string, note: string): void,
    getNote(name: string): Note,
    noteNames(): string[],
}

export const newNotes = (): Notes => {
    const notes: NoteMap = {}
    let noteKeys: string[] = []

    const saveNote = (name: string, note: string) => {
        notes[name] = {
            name,
            date: new Date(),
            note,
        }
        noteKeys = Object.keys(notes)
    }

    /* export const deleteNote = (name: string) => {
        delete notes[name]
        noteKeys = Object.keys(notes)
    } */

    const getNote = (name: string) => notes[name]

    const noteNames = (): string[] => noteKeys

    return {
        saveNote,
        getNote,
        noteNames,
    }
}
