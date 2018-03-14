// parse a booster translation file from Heart of the cards

const { ReplaySubject, Observable } = require('rxjs')
const { create, from, of } = Observable;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { http } = require('./utils');
const { rebuildAbilities } = require('./dom_parsing');
//const { series_code } = require('./config');

//const config_data = fs.readFileSync(process.argv[2]);
//const config = JSON.parse(config_data)


const series_code = (_ => {
   let subject = new ReplaySubject()
   create(observer => {
      if(process.env.NODE_ENV !== 'production')
         console.log(`parsing file ${process.env.CONFIG_FILE}`)
      if(process.env.CONFIG_FILE && process.env.CONFIG_FILE.endsWith('json'))
         fs.readFile(process.env.CONFIG_FILE,
            (error, contents) => {
               if(error) observer.error(error)
               else {
                  try {
                     observer.next(JSON.parse(contents))
                     observer.complete()
                  }
                  catch(e) {
                     observer.error(new Error(`Error parsing ${process.env.CONFIG_FILE}`))
                  }
               }
            })
   })
      .subscribe(subject)

   //    console.log(`checking ${id}`)
   return id => {
      return subject
         .map(config => {
           let info = config.find( ({prefix,info}) => {
               if(info.url && info.id) {
                  if(typeof prefix === 'string')
                     return id.startsWith(prefix.replace("/","_").replace("-","_").toLowerCase())
                  return prefix.find( i => id.startsWith(i.replace("/","_").replace("-","_").toLowerCase()))
               }
            })
            if(info) {
               return info.info.id;
            }
            else throw new Error(`could not locate id for ${id}`)
         })
   }
})()

const colorRe = /^Color: ([a-zA-Z]+)/
const re1 = new RegExp("TEXT:");
const lvlre = /^Level: ([0-9]).*/;
const costre = /Cost: ([0-9])/;
const powerre = /Power: ([0-9]{0,5})/
const triggerre = /^Triggers: (.+)$/
const soulre = /Soul: ([0-9])/
const traitre = /Trait 1:(.+)Trait 2:(.+)/
const idre = new RegExp("^Card No[.]: (.+)\w*Rarity:(.+)");

function parsePartition(partition) {

   try {
      let data = partition.split("\n").map(o => o.trim()).filter(o => o.length > 0);
      const index = data.findIndex(input => re1.test(input));
      let abilities = "";
      if(index >= 0) {
      
         const sliced = data.slice(index);
      
         abilities = rebuildAbilities(sliced);
      }
      const level = lvlre.exec(data[4]);
      if(index == 7) {
      
         // no translation
         data = [""].concat(data)
      }
      
      let lvl = level ? level[1] : "no level";
      let id = idre.exec(data[2])
      if(!id) {
         console.log("Could not find id for " + partition + " in data " + data[0])
         throw new Error("id not found")
      }
      let power = powerre.exec(data[4])
      let soul = soulre.exec(data[4])
      let cost = costre.exec(data[4])
      let traits = traitre.exec(data[5])
      let color = colorRe.exec(data[3])
      let trigger = triggerre.exec(data[6])
      
      let couchdbid = id[1].trim().toLowerCase().replace('/','_').replace('-','_')
      let splitid = couchdbid.split('_');
      
      return {
         rarity:id[2].trim(),
         trigger:trigger[1],
         data,
         lvl,
         id,
         couchdbid,
         abilities,
         splitid,
         power:power ? power[1] : "no power",
         soul:soul ? soul[1] : "no soul",
         cost: cost ? cost[1] : "no cost",
         color: color ? color[1].toLowerCase() : "no color",
         trait1: traits ? traits[1].trim() : "no trait1",
         trait2: traits ? traits[2].trim() : "no trait2"
      }
   }
   catch(e) {
      fs.writeFileSync('/tmp/errror.html', partition)
   throw e
   }
}

function findImageHref(dom) {
   let img = dom.window.document.querySelectorAll('div.card_details img.thumbnail');
   //    console.log(img)
   if(img && img.length > 0) {
      //	console.log("parsed " + couchdbid);
      return img[0].src.replace(/"/g,'');
   }
   else {
      //	console.log("error, could not parse " + couchdbid);
      return "";
   }
   return img;
}

function generateFileParser(file) {
   return create(observer => {
      const read = fs.createReadStream(file);
      let buffer = [];
      read.on('data', chunk => buffer.push(chunk));
      read.on('end', _ => {
      
         observer.next(buffer.join());
         observer.complete()
      })
      read.on('error', observer.error.bind(observer))
   })
}

function generateHttpParser(url) {
   return http(url);
}

// heart of the cards map
function trigger_map(trigger) {
   switch(trigger) {
      case "None":
         return ""
      case "Soul Gate":
         return "soul gate";
      case "2 Soul":
         return "soul2"
      case "Soul":
         return "soul"
      case "Salvage":
         return "salvage"
      case "Draw":
         return "draw"
      case "Treasure":
         return "treasure"
      case "Soul Bounce":
         return "soul bounce"
      case "Soul Shot":
         return "soul shot"
      default:
         throw new Error(`could not map ${trigger}`)
   }
}

function parseIt(file) {
   //    console.log("Parsing it");
   let parseFunc;
   if(file.startsWith("/"))
      parseFunc = generateFileParser;
   else if(file.startsWith("http"))
      parseFunc = generateHttpParser;
   else
      throw "Could not locate a parser for input";
   return parseFunc(file)
      .map(data => new JSDOM(data))
      .map(dom => dom.window.document.querySelector("pre").textContent)
      .mergeMap(data => {
         return from(data.split("================================================================================"));
      })
      .filter(data => {
         return new RegExp("Level:").test(data)
      })
      .mergeMap(partition => {
         let { trigger, color, power, soul, cost, trait1, trait2, lvl, data, id, couchdbid, abilities, splitid, rarity } = parsePartition(partition);
         
         return series_code(couchdbid)
            .mergeMap(image_id => {
               if(process.env.NODE_ENV !== 'TESTING' || !process.env.IGNORE_IMAGES)
                  return http('https://littleakiba.com/tcg/weiss-schwarz/card.php?series_id=' + image_id + '&code=' + splitid[splitid.length - 1]  +  '&view=Go')
         //	   	.do(data => fs.writeFile('/tmp/' + couchdbid + '.html', data, err => { if(err) console.log(err)} ))
                     .map(data => new JSDOM(data))
                     .map(findImageHref)
               
               return of("")
            })
               .map(imgsrc => {
               //		    console.log(imgsrc);
                  return {
                     name:data[0],
                     level:lvl,
                     rarity:rarity,
                     number:id[1].trim(),
                     id:couchdbid,
                     abilities:abilities,
                     trigger_action:trigger_map(trigger),
                     color,
                     power,
                     soul,
                     cost,
                     trait1,
                     trait2,
                     image:imgsrc}
               })
      })


}

exports.parseIt = parseIt;
exports.parsePartition = parsePartition;
exports.findImageHref = findImageHref;
