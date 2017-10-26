const Elements = require('./elements');
const FilterBank = require('./filterbank');
const BitStream = require('../bitstream');

// partial port of jaad-0.8.4
// supports:
// profiles: AAC-LC
// channels: stereo
// frequencies: 11025, 22050, 44100, 48000
// frameSize: 1024

module.exports = class Decoder
{
    constructor(frame) {
        this.elements   = new Elements(this.frame = frame);
        this.filterBank = new FilterBank(
            false,                      // fixme: config.isSmallFrameUsed()
            this.frame.channels         // fixme: config.getChannelConfiguration().getChannelCount()
        );
    }

    decode(data) {
        return this.elements
            .reset()
            .decode(new BitStream(data))
            .process(this.filterBank)
            .output();
    }
};