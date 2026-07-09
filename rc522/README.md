# RFID Reader RC522

Driver for the RC522 RFID reader/writer module.

For simple text values, prefer the higher-level record helpers instead of reading blocks one by one:

```ts
import { RC522, DEFAULT_KEY } from "rc522";
import { SPI1 } from "spi";

const rfid = new RC522(SPI1, 5);

rfid.onCard(async (uid) => {
    await rfid.authenticate(uid, 4, "A", DEFAULT_KEY);

    await rfid.writeTextRecord(4, "Ahoj tabor!");
    const message = await rfid.readTextRecord(4);

    console.log(message);
    await rfid.haltCard();
    rfid.stopCrypto();
});
```
