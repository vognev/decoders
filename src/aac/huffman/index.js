module.exports = class Huffman {

    static get UNSIGNED() {
        return [false, false, true, true, false, false, true, true, true, true, true];
    }

    static get QUAD_LEN() {
        return 4;
    }

    static get PAIR_LEN() {
        return 2;
    }

    static decodeSpectralData(bitStream, cb, data, off) {
        const HCB = CODEBOOKS[cb-1];

        //find index
        const offset = Huffman.findOffset(bitStream, HCB);

        //copy data
        data[off]   = HCB[offset][2];
        data[off+1] = HCB[offset][3];

        if(cb < 5) {
            data[off+2] = HCB[offset][4];
            data[off+3] = HCB[offset][5];
        }

        //sign & escape
        if(cb < 11) {
            if(Huffman.UNSIGNED[cb - 1])
                Huffman.signValues(bitStream, data, off, cb < 5 ? Huffman.QUAD_LEN : Huffman.PAIR_LEN);
        }
        else if(cb === 11 || cb > 15) {
            //virtual codebooks are always unsigned
            Huffman.signValues(bitStream, data, off, cb < 5 ? Huffman.QUAD_LEN : Huffman.PAIR_LEN);
            if(Math.abs(data[off]) === 16)
                data[off] = Huffman.getEscape(bitStream, data[off]);
            if(Math.abs(data[off+1]) === 16)
                data[off+1] = Huffman.getEscape(bitStream, data[off+1]);
        }
        else throw "Huffman: unknown spectral codebook: " + cb;
    }

    static signValues(bitStream, data, off, len) {
        for(let i = off; i < off + len; i++) {
            if(data[i] !== 0) {
                if(!!bitStream.readBit())
                    data[i] = -data[i];
            }
        }
    }

    static decodeScaleFactor(bitStream) {
        const offset = Huffman.findOffset(bitStream, HCB_SF);

        return HCB_SF[offset][2];
    }

    static findOffset(bitStream, table) {
        let off = 0, len = table[off][0], cw = bitStream.readBits(len), j;

        while (cw !== table[off][1]) {
            off++;
            j = table[off][0] - len;
            len = table[off][0];
            cw <<= j;
            cw |= bitStream.readBits(j);
        }
        return off;
    }

    static getEscape(bitStream, s)
    {
        const neg = s < 0;

        let i = 4;

        while(!!bitStream.readBit()) {
            i++;
        }

        const j = bitStream.readBits(i) | (1 << i);

        return (neg ? -j : j);
    }
};

const HCB1 = [
    [1, 0, 0, 0, 0, 0],
    [5, 16, 1, 0, 0, 0],
    [5, 17, -1, 0, 0, 0],
    [5, 18, 0, 0, 0, -1],
    [5, 19, 0, 1, 0, 0],
    [5, 20, 0, 0, 0, 1],
    [5, 21, 0, 0, -1, 0],
    [5, 22, 0, 0, 1, 0],
    [5, 23, 0, -1, 0, 0],
    [7, 96, 1, -1, 0, 0],
    [7, 97, -1, 1, 0, 0],
    [7, 98, 0, 0, -1, 1],
    [7, 99, 0, 1, -1, 0],
    [7, 100, 0, -1, 1, 0],
    [7, 101, 0, 0, 1, -1],
    [7, 102, 1, 1, 0, 0],
    [7, 103, 0, 0, -1, -1],
    [7, 104, -1, -1, 0, 0],
    [7, 105, 0, -1, -1, 0],
    [7, 106, 1, 0, -1, 0],
    [7, 107, 0, 1, 0, -1],
    [7, 108, -1, 0, 1, 0],
    [7, 109, 0, 0, 1, 1],
    [7, 110, 1, 0, 1, 0],
    [7, 111, 0, -1, 0, 1],
    [7, 112, 0, 1, 1, 0],
    [7, 113, 0, 1, 0, 1],
    [7, 114, -1, 0, -1, 0],
    [7, 115, 1, 0, 0, 1],
    [7, 116, -1, 0, 0, -1],
    [7, 117, 1, 0, 0, -1],
    [7, 118, -1, 0, 0, 1],
    [7, 119, 0, -1, 0, -1],
    [9, 480, 1, 1, -1, 0],
    [9, 481, -1, 1, -1, 0],
    [9, 482, 1, -1, 1, 0],
    [9, 483, 0, 1, 1, -1],
    [9, 484, 0, 1, -1, 1],
    [9, 485, 0, -1, 1, 1],
    [9, 486, 0, -1, 1, -1],
    [9, 487, 1, -1, -1, 0],
    [9, 488, 1, 0, -1, 1],
    [9, 489, 0, 1, -1, -1],
    [9, 490, -1, 1, 1, 0],
    [9, 491, -1, 0, 1, -1],
    [9, 492, -1, -1, 1, 0],
    [9, 493, 0, -1, -1, 1],
    [9, 494, 1, -1, 0, 1],
    [9, 495, 1, -1, 0, -1],
    [9, 496, -1, 1, 0, -1],
    [9, 497, -1, -1, -1, 0],
    [9, 498, 0, -1, -1, -1],
    [9, 499, 0, 1, 1, 1],
    [9, 500, 1, 0, 1, -1],
    [9, 501, 1, 1, 0, 1],
    [9, 502, -1, 1, 0, 1],
    [9, 503, 1, 1, 1, 0],
    [10, 1008, -1, -1, 0, 1],
    [10, 1009, -1, 0, -1, -1],
    [10, 1010, 1, 1, 0, -1],
    [10, 1011, 1, 0, -1, -1],
    [10, 1012, -1, 0, -1, 1],
    [10, 1013, -1, -1, 0, -1],
    [10, 1014, -1, 0, 1, 1],
    [10, 1015, 1, 0, 1, 1],
    [11, 2032, 1, -1, 1, -1],
    [11, 2033, -1, 1, -1, 1],
    [11, 2034, -1, 1, 1, -1],
    [11, 2035, 1, -1, -1, 1],
    [11, 2036, 1, 1, 1, 1],
    [11, 2037, -1, -1, 1, 1],
    [11, 2038, 1, 1, -1, -1],
    [11, 2039, -1, -1, 1, -1],
    [11, 2040, -1, -1, -1, -1],
    [11, 2041, 1, 1, -1, 1],
    [11, 2042, 1, -1, 1, 1],
    [11, 2043, -1, 1, 1, 1],
    [11, 2044, -1, 1, -1, -1],
    [11, 2045, -1, -1, -1, 1],
    [11, 2046, 1, -1, -1, -1],
    [11, 2047, 1, 1, 1, -1]
];

