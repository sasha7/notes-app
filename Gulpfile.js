// ////////////////////////////////////
// Simple task to update our views  //
// ////////////////////////////////////

const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const bs = require('browser-sync').create();
const openBrowser = require('open');

// our browser-sync config + nodemon chain
gulp.task('browser-sync', ['nodemon'], () => {
  // without proxy
  // bs.init({
  //   host: 'localhost',
  //   port: '3001',
  //   open: false,
  //   notify: false
  // });

  // proxy
  bs.init({
    proxy: 'http://localhost:3000',
    port: 4000,
    open: false,
    notify: false
  });
});

// the real stuff
gulp.task('default', ['browser-sync'], () => {
  // gulp.watch('./views/**/*.hbs', bs.reload);
  gulp.watch('./public/**/*.js', bs.reload);
  gulp.watch('./public/css/**/*.css', bs.reload);
  gulp.watch(['./routes/**/*.js', './app.js', './bin/www', './views/**/*.hbs'], ['bs-delay']);
  setTimeout(() => openBrowser('http://localhost:4000'), 1000);
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
    ext: 'js,hbs',
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
