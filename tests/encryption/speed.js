function speed() {
        // construct encryption key
        var key = "00112233445566778899aabbccddeeff".hexToBytes();
        var aes = new DlCryptAES({ key: key, mode: "CTR" });

        aes.setTimestampIV();

        // transform text to bytes
        var text = "foo bar baz boo!foo bar baz boo!".x(5000);

        console.log("Text length: %d", text.length);

        console.time("textToBytes");
        var data = text.toBytes();
        console.timeEnd("textToBytes");

        // encrypt bytes
        console.time("encode");
        var out = aes.encodeBytes(data);
        console.timeEnd("encode");

        // decrypt bytes
        console.time("decode");
        var out2 = aes.decodeBytes(out);
        console.timeEnd("decode");

        // transform bytes to text
        console.time("bytesToString");
        var txt = out2.bytesToString();
        console.timeEnd("bytesToString");

        console.log(text == txt);
};

function base64() {
        var str = "şmenozeală";
        var bytes = str.toBytes();
        var base64 = bytes.bytesToBase64();
        console.log(base64);
        var back = base64.base64ToBytes();
        console.log(back.bytesToString());
};

function RUN() {

        new DlButton({ label: "Run it", focusable: true, parent: desktop }).addEventListener("onClick", speed);
        new DlButton({ label: "Base 64", focusable: true, parent: desktop }).addEventListener("onClick", base64);

};
