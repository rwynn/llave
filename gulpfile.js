const gulp = require('gulp'),
    rename = require('gulp-rename'),
    template = require('gulp-template'),
    filter = require('gulp-filter'),
    chmod = require('gulp-chmod'),
    crypto = require('crypto'),
    fs = require('fs'),
    path = require('path'),
    Stream = require('stream'),
    del = require('del'),
    gulpNSP = require('gulp-nsp'),
    shasums = { data: {} };

const buildIntegrity = function() {
    const stream = new Stream.Transform({ objectMode: true });
    stream._transform = function(file, unused, callback) {
        const hash = crypto.createHash('sha384'),
            input = fs.createReadStream(file.path),
            basename = path.basename(file.path);
        input.on('readable', function() {
            const data = input.read();
            if (data) hash.update(data);
            else {
                shasums.data[basename] = 'sha384-' + hash.digest('base64');
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
    exe: ['go/ironclad/**/ironclad*'],
    main: [
        'package.prod.json',
        'npm-shrinkwrap.json',
        'main.js',
        'ipc.js',
        'formatdb.js',
        'go/ironclad/**/ironclad*'
    ],
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
    integrity: ['dist/*.js']
};

const renamed = {
    'package.prod': 'package',
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

gulp.task('nsp', function(cb) {
    gulpNSP(
        {
            shrinkwrap: __dirname + '/npm-shrinkwrap.json',
            package: __dirname + '/package.json'
        },
        cb
    );
});

gulp.task('integrity', function() {
    return gulp.src(paths.integrity).pipe(buildIntegrity());
});

gulp.task('main', ['nsp', 'clean'], function() {
    return gulp
        .src(paths.main, { base: '.' })
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/app'));
});

gulp.task('render', ['nsp', 'clean', 'integrity'], function() {
    const templates = filter(['**/index.html'], { restore: true });
    return gulp
        .src(paths.render, { base: '.' })
        .pipe(rename(maybeRename))
        .pipe(templates)
        .pipe(template(shasums))
        .pipe(templates.restore)
        .pipe(gulp.dest('build/app'));
});

gulp.task('web', ['nsp', 'clean', 'integrity'], function() {
    const templates = filter(['**/index.html'], { restore: true });
    return gulp
        .src(paths.web)
        .pipe(rename(maybeRename))
        .pipe(templates)
        .pipe(template(shasums))
        .pipe(templates.restore)
        .pipe(gulp.dest('build/web'));
});

gulp.task('cordova', ['nsp', 'clean', 'integrity'], function() {
    const templates = filter(['**/index.html'], { restore: true });
    return gulp
        .src(paths.cordova)
        .pipe(rename(maybeRename))
        .pipe(templates)
        .pipe(template(shasums))
        .pipe(templates.restore)
        .pipe(gulp.dest('build/cordova/www'));
});

gulp.task('postclean', function() {
    return del(['build/app/etc']);
});

gulp.task('chmod', function() {
    return gulp
        .src(paths.exe)
        .pipe(chmod(0755))
        .pipe(gulp.dest('go/ironclad'));
});

gulp.task('buildapp', ['main', 'render', 'web', 'cordova']);
