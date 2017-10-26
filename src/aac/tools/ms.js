const HCB = require('../huffman/hcb');

module.exports = class MS
{
    static process(cpe, specL, specR) {
        const ics = cpe.getLeftChannel();

        const info = ics.getInfo();

        const offsets = info.getSWBOffsets();

        const windowGroups = info.getWindowGroupCount();

        const maxSFB = info.getMaxSFB();

        const sfbCBl = ics.getSfbCB();

        const sfbCBr = cpe.getRightChannel().getSfbCB();

        let groupOff = 0, g, i, w, j, idx = 0;

        for(g = 0; g < windowGroups; g++) {
            for(i = 0; i < maxSFB; i++, idx++) {
                if(cpe.isMSUsed(idx) && sfbCBl[idx] < HCB.NOISE_HCB && sfbCBr[idx] < HCB.NOISE_HCB) {
                    for(w = 0; w < info.getWindowGroupLength(g); w++) {
                        const off = groupOff + w * 128 + offsets[i];
                        for(j = 0; j < offsets[i + 1] - offsets[i]; j++) {
                            let t = specL[off + j] - specR[off + j];
                            specL[off + j] += specR[off + j];
                            specR[off + j] = t;
                        }
                    }
                }
            }
            groupOff += info.getWindowGroupLength(g) * 128;
        }
    }
};