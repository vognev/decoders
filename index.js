module.exports = class Decoder {
    static get WAV() {
        return require('./src/wav');
    }

    static get MP3() {
        return require('./src/mp3');
    }

    static get AAC() {
        return require('./src/aac');
    }

    static factory(type) {
        type = type.toLowerCase();
        if ('.' === type[0]) // extension?
            type = type.substring(1);

        switch (type) {
            case 'mp3': return new Decoder.MP3;
            case 'aac': return new Decoder.AAC;
            case 'wav': return new Decoder.WAV;
        }

        return null;
    }

    static buf(data) {
        return new Buffer(data);
    }

    static feeder(options) {
        const feeder = require('audio-feeder');
        return new feeder(options);
    }
};