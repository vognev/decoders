const Decoders = require('../index.js');

const streamFactory  = (location) => {
    const fs    = require('fs');
    const path  = require('path');
    const url   = require('url');
    const icy   = require('icy');

    if (fs.existsSync(path.resolve(location))) {
        const decoder = Decoders.factory(path.extname(location));
        fs.createReadStream(location).pipe(decoder);
        return decoder;
    }

    if(url.parse(location))
    return new Promise(resolve => {
        icy.get(location, function (res) {
            res.on('metadata', function (metadata) {
                console.error(icy.parse(metadata));
            });

            const decoder = (() => { switch (res.headers['content-type']) {
                case 'audio/aac': return Decoders.factory('aac');
                case 'audio/mpeg':return Decoders.factory('mp3');
                default:
                    throw 'Unable to find stream decoder';
            }})();

            res.pipe(decoder);
            resolve(decoder);
        });
    });
};

(async (location) => {
    try {
        const stream = await streamFactory(location);
        stream.once('header', (format) => {
            console.error('Header', format);
            stream.pipe(process.stdout);
        });
    } catch (e) {
        console.error(e);
    }
})(process.argv[2]);

