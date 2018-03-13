function checkDOM(dom) {
   const document = dom.window.document;
   const nameElem = document.querySelector('table.cards tr:nth-child(1) td:nth-child(2)');
   let name = nameElem ? nameElem.textContent : "Name Not Found";
   const idElem = document.querySelector('table.cards tr:nth-child(2) td:nth-child(2)');
   let id = idElem ? idElem.textContent : "Id not found";
   const levelElem = document.querySelector('table.cards tr:nth-child(4) td:nth-child(4)')
   let level = levelElem ? levelElem.textContent : "level not found";
   const imageElem = document.querySelectorAll('img[src*="images/cards"]');
   
   let image = imageElem ? imageElem[0].src : "";
   if(!(nameElem && idElem && levelElem && imageElem)) {
      console.log("Something went missing from : " + document.location.href);
      return {};
   }
   else
      return { 
         name:name,
         id:id, 
         level:level,
         image:image 
      }

}

const re = new RegExp("^TEXT:(.+)$");

function rebuildAbilities(input) {

   let buffer = [];
   input.forEach(data => {
   
      
      try {
      let rei = re.exec(data);
      if(rei && rei.length > 0) {
         data = rei[1].trim();
      }
      if(!data.startsWith("[")) {
         buffer[buffer.length - 1] += " " + data;
      }
      else
         buffer.push(data);
      }
      catch(e) {
         console.log(e);
      }
   
   
   })
   
   return buffer;
}

exports.checkDOM = checkDOM;
exports.rebuildAbilities = rebuildAbilities;
