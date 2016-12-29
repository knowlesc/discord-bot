var gulp = require('gulp');
var eslint = require('gulp-eslint');
var spawn = require('child_process').spawn;
var bot;

gulp.task('default', ['run', 'watch', 'lint']);

gulp.task('run', function() {
  if (bot) {
    bot.kill();
  }
  bot = spawn('node', ['--debug', 'app.js', '-d'], { stdio: 'inherit' });
});

gulp.task('lint', function () {
  return gulp.src(['src/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('watch', function() {
  return gulp.watch(['src/**/*.js', 'app.js', '.eslintrc'], ['lint', 'run']);
})
