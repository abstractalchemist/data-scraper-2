const { create_table, delete_table, insert_into_table, put_item } = require('aws-interface')
const { cardset } = require('./eng_scraper')
const { parseIt } = require('./translation_parsing')
const { create, of, from } = require('rxjs').Observable
const fs = require('fs')
// script to create and insert new tables for series
if(!process.env.CREDENTIALS_FILE)
   throw new Error("We're in production mode, please provide root credentials file via CREDENTIALS_FILE variable")
if(!process.env.CONFIG_FILE)
   throw new Error("We're trying to actually insert something, please provide series file via CONFIG_FILE variable")
if(process.env.NODE_ENV !== 'production')
   throw new Error(`We're in production if we're running this file, please set this via NODE_ENV, currently ${typeof process.env.NODE_ENV}`)

const process_data = data => {
   if(data.length == 0)
      return of("")
   let { id, label, prefix, info: {url, id:set_id} } = data[0]
   data.shift()
   let table_name = id

   const next = _ => 
      create(observer => 
         setTimeout(_ =>
            process_data(data).subscribe(observer)
         , 15000))
   

   const add_to_sets = _ => put_item('card_sets', {id:table_name, label, prefix})

   const insert_table = data => insert_into_table('cards', data)

   const combine = (R,V) => {
      R.push(V)
      return R
   }

   return create(observer => {
       if(url) {
          console.log(`parsing data from ${url} for ${table_name}`)
          parseIt(url).subscribe(observer)

       }
       else if(set_id) {
          // probably english
          console.log(`looking up from ws-tcg english set ${set_id} for table ${table_name}`)
          cardset(set_id).subscribe(observer)
       }
       else { 
          console.log(`skipping ${table_name}`)
          observer.next({})
          observer.complete()
       }
   })
      .map(item => Object.assign({}, item, {table_id:table_name}))
      .reduce(combine,[])
      .mergeMap(insert_table)
      .mergeMap(add_to_sets)
      .mergeMap(next)
}
create(observer => {
   fs.readFile(process.env.CONFIG_FILE,
      (error, contents) => {
         if(error) observer.error(error)
         else {
            observer.next(contents)
            observer.complete()
         }
      })
})
   .map(JSON.parse)
   .mergeMap(process_data)
   .subscribe(
      console.log.bind(console),
      console.log.bind(console),
      _ => {
         console.log("*******************************\nComplete\n************************************")
      })



