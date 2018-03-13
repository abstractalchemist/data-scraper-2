const gulp = require('gulp')
const mocha = require('gulp-mocha')
process.env.NODE_ENV = 'TESTING'

gulp.task('test', function() {
   return gulp..src('./test/**/*.js').pipe(mocha({exit:true}))
})

gulp.watch(['./test/**/*.js', './src/**/*.js'], 'test')

gulp.task('default','test')
