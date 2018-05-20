var gulp = require('gulp');
var notify = require("gulp-notify");
var plumber = require("gulp-plumber");
var pug = require('gulp-pug');
var browserSync = require("browser-sync");
var replace = require('gulp-replace');
var git = require('git-rev');
var pkg = require('./package.json')
var typescript = require('gulp-typescript');
var tslint = require("gulp-tslint");
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const webpackConfig = require("./webpack.config");

//setting : paths
var paths = {
  'pug': './pug/',
  'html': './public/',
  'js': './public/js/',
  'css': './public/css/',
  'src': './src/',
  'ts': './ts/'
}

//setting : Pug Options
var pugOptions = {
  pretty: true
}


// Pre task
var gitCommitHash = "(no commit hash)";
gulp.task('pretask', (done) => {
  git.short(function (str) {
    gitCommitHash = str;
    done();
  });
});

//Pug
gulp.task('pug', ['pretask'], () => {
  return gulp.src([paths.pug + '**/*.pug', '!' + paths.pug + '**/includes/*.pug'])
    .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(pug(pugOptions))
    .pipe(replace('__package_name__', pkg.name))
    .pipe(replace('__package_version__', pkg.version))
    .pipe(replace('__package_description__', pkg.description))
    .pipe(replace('__git_commit_hash__', gitCommitHash))
    .pipe(gulp.dest(paths.html));
});

//Browser Sync
gulp.task('browser-sync', () => {
  browserSync({
    server: {
      baseDir: paths.html
    }
  });
  gulp.watch(paths.js + "**/*.js", ['reload']);
  gulp.watch(paths.html + "**/*.html", ['reload']);
  gulp.watch(paths.css + "**/*.css", ['reload']);
});
gulp.task('reload', () => {
  browserSync.reload();
});

//TypeScript
gulp.task('ts', () => {
  var ethOptions =  {
     out: 'ether-tools.js'
  };
  gulp.src([paths.ts + '**/*.ts', '!./node_modules/**'])
    .pipe(typescript(ethOptions))
    .pipe(gulp.dest(paths.js));
 });

//tslint
gulp.task("tslint", () =>
  gulp.src([paths.ts + '**/*.ts', '!./node_modules/**'])
    .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(tslint({
       formatter: "verbose"
    }))
    .pipe(tslint.report())
);

//watch
gulp.task('watch', function () {
  gulp.watch([paths.pug + '**/*.pug', '!' + paths.pug + '**/_*.pug'], ['pug']);
  gulp.watch([paths.ts + '**/*.ts'], ['tslint', 'ts']);
});

gulp.task('webpack', () => {
  gulp.watch(paths.src + "*.js", ['webpack-build']);
});

gulp.task('webpack-build', () => {
  return webpackStream(webpackConfig, webpack)
    .pipe(gulp.dest("./public/js/"));
});



gulp.task('default', ['pug', 'ts', 'browser-sync', 'watch', 'webpack']);
