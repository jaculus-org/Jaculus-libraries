# RC522

SPI driver for selecting ISO/IEC 14443-A cards and accessing MIFARE Classic 1K data blocks.

```ts
import { DEFAULT_KEY, formatUID, MifareClassic, RC522 } from "rc522";
import { SPI1 } from "spi";

const reader = new RC522(SPI1, 5);
const mifare = new MifareClassic(reader);

const uid = await reader.readCard();
if (uid !== null) {
    console.log(formatUID(uid));

    await mifare.authenticate(uid, 4, DEFAULT_KEY, "A");
    const data = await mifare.readBlock(4);
    console.log(data);

    mifare.stopCrypto();
    await reader.halt();
}
```

`MifareClassic` supports blocks 0–63. Writes to manufacturer block 0 and sector trailers are rejected to avoid destroying card metadata or access keys.

`readCard()` returns `null` when no card responds. Communication and malformed-response errors are thrown.
