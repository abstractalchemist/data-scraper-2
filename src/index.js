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
   .mergeMap(from)
   .mergeMap(({id, label, prefix, info}) => {
      return delete_table(id)
         .catch(e => {
            console.log('an error occurred, most likely because this table was created before')
            console.log(e)
            return of({})
         })
         .mergeMap(_ => create_table(id, {id:'S'}))
         .map(_ => info)
         .mergeMap(({url,id}) => parseIt(url))
         .reduce(
            (R,V) => {
               R.push(V)
               return R
            },
            [])
         .mergeMap(data => insert_into_table(id, data))
        
   })
   .subscribe(
      console.log.bind(console),
      console.log.bind(console),
      _ => {
         console.log("*******************************\nComplete\n************************************")
      })