const HCB2 = [
    [3, 0, 0, 0, 0, 0],
    [4, 2, 1, 0, 0, 0],
    [5, 6, -1, 0, 0, 0],
    [5, 7, 0, 0, 0, 1],
    [5, 8, 0, 0, -1, 0],
    [5, 9, 0, 0, 0, -1],
    [5, 10, 0, -1, 0, 0],
    [5, 11, 0, 0, 1, 0],
    [5, 12, 0, 1, 0, 0],
    [6, 26, 0, -1, 1, 0],
    [6, 27, -1, 1, 0, 0],
    [6, 28, 0, 1, -1, 0],
    [6, 29, 0, 0, 1, -1],
    [6, 30, 0, 1, 0, -1],
    [6, 31, 0, 0, -1, 1],
    [6, 32, -1, 0, 0, -1],
    [6, 33, 1, -1, 0, 0],
    [6, 34, 1, 0, -1, 0],
    [6, 35, -1, -1, 0, 0],
    [6, 36, 0, 0, -1, -1],
    [6, 37, 1, 0, 1, 0],
    [6, 38, 1, 0, 0, 1],
    [6, 39, 0, -1, 0, 1],
    [6, 40, -1, 0, 1, 0],
    [6, 41, 0, 1, 0, 1],
    [6, 42, 0, -1, -1, 0],
    [6, 43, -1, 0, 0, 1],
    [6, 44, 0, -1, 0, -1],
    [6, 45, -1, 0, -1, 0],
    [6, 46, 1, 1, 0, 0],
    [6, 47, 0, 1, 1, 0],
    [6, 48, 0, 0, 1, 1],
    [6, 49, 1, 0, 0, -1],
    [7, 100, 0, 1, -1, 1],
    [7, 101, 1, 0, -1, 1],
    [7, 102, -1, 1, -1, 0],
    [7, 103, 0, -1, 1, -1],
    [7, 104, 1, -1, 1, 0],
    [7, 105, 1, 1, 0, -1],
    [7, 106, 1, 0, 1, 1],
    [7, 107, -1, 1, 1, 0],
    [7, 108, 0, -1, -1, 1],
    [7, 109, 1, 1, 1, 0],
    [7, 110, -1, 0, 1, -1],
    [7, 111, -1, -1, -1, 0],
    [7, 112, -1, 0, -1, 1],
    [7, 113, 1, -1, -1, 0],
    [7, 114, 1, 1, -1, 0],
    [8, 230, 1, -1, 0, 1],
    [8, 231, -1, 1, 0, -1],
    [8, 232, -1, -1, 1, 0],
    [8, 233, -1, 0, 1, 1],
    [8, 234, -1, -1, 0, 1],
    [8, 235, -1, -1, 0, -1],
    [8, 236, 0, -1, -1, -1],
    [8, 237, 1, 0, 1, -1],
    [8, 238, 1, 0, -1, -1],
    [8, 239, 0, 1, -1, -1],
    [8, 240, 0, 1, 1, 1],
    [8, 241, -1, 1, 0, 1],
    [8, 242, -1, 0, -1, -1],
    [8, 243, 0, 1, 1, -1],
    [8, 244, 1, -1, 0, -1],
    [8, 245, 0, -1, 1, 1],
    [8, 246, 1, 1, 0, 1],
    [8, 247, 1, -1, 1, -1],
    [8, 248, -1, 1, -1, 1],
    [9, 498, 1, -1, -1, 1],
    [9, 499, -1, -1, -1, -1],
    [9, 500, -1, 1, 1, -1],
    [9, 501, -1, 1, 1, 1],
    [9, 502, 1, 1, 1, 1],
    [9, 503, -1, -1, 1, -1],
    [9, 504, 1, -1, 1, 1],
    [9, 505, -1, 1, -1, -1],
    [9, 506, -1, -1, 1, 1],
    [9, 507, 1, 1, -1, -1],
    [9, 508, 1, -1, -1, -1],
    [9, 509, -1, -1, -1, 1],
    [9, 510, 1, 1, -1, 1],
    [9, 511, 1, 1, 1, -1]
];

const HCB3 = [
    [1, 0, 0, 0, 0, 0],
    [4, 8, 1, 0, 0, 0],
    [4, 9, 0, 0, 0, 1],
    [4, 10, 0, 1, 0, 0],
    [4, 11, 0, 0, 1, 0],
    [5, 24, 1, 1, 0, 0],
    [5, 25, 0, 0, 1, 1],
    [6, 52, 0, 1, 1, 0],
    [6, 53, 0, 1, 0, 1],
    [6, 54, 1, 0, 1, 0],
    [6, 55, 0, 1, 1, 1],
    [6, 56, 1, 0, 0, 1],
    [6, 57, 1, 1, 1, 0],
    [7, 116, 1, 1, 1, 1],
    [7, 117, 1, 0, 1, 1],
    [7, 118, 1, 1, 0, 1],
    [8, 238, 2, 0, 0, 0],
    [8, 239, 0, 0, 0, 2],
    [8, 240, 0, 0, 1, 2],
    [8, 241, 2, 1, 0, 0],
    [8, 242, 1, 2, 1, 0],
    [9, 486, 0, 0, 2, 1],
    [9, 487, 0, 1, 2, 1],
    [9, 488, 1, 2, 0, 0],
    [9, 489, 0, 1, 1, 2],
    [9, 490, 2, 1, 1, 0],
    [9, 491, 0, 0, 2, 0],
    [9, 492, 0, 2, 1, 0],
    [9, 493, 0, 1, 2, 0],
    [9, 494, 0, 2, 0, 0],
    [9, 495, 0, 1, 0, 2],
    [9, 496, 2, 0, 1, 0],
    [9, 497, 1, 2, 1, 1],
    [9, 498, 0, 2, 1, 1],
    [9, 499, 1, 1, 2, 0],
    [9, 500, 1, 1, 2, 1],
    [10, 1002, 1, 2, 0, 1],
    [10, 1003, 1, 0, 2, 0],
    [10, 1004, 1, 0, 2, 1],
    [10, 1005, 0, 2, 0, 1],
    [10, 1006, 2, 1, 1, 1],
    [10, 1007, 1, 1, 1, 2],
    [10, 1008, 2, 1, 0, 1],
    [10, 1009, 1, 0, 1, 2],
    [10, 1010, 0, 0, 2, 2],
    [10, 1011, 0, 1, 2, 2],
    [10, 1012, 2, 2, 1, 0],
    [10, 1013, 1, 2, 2, 0],
    [10, 1014, 1, 0, 0, 2],
    [10, 1015, 2, 0, 0, 1],
    [10, 1016, 0, 2, 2, 1],
    [11, 2034, 2, 2, 0, 0],
    [11, 2035, 1, 2, 2, 1],
    [11, 2036, 1, 1, 0, 2],
    [11, 2037, 2, 0, 1, 1],
    [11, 2038, 1, 1, 2, 2],
    [11, 2039, 2, 2, 1, 1],
    [11, 2040, 0, 2, 2, 0],
    [11, 2041, 0, 2, 1, 2],
    [12, 4084, 1, 0, 2, 2],
    [12, 4085, 2, 2, 0, 1],
    [12, 4086, 2, 1, 2, 0],
    [12, 4087, 2, 2, 2, 0],
    [12, 4088, 0, 2, 2, 2],
    [12, 4089, 2, 2, 2, 1],
    [12, 4090, 2, 1, 2, 1],
    [12, 4091, 1, 2, 1, 2],
    [12, 4092, 1, 2, 2, 2],
    [13, 8186, 0, 2, 0, 2],
    [13, 8187, 2, 0, 2, 0],
    [13, 8188, 1, 2, 0, 2],
    [14, 16378, 2, 0, 2, 1],
    [14, 16379, 2, 1, 1, 2],
    [14, 16380, 2, 1, 0, 2],
    [15, 32762, 2, 2, 2, 2],
    [15, 32763, 2, 2, 1, 2],
    [15, 32764, 2, 1, 2, 2],
    [15, 32765, 2, 0, 1, 2],
    [15, 32766, 2, 0, 0, 2],
    [16, 65534, 2, 2, 0, 2],
    [16, 65535, 2, 0, 2, 2]
];

