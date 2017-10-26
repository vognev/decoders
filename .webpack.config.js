// webpack.config.js

const path = require('path');
const libraryName = 'Decoders';

module.exports = {
    output: {
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },

    devtool: 'source-map',

    module: {
        loaders: [
            {
                test: /(\.jsx|\.js)$/,
                loader: 'babel-loader',
                exclude: /(node_modules|bower_components)/
            }
        ]
    },
    resolve: {
        modules: [path.resolve('./src'), path.resolve('./node_modules')],
        extensions: ['.js']
    }
};
