const Bitstream = require('../bitstream');
const FrameHeader = require('./frame');

module.exports = class Util
{
    /**
     * @param {Buffer} data
     */
    static getSizeFromID3v2Header(data) {
        if (10 !== data.length)
            throw 'Expected ID3v2 header buffer length to be 10';

        const flags = data[5];
        if (flags !== 0)
            throw 'Expected no ID3 header flags set';

        return (data[6] << 21) + (data[7] << 14) + (data[8] << 7) + (data[9]);
    }

    /**
     *
     * @param {Buffer} data
     */
    static makeFrameHeader(data)
    {
        const bitStream     = new Bitstream(data);
        const frame         = new FrameHeader();

        if (bitStream.readBits(11) !== 0x7FF)
            throw 'invalid syncword';

        frame.version       = bitStream.readBits(2);
        frame.layer         = bitStream.readBits(2);
        frame.bProtect      = 0 === bitStream.readBit();
        frame.bitrate       = bitStream.readBits(4);
        frame.freq          = bitStream.readBits(2);
        frame.bPadding      = 1 === bitStream.readBit();
        frame.bPrivate      = 1 === bitStream.readBit();
        frame.mode          = bitStream.readBits(2);
        frame.extension     = bitStream.readBits(2);
        frame.bCopyright    = 1 === bitStream.readBit();
        frame.bOriginal     = 1 === bitStream.readBit();
        frame.emphasis      = bitStream.readBits(2);

        return frame;
    }
};