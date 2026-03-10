const ADDR_BASE = 0b1001_000;
var Reg;
(function (Reg) {
    Reg[Reg["Conf"] = 1] = "Conf";
    Reg[Reg["Temp"] = 0] = "Temp";
    Reg[Reg["Tos"] = 3] = "Tos";
    Reg[Reg["Thyst"] = 2] = "Thyst";
})(Reg || (Reg = {}));
var ConfMask;
(function (ConfMask) {
    // reserved
    // reserved
    // reserved
    ConfMask[ConfMask["OS_F_QUE"] = 24] = "OS_F_QUE";
    ConfMask[ConfMask["OS_POL"] = 4] = "OS_POL";
    ConfMask[ConfMask["OS_COMP_INT"] = 2] = "OS_COMP_INT";
    ConfMask[ConfMask["SHUTDOWN"] = 1] = "SHUTDOWN";
})(ConfMask || (ConfMask = {}));
export class LM75A {
    bus;
    addr;
    /**
     * Creates a new instance of the LM75A temperature sensor.
     * @param bus The I2C bus used for communication
     * @param addrBits Selects the I2C address (addr | (addrBits & 0b111))
     */
    constructor(bus, addrBits) {
        this.bus = bus;
        this.addr = ADDR_BASE | (addrBits & 0b111);
        this.init();
    }
    /**
     * Initializes the sensor
     */
    init() {
        this.bus.writeTo(this.addr, [Reg.Conf, 0x00]);
    }
    /**
     * Reads the temperature in degrees Celsius.
     */
    readTemperature() {
        let value = this.bus.writeRead(this.addr, Reg.Temp, 2);
        let deg = ((value[1] | (value[0] << 8)) >> 5) / 8.0;
        if (value[0] & 0x80) {
            deg -= 256;
        }
        return deg;
    }
}
