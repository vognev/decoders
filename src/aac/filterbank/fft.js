const Tables = require('./fft_tables');

module.exports = class FFT {
    constructor(length) {
        this.length = length;

        switch (length) {
            case 64:
                this.roots = Tables.FFT_TABLE_64;
                break;
            case 512:
                this.roots = Tables.FFT_TABLE_512;
                break;
            case 60:
                this.roots = Tables.FFT_TABLE_60;
                break;
            case 480:
                this.roots = Tables.FFT_TABLE_480;
                break;
            default:
                throw "unexpected FFT length: " + length;
        }

        //processing buffers

        this.rev = (new Array(length)).fill().map(() => {
            return (new Array(2)).fill(0.0);
        });

        this.a = new Array(2).fill(0.0);
        this.b = new Array(2).fill(0.0);
        this.c = new Array(2).fill(0.0);
        this.d = new Array(2).fill(0.0);
        this.e1 = new Array(2).fill(0.0);
        this.e2 = new Array(2).fill(0.0);
    }

    process(inp, forward) {
        const imOff = forward ? 2 : 1;
        const scale = forward ? this.length : 1;

        //bit-reversal
        let ii = 0;
        for (let i = 0; i < this.length; i++) {
            this.rev[i][0] = inp[ii][0];
            this.rev[i][1] = inp[ii][1];
            let k = this.length >> 1;
            while (ii >= k && k > 0) {
                ii -= k;
                k >>= 1;
            }
            ii += k;
        }
        for (let i = 0; i < this.length; i++) {
            inp[i][0] = this.rev[i][0];
            inp[i][1] = this.rev[i][1];
        }

        //bottom base-4 round
        for (let i = 0; i < this.length; i += 4) {
            this.a[0] = inp[i][0] + inp[i + 1][0];
            this.a[1] = inp[i][1] + inp[i + 1][1];
            this.b[0] = inp[i + 2][0] + inp[i + 3][0];
            this.b[1] = inp[i + 2][1] + inp[i + 3][1];
            this.c[0] = inp[i][0] - inp[i + 1][0];
            this.c[1] = inp[i][1] - inp[i + 1][1];
            this.d[0] = inp[i + 2][0] - inp[i + 3][0];
            this.d[1] = inp[i + 2][1] - inp[i + 3][1];
            inp[i][0] = this.a[0] + this.b[0];
            inp[i][1] = this.a[1] + this.b[1];
            inp[i + 2][0] = this.a[0] - this.b[0];
            inp[i + 2][1] = this.a[1] - this.b[1];

            this.e1[0] = this.c[0] - this.d[1];
            this.e1[1] = this.c[1] + this.d[0];
            this.e2[0] = this.c[0] + this.d[1];
            this.e2[1] = this.c[1] - this.d[0];
            if (forward) {
                inp[i + 1][0] = this.e2[0];
                inp[i + 1][1] = this.e2[1];
                inp[i + 3][0] = this.e1[0];
                inp[i + 3][1] = this.e1[1];
            }
            else {
                inp[i + 1][0] = this.e1[0];
                inp[i + 1][1] = this.e1[1];
                inp[i + 3][0] = this.e2[0];
                inp[i + 3][1] = this.e2[1];
            }
        }

        //iterations from bottom to top
        let shift, m, km;
        let rootRe, rootIm, zRe, zIm;

        for (let i = 4; i < this.length; i <<= 1) {
            shift = i << 1;
            m = this.length / shift;
            for (let j = 0; j < this.length; j += shift) {
                for (let k = 0; k < i; k++) {
                    km = k * m;
                    rootRe = this.roots[km][0];
                    rootIm = this.roots[km][imOff];
                    zRe = inp[i + j + k][0] * rootRe - inp[i + j + k][1] * rootIm;
                    zIm = inp[i + j + k][0] * rootIm + inp[i + j + k][1] * rootRe;

                    inp[i + j + k][0] = (inp[j + k][0] - zRe) * scale;
                    inp[i + j + k][1] = (inp[j + k][1] - zIm) * scale;
                    inp[j + k][0] = (inp[j + k][0] + zRe) * scale;
                    inp[j + k][1] = (inp[j + k][1] + zIm) * scale;
                }
            }
        }
    }
};