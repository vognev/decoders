const Layer3 = require('./layer3');
const FltOut = require('./fltout');

module.exports = class Decoder
{
    constructor() {
        this.bInitialized   = false;
        this.layer3         = null;
    }

    decodeFrame(header, data) {
        if (!this.bInitialized) {
            this.initialize(header);
        }

        this.output.clear();

        this.retrieveDecoder(header)
            .decodeFrame(header, data);

        return this.output.asBuffer();
    }

    initialize(header) {
        const scalefactor = 32700.0;
        const channels  = header.channels;

        this.output     = new FltOut.SampleBuffer(header.sampleRate, channels);
        this.filter1    = new FltOut.SynthesisFilter(0, scalefactor);
        this.filter2    = new FltOut.SynthesisFilter(1, scalefactor);

        this.bInitialized = true;
    }

    retrieveDecoder(header) {
        let decoder = null;

        switch (header.layer) {
            case header.LAYER3:
                if (null === this.layer3) {
                    this.layer3 = new Layer3(header, this.filter1, this.filter2, this.output);
                }

                decoder = this.layer3;
                break;
        }

        if (null === decoder)
            throw 'unsupported layer';

        return decoder;
    }
};