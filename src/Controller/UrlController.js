
const urlModel = require('../Model/Urlmodel')
const shortId = require('short-id')

function validateUrl(value) {
    return /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(value);
  }
function isValidBody(value){
    if(Object.keys(value).length == 0) {return false}  
    else return true;
}
  

const createUrl = async function(req,res){
    try{
        const longUrl = req.body.url;
        const base  = "http://localhost:3000"
        const urlCode = shortId.generate();
        if(!isValidBody(req.body)) return res.status(400).send({status : false , msg : " Bad Request : Empty Body"})
        
        if(validateUrl(longUrl)){
            const savedData = await urlModel.findOne({longUrl});
            if (savedData) {
                return res.status(200).send({ status : true , data : {longUrl : savedData.longUrl , shortUrl : savedData.shortUrl , urlCode : savedData.urlCode }})
            }
            else{
                const shortUrl = `${base}/${urlCode}`;
               const url = {
                    longUrl,
                    shortUrl,
                    urlCode
                  };
                  const savedData = await urlModel.create(url)
                  return res.status(201).send({ status : true , data : {longUrl : savedData.longUrl , shortUrl : savedData.shortUrl , urlCode : savedData.urlCode }})
            }
           
        }
        else {
            return res.status(400).send({status : false , msg : "Bad Request"})
        }
        
    }
    catch(err){
        res.status(500).send({msg : err.message})
    }

}

const getUrl = async function(req,res){
    try{
        const urlCode = req.params.urlCode;
        const data = await urlModel.findOne({urlCode : urlCode})
        if(!data) return res.status(400).send({status : false , msg : "Bad Request"})
        console.log(data.longUrl)
        return res.redirect(data.longUrl)
    }
    catch(err){
        res.status(500).send({msg : err.message})
    }

}

module.exports = {createUrl , getUrl}