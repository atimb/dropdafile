var express = require('express');
var app = express.createServer(express.static(__dirname + '/web'), express.logger(), express.bodyParser());
var port = process.env.PORT || 3000;
var formidable = require('formidable');
delete require('express').bodyParser.parse['multipart/form-data'];

app.configure(function(){

  app.set('views', __dirname + '/web');
  
  // disable layout
  app.set("view options", {layout: false});

  // make a custom html template
  app.register('.html', {
    compile: function(str, options){
      return function(locals){
        return str;
      };
    }
  });
});


app.listen(port);

pendingStreams = {};

app.post('/pending', function(req, res) {
    var id = req.body.id;
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


app.get('/:id', function(req, res) {
    res.render('index.html');
});

app.post('/upstream/:id', function(req, res) {
    
    var id = req.params.id;
    console.log('Upstream req');

    var form = new formidable.IncomingForm;
    form.onPart = function(part) {
        
        if (!part.filename) {
            return;
        }
        
        if (!pendingStreams[id] || !pendingStreams[id].downRes) {
            console.log('No pending stream');
            req.socket.destroy();
            //res.send({ ok: false });
            return;
        }
        
        var self = this;
        var downRes = pendingStreams[id].downRes;
        
        // req.on('close', function() {
        //     if (downRes) {
        //         downRes.end();
        //     }
        //     delete pendingStreams[id];
        // });
        
        downRes.on('close', function() {
            //res.send({ ok: false });
            req.socket.destroy();
            console.log('Downstream close');
            delete pendingStreams[id];
        });
        
        downRes.on('end', function() {
            console.log('Downstream end');
        });
        
        var size = pendingStreams[id].length / (1024*1024);
        console.log('File size (MB): ' + size);

        downRes.header('Content-Disposition', 'attachment; filename=' + part.filename);
        downRes.header('Content-Length', pendingStreams[id].length);

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
            console.log('Part close');
        });
        
        part.on('end', function() {
            console.log('Part end');
            if (downRes) {
                downRes.end();
            }
            delete pendingStreams[id];
            res.send({ ok: true });
        });
    };
    form.parse(req);
});
