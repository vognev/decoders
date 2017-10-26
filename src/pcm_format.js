/**
 * @property {Number} channels
 * @property {Number} sampleRate
 * @property {Number} bitsPerSample
 * @type {PCMFormat}
 */
module.exports = class PCMFormat
{
    /**
     * bytes per second
     * @returns {Number}
     */
    get byteRate()
    {
        const byteRate = this.bitsPerSample * this.channels * this.sampleRate / 8;
        console.assert(Number.isInteger(byteRate));
        return byteRate;
    }

    /**
     * bytes per single sample
     * @returns {number}
     */
    get blockAlign()
    {
        const blockAlign = this.bitsPerSample * this.channels / 8;
        console.assert(Number.isInteger(blockAlign));
        return blockAlign;
    }
};