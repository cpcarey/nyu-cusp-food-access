const gulp = require('gulp');
const connect = require('gulp-connect');

gulp.task('build-src', gulp.series(async function(done) {
  done();
}));

gulp.task('webserver', gulp.series(async function() {
  server = connect.server({
    port: 2345,
    https: false,
  });
}));

gulp.task('watch', gulp.parallel('build-src', 'webserver', async function() {
  const watchlistSrc = [
    './src/*',
  ];

  gulp.watch(watchlistSrc, gulp.series('build-src'));
}));