const HCB4 = [
    [4, 0, 1, 1, 1, 1],
    [4, 1, 0, 1, 1, 1],
    [4, 2, 1, 1, 0, 1],
    [4, 3, 1, 1, 1, 0],
    [4, 4, 1, 0, 1, 1],
    [4, 5, 1, 0, 0, 0],
    [4, 6, 1, 1, 0, 0],
    [4, 7, 0, 0, 0, 0],
    [4, 8, 0, 0, 1, 1],
    [4, 9, 1, 0, 1, 0],
    [5, 20, 1, 0, 0, 1],
    [5, 21, 0, 1, 1, 0],
    [5, 22, 0, 0, 0, 1],
    [5, 23, 0, 1, 0, 1],
    [5, 24, 0, 0, 1, 0],
    [5, 25, 0, 1, 0, 0],
    [7, 104, 2, 1, 1, 1],
    [7, 105, 1, 1, 2, 1],
    [7, 106, 1, 2, 1, 1],
    [7, 107, 1, 1, 1, 2],
    [7, 108, 2, 1, 1, 0],
    [7, 109, 2, 1, 0, 1],
    [7, 110, 1, 2, 1, 0],
    [7, 111, 2, 0, 1, 1],
    [7, 112, 0, 1, 2, 1],
    [8, 226, 0, 1, 1, 2],
    [8, 227, 1, 1, 2, 0],
    [8, 228, 0, 2, 1, 1],
    [8, 229, 1, 0, 1, 2],
    [8, 230, 1, 2, 0, 1],
    [8, 231, 1, 1, 0, 2],
    [8, 232, 1, 0, 2, 1],
    [8, 233, 2, 1, 0, 0],
    [8, 234, 2, 0, 1, 0],
    [8, 235, 1, 2, 0, 0],
    [8, 236, 2, 0, 0, 1],
    [8, 237, 0, 1, 0, 2],
    [8, 238, 0, 2, 1, 0],
    [8, 239, 0, 0, 1, 2],
    [8, 240, 0, 1, 2, 0],
    [8, 241, 0, 2, 0, 1],
    [8, 242, 1, 0, 0, 2],
    [8, 243, 0, 0, 2, 1],
    [8, 244, 1, 0, 2, 0],
    [8, 245, 2, 0, 0, 0],
    [8, 246, 0, 0, 0, 2],
    [9, 494, 0, 2, 0, 0],
    [9, 495, 0, 0, 2, 0],
    [9, 496, 1, 2, 2, 1],
    [9, 497, 2, 2, 1, 1],
    [9, 498, 2, 1, 2, 1],
    [9, 499, 1, 1, 2, 2],
    [9, 500, 1, 2, 1, 2],
    [9, 501, 2, 1, 1, 2],
    [10, 1004, 1, 2, 2, 0],
    [10, 1005, 2, 2, 1, 0],
    [10, 1006, 2, 1, 2, 0],
    [10, 1007, 0, 2, 2, 1],
    [10, 1008, 0, 1, 2, 2],
    [10, 1009, 2, 2, 0, 1],
    [10, 1010, 0, 2, 1, 2],
    [10, 1011, 2, 0, 2, 1],
    [10, 1012, 1, 0, 2, 2],
    [10, 1013, 2, 2, 2, 1],
    [10, 1014, 1, 2, 0, 2],
    [10, 1015, 2, 0, 1, 2],
    [10, 1016, 2, 1, 0, 2],
    [10, 1017, 1, 2, 2, 2],
    [11, 2036, 2, 1, 2, 2],
    [11, 2037, 2, 2, 1, 2],
    [11, 2038, 0, 2, 2, 0],
    [11, 2039, 2, 2, 0, 0],
    [11, 2040, 0, 0, 2, 2],
    [11, 2041, 2, 0, 2, 0],
    [11, 2042, 0, 2, 0, 2],
    [11, 2043, 2, 0, 0, 2],
    [11, 2044, 2, 2, 2, 2],
    [11, 2045, 0, 2, 2, 2],
    [11, 2046, 2, 2, 2, 0],
    [12, 4094, 2, 2, 0, 2],
    [12, 4095, 2, 0, 2, 2]
];

const HCB5 = [
    [1, 0, 0, 0],
    [4, 8, -1, 0],
    [4, 9, 1, 0],
    [4, 10, 0, 1],
    [4, 11, 0, -1],
    [5, 24, 1, -1],
    [5, 25, -1, 1],
    [5, 26, -1, -1],
    [5, 27, 1, 1],
    [7, 112, -2, 0],
    [7, 113, 0, 2],
    [7, 114, 2, 0],
    [7, 115, 0, -2],
    [8, 232, -2, -1],
    [8, 233, 2, 1],
    [8, 234, -1, -2],
    [8, 235, 1, 2],
    [8, 236, -2, 1],
    [8, 237, 2, -1],
    [8, 238, -1, 2],
    [8, 239, 1, -2],
    [8, 240, -3, 0],
    [8, 241, 3, 0],
    [8, 242, 0, -3],
    [8, 243, 0, 3],
    [9, 488, -3, -1],
    [9, 489, 1, 3],
    [9, 490, 3, 1],
    [9, 491, -1, -3],
    [9, 492, -3, 1],
    [9, 493, 3, -1],
    [9, 494, 1, -3],
    [9, 495, -1, 3],
    [9, 496, -2, 2],
    [9, 497, 2, 2],
    [9, 498, -2, -2],
    [9, 499, 2, -2],
    [10, 1000, -3, -2],
    [10, 1001, 3, -2],
    [10, 1002, -2, 3],
    [10, 1003, 2, -3],
    [10, 1004, 3, 2],
    [10, 1005, 2, 3],
    [10, 1006, -3, 2],
    [10, 1007, -2, -3],
    [10, 1008, 0, -4],
    [10, 1009, -4, 0],
    [10, 1010, 4, 1],
    [10, 1011, 4, 0],
    [11, 2024, -4, -1],
    [11, 2025, 0, 4],
    [11, 2026, 4, -1],
    [11, 2027, -1, -4],
    [11, 2028, 1, 4],
    [11, 2029, -1, 4],
    [11, 2030, -4, 1],
    [11, 2031, 1, -4],
    [11, 2032, 3, -3],
    [11, 2033, -3, -3],
    [11, 2034, -3, 3],
    [11, 2035, -2, 4],
    [11, 2036, -4, -2],
    [11, 2037, 4, 2],
    [11, 2038, 2, -4],
    [11, 2039, 2, 4],
    [11, 2040, 3, 3],
    [11, 2041, -4, 2],
    [12, 4084, -2, -4],
    [12, 4085, 4, -2],
    [12, 4086, 3, -4],
    [12, 4087, -4, -3],
    [12, 4088, -4, 3],
    [12, 4089, 3, 4],
    [12, 4090, -3, 4],
    [12, 4091, 4, 3],
    [12, 4092, 4, -3],
    [12, 4093, -3, -4],
    [13, 8188, 4, -4],
    [13, 8189, -4, 4],
    [13, 8190, 4, 4],
    [13, 8191, -4, -4]
];

