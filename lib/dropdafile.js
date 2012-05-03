var express = require('express');
var app = express();
var formidable = require('formidable');

app.set('views', __dirname + '/../public');
app.set("view options", {layout: false});

app.use(express.logger());
app.use(express.json());
app.use(express.urlencoded());
//app.use(express.compiler({ src: __dirname + '/../public', enable: ['less'] }));

var port = process.env.PORT || 3000;
app.listen(port);

// this stores all of our current streams
pendingStreams = {};

// uploader is signaling its intention
app.post('/pending', function(req, res) {
    var id = req.body.id;
    if (!id.match(/^[a-zA-Z0-9]{5}$/)) {
        res.send(400);
        return;
    }
    if (pendingStreams[id] && pendingStreams[id].downRes) {
        res.send({ go: true });
        return;
    }
    pendingStreams[id] = {
        upRes: res,
        length: req.body.length,
        timeout: setTimeout(function() {
            pendingStreams[id].upRes = null;
            res.send({ go: false });
        }, 25000)
    };
});

// downloader opens the site, render index
app.get(/^\/[a-zA-Z0-9]{5}$/, function(req, res, next) {
    req.url = '/';
    next();
});

// downloader is initiating transfer
app.get('/downstream/:id', function(req, res) {
    var id = req.params.id;
    if (!pendingStreams[id]) {
        res.send(404);
        return;
    }
    res.on('close', function() {
        pendingStreams[id].downRes = null;
    });
    pendingStreams[id].downRes = res;
    if (pendingStreams[id].upRes) {
        clearTimeout(pendingStreams[id].timeout);
        pendingStreams[id].upRes.send({ go: true });
        pendingStreams[id].upRes = null;
    }
});

// uploader is uploading (lots of lines are unneccessary, the code is still in debug mode :)
app.post('/upstream/:id', function(req, res) {
    
    var id = req.params.id;
    console.log('Upstream req');

    var form = new formidable.IncomingForm;
    
    form.onPart = function(part) {
        
        if (!part.filename) {
            return;
        }
        
        if (!pendingStreams[id] || !pendingStreams[id].downRes) {
            console.log('No pending stream ' + part.filename);
            req.socket.destroy();
            return;
        }
        
        var self = this;
        var downRes = pendingStreams[id].downRes;
        
        req.on('close', function() {
            if (downRes) {
                downRes.end();
            }
            delete pendingStreams[id];
        });
        
        downRes.on('close', function() {
            console.log('Downstream close ' + part.filename);
            req.socket.destroy();
            delete pendingStreams[id];
        });
        
        downRes.on('end', function() {
            console.log('Downstream end ' + part.filename);
            downRes = null;
        });
        
        var size = pendingStreams[id].length / (1024*1024);
        console.log('File: ' + part.filename + ', File size (MB): ' + size);

        downRes.header('Content-Disposition', 'attachment; filename=' + part.filename);
        downRes.header('Content-Length', pendingStreams[id].length);
    
        // handlers 
        downRes.on('drain', function() {
            self.resume();
        });
        
        part.on('data', function(buffer) {
            self.pause();
            if (downRes) {
                downRes.write(buffer);
            }
        });
        
        part.on('close', function() {
            console.log('Part close ' + part.filename);
        });
        
        part.on('error', function() {
            console.log('Part error ' + part.filename);
        });
        
        part.on('end', function() {
            console.log('Part end ' + part.filename);
            if (downRes) {
                downRes.end();
            }
            delete pendingStreams[id];
            res.send({ ok: true });
        });
    };
    
    form.parse(req);
});

// serve public www
app.use(express.static(__dirname + '/../public'));
