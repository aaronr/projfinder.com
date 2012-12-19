var express = require('express');
var app = express();

app.get('/', function(req, res){
    res.send('hello world');
});

app.listen(9000);




// Initial Attempt

//// Load the http module to create an http server.
//var http = require('http');
//
//// Configure our HTTP server to respond with Hello World to all requests.
//var server = http.createServer(function (request, response) {
//    response.writeHead(200, {"Content-Type": "text/plain"});
//    response.end("Hello World\n");
//});
//
//// Listen on port 9000, IP defaults to 127.0.0.1
//server.listen(9000);
//
//// Put a friendly message on the terminal
//console.log("Server running at http://127.0.0.1:9000/");