const HCB6 = [
    [4, 0, 0, 0],
    [4, 1, 1, 0],
    [4, 2, 0, -1],
    [4, 3, 0, 1],
    [4, 4, -1, 0],
    [4, 5, 1, 1],
    [4, 6, -1, 1],
    [4, 7, 1, -1],
    [4, 8, -1, -1],
    [6, 36, 2, -1],
    [6, 37, 2, 1],
    [6, 38, -2, 1],
    [6, 39, -2, -1],
    [6, 40, -2, 0],
    [6, 41, -1, 2],
    [6, 42, 2, 0],
    [6, 43, 1, -2],
    [6, 44, 1, 2],
    [6, 45, 0, -2],
    [6, 46, -1, -2],
    [6, 47, 0, 2],
    [6, 48, 2, -2],
    [6, 49, -2, 2],
    [6, 50, -2, -2],
    [6, 51, 2, 2],
    [7, 104, -3, 1],
    [7, 105, 3, 1],
    [7, 106, 3, -1],
    [7, 107, -1, 3],
    [7, 108, -3, -1],
    [7, 109, 1, 3],
    [7, 110, 1, -3],
    [7, 111, -1, -3],
    [7, 112, 3, 0],
    [7, 113, -3, 0],
    [7, 114, 0, -3],
    [7, 115, 0, 3],
    [7, 116, 3, 2],
    [8, 234, -3, -2],
    [8, 235, -2, 3],
    [8, 236, 2, 3],
    [8, 237, 3, -2],
    [8, 238, 2, -3],
    [8, 239, -2, -3],
    [8, 240, -3, 2],
    [8, 241, 3, 3],
    [9, 484, 3, -3],
    [9, 485, -3, -3],
    [9, 486, -3, 3],
    [9, 487, 1, -4],
    [9, 488, -1, -4],
    [9, 489, 4, 1],
    [9, 490, -4, 1],
    [9, 491, -4, -1],
    [9, 492, 1, 4],
    [9, 493, 4, -1],
    [9, 494, -1, 4],
    [9, 495, 0, -4],
    [9, 496, -4, 2],
    [9, 497, -4, -2],
    [9, 498, 2, 4],
    [9, 499, -2, -4],
    [9, 500, -4, 0],
    [9, 501, 4, 2],
    [9, 502, 4, -2],
    [9, 503, -2, 4],
    [9, 504, 4, 0],
    [9, 505, 2, -4],
    [9, 506, 0, 4],
    [10, 1014, -3, -4],
    [10, 1015, -3, 4],
    [10, 1016, 3, -4],
    [10, 1017, 4, -3],
    [10, 1018, 3, 4],
    [10, 1019, 4, 3],
    [10, 1020, -4, 3],
    [10, 1021, -4, -3],
    [11, 2044, 4, 4],
    [11, 2045, -4, 4],
    [11, 2046, -4, -4],
    [11, 2047, 4, -4]
];

const HCB7 = [
    [1, 0, 0, 0],
    [3, 4, 1, 0],
    [3, 5, 0, 1],
    [4, 12, 1, 1],
    [6, 52, 2, 1],
    [6, 53, 1, 2],
    [6, 54, 2, 0],
    [6, 55, 0, 2],
    [7, 112, 3, 1],
    [7, 113, 1, 3],
    [7, 114, 2, 2],
    [7, 115, 3, 0],
    [7, 116, 0, 3],
    [8, 234, 2, 3],
    [8, 235, 3, 2],
    [8, 236, 1, 4],
    [8, 237, 4, 1],
    [8, 238, 1, 5],
    [8, 239, 5, 1],
    [8, 240, 3, 3],
    [8, 241, 2, 4],
    [8, 242, 0, 4],
    [8, 243, 4, 0],
    [9, 488, 4, 2],
    [9, 489, 2, 5],
    [9, 490, 5, 2],
    [9, 491, 0, 5],
    [9, 492, 6, 1],
    [9, 493, 5, 0],
    [9, 494, 1, 6],
    [9, 495, 4, 3],
    [9, 496, 3, 5],
    [9, 497, 3, 4],
    [9, 498, 5, 3],
    [9, 499, 2, 6],
    [9, 500, 6, 2],
    [9, 501, 1, 7],
    [10, 1004, 3, 6],
    [10, 1005, 0, 6],
    [10, 1006, 6, 0],
    [10, 1007, 4, 4],
    [10, 1008, 7, 1],
    [10, 1009, 4, 5],
    [10, 1010, 7, 2],
    [10, 1011, 5, 4],
    [10, 1012, 6, 3],
    [10, 1013, 2, 7],
    [10, 1014, 7, 3],
    [10, 1015, 6, 4],
    [10, 1016, 5, 5],
    [10, 1017, 4, 6],
    [10, 1018, 3, 7],
    [11, 2038, 7, 0],
    [11, 2039, 0, 7],
    [11, 2040, 6, 5],
    [11, 2041, 5, 6],
    [11, 2042, 7, 4],
    [11, 2043, 4, 7],
    [11, 2044, 5, 7],
    [11, 2045, 7, 5],
    [12, 4092, 7, 6],
    [12, 4093, 6, 6],
    [12, 4094, 6, 7],
    [12, 4095, 7, 7]
];

