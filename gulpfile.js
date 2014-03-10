'use strict';

var gulp = require('gulp');
var stylus = require('gulp-stylus');
var typescript = require('gulp-tsc');
var concat = require('gulp-concat');

gulp.task('default', ['build']);

gulp.task('build', ['typescript', 'stylus']);

gulp.task('watch', function() {
    gulp.watch('src/**/*.ts', ['typescript-dev']);
    gulp.watch('styl/*.styl', ['stylus']);
});

gulp.task('typescript', function() {
    return gulp.src('src/*.ts')
               .pipe(typescript({ out: 'klotski.js', emitError: false }))
               .pipe(gulp.dest('app/js/'));
});

gulp.task('typescript-dev', function() {
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
