// ////////////////////////////////////
// Simple task to update our views  //
// ////////////////////////////////////

const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const bs = require('browser-sync').create();

// our browser-sync config + nodemon chain
gulp.task('browser-sync', ['nodemon'], () => {
  bs.init({
    proxy: 'http://localhost:3000',
    open: false,
    online: true,
    port: 4000
  });
});

// the real stuff
gulp.task('default', ['browser-sync'], () => {
  gulp.watch('./views/**/*.hbs', bs.reload);
  gulp.watch('./public/**/*.js', bs.reload);
  gulp.watch('./public/**/*.css', bs.reload);
  gulp.watch(['./routes/**/*.js', './app.js', './bin/www'], ['bs-delay']);
});

// give nodemon time to restart
gulp.task('bs-delay', () => {
  setTimeout(() => {
    bs.reload({ stream: false });
  }, 1000);
});

// our gulp-nodemon task
gulp.task('nodemon', (cb) => {
  let started = false;
  return nodemon({
    script: './bin/www',
    ext: 'js',
    ignore: ['public/**/*.js'],
    env: {
      PORT: 3000,
      NODE_ENV: 'development',
      DEBUG: 'notes-app:*'
    }
  }).on('start', () => {
    // avoid nodemon being started multiple times
    if (!started) {
      cb();
      started = true;
    }
  })
    .on('crash', () => {
      // console.log('nodemon.crash');
    })
    .on('restart', () => {
      // setTimeout(() => {
      //   bs.reload({
      //     stream: false
      //   });
      // }, 1000);
      // console.log('nodemon.restart');
    })
    .once('quit', () => {
      // handle ctrl+c without a big weep
      process.exit();
    });
});
