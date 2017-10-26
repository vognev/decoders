const BYTE = 8;
const READ = 'readUInt8';

module.exports = class BitStream
{
    constructor(buffer)
    {
        this.buffer         = buffer;
        this.bitPosition    = 0;
        this.maxPosition    = buffer.length * BYTE;
    }

    available()
    {
        return this.maxPosition - this.bitPosition;
    }

    skipBit() {
        return this.skipBits(1);
    }

    skipBits(bits) {
        if (this.available() < bits)
            throw 'Unable to skipBitspast the end of stream';
        this.bitPosition += bits;
        return this;
    }

    readBit()
    {
        return this.readBits(1);
    }

    readBits(bits)
    {
        let res = 0;

        if (this.available() < bits)
            throw 'Unable to readBits past the end of stream';

        while(bits) {
            let pow = BYTE - 1 - this.bitPosition  % BYTE;
            let int = this.buffer[READ]((this.bitPosition / BYTE) ^ 0);

            res = (res << 1) | ((int & (1 << pow)) >> pow);

            this.bitPosition++;
            bits--;
        }

        return res;
    }
};