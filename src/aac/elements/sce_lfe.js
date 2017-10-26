const Element = require('./element');
const ICStream  = require('./icstream');

module.exports = class SCE_LFE extends Element
{
    constructor(frame) {
        super();

        this.ics = new ICStream(this.frame = frame);
    }

    decode(bitStream) {
        this.readInstanceTag(bitStream);
        this.ics.decode(bitStream, false);
    }

    getICStream() {
        return this.ics;
    }
};