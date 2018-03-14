const { get_items, insert_into_table, create_table, delete_table } = require('./db')
const { of, from, create } = require('rxjs').Observable


delete_table('card_sets')
   .catch(e => of(""))
   .mergeMap(_ => create_table('card_sets',{ id:"S" }))
   .mergeMap(_ => insert_into_table('card_sets', [
         {
            id:"shana",
            prefix:"SS/W14",
            label:"Shakugan No Shana"
         },
         {
            id:"vivid_strike",
            prefix:"VS/W50",
            label:"Vivid Strike"
         },
         {
            id:"nanoha_movie_ws",
            prefix:["N1/W32","N2/W32"],
            label:"Nanoha Movie"
         }
      ]))
   .mergeMap(_ => get_items('card_sets'))
   .pluck('Items')
   .mergeMap(from)
   .subscribe(
      console.log.bind(console),
      console.log.bind(console),
      _ => {
         console.log("*****************************\nComplete\n*************************************")
      })

