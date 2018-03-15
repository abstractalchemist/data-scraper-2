const { expect } = require('chai')
const { create_table, delete_table, db_interface } = require('../src/db')
const { create } = require('rxjs').Observable

const basic_handler = observer => {
   return (error, data) => {
      if(error) observer.error(error)
      else {
         observer.next(data)
         observer.complete()
      }
   }

}

describe('database exp', function() {
   it('update test', async function() {
      try {
         await delete_table('update_test').toPromise()
      }
      catch(e) {
      }

      await create_table('update_test', {id:"S"}).toPromise()

      let  res = await create(observer => {
         db_interface.updateItem({
            TableName:'update_test',
            ExpressionAttributeNames:{
               "#c":"COUNT"
            },
            ExpressionAttributeValues:{
               ":i":{
                  N:"1"
               }
            },
            Key: {
               id:{
                  S:"0"
               },
            },
            UpdateExpression:"ADD #c :i",
            ReturnValues: "ALL_NEW"
         }, basic_handler(observer))
      }).toPromise();
     console.log(res);
     res = await create(observer => {
         db_interface.updateItem({
            TableName:'update_test',
            ExpressionAttributeNames:{
               "#c":"COUNT"
            },
            ExpressionAttributeValues:{
               ":i":{
                  N:"1"
               }
            },
            Key: {
               id:{
                  S:"0"
               },
            },
            UpdateExpression:"ADD #c :i",
            ReturnValues:"ALL_NEW"
         }, basic_handler(observer))
      }).toPromise();


      console.log(res)
      res = await create(observer => {
         db_interface.updateItem({
            TableName:'update_test',
            ExpressionAttributeNames:{
               "#c":"COUNT"
            },
            ExpressionAttributeValues:{
               ":i":{
                  N:"-1"
               }
            },
            Key: {
               id:{
                  S:"0"
               },
            },
            UpdateExpression:"ADD #c :i",
            ReturnValues:"ALL_NEW"
         }, basic_handler(observer))
      }).toPromise();


      console.log(res)
      
      await delete_table('update_test').toPromise()
   })

   it('nested documents', async function() {
      try {
         await delete_table('update_table_2').toPromise()
      }
      catch(e) {
      }

      await create_table('update_table_2', {id:"S"}).toPromise()

      let res = await create(observer => {
         db_interface.updateItem({
            TableName:'update_table_2',
            Key: {
               id:{
                  S:"0"
               }
            },
            ExpressionAttributeNames: {
               "#l":"library",
               "#f":"foo"
            },
            ExpressionAttributeValues: {
               ":v": {
                  L : []
               },
               ":f": {
                  M: {}
               }
            },
            UpdateExpression: "SET #l = :v, #f = :f",
            ReturnValues:"ALL_NEW"
         }, basic_handler(observer))
      }).toPromise()
      console.log(res)

      res = await create(observer => {
         db_interface.updateItem({
            TableName:'update_table_2',
            Key: {
               id: {
                  S:"0"
               }
            },
            ExpressionAttributeNames: {
               "#l":"library",
               "#f":"foo",
               "#b":"bar"
            },
            ExpressionAttributeValues: {
               ":l": {
                  L:[{
                        M: {
                           card_id: { S: "SS/W14-001" },
                           count: { N: "1" }
                        }
                  }]
               },
               ":e": { N: "0" }
            },
            UpdateExpression: " SET #l = list_append(#l, :l) ,#f.#b = :e",
            ReturnValues:"ALL_NEW"
         }, basic_handler(observer))
      }).toPromise()
      console.log(res)
      console.log(res.Attributes.foo.M.bar)

      await delete_table('update_table_2').toPromise()
   })
})
