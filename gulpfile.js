var gulp = require('gulp'),
    rename = require('gulp-rename'),
    del = require('del');

var paths = {
    main: ['package.prod.json', 'main.js', 'ipc.js', 'go/**/ironclad*'],
    render: ['dist/bundle.js', 'dist/index.prod.html']
};

var renamed = {
    'package.prod': 'package',
    'index.prod': 'index'
};

var maybeRename = function(path) {
    var name = renamed[path.basename];
    if (name) {
        path.basename = name;
    }
};

gulp.task('clean', function() {
    return del(['build/*']);
});

gulp.task('main', ['clean'], function() {
    return gulp
        .src(paths.main, { base: '.' })
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/app'));
});

gulp.task('render', ['clean'], function() {
    return gulp
        .src(paths.render, { base: '.' })
        .pipe(rename(maybeRename))
        .pipe(gulp.dest('build/app'));
});

gulp.task('postclean', function() {
    return del(['build/app/etc']);
});

gulp.task('buildapp', ['main', 'render']);
