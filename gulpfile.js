'use strict';

var gulp = require('gulp');
var stylus = require('gulp-stylus');
var typescript = require('gulp-tsc');

gulp.task('default', ['build']);

gulp.task('build', ['typescript', 'stylus']);

gulp.task('watch', function() {
    gulp.watch('src/**/*.ts', ['typescript']);
    gulp.watch('styl/*.styl', ['stylus']);
});

gulp.task('typescript', function() {
    return gulp.src('src/**/*.ts')
               .pipe(typescript({ emitError: false }))
               .pipe(gulp.dest('app/js/'));
});

gulp.task('stylus', function() {
    gulp.src('styl/*.styl')
        .pipe(stylus())
        .on('error', function(err) { console.error(err.message) })
        .pipe(gulp.dest('app/css/'));
});
