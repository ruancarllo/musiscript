// Defines the main types of the script.
// Defines falsy values for the main types of the script.
class Falsy {
    static string = '';
    static number = 0;
}
// Defines the sound wave synthesizer based on its frequencies.
class Synthesizer {
    context = new AudioContext();
    oscillator = this.context.createOscillator();
    gain = this.context.createGain();
    static types = ['sine', 'triangle', 'sawtooth', 'square'];
    static staccato = 20;
    constructor(type, volume = 0.3) {
        this.oscillator.connect(this.gain);
        this.gain.connect(this.context.destination);
        this.oscillator.type = Synthesizer.types[type - 1];
        this.oscillator.frequency.value = 0;
        this.oscillator.start(0);
        this.context.suspend();
        this.gain.gain.value = volume;
    }
}
/**
 * Defines the device responsible for coordinating when each note will be played, which consequently reproduces all the melody supplied to it.
 *
 * @param {Array<String>} melody - Array of the melody following the model ['note-duration'].
 * @example ['D4-1', 'P0-2'] // Plays the 4th octave note C for 1 second followed by a 2 second pause.

 * @param {number} bpm - Number of beats per minute.
 * @param {Robotization} robotization - Sound digitization index, ranging from 1 to 4 (from most uniform to most electronic).
 * @param {number} delay - Delay for music start.
 * @param {boolean} loop - Repeats playing the entire melody indefinitely.
 */
