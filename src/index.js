const { create_table, delete_table, insert_into_table } = require('./db')
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
   let { id, label, prefix, info } = data[0]
   data.shift()
   let table_name = id
   console.log(`inputting table ${table_name}`)
   return delete_table(table_name)
      .catch(e => {
         console.log(`probably tried to delete a table that does not exist; this is not a problem`)
         return of("")
      })
      .do(_ => {
         console.log(`deleted table ${table_name}`)
      })
      .mergeMap(_ =>  create_table(table_name, {id:"S"}))
      .map(_ => info)
      .mergeMap( ({url,id}) => {
         if(url) {
            console.log(`parsing data from ${url}`)
            return parseIt(url)
               .reduce(
                  (R,V) => {
                     R.push(V)
                     return R
                  },
                  [])
               .do(_ => {
                  console.log(`data parse complete, transferring to table ${table_name}`)
               })
               .mergeMap(data => insert_into_table(table_name,data))
               .mergeMap(_ => {
                  return create(observer => {
                     setTimeout(_ => {
                        process_data(data)
                           .subscribe(observer)
                        }, 15000)
                  })
               })
         }
         else { 
            console.log(`skipping ${table_name}`)
            return of({})
         }
     })
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



