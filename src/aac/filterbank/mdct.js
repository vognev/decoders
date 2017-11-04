const Tables = require('./mdct_tables');
const FFT = require('./fft');

module.exports = class MDCT {
    constructor(length) {
        this.N = length;
        this.N2 = length >> 1;
        this.N4 = length >> 2;
        this.N8 = length >> 3;

        switch (length) {
            case 2048:
                this.sincos = Tables.MDCT_TABLE_2048;
                break;
            case 256:
                this.sincos = Tables.MDCT_TABLE_256;
                break;
            case 1920:
                this.sincos = Tables.MDCT_TABLE_1920;
                break;
            case 240:
                this.sincos = Tables.MDCT_TABLE_240;
                break; // fixme: break needed?
            default:
                throw "unsupported MDCT length: " + length;
        }

        this.fft = new FFT(this.N4);

        // private final float[][] buf = new float[N4][2];
        this.buf = (new Float32Array(this.N4 * 2));
    }

    process(inp, inOff, out, outOff) {
        // if (this.processed) throw 'processed'; this.processed = true;
        let k, tmp0, tmp1;

        const N2 = this.N2, N4 = this.N4, N8 = this.N8, buf = this.buf, sincos = this.sincos;

        //pre-IFFT complex multiplication
        for (k = 0; k < N4; k++) {
            buf[2 * k + 1] = (inp[inOff + 2 * k] * sincos[k][0]) + (inp[inOff + N2 - 1 - 2 * k] * sincos[k][1]);
            buf[2 * k + 0] = (inp[inOff + N2 - 1 - 2 * k] * sincos[k][0]) - (inp[inOff + 2 * k] * sincos[k][1]);
        }

        //complex IFFT, non-scaling
        this.fft.process(buf, false);

        //post-IFFT complex multiplication
        for (k = 0; k < N4; k++) {
            tmp0 = buf[2 * k + 0];
            tmp1 = buf[2 * k + 1];
            buf[2 * k + 1] = (tmp1 * sincos[k][0]) + (tmp0 * sincos[k][1]);
            buf[2 * k + 0] = (tmp0 * sincos[k][0]) - (tmp1 * sincos[k][1]);
        }

        //reordering
        for (k = 0; k < N8; k += 2) {
            out[outOff + 2 * k] = buf[2 * (N8 + k) + 1];
            out[outOff + 2 + 2 * k] = buf[2 * (N8 + 1 + k) + 1];

            out[outOff + 1 + 2 * k] = -buf[2 * (N8 - 1 - k) + 0];
            out[outOff + 3 + 2 * k] = -buf[2 * (N8 - 2 - k) + 0];

            out[outOff + N4 + 2 * k] = buf[2 * k + 0];
            out[outOff + N4 + 2 + 2 * k] = buf[2 * (1 + k)+0];

            out[outOff + N4 + 1 + 2 * k] = -buf[2 * (N4 - 1 - k) + 1];
            out[outOff + N4 + 3 + 2 * k] = -buf[2 * (N4 - 2 - k) + 1];

            out[outOff + N2 + 2 * k] = buf[2 * (N8 + k) + 0];
            out[outOff + N2 + 2 + 2 * k] = buf[2 * (N8 + 1 + k) + 0];

            out[outOff + N2 + 1 + 2 * k] = -buf[2 * (N8 - 1 - k) + 1];
            out[outOff + N2 + 3 + 2 * k] = -buf[2 * (N8 - 2 - k) + 1];

            out[outOff + N2 + N4 + 2 * k] = -buf[2 * k + 1];
            out[outOff + N2 + N4 + 2 + 2 * k] = -buf[2 * (1 + k) + 1];

            out[outOff + N2 + N4 + 1 + 2 * k] = buf[2 * (N4 - 1 - k) + 0];
            out[outOff + N2 + N4 + 3 + 2 * k] = buf[2 * (N4 - 2 - k) + 0];
        }
    }
};
