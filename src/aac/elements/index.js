const Constants = require('../constants');
const CPE = require('./cpe');
const SCE_LFE = require('./sce_lfe');
const FIL = require('./fil');
const IS = require('../tools/is');
const MS = require('../tools/ms');
const debug = require('debug')('elements');

const Short = {
    MAX_VALUE: Math.pow(2, 15) - 1,
    MIN_VALUE: -Math.pow(2, 15)
};

module.exports = class Elements
{
    constructor(frame) {
        this.frame      = frame;

        this.elements   = [];
        this.fils       = [];
        this.data       = null;

        this.reset();
    }

    reset() {
        this.elements.length    = 0;
        this.fils.length        = 0;
        this.sbrPresent         = false;
        this.psPresent          = false;
        return this;
    }

    decode(bitStream) {

        let elementType, prev = null;

        while ((elementType = bitStream.readBits(3)) !== Constants.elements.END) {

            switch (elementType) {
                case Constants.elements.CCE:        // 2
                    throw 'CCE not implemented';

                case Constants.elements.DSE:        // 4
                    throw 'DSE not implemented';

                case Constants.elements.PCE:        // 5
                    throw 'PCE not implemented';

                case Constants.elements.SCE:        // 0
                case Constants.elements.LFE:        // 3
                    debug('decodeSCE_LFE');
                    prev = this.decodeSCE_LFE(bitStream);
                    break;

                case Constants.elements.CPE:        // 1
                    debug('decodeCPE');
                    prev = this.decodeCPE(bitStream);
                    break;

                case Constants.elements.FIL:        // 6
                    debug('decodeFIL');
                    this.decodeFIL(bitStream, prev);
                    prev = null;
                    break;

                default:
                    throw 'Unexpected elementType ' + elementType;
            }
        }

        return this;
    }

    process(filterBank) {

        let chs = this.frame.channels;

        // fixme: if(chs==1&&psPresent) chs++;
        if (chs === 1) {
            throw 'unsupported channels';
        }

        // fixme: final int mult = sbrPresent ? 2 : 1;
        const mult = 1;

        // //only reallocate if needed
        if( !this.data || chs !== this.data.length || this.data[0].length !== (mult * this.frame.frameLength))
            this.data = (new Array(chs)).fill().map(() => {
                return (new Array(mult * this.frame.frameLength))
                    .fill(0);
            });

        let channel = 0;

        for(let i = 0; i < this.elements.length && channel < chs; i++) {
            const e = this.elements[i];

            if(e instanceof CPE) {
                this.processPair(e, filterBank, channel);
                channel += 2;
            } else {
                throw 'not implemented';
            }
        }

        return this;
    }

    processPair(cpe, filterBank, channel) {

        const ics1 = cpe.getLeftChannel();
        const ics2 = cpe.getRightChannel();

        const info1 = ics1.getInfo();
        const info2 = ics2.getInfo();

        const elementID = cpe.getInstanceTag();

        const iqData1 = ics1.getInvQuantData();
        const iqData2 = ics2.getInvQuantData();

        //MS
        if (cpe.isCommonWindow() && cpe.isMSMaskPresent()) {
            MS.process(cpe, iqData1, iqData2);
        }

        // fixme: main prediction

        //IS
        IS.process(cpe, iqData1, iqData2);

        // fixme: LTP

        // fixme: dependent coupling

        //TNS
        if(ics1.isTNSDataPresent()) ics1.getTNS().process(ics1, iqData1, sf, false);
        if(ics2.isTNSDataPresent()) ics2.getTNS().process(ics2, iqData2, sf, false);

        // fixme: dependent coupling again

        //filterbank
        filterBank.process(info1.getWindowSequence(), info1.getCurrentWindowShape(), info1.getPreviousWindowShape(), iqData1, this.data[channel+0], channel+0);
        filterBank.process(info2.getWindowSequence(), info2.getCurrentWindowShape(), info2.getPreviousWindowShape(), iqData2, this.data[channel+1], channel+1);

        // fixme: LTP
        // fixme: independent coupling
        // fixme: gain control
        // fixme: SBR
    }

    decodeSCE_LFE(bitStream) {
        const element = new SCE_LFE(this.frame);
        this.elements.push(element);
        return element.decode(bitStream);
    }

    decodeCPE(bitStream) {
        const element = new CPE(this.frame);
        this.elements.push(element);
        return element.decode(bitStream);
    }

    decodeFIL(bitStream, prev) {

        if(Constants.MAX_ELEMENTS === this.fils.length)
            throw "too much FIL elements";

        const element = new FIL(
            false                   // fixme: config.isSBRDownSampled()
        );

        element.decode(
            bitStream, prev,
            this.frame.sampleRate,  // fixme: config.getSampleFrequency(),
            false,                  // fixme: config.isSBREnabled(),
            false                   // fixme: config.isSmallFrameUsed()
        );

        this.fils.push(element);

        if(prev != null && prev.isSBRPresent()) {
            this.sbrPresent = true;
            if(!this.psPresent && prev.getSBR().isPSUsed())
                this.psPresent = true;
        }
    }

    output() {
        const chs = this.data.length;

        const mult = 1; // fixme: SBR
        const length = mult * this.frame.frameLength;
        const b = new Buffer(chs*length*2);

        let idx = 0;
        // for each value in frame
        for (let j = 0; j < length; j++) {
            // interleave channels
            for (let i = 0; i < chs; i++) {
                // write uint16 pcm sample
                const s = Math.max(Math.min(Math.round(this.data[i][j]), Short.MAX_VALUE), Short.MIN_VALUE);
                b.writeInt16LE(s, idx);
                idx += 2;
            }
        }

        return b;
    }
};