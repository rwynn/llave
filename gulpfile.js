const gulp = require('gulp'),
    rename = require('gulp-rename'),
    template = require('gulp-template'),
    crypto = require('crypto'),
    fs = require('fs'),
    path = require('path'),
    Stream = require('stream'),
    del = require('del'),
    shasums = { data: {}};
    
const buildIntegrity = function() {
    const stream = new Stream.Transform({objectMode: true});
    stream._transform = function (file, unused, callback) {
        const hash = crypto.createHash('sha384'),
            input = fs.createReadStream(file.path),
            basename = path.basename(file.path);
        input.on('readable', function() { 
            const data = input.read();
            if (data)
                hash.update(data);
            else {
                shasums.data[basename] = hash.digest('base64');
                callback(null, file);
            }
        });
        input.on('error', function(err) {
            callback(err, undefined);
        });
    };
    return stream;
};

const paths = {
    main: ['package.prod.json', 'npm-shrinkwrap.prod.json', 'main.js', 'ipc.js', 'go/**/ironclad*'],
    render: ['dist/bundle.js', 'dist/index.prod.html'],
    web: [
        'dist/bundle.web.js',
        'dist/index.web.prod.html',
        'dist/worker.web.js'
    ],
    cordova: [
        'dist/bundle.web.js',
        'dist/index.cordova.html',
        'dist/worker.web.js'
    ],
    integrity: [
        'dist/*.js'
    ]
};

const renamed = {
    'package.prod': 'package',
    'npm-shrinkwrap.prod': 'npm-shrinkwrap',
    'index.prod': 'index',
    'index.web.prod': 'index',
    'index.cordova': 'index'
};

const maybeRename = function(path) {
    const name = renamed[path.basename];
    if (name) {
        path.basename = name;
    }
};

gulp.task('clean', function() {
    return del(['build/*']);
});

gulp.task('integrity', function() {
    return gulp
        .src(paths.integrity)
        .pipe(buildIntegrity());
});

gulp.task('main', ['clean'], function() {
    return gulp
        .src(paths.main, { base: '.' })
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/app'));
});

gulp.task('render', ['clean', 'integrity'], function() {
    return gulp
        .src(paths.render, { base: '.' })
        .pipe(template(shasums))
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/app'));
});

gulp.task('web', ['clean', 'integrity'], function() {
    return gulp
        .src(paths.web)
        .pipe(template(shasums))
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/web'));
});

gulp.task('cordova', ['clean', 'integrity'], function() {
    return gulp
        .src(paths.cordova)
        .pipe(template(shasums))
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/cordova/www'));
});

gulp.task('postclean', function() {
    return del(['build/app/etc']);
});

gulp.task('buildapp', ['main', 'render', 'web', 'cordova']);
