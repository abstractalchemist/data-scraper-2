const AWS = require('aws-sdk')
const { create, from, of } = require('rxjs').Observable

if(process.env.CREDENTIALS_FILE)
   AWS.config.loadFromPath(process.env.CREDENTIALS_FILE)

let db_interface;
if(process.env.NODE_ENV === 'TESTING')
   db_interface = new AWS.DynamoDB({endpoint:process.env.ENDPOINT})
else
   db_interface = new AWS.DynamoDB()

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

const convert_type = item => {
   if(typeof item === 'string')
      return 'S'
   if(typeof item === 'object')
      return 'M'
   if(typeof item === 'number')
      return 'N'
   throw new Error(`cannot handle item type ${typeof item}`)

}

const convert_item = object => {
   if(typeof object !== 'object')
      return object.toString()
   let dynamo_obj = {}
   for(let i in object) {
      if(object.hasOwnProperty(i)) {
          
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

const insert_into_table = (table, objects) => {
   return create(observer => {
      let req = convert_obj_to_dynamo(table, objects)
      db_interface.batchWriteItem(req,
         (error, data) => {
            if(error) observer.error(error)
            else {
               observer.next(data)
               observer.complete()
            }
         })
   })
}

exports.insert_into_table = insert_into_table

const create_table = (db_name,attributes) => {
   if(!db_name)
      throw new Error("database name creation requires table")
   return create(observer => {
      db_interface.createTable({
         TableName:db_name,
         AttributeDefinitions: convert_to_attributes(attributes),
         KeySchema:convert_to_schema(attributes),
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

}

exports.create_table = create_table
exports.delete_table = delete_table
