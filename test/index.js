const { expect } = require('chai')
const { parseIt, parsePartition, findImageHref } = require('../src/translation_parsing')
const fs = require('fs')
const { create } = require('rxjs').Observable
const { clean_object, get_items, put_item, insert_into_table, convert_obj_to_dynamo, convert_item, create_table, delete_table } = require('aws-interface')

const async_readFile = file => {
   return create(observer => {
      fs.readFile(file,
         (error, contents) => {
            if(error) observer.error(error)
            else {
               observer.next(contents.toString())
               observer.complete()
            }
         })
         
      })
      .toPromise()

}

describe('dynamo conversion', function() {
   it('convert to', function() {
      const res = convert_item({
         id:0,
         set_name:"nanoha",
         set_prefix:"NN/WE",
         set_attributes: {
            foo:"bar"
         }
      })
      expect(res).to.not.be.undefined
      expect(res).to.have.property('id')
      expect(res.id).to.have.property('N')
      expect(res).to.have.property('set_name')
      expect(res.set_name).to.have.property('S')
      expect(res).to.have.property('set_attributes')
   })

   it('convert whole objects', function() {
      const res = convert_obj_to_dynamo('test',
         [
            {
               id:0,
               name:'foo'
            },
            {
               id:1,
               name:'bar'
            }
         ])
      expect(res).to.not.be.undefined
      expect(res).to.have.property('RequestItems')
      expect(res['RequestItems']).to.have.property('test')
      expect(res['RequestItems']['test']).to.have.lengthOf(2)
   })
})

describe('insert into dynamo test', function() {
   it('batch insert test', async function() {
      try {
         await delete_table('test2').toPromise()
      }
      catch(e) {
      }
      let res = await create_table('test2',{id:"N"}).toPromise()
      expect(res).to.be.not.undefined
      res = await insert_into_table('test2', [
         {
            id:0,
            value:'foo'
         },
         {
            id:1,
            value:'bar'
         }
      ]).toPromise()
      expect(res).to.not.be.undefined
      expect(res).to.have.property('UnprocessedItems')
      expect(res.UnprocessedItems).to.be.empty

      let all_items = await get_items('test2').toPromise()
      expect(all_items).to.have.property('Items')
      expect(all_items.Items).to.have.lengthOf(2)

      await delete_table('test2').toPromise()
   })

   it('one item test', async function() {
      try {
         await delete_table('test3').toPromise()
      }
      catch(e) {
      }
      await create_table('test3', {id:"N"}).toPromise()
      let res = await put_item('test3', {
         id:0
      }).toPromise()

      expect(res).to.not.be.undefined
      let all_items = await get_items('test3').toPromise()
      expect(all_items).to.have.property('Items')
      expect(all_items.Items).to.have.lengthOf(1)

      await delete_table('test3').toPromise()
   })
})

describe('table creation test', function() {
   it('create table test', async function() {
      const res = await create_table('test',{id:"N"}).toPromise()
      expect(res).to.not.be.undefined
  })

   it('delete table test', async function() {
      const res = await delete_table('test').toPromise()
      expect(res).to.not.be.undefined
   })
})

describe('translation parse testing', function() {
   it('basic', async function() {
      expect(true).to.be.true
   })

   it('parseIt', async function() {
      this.timeout(30000)
      const res = await parseIt(process.cwd() + "/test_simple.html")
         .reduce(
            (R, V) => {
               R.push(V)
               return R
            },[]
         )
         .toPromise()
      expect(res).to.not.be.undefined
      expect(res).to.have.lengthOf(7)
   })

   it('parseParitition', async function() {
      const contents = await async_readFile(process.cwd() + "/partition_test.txt")
      const res = await parsePartition(contents)
      expect(res).to.not.be.undefined
      expect(res).to.have.property('lvl')
      expect(res).to.have.property('cost')
      expect(res).to.have.property('abilities')
      expect(res.abilities).to.have.lengthOf(1)
      expect(res.abilities[0]).to.equal('Search your Library for up to 2 ::Flame:: Characters, reveal them, and put them in your hand. Discard a card from your hand to your Waiting Room. Send this to Memory.')
 
   })

   it('parsePartition2', async function() {
      const contents = await async_readFile(process.cwd() + "/partition_test_2.txt")
      const res = await parsePartition(contents)
      expect(res).to.not.be.undefined
      expect(res).to.have.property('lvl')
      expect(res).to.have.property('cost')
      expect(res).to.have.property('abilities')
      expect(res.abilities).to.have.lengthOf(2)
      expect(res.abilities[0]).to.equal('[C] ASSIST All your Characters in front of this gain +500 Power.')
      expect(res.abilities[1]).to.equal('[S] [Rest this] Choose 1 of your ::Flame:: Characters, and that Character gains +500 Power for the turn.')
     
   })

   it('parseParition3', async function() {
      const contents = await async_readFile(process.cwd() + "/partition_test3.txt")
      const res = await parsePartition(contents)
      expect(res).to.not.be.undefined
      expect(res).to.have.property('trigger')
      expect(res.trigger).to.equal("None")
   })
})

describe('clean object', function() {
   it('basic', function() {
      const res = clean_object({foo:"", ar:['1','2',''],tar:0, thisisempty:['','']})
      expect(res).to.not.have.property('foo')
      expect(res).to.have.property('ar')
      expect(res.ar).to.have.lengthOf(2)
      expect(res).to.have.property('tar')
      expect(res).to.not.have.property('thisisempty')
   })
})


