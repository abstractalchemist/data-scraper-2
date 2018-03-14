const { create_table, delete_table } = require('./db')
const { create, of } = require('rxjs').Observable

const delete_and_create = (table_name, key_schema, sort_key) => {
   return delete_table(table_name)
      .catch(e => of(""))
      .mergeMap(_ => create_table(table_name, key_schema, sort_key))
}

delete_and_create('card_sets', {id:"S"})
   .mergeMap(_ => delete_and_create('decks', {user_id:"S"},  {generated_id:"S"}))
   .mergeMap(_ => delete_and_create('library', {user_id:"S"}, {card_id:"S"}))
   .mergeMap(_ => delete_and_create('id_table', {id:"N"}))
   .subscribe(
      console.log.bind(console),
      console.log.bind(console),
      _ => {
         console.log("**********************************\nComplete\n***********************************")
      })
