const PCMFrame = require('../pcm_format');

const MPEG1             = 0b11;
const MPEG2             = 0b10;
const MPEG25            = 0b00;
const MPEG25_LSF        = 0b00;

const LAYER3            = 0b01;

const SINGLE_CHANNEL    = 0b11;
const STEREO            = 0b00;
const JOINT_STEREO      = 0b01;
const DUAL_MONO         = 0b10;

module.exports = class MP3Frame extends PCMFrame
{
    constructor() {
        super();

        this.version       = null;
        this.layer         = null;
        this.bitrate       = null;
        this.freq          = null;
        this.mode          = null;

        this.extension     = null;
        this.emphasis      = null;

        this.bProtect      = null;
        this.bPadding      = null;
        this.bPrivate      = null;
        this.bCopyright    = null;
        this.bOriginal     = null;
    }

    get MPEG1()             { return MPEG1;  }
    get LAYER3()            { return LAYER3; }
    get SINGLE_CHANNEL()    { return SINGLE_CHANNEL; }
    get MPEG25_LSF()        { return MPEG25_LSF; }
    get JOINT_STEREO()      { return JOINT_STEREO; }

    get channels() {
        switch(this.mode) {
            case STEREO:
            case JOINT_STEREO:
            case DUAL_MONO:
                return 2;
            case SINGLE_CHANNEL:
                return 1;
            default:
                throw 'invalid channels mode';
        }
    }

    get sampleRate() {
        switch (this.version) {
            case MPEG1: // 1
                switch (this.freq) {
                    case 0b00: return 44100;
                    case 0b01: return 48000;
                    case 0b10: return 32000;
                    default:
                        throw 'unsupported sample rate';
                }
            default:
                throw 'unsupported mpeg version';
        }
    }

    get bitsPerSample() {
        return 16;
    }

    get bitRate() {
        switch (this.version) {
            case MPEG1:
                switch (this.layer) {
                    case LAYER3:
                        switch (this.bitrate) {
                            case 0b0111: return 96;
                            case 0b1000: return 112;
                            case 0b1001: return 128;
                            default:
                                throw 'unsupported bitrate';
                        }
                    default:
                        throw 'unsupported layer';
                }
            default:
                throw 'unsupported mpeg version';
        }
    }

    get frameSize() {
        const bitrates      = [0, 32000, 40000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 160000, 192000, 224000, 256000, 320000, 0];
        const frequencies   = [44100, 48000, 32000, 1];

        let framesize = (144 * bitrates[this.bitrate] / frequencies[this.freq]) ^0;

        if (this.bPadding) framesize++;

        framesize -= 4;

        return framesize;
    }

    slots() {
        let nSlots = this.frameSize - ((this.mode === SINGLE_CHANNEL) ? 17 : 32) // side info size
            -  ((!this.bProtect) ? 0 : 2); // crc size

        return nSlots;
    }
};