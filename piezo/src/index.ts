import { VariablePWM } from "pwm";

/**
 * Type enum Tones
 *  - Rounded frequency values for common notes
 */
export enum Tones {
    REST = 0,
    A = 440,
    AS = 466,
    H = 494,
    C = 523,
    CS = 554,
    D = 587,
    DS = 622,
    E = 659,
    F = 698,
    FS = 740,
    G = 784,
    GS = 831,
}

/**
 * Type enum Volume
 *  - Some choosen PWM duty values, that sound the best and provide comfort for
 *    setting the piezo volume
 */
export enum Volume {
    OFF = 0,
    LOW = 6,
    MID = 10,
    ON = 512,
}

/**
 * Type Tone
 *  - Tone in Hz
 */
export type Tone = number;

/**
 * Type Note
 *  - Touple of Tone in HZ and it's duration in ms
 */
export type Note = [Tone, number];

/**
 * Type Song
 *  - Song is just an array of Notes
 */
export type Song = Note[];

/**
 * Type Effects
 *  - Some premade musical effects mainly targeted at games
 */
export const Effects: Record<string, Song> = {
    coin: [
        [Tones.H, 60],
        [Tones.E, 120],
    ],

    jump: [
        [Tones.C, 50],
        [Tones.G, 80],
    ],

    win: [
        [Tones.C, 100],
        [Tones.E, 100],
        [Tones.G, 100],
        [Tones.C, 100],
        [Tones.G, 100],
        [Tones.C, 200],
    ],

    lose: [
        [Tones.G, 150],
        [Tones.FS, 150],
        [Tones.F, 150],
        [Tones.E, 300],
    ],

    damage: [
        [Tones.AS, 60],
        [Tones.REST, 30],
        [Tones.A, 80],
    ],

    upgrade: [
        [Tones.C, 70],
        [Tones.D, 70],
        [Tones.E, 70],
        [Tones.F, 70],
        [Tones.G, 90],
    ],

    shoot: [
        [Tones.H, 30],
        [Tones.G, 30],
        [Tones.D, 30],
    ],

    menuMove: [[Tones.A, 40]],

    menuSelect: [
        [Tones.E, 50],
        [Tones.A, 80],
    ],

    error: [
        [Tones.D, 100],
        [Tones.REST, 40],
        [Tones.D, 100],
    ],

    notify: [
        [Tones.C, 20],
        [Tones.G, 30],
    ],

    tick: [[Tones.E, 20]],
    tock: [[Tones.C, 20]],
};



/**
 * Type class PIEZO
 *  - Main library class that has all the important methods
 */
export class PIEZO {
    readonly piezo_gpio: number;
    readonly pwm: VariablePWM;

    private readonly PWM_INIT_HZ = 1000;

    private volume: Volume;

    /**
     * Creates a new instance of the PIEZO piezo sounds library.
     * @param gpio_pin The gpio pin nubmer for communicating with the piezo.
     * @param volume The starting volume for the sound.
     */
    constructor(gpio_pin: number, volume: number = Volume.MID) {
        this.piezo_gpio = gpio_pin;
        this.volume = volume;
        this.pwm = new VariablePWM({
            pin: this.piezo_gpio,
            frequency: this.PWM_INIT_HZ,
        });
    }

    /**
     * setVolume() Set "volume" of the playback on the piezo
     * @param volume Volume value in the range of 0-1023 to set the PWM Duty to
     */
    public setVolume(volume: Volume) {
        if (volume > 0 && volume < 1024) {
            this.volume = volume;
        }
    }

    /**
     * playTone() Play one tone indefinitely it can also change the frequency
     * currently playing
     * @param hz The frequency to set the piezo to
     */
    public async playTone(hz: number) {
        if (hz !== Tones.REST) {
            this.pwm.setFrequency(hz);
            this.pwm.setDuty(this.volume);
        } else {
            this.pwm.setDuty(Volume.OFF);
        }
    }

    /**
     * playToneDuration() Private method to play tone with set duration
     * @param hz The frequency to set the piezo to
     * @param duration_ms The duration how long to play the tone, in ms
     */
    private async playToneDuration(hz: number, duration_ms: number) {
        this.playTone(hz);
        await sleep(duration_ms);
        this.playTone(Tones.REST);
    }

    /**
     * playNote() Play the provided note
     * @param note Touple of Tone in Hz and duration in ms
     */
    public async playNote(note: Note) {
        await this.playToneDuration(note[0], note[1]);
    }

    /**
     * playSong() Play the provided song
     * @param song Array of Notes to play
     */
    public async playSong(song: Song) {
        for (const note of song) {
            await this.playNote(note);
        }
    }

    /**
     * playScale() Play the scale using play song method.
     */
    public async playScale() {
        let scale: Song = [
            [Tones.C, 100],
            [Tones.CS, 100],
            [Tones.D, 100],
            [Tones.DS, 100],
            [Tones.E, 100],
            [Tones.F, 100],
            [Tones.FS, 100],
            [Tones.G, 100],
            [Tones.GS, 100],
            [Tones.A, 100],
            [Tones.AS, 100],
            [Tones.H, 100],
        ];
        await this.playSong(scale);
    }
}
