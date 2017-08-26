var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;

var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var webpack = require('webpack');
var config = require('./webpack.config');
var compiler = webpack(config);

app.get('/*', function(req, res, next) {
    res.header(
        'Content-Security-Policy',
        'sandbox allow-scripts allow-same-origin;'
    );
    res.header('X-Frame-Options', 'deny');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Referrer-Policy', 'no-referrer');
    res.header('X-Permitted-Cross-Domain-Policies', 'none');
    next();
});

app.use(
    webpackDevMiddleware(compiler, {
        noInfo: true,
        publicPath: config.output.publicPath
    })
);
app.use(webpackHotMiddleware(compiler));

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/dist/index.html');
});

app.get('/web', function(request, response) {
    response.sendFile(__dirname + '/dist/index.web.html');
});

app.get('/web/worker.web.js', function(request, response) {
    response.sendFile(__dirname + '/dist/worker.web.js');
});

app.listen(PORT, function(error) {
    if (error) {
        console.error(error);
    } else {
        console.info(
            '==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.',
            PORT,
            PORT
        );
    }
});
