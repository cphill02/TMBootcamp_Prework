const port = process.env.PORT || 3000,
      http = require('http'),
      fs = require('fs').promises,
      async = require('async');

async function loadFileAsync(file){
    const data = await fs.readFile(file, "binary");
    return new Buffer(data);
}

var log = function(entry) {
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
        if (req.url && req.url.search(/[.]/) !== -1){
            file = './' + req.url;
        } else {
            file = './index.html';
        }
        try {
            //read file asyncronously, fs.readFile is wrapped in an async promise function since it normally blocks
            loadFileAsync(file).then(data => {
                res.writeHead(200); //write an OK header
                res.write(data.toString()); //send the flat file to the client
                res.end();
            });
        }
        catch(err){ //file not found
            if (err){
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.write('Opps! File not found'); //send a standard flat file to the client (really Apache should do this vs Node.js)
                res.end();
            }
        }
    }
});

// Listen on port 3000, IP defaults to 127.0.0.1
server.listen(port);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + port + '/');