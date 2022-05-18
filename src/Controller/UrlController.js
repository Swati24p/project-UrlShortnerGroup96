
const urlModel = require('../Model/Urlmodel')
const shortId = require('short-id')
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  13190,
  "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient)


//------------------------------------------Basic Validation-------------------------------------------------------------------//

function validateUrl(value) {
    return /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/.test(value);
}
function isValidBody(value) {
    if (Object.keys(value).length == 0) { return false }
    else return true;
}


// 1 Api
//----------------------------------------------Post/url/shorten-------------------------------------------------------------//

const createUrl = async function (req, res) {
    
    try {
        const longUrl = req.body.url;
        const base = "http://localhost:3000"
        const urlCode = shortId.generate().toLowerCase();
        if (!isValidBody(req.body)) return res.status(400).send({ status: false, msg: " Bad Request : Empty Body" })

        if (validateUrl(longUrl)) {
            const savedData = await urlModel.findOne({ longUrl });
            if (savedData) {
                return res.status(200).send({ status: true, data: { longUrl: savedData.longUrl, shortUrl: savedData.shortUrl, urlCode: savedData.urlCode } })
            }
            else {
                const shortUrl = `${base}/${urlCode}`;
                const url = {
                    longUrl,
                    shortUrl,
                    urlCode
                };
                const savedData = await urlModel.create(url)
                return res.status(201).send({ status: true, data: { longUrl: savedData.longUrl, shortUrl: savedData.shortUrl, urlCode: savedData.urlCode } })
            }

        }
        else {
            return res.status(400).send({ status: false, msg: "Bad Request : Invalid Url" })
        }

    }
    catch (err) {
        res.status(500).send({ msg: err.message })
    }

}


//2 Api
//-------------------------------------------------Get/:urlCode------------------------------------------------------------//

const getUrl = async function (req, res) {

    try {
        const urlCode = req.params.urlCode;
        console.log(urlCode)
        // if(!urlCode.trim()){
        //     res.status(400).send({status:false, message:'please mention appropriate url'})
        // }
        let cacheUrlcode = await GET_ASYNC(`${urlCode}`);
        
        let value = JSON.parse(cacheUrlcode)

        if(value){
            return res.status(302).redirect(value.longUrl);
        }
        else {
        const data = await urlModel.findOne({ urlCode: urlCode })
        console.log(data)

        if (!data) {
        return res.status(404).send({ status: false, msg: "Url Not Found." })
        }
        await SET_ASYNC(`${urlCode}`, JSON.stringify(data));
        return res.status(302).redirect(data.longUrl)
      }
    }
    catch (err) {
        res.status(500).send({ msg: err.message })
    }
}

module.exports = { createUrl, getUrl }