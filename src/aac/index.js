const stream = require('stream');
const debug  = require('debug')('aac');
const AACDecoder = require('./decoder');
const AACFrame = require('./frame');

// support ADTS containers only

class Decoder extends stream.Transform {

    constructor() {
        super();

        this.bytes = new Buffer(0);
        this.pendingBytes = 0;
        this.pendingCb = null;

        this.frstFrame = null;
        this.currFrame = null;
        this.decoder   = null;

        // read 72 bits containing header
        this._bytes(7, this._read_frame_header);
    }

    _transform(data, enc, callback) {
        this.bytes = Buffer.concat([this.bytes, data]);

        while(this.pendingBytes) {
            if (this.bytes.length < this.pendingBytes) {
                return callback();
            }

            const bytes = new Buffer(this.pendingBytes);
            const remnd = new Buffer(this.bytes.length - this.pendingBytes);

            this.bytes.copy(bytes, 0, 0, bytes.length);
            this.bytes.copy(remnd, 0, this.pendingBytes);
            this.bytes = remnd;

            const pendingCb = this.pendingCb;
            const pendingBt = this.pendingBytes;
            this.pendingCb = null;
            this.pendingBytes = null;

            pendingCb.call(this, pendingBt, bytes);
        }

        console.assert(false, 'decoding out of sync');

        callback(null, this.bytes);
        this.bytes = new Buffer(0);
    }

    _bytes(bytes, callback) {
        if (bytes <= 0 || !callback) {
            throw "Invalid arguments";
        }

        if (this.pendingCb) {
            throw "There is already pending callback";
        }

        this.pendingBytes = bytes;
        this.pendingCb    = callback;
    }

    _read_frame_header(size, data)
    {
        console.assert(7 === size && 7 === data.length);

        debug('decoding frame header', size);

        // assert syncword exists
        console.assert(data[0] === 0xff && (data[1] & 0xf0) === 0xf0);

        // 0 for MPEG-4, 1 for MPEG-2
        const mpeg_version = (data[1] & 0x08) >> 3;
        console.assert(mpeg_version >= 0 && mpeg_version <= 1);

        // always 0
        const mpeg_layer = (data[1] & 0x06) >> 1;
        console.assert(mpeg_layer === 0);

        // set to 1 if there is no CRC and 0 if there is CRC
        const no_crc = data[1] & 0x01;

        // https://wiki.multimedia.cx/index.php/MPEG-4_Audio#Audio_Object_Types
        const profile = ((data[2] & 0xc0) >> 6) + 1;
        console.assert(profile === 2);

        // https://wiki.multimedia.cx/index.php/MPEG-4_Audio#Sampling_Frequencies
        const samplingIndex = (data[2] & 0x3c) >> 2;
        console.assert(samplingIndex >= 0 && samplingIndex <= 12);

        // https://wiki.multimedia.cx/index.php/MPEG-4_Audio#Channel_Configurations
        // MPEG-4 Channel Configuration
        // (in the case of 0, is sent via an inband PCE)
        const channelConfig = ((data[2] & 0x01) << 2) | ((data[3] & 0xC0) >> 6);

        const frameLength = ((data[3] & 0x03) << 11) | (data[4] << 3) | ((data[5] & 0xe0) >> 5);

        const num_frames  = (data[6] & 0x03) + 1;
        console.assert(1 === num_frames);

        const frame = this.currFrame = new AACFrame();
        frame.profile = profile;
        frame.samplingIndex = samplingIndex;
        frame.channelConfig = channelConfig;
        frame.hasCrc = !no_crc;
        frame.length = frameLength;

        if (frame.hasCrc) {
            this._bytes(2, this._read_frame_crc);
        } else {
            this._bytes(frame.dataLength, this._read_frame_data);
        }
    }

    _read_frame_crc(size, data)
    {
        console.assert(2 === size && 2 === data.length);
        debug('validating frame crc');
        this._bytes(this.currFrame.dataLength, this._read_frame_data);
    }

    _read_frame_data(size, data)
    {
        if (null === this.frstFrame) {
            this.frstFrame  = this.currFrame;
            this.decoder    = new AACDecoder(this.currFrame);
            this.emit('header', this.currFrame);
        }

        this.push(this.decoder.decode(data));

        this._bytes(7, this._read_frame_header);
    }
}

module.exports = Decoder;