const { pages, page, info, cardset } = require('../src/eng_scraper')
const { expect } = require('chai')
const fs = require('fs')
const { create } = require('rxjs').Observable;

const async_readfile = file => {
   return create(observer => {
      fs.readFile(file,
         (error, contents) => {
            if(error) observer.error(error)
            else {
               observer.next(contents)
               observer.complete()
            }
         })
   })
}

describe('english scraper', function() {
   it('info', async function() {
      const contents = await async_readfile(process.cwd() + "/test_eng.html").toPromise()
      const res = info(contents)
      expect(res).to.not.be.undefined
      expect(res).to.have.property('name')
      expect(res.name).to.equal('"Happy Maker!" Eli Ayase')
      expect(res).to.have.property('cost')
      expect(res.cost).to.equal("2")
      expect(res).to.have.property('level')
      expect(res.level).to.equal("3")
      expect(res).to.have.property('abilities')
      expect(res.abilities).to.have.lengthOf(3)
      expect(res).to.have.property('trigger')
      expect(res.trigger).to.equal('soul')
   })

   it('page', async function() {
      const contents = await async_readfile(process.cwd() + "/test_page.html").toPromise()
      const res = page(contents)
      expect(res).to.not.be.undefined
      expect(res).to.have.lengthOf(10)
      res.forEach( ({name, href}) => {
         expect(name).to.not.be.undefined
         expect(href).to.not.be.undefined
      })
   })

   it('pages', async function() {
      const contents = await async_readfile(process.cwd() + "/test_pages.html").toPromise()
      const res = pages(contents)
      expect(res).to.equal(13)
   })
})
