// require all the things
var express = require('express');
var WebSocketServer = require('ws').Server;
var http = require('http');
var fs = require('fs');

// parse the command line parameters
var args = process.argv.splice(2);
var argPort = 8080;
args.forEach(function(arg) {
  var a = arg.split('=');
  var param = a[0];
  var val = a[1];
  switch(param){
  case "-port" :
    argPort = val;
    break;
  }
});

// set up the express handler
var app = express();
app.set('port', argPort || process.env.PORT || 8080);

// configure the express handler to server the static application files
app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

// start the server with the express handler
var server = http.createServer(app);
server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port') + ' in ' + app.get('env') + ' mode');
});

// read the features to be streamed. 
// this file contains a bunch of features in Esri GeoJSON, one per line (no commas or trailing newline)
var FEATURES = fs.readFileSync(
  __dirname + '/data/data.json', {
    encoding: 'utf-8',
    flag: 'r'
  }).split('\n');
var FEATURE_INDEX = 0;
console.log(FEATURES.length + " features available for streaming");

// set up the ws handler
var wss = new WebSocketServer({
  server: server
});
// handle the ws connections and whatnot
wss.on('connection', function(ws) {
  var id = setInterval(function() {
    // send the next feature, looping around the array
    ws.send(FEATURES[FEATURE_INDEX], function() { /* ignore errors */});
    FEATURE_INDEX += 1;
    FEATURE_INDEX %= FEATURES.length;
  }, 250);
  console.log('started client interval');
  ws.on('close', function() {
    console.log('stopping client interval');
    clearInterval(id);
  });
});
