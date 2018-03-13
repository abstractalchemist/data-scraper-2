const { JSDOM } = require('jsdom');
const { httpPromise } = require('./utils');
const { from, range, of, create } = require('rxjs').Observable;
const fs = require('fs')
const pages = function(data) {
   let dom = JSDOM.fragment(data);
   
   let links = dom.querySelectorAll('p.pageLink a');
   
   
   let pageCount = links.item(links.length - 2).textContent;
   return parseInt(pageCount);

}

const page = function(data) {
   //    console.log("looking at page");
   let dom = JSDOM.fragment(data);
   let cards = dom.querySelectorAll('tr');
   
   let output = [];
   for(let i = 1; i < cards.length; ++i) {
      let nameRow = dom.querySelector('tr:nth-child(' + (i + 1) + ') td:nth-child(1)');
      
      
      
      let hrefRow = dom.querySelector('tr:nth-child(' + (i + 1) + ') td:nth-child(3) a');
      if(nameRow && hrefRow)
         output.push({name:nameRow.textContent,href:hrefRow.href});
   }
   return output;
}

const map_trigger_value = function(value) {
   if(value) {
      if(value.endsWith("soul.gif"))
         return "soul"
      if(value.endsWith("salvage.gif"))
         return "salvage"
      if(value.endsWith("draw.gif"))
         return "draw"
      if(value.endsWith("treasure.gif"))
         return "treasure"
      if(value.endsWith("stock.gif"))
         return "pool"
      if(value.endsWith("bounce.gif"))
         return "bounce"
      if(value.endsWith("shot.gif"))
         return "shot"
      if(value.endsWith("gate.gif"))
         return "gate"
   else {
      console.log(`failed to map ${value} as a trigger value`)
      return "";
   }
   
   }

}

const processtrigger = function(trigger_data) {
   if(trigger_data && trigger_data.length) {
      let trigger1 = trigger_data[0] ? trigger_data[0].src : ""
      let trigger2 = trigger_data[1] ? trigger_data[1].src : "";
      
      // probably a climax card
      if(trigger1 && trigger2) {
         let one = map_trigger_value(trigger1)
         let two = map_trigger_value(trigger2)
         if(one === 'soul' && two === 'soul')
            return "soul2"
         if(one === 'soul' && two === 'gate')
            return "soul gate"
      }
      
      // only trigger1
      return map_trigger_value(trigger1)
   
   }
   return ""
}

const info = function(data) {
   let dom = new JSDOM(data);
   let i = 0
   const extract = (expression, input_data) => {
      let i = dom.window.document.querySelector(expression);
      if(i) {
         return i.textContent;
      }
      else {
         console.log(`error looking up input ${input_data}`)
      
      }
      return ""
   }
   let input = extract('table.status tr.first td:nth-child(3)', 'name')
   input = input.split('\n')[1];
   let image = dom.window.document.querySelector('table.status tr.first td:first-child img');
   let number = extract('table.status tr:nth-child(2) td:nth-child(2)', 'number');
   let rarity = extract('table.status tr:nth-child(2) td:nth-child(4)','rarity');
   let level = extract('table.status tr:nth-child(5) td:nth-child(2)','level');
   let abilities = extract('table.status tr:nth-child(8) td','abilities');
   
   let cost = extract('table.status tr:nth-child(5) td:nth-child(4)', 'cost');
   let power = extract('table.status tr:nth-child(6) td:nth-child(2)', 'power');
   let soul = dom.window.document.querySelectorAll('table.status tr:nth-child(6) td:nth-child(4) img').length
   let trigger = processtrigger(dom.window.document.querySelectorAll('table.status tr:nth-child(7) td:nth-child(2) img'))
   let couchdbid = number.trim().toLowerCase().replace('/','-').replace(/-/g,'_')
   return { 
      name:input,
      level,
      number,
      rarity,
      power,
      soul,
      cost,
      trigger,
      id:couchdbid,
      abilities:[abilities],
      image:image.src.replace('..','http://ws-tcg.com/en/cardlist').replace(',','.')
   };
}

let url = 'http://ws-tcg.com/en/jsp/cardlist/expansionDetail';

const cardset = function(id) {
   let pageCounter = 0;
   return from(httpPromise(url,'POST','expansion_id=' + id))
   
      .map(pages)
      .mergeMap(input => range(1,input))
      .mergeMap(i => from(httpPromise(url, 'POST', 'expansion_id=' + id + '&page=' + i)))
      .map(page)
      .mergeMap(from)
      .mergeMap( ({href}) => {
      //	    console.log(`looking up ${href}`)
         href = href.substr(1)
         let [key,value] = href.split("=")
         value = encodeURI(value)
         return from(httpPromise(`http://ws-tcg.com/en/cardlist/list/?${key}=${value}`))
            .do(data => fs.writeFileSync(`/tmp/${encodeURIComponent(value)}.html`, data))
            .map(info)
            .catch(e => {
               console.log(`Error lookup: ${href} via ${key}=${value}`);
               console.log(e)
               return of({})
            })
      
      })


}

exports.pages = pages;
exports.page = page;
exports.info = info;
exports.cardset = cardset;
