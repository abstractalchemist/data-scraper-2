const { create_table, delete_table } = require('./db')
const { create, of } = require('rxjs').Observable

const delete_and_create = (table_name, key_schema) => {
   return delete_table(table_name)
      .catch(e => of(""))
      .mergeMap(_ => create_table(table_name, key_schema))
}

delete_and_create('card_sets', {id:"S"})
   .mergeMap(_ => delete_and_create('decks', {id:"S"}))
   .mergeMap(_ => delete_and_create('library', {id:"S"}))
   .subscribe(
      console.log.bind(console),
      console.log.bind(console),
      _ => {
         console.log("**********************************\nComplete\n***********************************")
      })
