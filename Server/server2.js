String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var http = require('http');
var url = require('url');
var fs = require("fs");

var port = 3000;

var clientPage = "";
var developPage = "";
var users = "";

var usersCounter = 0;

try{
    var temp = fs.readFileSync("users.config",'utf-8');
    usersCounter = temp.split('|').length;
}
catch(e){    
    fs.writeFileSync("users.config","");
}

function updateHtml(){
    fs.readFile('../Client/index.html', function (err, html) {
        if (err) 
            throw err;             
        clientPage = html;
    });
    fs.readFile('../Client/developIndex.html', function (err, html) {
        if (err) 
            throw err;             
        developPage = html;
    });
}

setInterval(updateHtml,300);

var server = http.createServer(function (req, res) {
    var urlParsed = url.parse(req.url, true);    
    var query = urlParsed.query;

    console.log(req.socket.remoteAddress + ': ' + urlParsed.pathname);

    switch (urlParsed.pathname) {
        case '/postData': {
            var postData = false;

            if (req.method=="POST"){
                req.addListener("data", function(postDataChunk){
                  if (!postData) postData = postDataChunk;
                  else postData += postDataChunk;
                    //console.log("New chunk! " + postDataChunk);
                });

                req.addListener("end", function(){                                                            
                    var ip = req.socket.remoteAddress;
                    var date = new Date();

                    //postData.replaceAll(',','.');

                    console.log('Path received from',ip,'at',date);
                    saveRoute(ip, date, postData);                    
                });                
            }

            res.statusCode = 202;
            res.end('Got it');
            break;
        }
        case '/getTrack': {
	    console.log(query)
            var trackName = query.trackName;
            console.log("Trying to get",trackName)
            fs.readFile('./Tracks/' + trackName, (err,track) => {
                if (err) res.end('Error');
                else res.end(track);
            });          
            break;
        }
        case '/getTracksList': {
            fs.readdir('./Tracks/', (err, files) => {
                var str = "";
                for (var f in files)
                    str += files[f] + '|' + (fs.statSync('./Tracks/' + files[f]).size / 1000000).toFixed(1) + 'MB ';
                res.end(str) 
            })
            break;
        }
        case '/developPage': {
            res.writeHeader(200, {"Content-Type": "text/html"});  
            res.write(developPage);  
            res.end();  
            break;
        }
        default: {            
            res.writeHeader(200, {"Content-Type": "text/html"});  
            res.write(clientPage);  
            res.end();  
            break;
        }               
    }
    //res.end("I'am on");
}).listen(port, "192.168.3.6");

function saveRoute(ip, date, route){
    console.log(route);
}   

function getAndSetUser(ip){    
    var usersList = fs.readFileSync('users.config', 'utf-8').split('|');
    usersList.pop();

    console.log(usersList);

    var users = [];        
    for (var i in usersList){
        var a = usersList[i].split(':');
        console.log(a);
        if (a[0] == ip) return a[1];
    }

    var name = 'user_N' + usersList.length;
    fs.appendFileSync('users.config', '{0}:{1}|'.format(ip,name));
    return name;
}