const { get_items } = require('./db')
const { from } = require('rxjs').Observable
get_items(process.env.TABLE_NAME)
   .pluck("Items")
   .mergeMap(from)
   .subscribe(
      console.log.bind(console),
      console.log.bind(console),
      _ => {
         console.log("****************************\nAll Complete\n*********************************")
      })
