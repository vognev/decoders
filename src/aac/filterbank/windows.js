class Windows {
    static generateSineWindow(len) {
        const d = new Array(len);
        for (let i = 0; i < len; i++) {
            d[i] = Math.sin((i + 0.5) * (Math.PI / (2.0 * len)))
        }
        return d;
    }

    static generateKBDWindow(alpha, len) {
        const PIN   = Math.PI / len,
            out     = new Array(len),
            f       = new Array(len),
            alpha2  = (alpha * PIN) * (alpha * PIN);

        let sum = 0;
        for (let n = 0; n < len; n++) {
            let tmp = n * (len - n) * alpha2,
                bessel = 1;

            for (let j = 50; j > 0; j--) {
                bessel = bessel * tmp / (j * j) + 1;
            }

            sum += bessel;
            f[n] = sum;
        }

        sum++;
        for (let n = 0; n < len; n++) {
            out[n] = Math.sqrt(f[n] / sum);
        }

        return out;
    }

    //static get SINE_120()  { return SINE_120; }
    static get SINE_128()  { return SINE_128; }
    //static get SINE_960()  { return SINE_960; }
    static get SINE_1024() { return SINE_1024; }

    //static get KBD_120()  { return KBD_120; }
    static get KBD_128()  { return KBD_128; }
    //static get KBD_960()  { return KBD_960; }
    static get KBD_1024() { return KBD_1024; }
}

//const SINE_120  = Windows.generateSineWindow(120);
const SINE_128  = Windows.generateSineWindow(128);
//const SINE_960  = Windows.generateSineWindow(960);
const SINE_1024 = Windows.generateSineWindow(1024);

//const KBD_120  = Windows.generateKBDWindow(120);
const KBD_128  = Windows.generateKBDWindow(6, 128);
//const KBD_960  = Windows.generateKBDWindow(960);
const KBD_1024 = Windows.generateKBDWindow(4, 1024);

module.exports = Windows;