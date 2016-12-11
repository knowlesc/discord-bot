var gulp = require('gulp');
var watch = require('gulp-watch');
var eslint = require('gulp-eslint');
var spawn = require('child_process').spawn;
var bot;

gulp.task('default', ['run', 'watch', 'lint']);

gulp.task('run', function() {
  if (bot) {
    bot.kill();
  }
  bot = spawn('node', ['app.js'], { stdio: 'inherit' });
});

gulp.task('lint', function () {
  return gulp.src(['src/js/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('watch', function() {
  gulp.watch(['src/js/**/*.js', 'app.js'], ['lint', 'run']);
})
