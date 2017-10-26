const stream = require('stream');
const debug  = require('debug')('wav');

// todo: may contain (id3) metadata, should limit the size of data section being piped

const Header = require('./header');

class Demuxer extends stream.Transform {
    constructor() {
        super();

        this.bytes = new Buffer(0);
        this.pendingBytes = 0;
        this.pendingCb = null;
        this.header = new Header();

        debug('initialized');

        this._bytes(4, this._processChunkId);
    }

    _transform(data, enc, callback) {
        this.bytes = Buffer.concat([this.bytes, data]);

        debug('_transform: received %d bytes', data.length);

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

        debug('_transform: piping %d bytes of pcm data', this.bytes.length);

        // push bytes aligned to header's blockAlign

        let size = this.bytes.length - (this.bytes.length % this.header.blockAlign);
        const bytes = new Buffer(size);
        const remnd = new Buffer(this.bytes.length - size);

        this.bytes.copy(bytes, 0, 0, bytes.length);
        this.bytes.copy(remnd, 0, size);

        this.push(bytes); callback();
        this.bytes = remnd;
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

    _processChunkId(size, data) {
        const chunkId = this.header.chunkId = data.toString('ascii');

        if ('RIFF' !== chunkId)
            throw 'Expected chunkId to be "RIFF"';

        this._bytes(4, this._processChunkSize);
    }

    _processChunkSize(size, data) {
        this.header.chunkSize = data['readUInt32' + this.header.order](0);
        this._bytes(4, this._processFormat);
    }

    _processFormat(size, data) {
        const format = this.header.format = data.toString('ascii');

        if ('WAVE' !== format)
            throw 'Expected format to be "WAVE"';

        this._bytes(8, this._processSubchunkHeader);
    }

    _processSubchunkHeader(size, data) {
        const subchunkId = data.slice(0, 4).toString('ascii');
        const subchunkSz = data.slice(4, 8)['readUInt32' + this.header.order](0);

        switch (subchunkId) {
            case "fmt ":
                this.header.subchunk1Id     = subchunkId;
                this.header.subchunk1Size   = subchunkSz;
                this._bytes(subchunkSz, this._processFmtChunk);
                break;
            case "data":
                this.header.subchunk2Id     = subchunkId;
                this.header.subchunk2Size   = subchunkSz;
                this.emit('header', this.header);
                break;
            default:
                throw "Unsupported subchunk - " + subchunkId;
        }
    }

    _processFmtChunk(size, data) {
        const audioFormat = this.header.audioFormat = data['readUInt16' + this.header.order](0);
        data = data.slice(2);

        if (1 !== audioFormat)
            throw 'Expected audioFormat to be 1 (PCM)';

        this.header.channels = data['readUInt16' + this.header.order](0);
        data = data.slice(2);

        this.header.sampleRate = data['readUInt32' + this.header.order](0);
        data = data.slice(4);

        const byteRate = data['readUInt32' + this.header.order](0);
        data = data.slice(4);

        const blockAlign = data['readUInt16' + this.header.order](0);
        data = data.slice(2);

        this.header.bitsPerSample = data['readUInt16' + this.header.order](0);

        console.assert(this.header.byteRate === byteRate);
        console.assert(this.header.blockAlign === blockAlign);

        this._bytes(8, this._processSubchunkHeader);
    }
}

module.exports = Demuxer;