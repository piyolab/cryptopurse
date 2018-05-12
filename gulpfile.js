var gulp = require('gulp');
var notify = require("gulp-notify");
var plumber = require("gulp-plumber");
var pug = require('gulp-pug');
var browserSync = require("browser-sync");
var replace = require('gulp-replace');
var git = require('git-rev');

//setting : paths
var paths = {
  'pug': './pug/',
  'html': './public/',
  'js': './public/js/',
  'css': './public/css/'
}

//setting : Pug Options
var pugOptions = {
  pretty: true
}

var gitCommitHash = "(no commit hash)";
git.short(function (str) {
  gitCommitHash = str;
})


//Pug
gulp.task('pug', () => {
  return gulp.src([paths.pug + '**/*.pug', '!' + paths.pug + '**/includes/*.pug'])
    .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
    .pipe(pug(pugOptions))
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

//watch
gulp.task('watch', function () {
  gulp.watch([paths.pug + '**/*.pug', '!' + paths.pug + '**/_*.pug'], ['pug']);
});

gulp.task('default', ['browser-sync', 'watch']);
