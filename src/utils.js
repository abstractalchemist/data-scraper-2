const http = require('http')
const { create } = require('rxjs').Observable
const url = require('url')
exports.http = (input, method, data) => {
   return create(observer => {
      let opts = url.parse(input)
      if(method)
         opts.method = method
      const req = http.request(opts,
         res => {
            if(res.statusCode == 200 || res.statusCode == 201) {
               let buffer = []
               res.on('data', buffer.push.bind(buffer))
               res.on('error', observer.error.bind(observer))
               res.on('end', _ => {
                  observer.next(buffer.join(''))
                  observer.complete()
               })
            }
            else
               observer.error(new Error(`bad status code ${res.statusCode}`)

         })
      req.on(error, observer.error.bind(error))
      if(data)
         req.write(data)
      req.end()
   })
}
