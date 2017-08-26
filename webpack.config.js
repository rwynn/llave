var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: {
        bundle: './src/index',
        'bundle.web': './src/index.web',
        'worker.web': './src/worker.web'
    },
    module: {
        loaders: [
            { test: /\.js?$/, loader: 'babel', exclude: /node_modules/ },
            { test: /\.s?css$/, loader: 'style!css!sass' }
        ]
    },
    resolve: {
        extensions: ['', '.js']
    },
    output: {
        path: path.join(__dirname, '/dist'),
        publicPath: '/',
        filename: '[name].js'
    },
    devServer: {
        contentBase: './dist',
        hot: true
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        // enable prod
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ]
};