const HCB8 = [
    [3, 0, 1, 1],
    [4, 2, 2, 1],
    [4, 3, 1, 0],
    [4, 4, 1, 2],
    [4, 5, 0, 1],
    [4, 6, 2, 2],
    [5, 14, 0, 0],
    [5, 15, 2, 0],
    [5, 16, 0, 2],
    [5, 17, 3, 1],
    [5, 18, 1, 3],
    [5, 19, 3, 2],
    [5, 20, 2, 3],
    [6, 42, 3, 3],
    [6, 43, 4, 1],
    [6, 44, 1, 4],
    [6, 45, 4, 2],
    [6, 46, 2, 4],
    [6, 47, 3, 0],
    [6, 48, 0, 3],
    [6, 49, 4, 3],
    [6, 50, 3, 4],
    [6, 51, 5, 2],
    [7, 104, 5, 1],
    [7, 105, 2, 5],
    [7, 106, 1, 5],
    [7, 107, 5, 3],
    [7, 108, 3, 5],
    [7, 109, 4, 4],
    [7, 110, 5, 4],
    [7, 111, 0, 4],
    [7, 112, 4, 5],
    [7, 113, 4, 0],
    [7, 114, 2, 6],
    [7, 115, 6, 2],
    [7, 116, 6, 1],
    [7, 117, 1, 6],
    [8, 236, 3, 6],
    [8, 237, 6, 3],
    [8, 238, 5, 5],
    [8, 239, 5, 0],
    [8, 240, 6, 4],
    [8, 241, 0, 5],
    [8, 242, 4, 6],
    [8, 243, 7, 1],
    [8, 244, 7, 2],
    [8, 245, 2, 7],
    [8, 246, 6, 5],
    [8, 247, 7, 3],
    [8, 248, 1, 7],
    [8, 249, 5, 6],
    [8, 250, 3, 7],
    [9, 502, 6, 6],
    [9, 503, 7, 4],
    [9, 504, 6, 0],
    [9, 505, 4, 7],
    [9, 506, 0, 6],
    [9, 507, 7, 5],
    [9, 508, 7, 6],
    [9, 509, 6, 7],
    [10, 1020, 5, 7],
    [10, 1021, 7, 0],
    [10, 1022, 0, 7],
    [10, 1023, 7, 7]
];

const HCB9 = [
    [1, 0, 0, 0],
    [3, 4, 1, 0],
    [3, 5, 0, 1],
    [4, 12, 1, 1],
    [6, 52, 2, 1],
    [6, 53, 1, 2],
    [6, 54, 2, 0],
    [6, 55, 0, 2],
    [7, 112, 3, 1],
    [7, 113, 2, 2],
    [7, 114, 1, 3],
    [8, 230, 3, 0],
    [8, 231, 0, 3],
    [8, 232, 2, 3],
    [8, 233, 3, 2],
    [8, 234, 1, 4],
    [8, 235, 4, 1],
    [8, 236, 2, 4],
    [8, 237, 1, 5],
    [9, 476, 4, 2],
    [9, 477, 3, 3],
    [9, 478, 0, 4],
    [9, 479, 4, 0],
    [9, 480, 5, 1],
    [9, 481, 2, 5],
    [9, 482, 1, 6],
    [9, 483, 3, 4],
    [9, 484, 5, 2],
    [9, 485, 6, 1],
    [9, 486, 4, 3],
    [10, 974, 0, 5],
    [10, 975, 2, 6],
    [10, 976, 5, 0],
    [10, 977, 1, 7],
    [10, 978, 3, 5],
    [10, 979, 1, 8],
    [10, 980, 8, 1],
    [10, 981, 4, 4],
    [10, 982, 5, 3],
    [10, 983, 6, 2],
    [10, 984, 7, 1],
    [10, 985, 0, 6],
    [10, 986, 8, 2],
    [10, 987, 2, 8],
    [10, 988, 3, 6],
    [10, 989, 2, 7],
    [10, 990, 4, 5],
    [10, 991, 9, 1],
    [10, 992, 1, 9],
    [10, 993, 7, 2],
    [11, 1988, 6, 0],
    [11, 1989, 5, 4],
    [11, 1990, 6, 3],
    [11, 1991, 8, 3],
    [11, 1992, 0, 7],
    [11, 1993, 9, 2],
    [11, 1994, 3, 8],
    [11, 1995, 4, 6],
    [11, 1996, 3, 7],
    [11, 1997, 0, 8],
    [11, 1998, 10, 1],
    [11, 1999, 6, 4],
    [11, 2000, 2, 9],
    [11, 2001, 5, 5],
    [11, 2002, 8, 0],
    [11, 2003, 7, 0],
    [11, 2004, 7, 3],
    [11, 2005, 10, 2],
    [11, 2006, 9, 3],
    [11, 2007, 8, 4],
    [11, 2008, 1, 10],
    [11, 2009, 7, 4],
    [11, 2010, 6, 5],
    [11, 2011, 5, 6],
    [11, 2012, 4, 8],
    [11, 2013, 4, 7],
    [11, 2014, 3, 9],
    [11, 2015, 11, 1],
    [11, 2016, 5, 8],
    [11, 2017, 9, 0],
    [11, 2018, 8, 5],
    [12, 4038, 10, 3],
    [12, 4039, 2, 10],
    [12, 4040, 0, 9],
    [12, 4041, 11, 2],
    [12, 4042, 9, 4],
    [12, 4043, 6, 6],
    [12, 4044, 12, 1],
    [12, 4045, 4, 9],
    [12, 4046, 8, 6],
    [12, 4047, 1, 11],
    [12, 4048, 9, 5],
    [12, 4049, 10, 4],
    [12, 4050, 5, 7],
    [12, 4051, 7, 5],
    [12, 4052, 2, 11],
    [12, 4053, 1, 12],
    [12, 4054, 12, 2],
    [12, 4055, 11, 3],
    [12, 4056, 3, 10],
    [12, 4057, 5, 9],
    [12, 4058, 6, 7],
    [12, 4059, 8, 7],
    [12, 4060, 11, 4],
    [12, 4061, 0, 10],
    [12, 4062, 7, 6],
    [12, 4063, 12, 3],
    [12, 4064, 10, 0],
    [12, 4065, 10, 5],
    [12, 4066, 4, 10],
    [12, 4067, 6, 8],
    [12, 4068, 2, 12],
    [12, 4069, 9, 6],
    [12, 4070, 9, 7],
    [12, 4071, 4, 11],
    [12, 4072, 11, 0],
    [12, 4073, 6, 9],
    [12, 4074, 3, 11],
    [12, 4075, 5, 10],
    [13, 8152, 8, 8],
    [13, 8153, 7, 8],
    [13, 8154, 12, 5],
    [13, 8155, 3, 12],
    [13, 8156, 11, 5],
    [13, 8157, 7, 7],
    [13, 8158, 12, 4],
    [13, 8159, 11, 6],
    [13, 8160, 10, 6],
    [13, 8161, 4, 12],
    [13, 8162, 7, 9],
    [13, 8163, 5, 11],
    [13, 8164, 0, 11],
    [13, 8165, 12, 6],
    [13, 8166, 6, 10],
    [13, 8167, 12, 0],
    [13, 8168, 10, 7],
    [13, 8169, 5, 12],
    [13, 8170, 7, 10],
    [13, 8171, 9, 8],
    [13, 8172, 0, 12],
    [13, 8173, 11, 7],
    [13, 8174, 8, 9],
    [13, 8175, 9, 9],
    [13, 8176, 10, 8],
    [13, 8177, 7, 11],
    [13, 8178, 12, 7],
    [13, 8179, 6, 11],
    [13, 8180, 8, 11],
    [13, 8181, 11, 8],
    [13, 8182, 7, 12],
    [13, 8183, 6, 12],
    [14, 16368, 8, 10],
    [14, 16369, 10, 9],
    [14, 16370, 8, 12],
    [14, 16371, 9, 10],
    [14, 16372, 9, 11],
    [14, 16373, 9, 12],
    [14, 16374, 10, 11],
    [14, 16375, 12, 9],
    [14, 16376, 10, 10],
    [14, 16377, 11, 9],
    [14, 16378, 12, 8],
    [14, 16379, 11, 10],
    [14, 16380, 12, 10],
    [14, 16381, 12, 11],
    [15, 32764, 10, 12],
    [15, 32765, 11, 11],
    [15, 32766, 11, 12],
    [15, 32767, 12, 12]
];

