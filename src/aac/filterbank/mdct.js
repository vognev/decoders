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

        this.buf = (new Array(this.N4)).fill().map(() => {
            return (new Array(2)).fill(0.0);
        });

        this.tmp = (new Array(2)).fill(0.0);
    }

    process(inp, inOff, out, outOff) {

        let k;

        //pre-IFFT complex multiplication
        for (k = 0; k < this.N4; k++) {
            this.buf[k][1] = (inp[inOff + 2 * k] * this.sincos[k][0]) + (inp[inOff + this.N2 - 1 - 2 * k] * this.sincos[k][1]);
            this.buf[k][0] = (inp[inOff + this.N2 - 1 - 2 * k] * this.sincos[k][0]) - (inp[inOff + 2 * k] * this.sincos[k][1]);
        }

        //complex IFFT, non-scaling
        this.fft.process(this.buf, false);

        //post-IFFT complex multiplication
        for(k = 0; k < this.N4; k++) {
            this.tmp[0] = this.buf[k][0];
            this.tmp[1] = this.buf[k][1];
            this.buf[k][1] = (this.tmp[1]*this.sincos[k][0])+(this.tmp[0]*this.sincos[k][1]);
            this.buf[k][0] = (this.tmp[0]*this.sincos[k][0])-(this.tmp[1]*this.sincos[k][1]);
        }

        //reordering
        for(k = 0; k < this.N8; k += 2) {
            out[outOff+2*k] = this.buf[this.N8+k][1];
            out[outOff+2+2*k] = this.buf[this.N8+1+k][1];

            out[outOff+1+2*k] = -this.buf[this.N8-1-k][0];
            out[outOff+3+2*k] = -this.buf[this.N8-2-k][0];

            out[outOff+this.N4+2*k] = this.buf[k][0];
            out[outOff+this.N4+2+2*k] = this.buf[1+k][0];

            out[outOff+this.N4+1+2*k] = -this.buf[this.N4-1-k][1];
            out[outOff+this.N4+3+2*k] = -this.buf[this.N4-2-k][1];

            out[outOff+this.N2+2*k] = this.buf[this.N8+k][0];
            out[outOff+this.N2+2+2*k] = this.buf[this.N8+1+k][0];

            out[outOff+this.N2+1+2*k] = -this.buf[this.N8-1-k][1];
            out[outOff+this.N2+3+2*k] = -this.buf[this.N8-2-k][1];

            out[outOff+this.N2+this.N4+2*k] = -this.buf[k][1];
            out[outOff+this.N2+this.N4+2+2*k] = -this.buf[1+k][1];

            out[outOff+this.N2+this.N4+1+2*k] = this.buf[this.N4-1-k][0];
            out[outOff+this.N2+this.N4+3+2*k] = this.buf[this.N4-2-k][0];
        }
    }
};

