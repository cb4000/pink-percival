
const express = require('express');
const app = express();
app.use(express.json());
const port = 3000;
var redis = require('redis');
var rediSearch  = require('redisearchclient');


var isReady = false;
var isError = false;
const MAX_RETRIES = 100;
var client = null ;
var myRediSearch = null ;


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   
function retryStrat(options) {
  if (options.error && options.error.code === "ECONNREFUSED") {
    // End reconnecting on a specific error and flush all commands with
    // a individual error
    return new Error("The server refused the connection");
  }
  if (options.total_retry_time > 1000 * 60 * 60) {
    // End reconnecting after a specific timeout and flush all commands
    // with a individual error
    return new Error("Retry time exhausted");
  }
  if (options.attempt > 10) {
    // End reconnecting with built in error
    return undefined;
  }
  // reconnect after
  return Math.min(options.attempt * 100, 3000);
}

function initClient() {
  let clientRetryCount = 0;
  while(clientRetryCount<MAX_RETRIES ){
    try{
      let clientR =   redis.createClient(  6379, 'redis'/*{host:'redis',port:6379,
      autoResubscribe: true,
      lazyConnect: false,
      maxRetriesPerRequest: 10000, retry_strategy:retryStrat} */);
      clientR.on('connect', function() {
        console.log('connected');

clientR.monitor(function(err, res) {
  console.log("Entering monitoring mode.");
});

clientR.set("foo", "bar");

clientR.on("monitor", function(time, args, rawReply) {
  console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
});
    });
      clientR.on('error', function(err) {
  console.log('Redis bulk error: ' + err);
  clientRetryCount++;
  sleep(1000);
});
return clientR;
    }catch(err){
    console.log(err);
     console.log("attempting reconnecta "+ clientRetryCount);
     clientRetryCount++;
     sleep(1000);
  
    }
  }
}

function initSearchClient() {
  let clientRetryCount = 0;
  while(clientRetryCount<MAX_RETRIES ){
    try{
      let clientR =  rediSearch(redis,'mentions', {clientOptions : { host:'redisearch',port:6379,
      autoResubscribe: true,
      lazyConnect: false,
      maxRetriesPerRequest: 10000, retry_strategy:retryStrat}} );  

      clientR.client.on('error', function(err) {
        console.log('Redis search error: ' + err);
        isError = true;
        clientRetryCount++;
        sleep(1000);
      });
      clientR.client.on('connect', function() {
        isReady = true;
        console.log('connected search');
    });
      return clientR;
    }catch(err){
      console.log(err);
     console.log("attempting reconnectb "+ clientRetryCount);

     clientRetryCount++;
     sleep(1000);
  
    }
  }
}

//client = initClient();
myRediSearch = initSearchClient();

/*
client.on('error', function() {
  isError = true;
}).on('ready', function() {
  isReady = true;
});
*/

//myRediSearch.on('error', function(err) {
//  console.log('Redis error: ' + err);
//});
//var client = redis.createClient( {host:'127.0.0.1',port:6380} );
//var myRediSearch = rediSearch(redis,'mentions',{ clientOptions : {host:'127.0.0.1',port:6380} });  



  app.get('/', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
app.post('/api/', (req, res) =>{

  if ( isReady ) {
    console.log(req.body);
    var searchTerm = req.body.find;
    
        myRediSearch.batch()                                            // Get the document index at 57956
          .rediSearch.search(searchTerm).rediSearch.exec(function(err,results) {                                // execute the pipeline
            if (err) { throw err; }                                               // Handle the errors
            console.log(JSON.stringify(results));                       // show the results from the second pipeline item (`getDoc`)
             
         res.send(results)
    
    
    
    });
    
  }else{
    res.status(503).send({
      message: 'Tnot connected to background!'
   });
  }
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


