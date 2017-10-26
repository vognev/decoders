const stream = require('stream');
const Util = require('./util');
const Decoder = require('./decoder');

class Demuxer extends stream.Transform {

    constructor() {
        super();

        this.bytes = new Buffer(0);
        this.pendingBytes = 0;
        this.pendingCb = null;

        this.frstFrame = null;
        this.currFrame = null;

        this.decoder   = new Decoder();

        this.syncword  = 0xFFE00000;
        this.rawId3v2  = null;

        this._bytes(10, this._read_id3_header);
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

        throw 'decoding out of sync';
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

    _read_id3_header(size, data) {
        if ('ID3' === data.toString('ascii', 0, 3)) {
            size = Util.getSizeFromID3v2Header(data);
            if (size)
                this._bytes(size, this._read_id3v2_data);
            else
                this._bytes(4, this._read_frame_header);
        } else {
            this.bytes = Buffer.concat([data, this.bytes]);
            this._bytes(4, this._read_frame_header);
        }
    }

    _read_id3v2_data(size, data) {
        this.rawId3v2 = data;
        this._bytes(4, this._read_frame_header)
    }

    _read_frame_header(size, data) {
        let syncword = (data.readUInt32BE(0) & this.syncword);
        if (syncword < 0)
            syncword = 0xFFFFFFFF + syncword + 1;

        if (syncword !== this.syncword)
            throw 'lost sync';

        const frame = Util.makeFrameHeader(data);

        if (!this.frstFrame) {
            this.syncword       = syncword;     // expect strict frame header now
            this.frstFrame      = frame;
            this.emit('header', frame);
        }

        this.currFrame = frame;

        this._bytes(this.currFrame.frameSize, this._read_frame_data);
    }

    _read_frame_data(size, data) {
        this.push(
            this.decoder.decodeFrame(this.currFrame, data)
        );

        if (this.currFrame.bProtect) {
            this._bytes(2, this._read_frame_crc);
        } else {
            this._bytes(4, this._read_frame_header)
        }
    }

    _read_frame_crc(size, data) {
        // todo: validate crc16
        this._bytes(4, this._read_frame_header)
    }
}

module.exports = Demuxer;