const Element = require('./element');
const ICStream  = require('./icstream');
const AACFrame = require('../frame');
const MSMask = require('../tools/msmask');
const Constants = require('../constants');

module.exports = class CPE extends Element
{
    constructor(frame) {
        super();

        console.assert(frame instanceof AACFrame);
        this.frame = frame;

        this.msMask = null;

        // private boolean[] msUsed;
        this.msUsed = new Uint8Array(Constants.MAX_MS_MASK);

        this.commonWindow = null;

        this.icsL = new ICStream(frame);
        this.icsR = new ICStream(frame);
    }

    decode(bitStream) {
        this.readInstanceTag(bitStream);

        this.commonWindow = bitStream.readBits(1);

        const info = this.icsL.getInfo();

        if(this.commonWindow) {
            info.decode(bitStream, this.commonWindow);

            this.icsR.getInfo().setData(info);

            this.msMask = MSMask.forInt(bitStream.readBits(2));

            if(MSMask.TYPE_USED === this.msMask) {
                const maxSFB            = info.getMaxSFB();
                const windowGroupCount  = info.getWindowGroupCount();

                for (let idx = 0; idx < windowGroupCount*maxSFB; idx++) {
                    this.msUsed[idx] = bitStream.readBit();
                }
            }
            else if (MSMask.TYPE_ALL_1 === this.msMask) {
                this.msUsed.fill(1);
            }
            else if (MSMask.TYPE_ALL_0 === this.msMask) {
                this.msUsed.fill(0);
            }
            else {
                throw "reserved MS mask type used";
            }
        } else {
            this.msMask = MSMask.TYPE_ALL_0;
            this.msUsed.fill(0);
        }

        if (this.frame.isErrorResilientProfile()) {
            throw 'not implemented';
        }

        this.icsL.decode(bitStream, this.commonWindow);

        this.icsR.decode(bitStream, this.commonWindow);

        return this;
    }

    isCommonWindow()
    {
        return !!this.commonWindow;
    }

    getLeftChannel() {
        return this.icsL;
    }

    getRightChannel() {
        return this.icsR;
    }

    isMSMaskPresent() {
        return MSMask.TYPE_ALL_0 !== this.msMask;
    }

    isMSUsed(off) {
        return !!this.msUsed[off];
    }
};