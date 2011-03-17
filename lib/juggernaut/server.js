var http     = require("http");
var sys      = require("sys");

var io       = require("socket.io");
var nstatic  = require("node-static");

var SuperClass = require("superclass");
var Connection = require("./connection");

var path = require("path");
var fs   = require("fs");

var credentials;
if (path.existsSync("keys/privatekey.pem")) {
  var privateKey  = fs.readFileSync("keys/privatekey.pem", "utf8");
  var certificate = fs.readFileSync("keys/certificate.pem", "utf8");
  credentials = {key: privateKey, cert: certificate};
}

Server = module.exports = new SuperClass;

var fileServer = new nstatic.Server("./public");

Server.include({
  init: function(){
    var connectionListener = function(request, response){
      request.addListener("end", function() {

        fileServer.serve(request, response, function (err, res) {
          if (err) { // An error as occured
            sys.error("> Error serving " + request.url + " - " + err.message);
            response.writeHead(err.status, err.headers);
            response.end();
          } else { // The file was served successfully
            sys.log("Serving " + request.url + " - " + res.message);
          }
        });

      });
    }

    if (credentials) {
      this.httpServer = https.createServer(credentials, connectionListener);
    } else {
      this.httpServer = http.createServer(connectionListener);
    }

    this.socket = io.listen(this.httpServer);
    this.socket.on("connection", function(stream){ new Connection(stream) });
  },

  listen: function(port){
    port = parseInt(port || process.env.PORT || 8080);
    this.httpServer.listen(port);
  }
});
