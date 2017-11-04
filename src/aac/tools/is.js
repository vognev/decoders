const HCB = require('../huffman/hcb');

module.exports = class IS {
    static process(cpe, specL, specR) {
        const ics = cpe.getRightChannel();

        const info = ics.getInfo();

        const offsets = info.getSWBOffsets();

        const windowGroups = info.getWindowGroupCount();

        const maxSFB = info.getMaxSFB();

        const sfbCB = ics.getSfbCB();

        const sectEnd = ics.getSectEnd();

        const scaleFactors = ics.getScaleFactors();

        let w, i, j, c, end, off;
        let idx = 0, groupOff = 0;
        let scale;

        for (let g = 0; g < windowGroups; g++) {
            for (i = 0; i < maxSFB;) {
                if(HCB.INTENSITY_HCB === sfbCB[idx] || HCB.INTENSITY_HCB2 === sfbCB[idx]) {
                    end = sectEnd[idx];
                    for(; i < end; i++, idx++) {
                        c = HCB.INTENSITY_HCB === sfbCB[idx] ? 1 : -1;

                        if(cpe.isMSMaskPresent())
                            c *= cpe.isMSUsed(idx) ? -1 : 1;

                        scale = c * scaleFactors[idx];

                        for(w = 0; w < info.getWindowGroupLength(g); w++) {
                            off = groupOff + w * 128 + offsets[i];
                            for(j = 0; j < offsets[i + 1] - offsets[i]; j++) {
                                specR[off + j] = specL[off + j] * scale;
                            }
                        }
                    }
                }
                else {
                    end = sectEnd[idx];
                    idx += end-i;
                    i = end;
                }
            }
            groupOff += info.getWindowGroupLength(g) * 128;
        }
    }
};
