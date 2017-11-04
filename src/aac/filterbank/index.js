const Windows = require('./windows');
const Constants = require('../constants');
const MDCT = require('./mdct');

// todo: extract to enum
const ONLY_LONG_SEQUENCE = 0;
const LONG_START_SEQUENCE = 1;
const EIGHT_SHORT_SEQUENCE = 2;
const LONG_STOP_SEQUENCE = 3;

module.exports = class FilterBank {
    constructor(smallFrames, channels) {
        if (smallFrames) {
            throw 'not implemented';
        }
        else {
            this.length = Constants.WINDOW_LEN_LONG;
            this.shortLen = Constants.WINDOW_LEN_SHORT;
            this.LONG_WINDOWS = [Windows.SINE_1024, Windows.KBD_1024];
            this.SHORT_WINDOWS = [Windows.SINE_128, Windows.KBD_128];
        }

        this.mid = (this.length - this.shortLen) / 2;
        this.trans = this.shortLen / 2;

        this.mdctShort = new MDCT(this.shortLen * 2);
        this.mdctLong = new MDCT(this.length * 2);

        // private final float[][] overlaps = new float[channels][length];
        this.overlaps = new Float32Array(channels * this.length);

        // private final float[] buf = new float[2*length];
        this.buf = new Float32Array(2 * this.length);
    }

    process(windowSequence, windowShape, windowShapePrev, inp, out, channel) {
        let i;

        const mdctLong = this.mdctLong, mdctShort = this.mdctShort;
        const buf = this.buf, overlap = this.overlaps;
        const shortLen = this.shortLen, length = this.length;
        const mid = this.mid, trans = this.trans;
        const LONG_WINDOWS = this.LONG_WINDOWS, SHORT_WINDOWS = this.SHORT_WINDOWS;

        switch (windowSequence) {
            case ONLY_LONG_SEQUENCE:

                mdctLong.process(inp, 0, buf, 0);

                //add second half output of previous frame to windowed output of current frame
                for (i = 0; i < length; i++) {
                    out[i] = overlap[channel * length + i] + (buf[i] * LONG_WINDOWS[windowShapePrev][i]);
                }

                //window the second half and save as overlap for next frame
                for (i = 0; i < length; i++) {
                    overlap[channel * length + i] = buf[length + i] * LONG_WINDOWS[windowShape][length - 1 - i];
                }

                break;

            case LONG_START_SEQUENCE:

                mdctLong.process(inp, 0, buf, 0);

                //add second half output of previous frame to windowed output of current frame
                for (i = 0; i < length; i++) {
                    out[i] = overlap[channel * length + i] + (buf[i] * LONG_WINDOWS[windowShapePrev][i]);
                }

                //window the second half and save as overlap for next frame
                for (i = 0; i < mid; i++) {
                    overlap[channel * length + i] = buf[length + i];
                }

                for (i = 0; i < shortLen; i++) {
                    overlap[channel * length + mid + i] = buf[length + mid + i] * SHORT_WINDOWS[windowShape][shortLen - i - 1];
                }

                for (i = 0; i < mid; i++) {
                    overlap[channel * length + mid + shortLen + i] = 0;
                }

                break;

            case EIGHT_SHORT_SEQUENCE:

                for (i = 0; i < 8; i++) {
                    mdctShort.process(inp, i * shortLen, buf, 2 * i * shortLen);
                }

                //add second half output of previous frame to windowed output of current frame
                for (i = 0; i < mid; i++) {
                    out[i] = overlap[channel * length + i];
                }

                for (i = 0; i < shortLen; i++) {
                    out[mid + i] =
                        overlap[channel * length + mid + i] +
                        (buf[i] * SHORT_WINDOWS[windowShapePrev][i]);

                    out[mid + 1 * shortLen + i] =
                        overlap[channel * length + mid + shortLen * 1 + i] +
                        (buf[shortLen * 1 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                        (buf[shortLen * 2 + i] * SHORT_WINDOWS[windowShape][i]);
                    out[mid + 2 * shortLen + i] =
                        overlap[channel * length + mid + shortLen * 2 + i] +
                        (buf[shortLen * 3 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                        (buf[shortLen * 4 + i] * SHORT_WINDOWS[windowShape][i]);
                    out[mid + 3 * shortLen + i] =
                        overlap[channel * length + mid + shortLen * 3 + i] +
                        (buf[shortLen * 5 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                        (buf[shortLen * 6 + i] * SHORT_WINDOWS[windowShape][i]);
                    if (i < trans)
                        out[mid + 4 * shortLen + i] =
                            overlap[channel * length + mid + shortLen * 4 + i] +
                            (buf[shortLen * 7 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                            (buf[shortLen * 8 + i] * SHORT_WINDOWS[windowShape][i]);
                }

                //window the second half and save as overlap for next frame
                for (i = 0; i < shortLen; i++) {
                    if (i >= trans)
                        overlap[channel * length + mid + 4 * shortLen + i - length] =
                            (buf[shortLen * 7 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                            (buf[shortLen * 8 + i] * SHORT_WINDOWS[windowShape][i]);
                    overlap[channel * length + mid + 5 * shortLen + i - length] =
                        (buf[shortLen * 9 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                        (buf[shortLen * 10 + i] * SHORT_WINDOWS[windowShape][i]);
                    overlap[channel * length + mid + 6 * shortLen + i - length] =
                        (buf[shortLen * 11 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                        (buf[shortLen * 12 + i] * SHORT_WINDOWS[windowShape][i]);
                    overlap[channel * length + mid + 7 * shortLen + i - length] =
                        (buf[shortLen * 13 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]) +
                        (buf[shortLen * 14 + i] * SHORT_WINDOWS[windowShape][i]);
                    overlap[channel * length + mid + 8 * shortLen + i - length] =
                        (buf[shortLen * 15 + i] * SHORT_WINDOWS[windowShape][shortLen - 1 - i]);
                }

                for (i = 0; i < mid; i++) {
                    overlap[channel * length + mid + shortLen + i] = 0;
                }

                break;

            case LONG_STOP_SEQUENCE:
                mdctLong.process(inp, 0, buf, 0);

                //add second half output of previous frame to windowed output of current frame
                //construct first half window using padding with 1's and 0's
                for (i = 0; i < mid; i++) {
                    out[i] = overlap[channel * length + i];
                }
                for (i = 0; i < shortLen; i++) {
                    out[mid + i] = overlap[channel * length + mid + i] + (buf[mid + i] * SHORT_WINDOWS[windowShapePrev][i]);
                }
                for (i = 0; i < mid; i++) {
                    out[mid + shortLen + i] = overlap[channel * length + mid + shortLen + i] + buf[mid + shortLen + i];
                }

                //window the second half and save as overlap for next frame
                for (i = 0; i < length; i++) {
                    overlap[channel * length + i] = buf[length + i] * LONG_WINDOWS[windowShape][length - 1 - i];
                }

                break;
        }
    }
};