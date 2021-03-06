
/**
 * Module dependencies.
 */

var babel = require('gulp-babel');
var concat = require('gulp-concat');
var gulp = require('gulp');
var header = require('gulp-header');
var jshint = require('gulp-jshint');
var karma = require('karma').Server;
var pkg = require('./package.json');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var wrapUmd = require('gulp-wrap-umd');

/**
 * Configuration
 */

var config = {
    name: 'angular-oauth.js',
    entry: './src/angular-oauth.js',
    src: ['./src/*.js', './src/**/*.js'],
    dest: './dist',
    umd: {
        namespace: 'angularOAuth',
        exports: 'ngModule'
    },
    banner: ['/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @version v<%= pkg.version %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''].join('\n')
};

/**
 * Scripts task.
 */

gulp.task('scripts', [], function() {
    return gulp.src(config.src)
        .pipe(babel({ modules: 'ignore', blacklist: ['useStrict'] }))
        .pipe(concat(config.name))
        .pipe(wrapUmd(config.umd))
        .pipe(uglify({
            mangle: false,
            output: { beautify: true },
            compress: false
        }))
        .pipe(header(config.banner, { pkg: pkg }))
        .pipe(gulp.dest(config.dest));
});

gulp.task('scripts-minify', ['scripts'], function() {
    return gulp.src(config.dest + '/' + config.name)
        .pipe(uglify())
        .pipe(rename(function(path) {
            path.extname = '.min.js';
        }))
        .pipe(gulp.dest(config.dest));
});

gulp.task('scripts-lint', function() {
    return gulp.src(config.src)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

/**
 * Test task.
 */

gulp.task('test', ['scripts'], function() {
    var server = new karma({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, function(code) {
        console.log('Karma has exited with code', code);
    });

    return server.start();
});

/**
 * Main tasks.
 */

gulp.task('build', ['scripts-minify']);
gulp.task('default', ['test']);