const ONLY_LONG_SEQUENCE = 0;
const LONG_START_SEQUENCE = 1;
const EIGHT_SHORT_SEQUENCE = 2;
const LONG_STOP_SEQUENCE = 3;

const PREVIOUS = 0;
const CURRENT = 1;

const WINDOW_SHAPE_SINE = 0;
const WINDOW_SHAPE_KAISER = 1;

const MAX_WINDOW_COUNT = 8;
const MAX_WINDOW_GROUP_COUNT = MAX_WINDOW_COUNT;

const AACFrame = require('../frame');
const SFB = require('../tools/sfb');

module.exports = class ICSInfo
{
    constructor(frame)
    {
        console.assert(frame instanceof AACFrame);
        this.frame = frame;

        this.windowShape = [0, 0];

        this._windowSequence = ONLY_LONG_SEQUENCE;

        this.windowGroupLength = (new Array(MAX_WINDOW_GROUP_COUNT))
            .fill(0);

        this.maxSFB                 = 0;
        this.predictionDataPresent  = false;
        this.windowCount            = 0;
        this.windowGroupCount       = 0;

        this.swbCount = this.swbOffsets = null;
    }

    get windowSequence() {
        return this._windowSequence;
    }

    set windowSequence(seq) {
        switch (seq) {
            case ONLY_LONG_SEQUENCE:
            case LONG_START_SEQUENCE:
            case EIGHT_SHORT_SEQUENCE:
            case LONG_STOP_SEQUENCE:
                this._windowSequence = seq;
                break;
            default:
                throw 'unknown window sequence type';
        }
    }

    decode(bitStream, commonWindow) {
        bitStream.skipBit();

        this.windowSequence         = bitStream.readBits(2);

        this.windowShape[PREVIOUS]  = this.windowShape[CURRENT];
        this.windowShape[CURRENT]   = bitStream.readBit();

        this.windowGroupCount       = 1;
        this.windowGroupLength[0]   = 1;

        if(EIGHT_SHORT_SEQUENCE === this.windowSequence) {
            this.maxSFB = bitStream.readBits(4);

            for (let i = 0; i < 7; i++) {
                if (bitStream.readBit()) {
                    this.windowGroupLength[this.windowGroupCount - 1]++;
                } else {
                    this.windowGroupCount++;
                    this.windowGroupLength[this.windowGroupCount - 1] = 1;
                }
            }

            this.windowCount = 8;

            this.swbOffsets = SFB.SWB_OFFSET_SHORT_WINDOW[this.frame.samplingIndex];
            this.swbCount   = SFB.SWB_SHORT_WINDOW_COUNT[ this.frame.samplingIndex];

            this.predictionDataPresent = false;
        } else {
            this.maxSFB         = bitStream.readBits(6);
            this.windowCount    = 1;

            this.swbOffsets = SFB.SWB_OFFSET_LONG_WINDOW[this.frame.samplingIndex];
            this.swbCount   = SFB.SWB_LONG_WINDOW_COUNT[ this.frame.samplingIndex];

            this.predictionDataPresent = !!bitStream.readBit();

            if (this.predictionDataPresent) {
                throw 'not implemented';
            }
        }
    }

    setData(info) {
        console.assert(info instanceof ICSInfo);

        this.windowSequence = info.windowSequence;

        this.windowShape[PREVIOUS] = this.windowShape[CURRENT];

        this.windowShape[CURRENT] = info.windowShape[CURRENT];

        this.maxSFB = info.maxSFB;

        this.predictionDataPresent = info.predictionDataPresent;

        this.windowCount = info.windowCount;

        this.windowGroupCount = info.windowGroupCount;

        this.windowGroupLength = info.windowGroupLength.slice();

        this.swbCount = info.swbCount;

        this.swbOffsets = info.swbOffsets.slice();
    }

    getMaxSFB() {
        return this.maxSFB;
    }

    getWindowGroupCount() {
        return this.windowGroupCount;
    }

    getWindowGroupLength(g) {
        return this.windowGroupLength[g];
    }

    isEightShortFrame() {
        return EIGHT_SHORT_SEQUENCE === this.windowSequence;
    }

    getSWBOffsets() {
        return this.swbOffsets;
    }

    getSWBOffsetMax() {
        return this.swbOffsets[this.swbCount];
    }

    getWindowSequence() {
        return this.windowSequence;
    }

    getWindowShape(index) {
        return this.windowShape[index];
    }

    getCurrentWindowShape() {
        return this.windowShape[CURRENT];
    }

    getPreviousWindowShape() {
        return this.windowShape[PREVIOUS];
    }

    getWindowCount() {
        return this.windowCount;
    }

    // warners
    get icPredict() {
        throw 'not implemented';
    }
    get ltpData1Present() {
        throw 'not implemented';
    }
    get ltPredict1() {
        throw 'not implemented';
    }
    get ltPredict2() {
        throw 'not implemented';
    }
};