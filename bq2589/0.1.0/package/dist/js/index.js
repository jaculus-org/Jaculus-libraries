const ADDRESS = 0x6a;
export class BQ2589 {
    bus;
    constructor(bus) {
        this.bus = bus;
    }
    setBit(address, reg, bit, value) {
        this.bus.writeTo(address, reg);
        let data = this.bus.readFrom(address, 1)[0];
        data = value ? data | (1 << bit) : data & ~(1 << bit);
        this.bus.writeTo(address, [reg, data]);
    }
    startADCContinuous() {
        this.setBit(ADDRESS, 2, 6, true);
    }
    startADCOneshot() {
        this.setBit(ADDRESS, 2, 7, true);
    }
    readADC() {
        this.bus.writeTo(ADDRESS, 0x0f);
        let value = this.bus.readFrom(ADDRESS, 1)[0];
        return (value * 20 + 2304) / 1000;
    }
    resetWatchdog() {
        this.setBit(ADDRESS, 3, 6, true);
    }
    async readADCOneshot() {
        this.startADCOneshot();
        await sleep(50);
        return this.readADC();
    }
    startBatteryChecker(setStatus, batteryThreshold = 3.2, intervalMs = 10000) {
        let blinkTimer = undefined;
        let blinkState = false;
        setInterval(async () => {
            const u = await this.readADCOneshot();
            if (u < batteryThreshold && blinkTimer === undefined) {
                blinkTimer = setInterval(() => {
                    blinkState = !blinkState;
                    setStatus(blinkState ? 1 : 0);
                    if (blinkState) {
                        console.log(`Battery low: ${u.toFixed(2)} V`);
                    }
                }, 500);
            }
            else if (u >= batteryThreshold && blinkTimer !== undefined) {
                clearInterval(blinkTimer);
                setStatus(0);
                blinkTimer = undefined;
            }
        }, intervalMs);
    }
}
