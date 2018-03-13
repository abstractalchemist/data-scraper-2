const gulp = require('gulp')
const mocha = require('gulp-mocha')
process.env.NODE_ENV = 'TESTING'
process.env.CONFIG_FILE = process.cwd() + '/series3.json'
process.env.CREDENTIALS_FILE = process.cwd() + "/credentials.json"
process.env.ENDPOINT = 'http://localhost:8000'

gulp.task('test', function() {
   return gulp.src('./test/**/*.js').pipe(mocha({exit:true}))
})

gulp.watch(['./test/**/*.js', './src/**/*.js'], ['test'])

gulp.task('default',['test'])
