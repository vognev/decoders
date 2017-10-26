const Element = require('./element');

const CPE = require('./cpe');
const SCE_LFE = require('./sce_lfe');

const TYPE_FILL             = 0;
const TYPE_FILL_DATA        = 1;
const TYPE_EXT_DATA_ELEMENT = 2;
const TYPE_DYNAMIC_RANGE    = 11;
const TYPE_SBR_DATA         = 13;
const TYPE_SBR_DATA_CRC     = 14;

module.exports = class FIL extends Element
{
    constructor(downSampledSBR) {
        super();

        this.downSampledSBR = downSampledSBR;
    }

    decode(bitStream, prev, sf, sbrEnabled, smallFrames)
    {
        let count = bitStream.readBits(4);
        if(count === 15)
            count += bitStream.readBits(8) - 1;
        count *= 8; //convert to bits

        const cpy = count;
        const pos = bitStream.bitPosition;

        while(count > 0) {
            count = this.decodeExtensionPayload(bitStream, count, prev, sf, sbrEnabled, smallFrames);
        }

        const pos2 = bitStream.bitPosition - pos;
        const bitsLeft = cpy - pos2;

        if (bitsLeft > 0)
            bitStream.skipBits(pos2);
        else if(bitsLeft < 0)
            throw "FIL element overread: " + bitsLeft;
    }

    decodeExtensionPayload(bitStream, count, prev, sf, sbrEnabled, smallFrames)
    {
        const type = bitStream.readBits(4);

        let ret = count - 4;

        switch(type) {
            case TYPE_DYNAMIC_RANGE:
                ret = this.decodeDynamicRangeInfo(bitStream, ret);
                break;

            case TYPE_SBR_DATA:
            case TYPE_SBR_DATA_CRC:
                if(sbrEnabled) {
                    if(prev instanceof SCE_LFE || prev instanceof CPE) {
                        prev.decodeSBR(bitStream, sf, ret, (prev instanceof CPE), (type===TYPE_SBR_DATA_CRC), downSampledSBR, smallFrames);
                        ret = 0;
                        break;
                    }
                    else throw "SBR applied on unexpected element";
                }
                else {
                    bitStream.skipBits(ret);
                    ret = 0;
                }
            // fallthrough
            case TYPE_FILL:
            case TYPE_FILL_DATA:
            case TYPE_EXT_DATA_ELEMENT:
            default:
                bitStream.skipBits(ret);
                ret = 0;
                break;
        }

        return ret;
    }

    decodeDynamicRangeInfo() {
        throw 'not implemented';
    }
};