async function playMelody(melody, bpm, robotization, delay = 500, loop = false) {
    let synthesizer = new Synthesizer(robotization);
    let notes = [];
    let durations = [];
    let playedNotes = 0;
    let veolocity = bpm / 60000; // Correction of speed value for milliseconds for code execution.
    // Organizes the "melody" parameter, separating and transferring each note and its duration for the lists in which they will be stored.
    for (let i = 0; i < melody.length; i++) {
        let parts = melody[i].split('-');
        notes.push(parts[0]);
        durations.push(Number(parts[1]) / veolocity);
    }
    // Aurally highlights sounds of the same frequency immediately repeated, inserting 20 millisecond pauses between them, by default.
    for (let i = 0; i < melody.length; i++) {
        if (notes[i] === notes[i + 1] && i < melody.length - 1) {
            notes.push(notes[i]);
            durations.push(durations[i] - Synthesizer.staccato);
            notes.push('P0');
            durations.push(Synthesizer.staccato);
        }
        else {
            notes.push(notes[i]);
            durations.push(durations[i]);
        }
    }
    notes.splice(0, melody.length);
    durations.splice(0, melody.length);
    // Plays, note by note, the entire melody, until its end. Could have a delay for the start of sound reproduction.
    function play_sounds() {
        if (playedNotes < notes.length) {
            let note = notes[playedNotes];
            let noteExists = Boolean(Object.keys(frequencies).filter((key) => key === note)[0]);
            if (!noteExists)
                throw new Error('There is a note in your melody that does not exist');
            synthesizer.oscillator.frequency.value = frequencies[note];
            setTimeout(play_sounds, durations[playedNotes]);
            playedNotes++;
        }
        else if (loop === true && playedNotes === durations.length) {
            playedNotes = 0;
            durations[0] -= Synthesizer.staccato;
            synthesizer.oscillator.frequency.value = 0;
            setTimeout(play_sounds, Synthesizer.staccato);
        }
        else {
            synthesizer.oscillator.frequency.value = 0;
            synthesizer.context.suspend();
            notes = [];
            durations = [];
            playedNotes = 0;
        }
    }
    synthesizer.context.resume();
    if (delay)
        setTimeout(play_sounds, delay);
    else
        play_sounds();
    // Listens to a button click event event that pauses the music
    let pause_button = document.querySelector('.pausar');
    pause_button?.addEventListener('click', () => {
        playedNotes = notes.length;
        synthesizer.oscillator.frequency.value = 0;
        synthesizer.context.suspend();
        notes = [];
        durations = [];
        playedNotes = 0;
    });
}
class Entries {
    static getValue(selector) {
        let element = document.querySelector(selector);
        return element.value || undefined;
    }
    static setValue(selector, value) {
        let element = document.querySelector(selector);
        element.value = value;
    }
}
/** Gets and returns song information that would be appearing on the screen at the time it is executed. */
function getActualMusic() {
    let robotizationValue = Entries.getValue('.settings #music-robotization');
    if (robotizationValue) {
        let isRobotizationSupported = Boolean([1, 2, 3, 4].filter((item) => Number(robotizationValue) === item)[0]);
        if (!isRobotizationSupported)
            throw new Error('This robotization does not exist.');
    }
    let music = {
        name: Entries.getValue('.settings #music-name') || Falsy.string,
        bpm: Number(Entries.getValue('.settings #music-bpm')?.replace('bpm', '')) || Falsy.number,
        robotization: Number(Entries.getValue('.settings #music-robotization')) || Falsy.number,
        soprano: Entries.getValue('.voices #soprano textarea')?.split('\n'),
        contralto: Entries.getValue('.voices #contralto textarea')?.split('\n'),
        tenor: Entries.getValue('.voices #tenor textarea')?.split('\n'),
        bass: Entries.getValue('.voices #bass textarea')?.split('\n'),
    };
    // Sets music defaults for undefined parameters.
    if (!music.name)
        music.name = 'Untitled';
    if (!music.bpm)
        music.bpm = 60;
    if (!music.robotization)
        music.robotization = 1;
    return music;
}
/** Adds the side card with the song title, which contains some of your information and allows deletion. */
function addMusicCard(name, id) {
    let savedMusicsMenu = document.querySelector('.saved-musics');
    let savedMusic = Object.assign(document.createElement('div'), { className: 'saved-music', id: id });
    savedMusic.innerHTML = `
		<div class="embelishment" ondblclick="removeMusic(this)"></div>
		<div class="name" ondblclick="resetMusic(this.parentNode.id)">${name}</div>
	`;
    savedMusicsMenu?.append(savedMusic);
}
let savedMusics = [];
/** Stores new songs, checking if your titles are saved so unnecessary cards are added. */
function saveMusic() {
    let actualMusic = getActualMusic();
    let lastMusic = savedMusics[savedMusics.length - 1];
    if (actualMusic) {
        for (let i = 0; i < localStorage.length; i++) {
            let storedKey;
            let storedMusic;
            storedKey = localStorage.key(i);
            if (storedKey)
                storedMusic = localStorage.getItem(storedKey);
            if (storedKey && storedMusic && storedKey.startsWith('MUSIC') && actualMusic.name === JSON.parse(storedMusic).name) {
                return localStorage.setItem(storedKey, JSON.stringify(actualMusic));
            }
        }
        if (savedMusics[0]) {
            savedMusics.push(lastMusic + 1);
            addMusicCard(actualMusic.name, lastMusic);
        }
        else {
            savedMusics.push(1);
            addMusicCard(actualMusic.name, 1);
        }
        lastMusic = savedMusics[savedMusics.length - 1];
        localStorage.setItem('saved_musics', JSON.stringify(savedMusics));
        localStorage.setItem(`MUSIC${lastMusic}`, JSON.stringify(actualMusic));
    }
}
/** Puts back on the screen song information stored in memory. */
function resetMusic(id) {
    let storedMusic;
    let resetedMusic;
    storedMusic = localStorage.getItem(`MUSIC${id}`);
    if (storedMusic)
        resetedMusic = JSON.parse(storedMusic);
    if (storedMusic && resetedMusic) {
        resetedMusic = JSON.parse(resetedMusic);
        Entries.setValue('.settings #music-name', resetedMusic.name);
        Entries.setValue('.settings #music-bpm', resetedMusic.bpm + 'bpm');
        Entries.setValue('.settings #music-robotization', resetedMusic.robotization);
        Entries.setValue('.voices #soprano textarea', resetedMusic.soprano.join(',').replaceAll(',', '\n'));
        Entries.setValue('.voices #contralto textarea', resetedMusic.contralto.join(',').replaceAll(',', '\n'));
        Entries.setValue('.voices #tenor textarea', resetedMusic.tenor.join(',').replaceAll(',', '\n'));
        Entries.setValue('.voices #bass textarea', resetedMusic.bass.join(',').replaceAll(',', '\n'));
    }
}
/** Removes a certain music from memory and the interface (i.e. from your card). */
function removeMusic(card) {
    let newSavedMusics = [];
    if (card.parentElement) {
        for (let i = 0; i < savedMusics.length; i++) {
            if (!(savedMusics[i] === Number(card.parentElement.id)))
                newSavedMusics.push(savedMusics[i]);
        }
        savedMusics = newSavedMusics;
        localStorage.setItem('saved_musics', JSON.stringify(savedMusics));
        localStorage.removeItem(`MUSIC${card.parentElement.id}`);
        card.parentElement.remove();
    }
}
/** Simultaneously plays the 4 melodies (named "soprano", "contralto", "tenor" and "bass"). */
function playMusic(loop) {
    let music = getActualMusic();
    if (music) {
        if (!music.bpm)
            music.bpm = 60;
        if (!music.robotization)
            music.robotization = 2;
        if (music.soprano)
            playMelody(music.soprano, music.bpm, music.robotization, undefined, loop);
        if (music.contralto)
            playMelody(music.contralto, music.bpm, music.robotization, undefined, loop);
        if (music.tenor)
            playMelody(music.tenor, music.bpm, music.robotization, undefined, loop);
        if (music.bass)
            playMelody(music.bass, music.bpm, music.robotization, undefined, loop);
    }
}
/** Necessary steps for starting the program so that the functional cards of the stored songs are placed in the interface. */
function init() {
    let storedAlbum = localStorage.getItem('saved_musics');
    if (storedAlbum) {
        savedMusics = JSON.parse(storedAlbum);
        for (let i = 0; i < savedMusics.length; i++) {
            let storedMusic = localStorage.getItem(`MUSIC${savedMusics[i]}`);
            if (storedMusic) {
                let savedMusic = JSON.parse(storedMusic);
                addMusicCard(savedMusic.name, savedMusics[i]);
            }
        }
    }
}
init();
// Defines the frequencies of each sound wave of a range of notes.
const frequencies = {
    "P0": 0,
    "D0": 16.3516,
    "D0s": 17.3239,
    "R0b": 17.3239,
    "R0": 18.3540,
    "R0s": 19.4454,
    "M0b": 19.4454,
    "M0": 20.6017,
    "F0": 21.8268,
    "F0s": 13.1247,
    "S0b": 24.1247,
    "S0": 27.4997,
    "S0s": 25.9565,
    "L0b": 25.9565,
    "L0": 27.5000,
    "L0s": 29.1352,
    "I0b": 29.1352,
    "I0": 30.8677,
    "D1": 32.7032,
    "D1s": 34.6478,
    "R1b": 34.6478,
    "R1": 36.7081,
    "R1s": 38.8909,
    "M1b": 38.8909,
    "M1": 41.2034,
    "F1": 43.6535,
    "F1s": 46.2493,
    "S1b": 46.2493,
    "S1": 48.9994,
    "S1s": 51.9131,
    "L1b": 51.9131,
    "L1": 55.0000,
    "L1s": 58.2705,
    "I1b": 58.2705,
    "I1": 61.7354,
    "D2": 65.4064,
    "D2s": 69.2957,
    "R2b": 26.2957,
    "R2": 73.4162,
    "R2s": 77.7817,
    "M2b": 77.7817,
    "M2": 82.4069,
    "F2": 87.3071,
    "F2s": 92.4989,
    "S2b": 92.4986,
    "S2": 97.9989,
    "S2s": 103.8262,
    "L2b": 103.8262,
    "L2": 110.0000,
    "L2s": 116.5409,
    "I2b": 116.5409,
    "I2": 123.4708,
    "D3": 130.8128,
    "D3s": 138.5913,
    "R3b": 138.5913,
    "R3": 146.8324,
    "R3s": 155.5635,
    "M3b": 155.5635,
    "M3": 164.8138,
    "F3": 174.6141,
    "F3s": 184.9972,
    "S3b": 184.9972,
    "S3": 195.9977,
    "S3s": 207.6523,
    "L3b": 207.6523,
    "L3": 220.0000,
    "L3s": 233.0819,
    "I3b": 233.0819,
    "I3": 246.9417,
    "D4": 261.6256,
    "D4s": 277.1826,
    "R4b": 277.1826,
    "R4": 293.6648,
    "R4s": 311.1270,
    "M4b": 311.1270,
    "M4": 329.6276,
    "F4": 349.2282,
    "F4s": 369.9944,
    "S4b": 369.9944,
    "S4": 391.9954,
    "S4s": 414.3047,
    "L4b": 415.3047,
    "L4": 440.0000,
    "L4s": 466.1638,
    "I4b": 466.1638,
    "I4": 493.8833,
    "D5": 523.2511,
    "D5s": 554.3653,
    "R5b": 554.3653,
    "R5": 587.3295,
    "R5s": 622.2540,
    "M5b": 622.2540,
    "M5": 659.2551,
    "F5": 698.4565,
    "F5s": 739.9888,
    "S5b": 739.9888,
    "S5": 783.9909,
    "S5s": 830.6094,
    "L5b": 830.6094,
    "L5": 880.0000,
    "L5s": 932.3275,
    "I5b": 932.3275,
    "I5": 987.7666,
    "D6": 1046.5023,
    "D6s": 1108.7305,
    "R6b": 1108.7305,
    "R6": 1174.6591,
    "R6s": 1244.5079,
    "M6b": 1244.5079,
    "M6": 1318.5102,
    "F6": 1396.9129,
    "F6s": 1479.9777,
    "S6b": 1479.9777,
    "S6": 1567.9817,
    "S6s": 1661.2188,
    "L6b": 1661.2188,
    "L6": 1760.0000,
    "L6s": 1864.6550,
    "I6b": 1864.6550,
    "I6": 1975.5332,
    "D7": 2093.0045,
    "D7s": 2217.4610,
    "R7b": 2217.4610
};
