module.exports = class Decoders {
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
            case 'mp3': return new Decoders.MP3;
            case 'aac': return new Decoders.AAC;
            case 'wav': return new Decoders.WAV;
        }

        return null;
    }

    static Buffer(...args) {
        return new Buffer(...args);
    }
};