const HCB10 = [
    [4, 0, 1, 1],
    [4, 1, 1, 2],
    [4, 2, 2, 1],
    [5, 6, 2, 2],
    [5, 7, 1, 0],
    [5, 8, 0, 1],
    [5, 9, 1, 3],
    [5, 10, 3, 2],
    [5, 11, 3, 1],
    [5, 12, 2, 3],
    [5, 13, 3, 3],
    [6, 28, 2, 0],
    [6, 29, 0, 2],
    [6, 30, 2, 4],
    [6, 31, 4, 2],
    [6, 32, 1, 4],
    [6, 33, 4, 1],
    [6, 34, 0, 0],
    [6, 35, 4, 3],
    [6, 36, 3, 4],
    [6, 37, 3, 0],
    [6, 38, 0, 3],
    [6, 39, 4, 4],
    [6, 40, 2, 5],
    [6, 41, 5, 2],
    [7, 84, 1, 5],
    [7, 85, 5, 1],
    [7, 86, 5, 3],
    [7, 87, 3, 5],
    [7, 88, 5, 4],
    [7, 89, 4, 5],
    [7, 90, 6, 2],
    [7, 91, 2, 6],
    [7, 92, 6, 3],
    [7, 93, 4, 0],
    [7, 94, 6, 1],
    [7, 95, 0, 4],
    [7, 96, 1, 6],
    [7, 97, 3, 6],
    [7, 98, 5, 5],
    [7, 99, 6, 4],
    [7, 100, 4, 6],
    [8, 202, 6, 5],
    [8, 203, 7, 2],
    [8, 204, 3, 7],
    [8, 205, 2, 7],
    [8, 206, 5, 6],
    [8, 207, 8, 2],
    [8, 208, 7, 3],
    [8, 209, 5, 0],
    [8, 210, 7, 1],
    [8, 211, 0, 5],
    [8, 212, 8, 1],
    [8, 213, 1, 7],
    [8, 214, 8, 3],
    [8, 215, 7, 4],
    [8, 216, 4, 7],
    [8, 217, 2, 8],
    [8, 218, 6, 6],
    [8, 219, 7, 5],
    [8, 220, 1, 8],
    [8, 221, 3, 8],
    [8, 222, 8, 4],
    [8, 223, 4, 8],
    [8, 224, 5, 7],
    [8, 225, 8, 5],
    [8, 226, 5, 8],
    [9, 454, 7, 6],
    [9, 455, 6, 7],
    [9, 456, 9, 2],
    [9, 457, 6, 0],
    [9, 458, 6, 8],
    [9, 459, 9, 3],
    [9, 460, 3, 9],
    [9, 461, 9, 1],
    [9, 462, 2, 9],
    [9, 463, 0, 6],
    [9, 464, 8, 6],
    [9, 465, 9, 4],
    [9, 466, 4, 9],
    [9, 467, 10, 2],
    [9, 468, 1, 9],
    [9, 469, 7, 7],
    [9, 470, 8, 7],
    [9, 471, 9, 5],
    [9, 472, 7, 8],
    [9, 473, 10, 3],
    [9, 474, 5, 9],
    [9, 475, 10, 4],
    [9, 476, 2, 10],
    [9, 477, 10, 1],
    [9, 478, 3, 10],
    [9, 479, 9, 6],
    [9, 480, 6, 9],
    [9, 481, 8, 0],
    [9, 482, 4, 10],
    [9, 483, 7, 0],
    [9, 484, 11, 2],
    [10, 970, 7, 9],
    [10, 971, 11, 3],
    [10, 972, 10, 6],
    [10, 973, 1, 10],
    [10, 974, 11, 1],
    [10, 975, 9, 7],
    [10, 976, 0, 7],
    [10, 977, 8, 8],
    [10, 978, 10, 5],
    [10, 979, 3, 11],
    [10, 980, 5, 10],
    [10, 981, 8, 9],
    [10, 982, 11, 5],
    [10, 983, 0, 8],
    [10, 984, 11, 4],
    [10, 985, 2, 11],
    [10, 986, 7, 10],
    [10, 987, 6, 10],
    [10, 988, 10, 7],
    [10, 989, 4, 11],
    [10, 990, 1, 11],
    [10, 991, 12, 2],
    [10, 992, 9, 8],
    [10, 993, 12, 3],
    [10, 994, 11, 6],
    [10, 995, 5, 11],
    [10, 996, 12, 4],
    [10, 997, 11, 7],
    [10, 998, 12, 5],
    [10, 999, 3, 12],
    [10, 1000, 6, 11],
    [10, 1001, 9, 0],
    [10, 1002, 10, 8],
    [10, 1003, 10, 0],
    [10, 1004, 12, 1],
    [10, 1005, 0, 9],
    [10, 1006, 4, 12],
    [10, 1007, 9, 9],
    [10, 1008, 12, 6],
    [10, 1009, 2, 12],
    [10, 1010, 8, 10],
    [11, 2022, 9, 10],
    [11, 2023, 1, 12],
    [11, 2024, 11, 8],
    [11, 2025, 12, 7],
    [11, 2026, 7, 11],
    [11, 2027, 5, 12],
    [11, 2028, 6, 12],
    [11, 2029, 10, 9],
    [11, 2030, 8, 11],
    [11, 2031, 12, 8],
    [11, 2032, 0, 10],
    [11, 2033, 7, 12],
    [11, 2034, 11, 0],
    [11, 2035, 10, 10],
    [11, 2036, 11, 9],
    [11, 2037, 11, 10],
    [11, 2038, 0, 11],
    [11, 2039, 11, 11],
    [11, 2040, 9, 11],
    [11, 2041, 10, 11],
    [11, 2042, 12, 0],
    [11, 2043, 8, 12],
    [12, 4088, 12, 9],
    [12, 4089, 10, 12],
    [12, 4090, 9, 12],
    [12, 4091, 11, 12],
    [12, 4092, 12, 11],
    [12, 4093, 0, 12],
    [12, 4094, 12, 10],
    [12, 4095, 12, 12]
];

