const { expect } = require('chai')
const { parseIt, parsePartition, findImageHref } = require('../src/translation_parsing')
const fs = require('fs')
const { create } = require('rxjs').Observable

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

describe('translation parse testing', function() {
   it('basic', async function() {
      expect(true).to.be.true
   })

   it('parseIt', async function() {
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
})

describe('english parse testing', function() {
   it('basic', async function() {
      expect(true).to.be.true
   })
})
