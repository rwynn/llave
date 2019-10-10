var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: {
        bundle: './src/index',
        'bundle.web': './src/index.web',
        'worker.web': './src/worker.web'
    },
    module: {
        rules: [
            { test: /\.js?$/, use: 'babel-loader', exclude: /node_modules/ },
            { test: /\.s?css$/, loader: 'style-loader!css-loader!sass-loader' }
        ]
    },
    resolve: {
        extensions: ['*', '.js']
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
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        // enable prod
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ]
};
