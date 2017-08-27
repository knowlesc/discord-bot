const gulp = require('gulp');
const ts = require('gulp-typescript');
const tslint = require("gulp-tslint");
const spawn = require('child_process').spawn;
let bot;

gulp.task('default', ['watch', 'tslint', 'build', 'run']);

gulp.task('watch', () => {
  gulp.watch(['src/**/*.ts'], ['tslint', 'build', 'run']);
});

gulp.task('run', ['build'], () => {
  if (bot) {
    bot.kill();
  }
  bot = spawn('node', ['--inspect', 'build/app.js', '-d'], { stdio: 'inherit' });
});

gulp.task('tslint', ['build'], () => {
  return gulp.src('src/**/*.ts')
    .pipe(tslint({
      formatter: 'stylish'
    }))
    .pipe(tslint.report({
      emitError: false
    }))
});

gulp.task('build', () => {
  const tsProject = ts.createProject('tsconfig.json');
  const tsResult = gulp.src('src/**/*.ts')
    .pipe(tsProject());

  return tsResult.js.pipe(gulp.dest('build'));
});

