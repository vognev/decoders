module.exports = class Element
{
    constructor() {
        this.instanceTag = null;
        this.sbr = null;
    }

    readInstanceTag(bitStream) {
        this.instanceTag = bitStream.readBits(4);
    }

    getInstanceTag() {
        return this.instanceTag;
    }

    decodeSBR(bitStream, sf, count, stereo, crc, downSampled, smallFrames) {
        throw 'not implemented';
    }

    isSBRPresent() {
        return this.sbr != null;
    }

    getSBR() {
        return this.sbr;
    }
};