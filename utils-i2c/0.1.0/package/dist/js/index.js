export function readInt16(bus, address, reg) {
    let value = bus.writeRead(address, reg, 2);
    return value[0] | (value[1] << 8);
}
export function readInt32(bus, address, reg) {
    let value = bus.writeRead(address, reg, 4);
    return value[0] | (value[1] << 8) | (value[2] << 16) | (value[3] << 24);
}
export function i2cScan(bus) {
    let found = [];
    for (let addr = 0x08; addr <= 0x77; addr++) {
        try {
            bus.readFrom(addr, 1);
            found.push(addr);
        }
        catch (e) {
            // No device at this address
        }
    }
    return found;
}
export function i2cScanPrint(bus) {
    console.log("Scanning I2C bus for devices...");
    let found = i2cScan(bus);
    if (found.length === 0) {
        console.log("No I2C devices found.");
    }
    else {
        console.log("I2C devices found at addresses:");
        for (let addr of found) {
            console.log(`- 0x${addr.toString(16).padStart(2, "0")}`);
        }
        console.log(`Total devices found: ${found.length}`);
    }
}
