const AWS = require('aws-sdk')
const { Observable } = require('rxjs')
const { create, from, of } = Observable

if(process.env.CREDENTIALS_FILE)
   AWS.config.loadFromPath(process.env.CREDENTIALS_FILE)

let db_interface;
if(process.env.ENDPOINT)
   db_interface = new AWS.DynamoDB({endpoint:process.env.ENDPOINT})
else
   db_interface = new AWS.DynamoDB()

exports.db_interface = db_interface

const convert_to_attributes = attributes => {
   let dynamodb_attributes = []
   for(let i in attributes) {
      if(attributes.hasOwnProperty(i))
         dynamodb_attributes.push({
            AttributeName:i,
            AttributeType:attributes[i]
         })
   }
   return dynamodb_attributes
}

const convert_to_schema = attributes => {
   let schema = []
   for(let i in attributes) {
      if(attributes.hasOwnProperty(i))
         schema.push({
            AttributeName:i,
            KeyType:"HASH"
         })
   }
   return schema
}

const convert_secondary = attributes => {
   let schema = []
   for(let i in attributes) {
      if(attributes.hasOwnProperty(i))
         schema.push({
            AttributeName:i,
            KeyType:"RANGE"
         })
   }
   return schema
}



const convert_type = item => {
   if(Array.isArray(item)) {
      return 'SS'
   }
   if(typeof item === 'string')
      return 'S'
   if(typeof item === 'number')
      return 'N'
   if(typeof item === 'object')
      return 'M'
   throw new Error(`cannot handle item type ${typeof item}`)

}

const convert_item = object => {
   if(typeof object !== 'object')
      return object.toString()
   if(Array.isArray(object))
      return object
   let dynamo_obj = {}
   for(let i in object) {
      if(object.hasOwnProperty(i)) {
         if(object[i] == undefined) {
            throw new Error(`${object.id} has an undefined property ${i}`)
         }
         dynamo_obj[i] = {}
         dynamo_obj[i][convert_type(object[i])] = convert_item(object[i]);
      }
   }
   return dynamo_obj
}

exports.convert_item = convert_item

const convert_obj_to_dynamo = (table,objects) => {
   if(!table)
      throw new Error("table name undefined")
   if(!Array.isArray(objects))
      throw new Error("object must be an array")
   let dynamo_request = {}
   dynamo_request.RequestItems = {}
   dynamo_request.RequestItems[table] = objects.map(o => {
      let u = {
         PutRequest: {
            Item: convert_item(o)
         }
      }
      return u
   })
   return dynamo_request;
}

exports.convert_obj_to_dynamo = convert_obj_to_dynamo

const put_item = (table, object) => {
   if(!table)
      throw new Error("table name undefined")
   if(!object)
      throw new Error("Must provide an object to update")
   return create(observer => {
      const req = convert_item(object)
      const params = {
         Item:req,
         ReturnConsumedCapacity:"TOTAL",
         TableName:table
      }
      db_interface.putItem(params,
         (error, data) => {
            if(error) observer.error(error)
            else {
               observer.next(data)
               observer.complete()
            }
         })
   })
}

exports.put_item = put_item

const get_items = table => {
   return create(observer => {
      db_interface.scan({
         TableName:table
      },
      (error, data) => {
         if(error) observer.error(error)
         else {
            observer.next(data)
            observer.complete()
         }
      })
   })
}

exports.get_items = get_items


const clean_object = object => {
   for(let i in object) {
      if(object.hasOwnProperty(i)) {
         if(typeof object[i] === 'string') {
            if(object[i].length === 0)
               delete object[i]
         }
         else if(Array.isArray(object[i])) {
            object[i] = object[i].filter(s => s && s.trim().length > 0)
            if(object[i].length == 0)
               delete object[i]
         }
      }

   }
   return object
}

exports.clean_object = clean_object

const insert_into_table = (table, objects) => {
   return from(objects)
      .map(clean_object)
      .bufferCount(25)
      .mergeMap(data => {
         
         let req = convert_obj_to_dynamo(table, data)
         return create(observer => {
            db_interface.batchWriteItem(req,
               (error, data) => {
                  if(error) observer.error(error)
                  else {
                     observer.next(data)
                     observer.complete()
                  }
               })
         })
            .catch(e => {

               return from(data)
                  .mergeMap(d => {
                     return create(observer => {
                        db_interface.putItem({
                           TableName:table,
                           Item:convert_item(d)
                        },
                        (error, data) => {
                           if(error) {
                              console.log(d)
                              observer.error(error)
                           }
                           else {
                              
                              observer.next(data)
                              observer.complete()
                           }
                        })
                     })
                  })
            })
      })
   
   
}


exports.insert_into_table = insert_into_table

const create_table = (db_name,attributes,sort_key) => {
   if(!db_name)
      throw new Error("database name creation requires table")
   return create(observer => {
      db_interface.createTable({
         TableName:db_name,
         AttributeDefinitions: convert_to_attributes(attributes).concat(convert_to_attributes(sort_key)),
         KeySchema:convert_to_schema(attributes).concat(convert_secondary(sort_key)),
         ProvisionedThroughput:{
            ReadCapacityUnits:5,
            WriteCapacityUnits:5
         }
      },
      (error, data) => {
         if(error) observer.error(error)
         else {
            observer.next(data)
            observer.complete()
         }
      })
   })
      .mergeMap(({TableDescription:{TableName, TableStatus}}) => {
         console.log(`after creation, table status is ${TableStatus} for ${TableName}`)
         if(TableStatus === 'CREATING')
            return create(observer => {
               db_interface.waitFor('tableExists', { TableName },
                  (error, data) => {
                     if(error) observer.error(error)
                     else {
                        observer.next()
                        observer.complete()
                     }
                  })
            })
         return of({})
      })
}

const delete_table = db_name => {
   if(!db_name)
      throw new Error("database name deletion requires table")
   return create(observer => {
      db_interface.deleteTable({
         TableName:db_name
      },
      (error, data) => {
         if(error) observer.error(error)
         else {
            observer.next(data)
            observer.complete()
         }
      })
   })
      .mergeMap(data  => {
         if(data.TableDescription) {
            let { TableDescription: { TableName, TableStatus } } = data
            return create(observer => {
               db_interface.waitFor('tableNotExists', { TableName },
                  (error, data) => {
                     if(error) observer.error(error)
                     else {
                        observer.next(data)
                        observer.complete()
                     }
                  })
            })
         }
         return of({})
      })
      

}

exports.create_table = create_table
exports.delete_table = delete_table
