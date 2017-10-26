const PCM = require('../pcm_format');

module.exports = class Header extends PCM {
    constructor() {
        super();

        // 4 bytes, RIFF
        this.chunkId = null;

        // 4 bytes, length of rest of file
        this.chunkSize = null;

        // 4 bytes, WAVE
        this.format = null;

        // 4 bytes, "fmt "
        this.subchunk1Id = null;

        // 4 bytes, length of rest of fmt section
        this.subchunk1Size = null;

        // 2 bytes, 1 = PCM
        this.audioFormat = null;

        // 4 bytes, "data"
        this.subchunk2Id = null;

        // 4 bytes, length of rest of data section
        this.subchunk2Size = null;
    }

    get isLE() {
        return this.chunkId === 'RIFF';
    }

    get isBE() {
        return this.chunkId === 'RIFX';
    }

    get order() {
        if (this.isLE) return 'LE';
        if (this.isBE) return 'BE';
        throw 'Neither BE or LE';
    }
};