const http = require('http'),
      fs = require('fs'),
      path = require('path'),
      async = require('async');

const port = process.env.PORT || 3000,
      hostname = process.env.C9_HOSTNAME || 'http://127.0.0.1';

const mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    ico: 'image/x-icon',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

/*
async function loadFileAsync(file){
    const data = await fs.readFile(file, "binary");
    //return new Buffer(data); //old & depricated method
    return Buffer.from(data).toString();
}
*/

var log = function(entry){
    fs.appendFileSync('/tmp/sample-app.log', new Date().toISOString() + ' - ' + entry + '\n');
};

var server = http.createServer(function (req, res){
    if (req.method === 'POST'){
        //handle a catchall endpoint from any HTTP POST which parses any number of integers passed sequentially as a path

        //console.log(req.url);
        if (req.url){
            let result = 0;
            let url = req.url.replace(/^\//,''); //strip off leading '/' if it exists
            url = url.replace(/\?.*/,''); //strip off query params

            //using the async .each module as the standard js forEach is a blocking sync function.
            async.each(url.split('/'), function(val, callback){

                // Perform operation on file here.
                //console.log('Processing val ' + val);
                 if (val){
                    result += val.match(/[0-9]*/) * 1; //cast value to an integer and add value to the result response.
                    callback();
                } else {
                    callback(); //val is empty, continue
                }
            }, function(error){ //this is the async callback function
                if ( error ){
                  console.log('ERROR: result is empty'); // One of the iterations produced an error.
                }
                res.writeHead(200, 'OK', {'Content-Type': 'application/json'}); //set some headers
                res.write('{"sum": ' + result + '}'); //send the content
                res.end(); //close the http connection
            });
        } else {
            res.writeHead(500, 'ERROR', {'Content-Type': 'text/html'});
        }
    } else {
        /* Worlds most basic async web server, flat file router */
        /* ...really Apache should do this NOT Node.js */
        //if there isn't a dot in the req.url then serve the ./index.html
        //otherwise assume the dot is a file extension and serve the file in req.url
        let file;
        
        if (req.url && req.url.search(/[.]/) !== -1){ //default to index.html
            file = './' + req.url;
        } else {
            file = './index.html';
        }
        let type = mime[path.extname(file).slice(1)] || 'text/plain'; //get mime type
        
        //serve file to client
        let s = fs.createReadStream(file);
        s.on('open', function(){
            res.setHeader('Content-Type', type);
            res.statusCode = 200;
            s.pipe(res);
        });
        s.on('error', function(){
            res.setHeader('Content-Type', 'text/plain');
            res.statusCode = 404;
            res.end('Not found');
        });
    }
});

// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port);

// Put a friendly message on the terminal
console.log('Server running at ' + hostname + ':' + port + '/');

//18.191.154.123 -- ECS VPC instance Public IP Address.