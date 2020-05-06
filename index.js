var redis = require('redis');
var rediSearch  = require('redisearchclient');
var client = redis.createClient( {host:'127.0.0.1',port:6380} );
var myRediSearch = rediSearch(redis,'mentions',{ clientOptions : {host:'127.0.0.1',port:6380} });  

const express = require('express')
const app = express()
app.use(express.json());
const port = 3000




client.monitor(function(err, res) {
    console.log("Entering monitoring mode.");
  });
  
  client.set("foo", "bar");
  
  client.on("monitor", function(time, args, rawReply) {
    console.log(time + ": " + args); // 1458910076.446514:['set', 'foo', 'bar']
  });

  app.get('/', function(req, res) {
    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
app.post('/api/', (req, res) =>{

console.log(req.body);
var searchTerm = req.body.find;

    myRediSearch.batch()                                            // Get the document index at 57956
      .rediSearch.search(searchTerm).rediSearch.exec(function(err,results) {                                // execute the pipeline
        if (err) { throw err; }                                               // Handle the errors
        console.log(JSON.stringify(results));                       // show the results from the second pipeline item (`getDoc`)
         
     res.send(results)



});
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))


