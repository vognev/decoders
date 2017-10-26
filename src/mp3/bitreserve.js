/**
 * Size of the internal buffer to store the reserved bits.
 * Must be a power of 2. And x8, as each bit is stored as a single
 * entry.
 */
const BUFSIZE = 4096 * 8;

/**
 * Mask that can be used to quickly implement the
 * modulus operation on BUFSIZE.
 */
const BUFSIZE_MASK = BUFSIZE - 1;

module.exports = class BitReserve {
    constructor() {
        this.offset = this.totbit = this.buf_byte_idx = 0;
        this.buf = (new Array(BUFSIZE)).fill(0)
    }

    hputbuf(val) {
        let ofs = this.offset;

        this.buf[ofs++] = val & 0x80;
        this.buf[ofs++] = val & 0x40;
        this.buf[ofs++] = val & 0x20;
        this.buf[ofs++] = val & 0x10;
        this.buf[ofs++] = val & 0x08;
        this.buf[ofs++] = val & 0x04;
        this.buf[ofs++] = val & 0x02;
        this.buf[ofs++] = val & 0x01;

        if (ofs === BUFSIZE)
            this.offset = 0;
        else
            this.offset = ofs;
    }

    hsstell() {
        return this.totbit;
    }

    hgetbits(N) {
        this.totbit += N;

        let val = 0;
        let pos = this.buf_byte_idx;

        if (pos + N < BUFSIZE) {
            while (N-- > 0) {
                val <<= 1;
                val |= ((this.buf[pos++] !== 0) ? 1 : 0);
            }
        }
        else {
            while (N-- > 0) {
                val <<= 1;
                val |= ((this.buf[pos] !== 0) ? 1 : 0);
                pos = (pos + 1) & BUFSIZE_MASK;
            }
        }

        this.buf_byte_idx = pos;
        return val;
    }

    rewindNbytes(N) {
        let bits = (N << 3);

        this.totbit -= bits;
        this.buf_byte_idx -= bits;

        if (this.buf_byte_idx < 0)
            this.buf_byte_idx += BUFSIZE;
    }

    hget1bit() {
        this.totbit++;
        let val = this.buf[this.buf_byte_idx];
        this.buf_byte_idx = (this.buf_byte_idx + 1) & BUFSIZE_MASK;
        return val;
    }

    rewindNbits(N) {
        this.totbit -= N;
        this.buf_byte_idx -= N;
        if (this.buf_byte_idx < 0)
            this.buf_byte_idx += BUFSIZE;
    }
};