const HCB11 = [
    [4, 0, 0, 0],
    [4, 1, 1, 1],
    [5, 4, 16, 16],
    [5, 5, 1, 0],
    [5, 6, 0, 1],
    [5, 7, 2, 1],
    [5, 8, 1, 2],
    [5, 9, 2, 2],
    [6, 20, 1, 3],
    [6, 21, 3, 1],
    [6, 22, 3, 2],
    [6, 23, 2, 0],
    [6, 24, 2, 3],
    [6, 25, 0, 2],
    [6, 26, 3, 3],
    [7, 54, 4, 1],
    [7, 55, 1, 4],
    [7, 56, 4, 2],
    [7, 57, 2, 4],
    [7, 58, 4, 3],
    [7, 59, 3, 4],
    [7, 60, 3, 0],
    [7, 61, 0, 3],
    [7, 62, 5, 1],
    [7, 63, 5, 2],
    [7, 64, 2, 5],
    [7, 65, 4, 4],
    [7, 66, 1, 5],
    [7, 67, 5, 3],
    [7, 68, 3, 5],
    [7, 69, 5, 4],
    [8, 140, 4, 5],
    [8, 141, 6, 2],
    [8, 142, 2, 6],
    [8, 143, 6, 1],
    [8, 144, 6, 3],
    [8, 145, 3, 6],
    [8, 146, 1, 6],
    [8, 147, 4, 16],
    [8, 148, 3, 16],
    [8, 149, 16, 5],
    [8, 150, 16, 3],
    [8, 151, 16, 4],
    [8, 152, 6, 4],
    [8, 153, 16, 6],
    [8, 154, 4, 0],
    [8, 155, 4, 6],
    [8, 156, 0, 4],
    [8, 157, 2, 16],
    [8, 158, 5, 5],
    [8, 159, 5, 16],
    [8, 160, 16, 7],
    [8, 161, 16, 2],
    [8, 162, 16, 8],
    [8, 163, 2, 7],
    [8, 164, 7, 2],
    [8, 165, 3, 7],
    [8, 166, 6, 5],
    [8, 167, 5, 6],
    [8, 168, 6, 16],
    [8, 169, 16, 10],
    [8, 170, 7, 3],
    [8, 171, 7, 1],
    [8, 172, 16, 9],
    [8, 173, 7, 16],
    [8, 174, 1, 16],
    [8, 175, 1, 7],
    [8, 176, 4, 7],
    [8, 177, 16, 11],
    [8, 178, 7, 4],
    [8, 179, 16, 12],
    [8, 180, 8, 16],
    [8, 181, 16, 1],
    [8, 182, 6, 6],
    [8, 183, 9, 16],
    [8, 184, 2, 8],
    [8, 185, 5, 7],
    [8, 186, 10, 16],
    [8, 187, 16, 13],
    [8, 188, 8, 3],
    [8, 189, 8, 2],
    [8, 190, 3, 8],
    [8, 191, 5, 0],
    [8, 192, 16, 14],
    [8, 193, 11, 16],
    [8, 194, 7, 5],
    [8, 195, 4, 8],
    [8, 196, 6, 7],
    [8, 197, 7, 6],
    [8, 198, 0, 5],
    [9, 398, 8, 4],
    [9, 399, 16, 15],
    [9, 400, 12, 16],
    [9, 401, 1, 8],
    [9, 402, 8, 1],
    [9, 403, 14, 16],
    [9, 404, 5, 8],
    [9, 405, 13, 16],
    [9, 406, 3, 9],
    [9, 407, 8, 5],
    [9, 408, 7, 7],
    [9, 409, 2, 9],
    [9, 410, 8, 6],
    [9, 411, 9, 2],
    [9, 412, 9, 3],
    [9, 413, 15, 16],
    [9, 414, 4, 9],
    [9, 415, 6, 8],
    [9, 416, 6, 0],
    [9, 417, 9, 4],
    [9, 418, 5, 9],
    [9, 419, 8, 7],
    [9, 420, 7, 8],
    [9, 421, 1, 9],
    [9, 422, 10, 3],
    [9, 423, 0, 6],
    [9, 424, 10, 2],
    [9, 425, 9, 1],
    [9, 426, 9, 5],
    [9, 427, 4, 10],
    [9, 428, 2, 10],
    [9, 429, 9, 6],
    [9, 430, 3, 10],
    [9, 431, 6, 9],
    [9, 432, 10, 4],
    [9, 433, 8, 8],
    [9, 434, 10, 5],
    [9, 435, 9, 7],
    [9, 436, 11, 3],
    [9, 437, 1, 10],
    [9, 438, 7, 0],
    [9, 439, 10, 6],
    [9, 440, 7, 9],
    [9, 441, 3, 11],
    [9, 442, 5, 10],
    [9, 443, 10, 1],
    [9, 444, 4, 11],
    [9, 445, 11, 2],
    [9, 446, 13, 2],
    [9, 447, 6, 10],
    [9, 448, 13, 3],
    [9, 449, 2, 11],
    [9, 450, 16, 0],
    [9, 451, 5, 11],
    [9, 452, 11, 5],
    [10, 906, 11, 4],
    [10, 907, 9, 8],
    [10, 908, 7, 10],
    [10, 909, 8, 9],
    [10, 910, 0, 16],
    [10, 911, 4, 13],
    [10, 912, 0, 7],
    [10, 913, 3, 13],
    [10, 914, 11, 6],
    [10, 915, 13, 1],
    [10, 916, 13, 4],
    [10, 917, 12, 3],
    [10, 918, 2, 13],
    [10, 919, 13, 5],
    [10, 920, 8, 10],
    [10, 921, 6, 11],
    [10, 922, 10, 8],
    [10, 923, 10, 7],
    [10, 924, 14, 2],
    [10, 925, 12, 4],
    [10, 926, 1, 11],
    [10, 927, 4, 12],
    [10, 928, 11, 1],
    [10, 929, 3, 12],
    [10, 930, 1, 13],
    [10, 931, 12, 2],
    [10, 932, 7, 11],
    [10, 933, 3, 14],
    [10, 934, 5, 12],
    [10, 935, 5, 13],
    [10, 936, 14, 4],
    [10, 937, 4, 14],
    [10, 938, 11, 7],
    [10, 939, 14, 3],
    [10, 940, 12, 5],
    [10, 941, 13, 6],
    [10, 942, 12, 6],
    [10, 943, 8, 0],
    [10, 944, 11, 8],
    [10, 945, 2, 12],
    [10, 946, 9, 9],
    [10, 947, 14, 5],
    [10, 948, 6, 13],
    [10, 949, 10, 10],
    [10, 950, 15, 2],
    [10, 951, 8, 11],
    [10, 952, 9, 10],
    [10, 953, 14, 6],
    [10, 954, 10, 9],
    [10, 955, 5, 14],
    [10, 956, 11, 9],
    [10, 957, 14, 1],
    [10, 958, 2, 14],
    [10, 959, 6, 12],
    [10, 960, 1, 12],
    [10, 961, 13, 8],
    [10, 962, 0, 8],
    [10, 963, 13, 7],
    [10, 964, 7, 12],
    [10, 965, 12, 7],
    [10, 966, 7, 13],
    [10, 967, 15, 3],
    [10, 968, 12, 1],
    [10, 969, 6, 14],
    [10, 970, 2, 15],
    [10, 971, 15, 5],
    [10, 972, 15, 4],
    [10, 973, 1, 14],
    [10, 974, 9, 11],
    [10, 975, 4, 15],
    [10, 976, 14, 7],
    [10, 977, 8, 13],
    [10, 978, 13, 9],
    [10, 979, 8, 12],
    [10, 980, 5, 15],
    [10, 981, 3, 15],
    [10, 982, 10, 11],
    [10, 983, 11, 10],
    [10, 984, 12, 8],
    [10, 985, 15, 6],
    [10, 986, 15, 7],
    [10, 987, 8, 14],
    [10, 988, 15, 1],
    [10, 989, 7, 14],
    [10, 990, 9, 0],
    [10, 991, 0, 9],
    [10, 992, 9, 13],
    [10, 993, 9, 12],
    [10, 994, 12, 9],
    [10, 995, 14, 8],
    [10, 996, 10, 13],
    [10, 997, 14, 9],
    [10, 998, 12, 10],
    [10, 999, 6, 15],
    [10, 1000, 7, 15],
    [11, 2002, 9, 14],
    [11, 2003, 15, 8],
    [11, 2004, 11, 11],
    [11, 2005, 11, 14],
    [11, 2006, 1, 15],
    [11, 2007, 10, 12],
    [11, 2008, 10, 14],
    [11, 2009, 13, 11],
    [11, 2010, 13, 10],
    [11, 2011, 11, 13],
    [11, 2012, 11, 12],
    [11, 2013, 8, 15],
    [11, 2014, 14, 11],
    [11, 2015, 13, 12],
    [11, 2016, 12, 13],
    [11, 2017, 15, 9],
    [11, 2018, 14, 10],
    [11, 2019, 10, 0],
    [11, 2020, 12, 11],
    [11, 2021, 9, 15],
    [11, 2022, 0, 10],
    [11, 2023, 12, 12],
    [11, 2024, 11, 0],
    [11, 2025, 12, 14],
    [11, 2026, 10, 15],
    [11, 2027, 13, 13],
    [11, 2028, 0, 13],
    [11, 2029, 14, 12],
    [11, 2030, 15, 10],
    [11, 2031, 15, 11],
    [11, 2032, 11, 15],
    [11, 2033, 14, 13],
    [11, 2034, 13, 0],
    [11, 2035, 0, 11],
    [11, 2036, 13, 14],
    [11, 2037, 15, 12],
    [11, 2038, 15, 13],
    [11, 2039, 12, 15],
    [11, 2040, 14, 0],
    [11, 2041, 14, 14],
    [11, 2042, 13, 15],
    [11, 2043, 12, 0],
    [11, 2044, 14, 15],
    [12, 4090, 0, 14],
    [12, 4091, 0, 12],
    [12, 4092, 15, 14],
    [12, 4093, 15, 0],
    [12, 4094, 0, 15],
    [12, 4095, 15, 15]
];

