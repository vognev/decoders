const Tables = require('./fft_tables');

module.exports = class FFT {
    constructor(length) {
        this.length = length;

        switch (length) {
            case 64:
                this.roots = Tables.FFT_TABLE_64;
                this.tabln = 2;
                break;
            case 512:
                this.roots = Tables.FFT_TABLE_512;
                this.tabln = 3;
                break;
            case 60:
                this.roots = Tables.FFT_TABLE_60;
                this.tabln = 2;
                break;
            case 480:
                this.roots = Tables.FFT_TABLE_480;
                this.tabln = 3;
                break;
            default:
                throw "unexpected FFT length: " + length;
        }
    }

    process(inp, forward) {
        const imOff = forward ? 2 : 1;
        const len = this.length; //N4 of MDCT
        const scale = forward ? len : 1;
        const rev = new Float32Array(len * 2);

        //bit-reversal
        let ii = 0;
        for (let i = 0; i < len; i++) {
            rev[i * 2 + 0] = inp[2 * ii + 0];
            rev[i * 2 + 1] = inp[2 * ii + 1];
            let k = len >> 1;
            while (ii >= k && k > 0) {
                ii -= k;
                k >>= 1;
            }
            ii += k;
        }
        for (let i = 0; i < len; i++) {
            inp[2 * i + 0] = rev[i * 2 + 0];
            inp[2 * i + 1] = rev[i * 2 + 1];
        }

        //bottom base-4 round
        for (let i = 0; i < len; i += 4) {
            const a0 = inp[2 * i + 0] + inp[2 * (i + 1) + 0];
            const a1 = inp[2 * i + 1] + inp[2 * (i + 1) + 1];
            const b0 = inp[2 * (i + 2) + 0] + inp[2 * (i + 3) + 0];
            const b1 = inp[2 * (i + 2) + 1] + inp[2 * (i + 3) + 1];
            const c0 = inp[2 * i + 0] - inp[2 * (i + 1) + 0];
            const c1 = inp[2 * i + 1] - inp[2 * (i + 1) + 1];
            const d0 = inp[2 * (i + 2) + 0] - inp[2 * (i + 3) + 0];
            const d1 = inp[2 * (i + 2) + 1] - inp[2 * (i + 3) + 1];

            inp[2 * i + 0] = a0 + b0;
            inp[2 * i + 1] = a1 + b1;
            inp[2 * (i + 2) + 0] = a0 - b0;
            inp[2 * (i + 2) + 1] = a1 - b1;

            const e1_0 = c0 - d1;
            const e1_1 = c1 + d0;
            const e2_0 = c0 + d1;
            const e2_1 = c1 - d0;

            if (forward) {
                inp[2 * (i + 1) + 0] = e2_0;
                inp[2 * (i + 1) + 1] = e2_1;
                inp[2 * (i + 3) + 0] = e1_0;
                inp[2 * (i + 3) + 1] = e1_1;
            }
            else {
                inp[2 * (i + 1) + 0] = e1_0;
                inp[2 * (i + 1) + 1] = e1_1;
                inp[2 * (i + 3) + 0] = e2_0;
                inp[2 * (i + 3) + 1] = e2_1;
            }
        }

        //iterations from bottom to top
        let shift, m, km;
        let rootRe, rootIm, zRe, zIm;

        for (let i = 4; i < len; i <<= 1) {
            shift = i << 1;
            m = len / shift;
            for (let j = 0; j < len; j += shift) {
                for (let k = 0; k < i; k++) {
                    km = k * m;
                    rootRe = this.roots[this.tabln * km + 0];
                    rootIm = this.roots[this.tabln * km + imOff];
                    zRe = inp[2 * (i + j + k) + 0] * rootRe - inp[2 * (i + j + k) + 1] * rootIm;
                    zIm = inp[2 * (i + j + k) + 0] * rootIm + inp[2 * (i + j + k) + 1] * rootRe;

                    inp[2 * (i + j + k) + 0] = (inp[2 * (j + k) + 0] - zRe) * scale;
                    inp[2 * (i + j + k) + 1] = (inp[2 * (j + k) + 1] - zIm) * scale;
                    inp[2 * (j + k) + 0] = (inp[2 * (j + k) + 0] + zRe) * scale;
                    inp[2 * (j + k) + 1] = (inp[2 * (j + k) + 1] + zIm) * scale;
                }
            }
        }
    }
};