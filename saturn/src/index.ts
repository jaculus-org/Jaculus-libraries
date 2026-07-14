import { Display } from "rphub75";


export const SaturnPins = {
    ILED: 48,
    ILEDConnector: 46,
    BootBtn: 0,

    uSupA: {
        SDA: 18,
        SCL: 17,
    },

    uSupB: {
        SDA: 14,
        SCL: 21
    },

    Pmod1: {
        Pin1: 4,
        Pin2: 5,
        Pin3: 15,
        Pin4: 16,
    },

    Pmod2: {
        Pin1: 2,
        Pin2: 10,
        Pin3: 42,
        Pin4: 40,
    },

    Pmod3: {
        Pin1: 6,
        Pin2: 8,
        Pin3: 47,
        Pin4: 12,
        Pin5: 7,
        Pin6: 9,
        Pin7: 11,
        Pin8: 13,
    },

    Display: {
        D0: 38,
        D1: 39,
        D2: 41,
        D3: 45,
        CS: 1,
        CK: 3,
    }
};


class Saturn {
    public readonly Pins = SaturnPins;

    display: Display;

    constructor(flip?: boolean) {
        this.display = new Display({
            spi: {
                pin_d0: SaturnPins.Display.D0,
                pin_d1: SaturnPins.Display.D1,
                pin_d2: SaturnPins.Display.D2,
                pin_d3: SaturnPins.Display.D3,
                pin_cs: SaturnPins.Display.CS,
                pin_ck: SaturnPins.Display.CK,
                baud: 20_000_000
            },
            width: 64,
            height: 64,
            rotation: flip ? -1 : 1,
        });
    }
}


export function createSaturn(flip?: boolean) {
    return new Saturn(flip);
}
