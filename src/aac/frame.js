const PCM = require('../pcm_format');

module.exports = class AACFrame extends PCM {
    constructor() {
        super();

        this.profile = null;

        this.samplingIndex = null;

        this.channelConfig = null;

        this.hasCrc = null;

        this.length = null;
    }

    get frameLength() {
        // For AAC-LC its 1024 for long windows and 128 for short windows and its fixed
        return 1024;
    }

    get dataLength() {
        return this.length - (this.hasCrc ? 9 : 7);
    }

    // pcm getters

    get channels() {
        switch (this.channelConfig) {
            case 2:
                return this.channelConfig;
            default:
                throw 'Fixme: unsupported channelConfig';
        }
    }

    get sampleRate() {
        switch (this.samplingIndex) {
            case  3: return 48000;
            case  4: return 44100;
            case  7: return 22050;
            case 10: return 11025;
            default:
                throw 'Fixme: unsupported samplingIndex';
        }
    }

    get bitsPerSample() {
        return 16;
    }

    // decoder config getters

    isErrorResilientProfile() {
        return this.profile > 16;
    }
};