const HCB_SF = [
    [1, 0, 60],
    [3, 4, 59],
    [4, 10, 61],
    [4, 11, 58],
    [4, 12, 62],
    [5, 26, 57],
    [5, 27, 63],
    [6, 56, 56],
    [6, 57, 64],
    [6, 58, 55],
    [6, 59, 65],
    [7, 120, 66],
    [7, 121, 54],
    [7, 122, 67],
    [8, 246, 53],
    [8, 247, 68],
    [8, 248, 52],
    [8, 249, 69],
    [8, 250, 51],
    [9, 502, 70],
    [9, 503, 50],
    [9, 504, 49],
    [9, 505, 71],
    [10, 1012, 72],
    [10, 1013, 48],
    [10, 1014, 73],
    [10, 1015, 47],
    [10, 1016, 74],
    [10, 1017, 46],
    [11, 2036, 76],
    [11, 2037, 75],
    [11, 2038, 77],
    [11, 2039, 78],
    [11, 2040, 45],
    [11, 2041, 43],
    [12, 4084, 44],
    [12, 4085, 79],
    [12, 4086, 42],
    [12, 4087, 41],
    [12, 4088, 80],
    [12, 4089, 40],
    [13, 8180, 81],
    [13, 8181, 39],
    [13, 8182, 82],
    [13, 8183, 38],
    [13, 8184, 83],
    [14, 16370, 37],
    [14, 16371, 35],
    [14, 16372, 85],
    [14, 16373, 33],
    [14, 16374, 36],
    [14, 16375, 34],
    [14, 16376, 84],
    [14, 16377, 32],
    [15, 32756, 87],
    [15, 32757, 89],
    [15, 32758, 30],
    [15, 32759, 31],
    [16, 65520, 86],
    [16, 65521, 29],
    [16, 65522, 26],
    [16, 65523, 27],
    [16, 65524, 28],
    [16, 65525, 24],
    [16, 65526, 88],
    [17, 131054, 25],
    [17, 131055, 22],
    [17, 131056, 23],
    [18, 262114, 90],
    [18, 262115, 21],
    [18, 262116, 19],
    [18, 262117, 3],
    [18, 262118, 1],
    [18, 262119, 2],
    [18, 262120, 0],
    [19, 524242, 98],
    [19, 524243, 99],
    [19, 524244, 100],
    [19, 524245, 101],
    [19, 524246, 102],
    [19, 524247, 117],
    [19, 524248, 97],
    [19, 524249, 91],
    [19, 524250, 92],
    [19, 524251, 93],
    [19, 524252, 94],
    [19, 524253, 95],
    [19, 524254, 96],
    [19, 524255, 104],
    [19, 524256, 111],
    [19, 524257, 112],
    [19, 524258, 113],
    [19, 524259, 114],
    [19, 524260, 115],
    [19, 524261, 116],
    [19, 524262, 110],
    [19, 524263, 105],
    [19, 524264, 106],
    [19, 524265, 107],
    [19, 524266, 108],
    [19, 524267, 109],
    [19, 524268, 118],
    [19, 524269, 6],
    [19, 524270, 8],
    [19, 524271, 9],
    [19, 524272, 10],
    [19, 524273, 5],
    [19, 524274, 103],
    [19, 524275, 120],
    [19, 524276, 119],
    [19, 524277, 4],
    [19, 524278, 7],
    [19, 524279, 15],
    [19, 524280, 16],
    [19, 524281, 18],
    [19, 524282, 20],
    [19, 524283, 17],
    [19, 524284, 11],
    [19, 524285, 12],
    [19, 524286, 14],
    [19, 524287, 13]
];

const CODEBOOKS = [
    HCB1, HCB2, HCB3, HCB4, HCB5, HCB6, HCB7, HCB8, HCB9, HCB10, HCB11
];