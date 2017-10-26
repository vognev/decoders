const ICSInfo = require('./icsinfo');
const AACFrame = require('../frame');
const Constants = require('../constants');
const HCB = require('../huffman/hcb');
const Huffman = require('../huffman');
const SFT = require('../tools/sft');
const TNS = require('../tools/tns');
const IQT = require('../tools/iqt');

const SF_DELTA  = 60;
const SF_OFFSET = 200;

module.exports = class ICStream
{
    constructor(frame) {
        console.assert(frame instanceof AACFrame);
        this.frame = frame;

        this.info = new ICSInfo(frame);

        this.sfbCB = new Array(Constants.MAX_SECTIONS);

        this.sectEnd = new Array(Constants.MAX_SECTIONS);

        this.data = new Array(frame.frameLength);

        this.scaleFactors = new Array(Constants.MAX_SECTIONS);

        this.globalGain = null;
        this.pulseDataPresent = null;
        this.tnsDataPresent = null;
        this.gainControlPresent = null;

        this.randomState = 0x1F2E3D4C;
    }

    decode(bitStream, commonWindow) {
        const er = this.frame.isErrorResilientProfile();
        if (er) {
            throw 'errorResilientProfile not implemented';
        }

        this.globalGain = bitStream.readBits(8);

        if (!commonWindow) {
            this.info.decode(bitStream, commonWindow);
        }

        this.decodeSectionData(bitStream /* fixme: conf.isSectionDataResilienceUsed() */);

        this.decodeScaleFactors(bitStream);

        this.pulseDataPresent = !!bitStream.readBit();

        if (this.pulseDataPresent) {
            if (this.info.isEightShortFrame())
                throw "pulse data not allowed for short frames";
            // fixme: decodePulseData(in);
            throw 'decodePulseData(in)';
        }

        this.tnsDataPresent = !!bitStream.readBit();
        if (this.tnsDataPresent && !er) {
            if(!this.tns)
                this.tns = new TNS();
            this.tns.decode(bitStream, this.info);
        }

        this.gainControlPresent = !!bitStream.readBit();
        if(this.gainControlPresent) {
            throw 'gainControl.decode(in, info.getWindowSequence())';
        }

        // fixme: conf.isSpectralDataResilienceUsed()

        this.decodeSpectralData(bitStream);
    }

    decodeSectionData(bitStream, sectionDataResilienceUsed) {

        this.sfbCB.fill(0);
        this.sectEnd.fill(0);

        const bits = this.info.isEightShortFrame() ? 3 : 5;
        const escVal = (1 << bits) - 1;

        const windowGroupCount = this.info.getWindowGroupCount();
        const maxSFB = this.info.getMaxSFB();

        let end, cb, incr, idx = 0;

        for (let g = 0; g < windowGroupCount; g++) {
            let k = 0;

            while(k < maxSFB) {
                end = k, cb = bitStream.readBits(4);

                if (12 === cb)
                    throw "invalid huffman codebook: 12";

                while((incr = bitStream.readBits(bits)) === escVal) {
                    end += incr;
                }

                end += incr;

                if (end > maxSFB)
                    throw "too many bands: " + end + ", allowed: " + maxSFB;

                for(; k < end; k++) {
                    this.sfbCB[idx]         = cb;
                    this.sectEnd[idx++]     = end;
                }
            }
        }
    }

    decodeScaleFactors(bitStream) {
        const windowGroups = this.info.getWindowGroupCount();
        const maxSFB = this.info.getMaxSFB();

        //0: spectrum, 1: noise, 2: intensity
        const offset = [this.globalGain, this.globalGain - 90, 0];

        let tmp, noiseFlag = true;

        let sfb, idx = 0;

        for (let g = 0; g < windowGroups; g++) {
            for(sfb = 0; sfb < maxSFB; ) {
                let end = this.sectEnd[idx];

                switch(this.sfbCB[idx]) {
                    case HCB.ZERO_HCB:
                        for(; sfb < end; sfb++, idx++) {
                            this.scaleFactors[idx] = 0;
                        }
                        break;
                    case HCB.INTENSITY_HCB:
                    case HCB.INTENSITY_HCB2:
                        for(; sfb < end; sfb++, idx++) {
                            offset[2] += Huffman.decodeScaleFactor(bitStream) - SF_DELTA;
                            tmp = Math.min(Math.max(offset[2], -155), 100);
                            this.scaleFactors[idx] = SFT.SCALEFACTOR_TABLE[-tmp + SF_OFFSET];
                        }
                        break;
                    case HCB.NOISE_HCB:
                        throw 'not implemented';
                        // for(; sfb < end; sfb++, idx++) {
                        //     if(noiseFlag) {
                        //         offset[1] += bitStream.readBits(9) - 256;
                        //         noiseFlag = false;
                        //     }
                        //     else offset[1] += Huffman.decodeScaleFactor(bitStream) - SF_DELTA;
                        //     tmp = Math.min(Math.max(offset[1], -100), 155);
                         //    this.scaleFactors[idx] = -SCALEFACTOR_TABLE[tmp+SF_OFFSET];
                        // }
                        // break;
                    default:
                        for (; sfb < end; sfb++, idx++) {
                            offset[0] += Huffman.decodeScaleFactor(bitStream) - SF_DELTA;
                            if (offset[0] > 255)
                                throw "scalefactor out of range: " + offset[0];
                            this.scaleFactors[idx] = SFT.SCALEFACTOR_TABLE[offset[0] - 100 + SF_OFFSET];
                        }
                        break;
                }
            }
        }
    }

    decodeSpectralData(bitStream) {

        this.data.fill(0);

        const maxSFB = this.info.getMaxSFB();

        const windowGroups = this.info.getWindowGroupCount();

        const offsets = this.info.getSWBOffsets();

        const buf = new Array(4);

        let sfb, j, k, w, hcb, off, width, num;

        let groupOff = 0, idx = 0;

        for (let g = 0; g < windowGroups; g++) {
            let groupLen = this.info.getWindowGroupLength(g);

            for(sfb = 0; sfb < maxSFB; sfb++, idx++) {
                hcb     = this.sfbCB[idx];
                off     = groupOff + offsets[sfb];
                width   = offsets[sfb + 1] - offsets[sfb];

                if(hcb === HCB.ZERO_HCB || hcb === HCB.INTENSITY_HCB || hcb === HCB.INTENSITY_HCB2) {
                    for (w = 0; w < groupLen; w++, off += 128) {
                        this.data.fill(off, off + width, 0);
                    }
                }
                else if(hcb === HCB.NOISE_HCB) {
                    throw 'not implemented';
                    //apply PNS: fill with random values
                    for (w = 0; w < groupLen; w++, off += 128) {
                        let energy = 0.0;

                        for(k = 0; k < width; k++) {
                            // fixme: uint math overflow
                            this.randomState *= 1664525+1013904223;
                            this.data[off + k] = this.randomState;
                            energy += this.data[off + k] * data[off + k];
                        }

                        const scale = this.scaleFactors[idx] / Math.sqrt(energy);

                        for(k = 0; k < width; k++) {
                            this.data[off + k] *= scale;
                        }
                    }
                }
                else {
                    for (w = 0; w < groupLen; w++, off += 128) {
                        num = (hcb >= HCB.FIRST_PAIR_HCB) ? 2 : 4;
                        for(k = 0; k < width; k += num) {
                            Huffman.decodeSpectralData(bitStream, hcb, buf, 0);

                            //inverse quantization & scaling
                            for(j = 0; j < num; j++) {
                                this.data[off + k + j]  = (buf[j] > 0) ? IQT.IQ_TABLE[ buf[j] ] : -IQT.IQ_TABLE[ -buf[j] ];
                                this.data[off + k + j] *= this.scaleFactors[idx];
                            }
                        }
                    }
                }
            }
            groupOff += groupLen << 7;
        }
    }

    getInfo() {
        return this.info;
    }

    getInvQuantData() {
        return this.data;
    }

    getSfbCB() {
        return this.sfbCB;
    }

    getSectEnd() {
        return this.sectEnd;
    }

    getScaleFactors() {
        return this.scaleFactors;
    }

    getTNS() {
        return this.tns;
    }

    isTNSDataPresent() {
        return this.tnsDataPresent;
    }
};