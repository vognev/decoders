class FFTTables {
    static get FFT_TABLE_512() {
        return FFT_TABLE_512;
    }

    static get FFT_TABLE_480() {
        return FFT_TABLE_480;
    }

    static get FFT_TABLE_60() {
        return FFT_TABLE_60;
    }

    static get FFT_TABLE_64() {
        return FFT_TABLE_64;
    }

    static generateShortTable(len) {
        let t = 2 * Math.PI / len,
            cosT = Math.cos(t),
            sinT = Math.sin(t);

        const f = new Float32Array(len * 2);

        f[2 * 0 + 0] = 1;
        f[2 * 0 + 1] = 0;

        let lastImag = 0;

        for (let i = 1; i < len; i++) {
            f[2 * i + 0] = f[2 * (i - 1) + 0] * cosT + lastImag * sinT;
            lastImag = lastImag * cosT - f[2 * (i - 1) + 0] * sinT;
            f[2 * i + 1] = -lastImag;
        }

        return f;
    }

    static generateLongTable(len) {
        let t = 2 * Math.PI / len,
            cosT = Math.cos(t),
            sinT = Math.sin(t);

        const f = new Float32Array(len * 3);

        f[3 * 0 + 0] = 1;
        f[3 * 0 + 1] = 0;
        f[3 * 0 + 2] = 0;

        for (let i = 1; i < len; i++) {
            f[3 * i + 0] = f[3 * (i - 1) + 0] * cosT + f[3 * (i - 1) + 2] * sinT;
            f[3 * i + 2] = f[3 * (i - 1) + 2] * cosT - f[3 * (i - 1) + 0] * sinT;
            f[3 * i + 1] = -f[3 * i + 2];
        }

        return f;
    }
}

const FFT_TABLE_64 = FFTTables.generateShortTable(64);

const FFT_TABLE_60 = FFTTables.generateShortTable(60);

const FFT_TABLE_480 = FFTTables.generateLongTable(480);

const FFT_TABLE_512 = FFTTables.generateLongTable(512);

module.exports = FFTTables;
