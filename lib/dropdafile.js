/*
 * dropdafile
 * http://dropdafile.com
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var express = require('express');
var app = express();
var formidable = require('formidable');

app.set('views', __dirname + '/../public');
app.set("view options", {layout: false});

app.use(express.json());
app.use(express.urlencoded());


// this stores all of our current streams
var pendingStreams = {};

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
        downloads: 0,
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
    if (!pendingStreams[id] || pendingStreams[id].downloads) {
        res.send(404);
        return;
    }
    res.on('close', function() {
        pendingStreams[id].downRes = null;
    });
    pendingStreams[id].downloads++;
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

    var form = new formidable.IncomingForm();

    form.onPart = function(part) {

        if (!part.filename) {
            return;
        }

        if (!pendingStreams[id] || !pendingStreams[id].downRes) {
            console.log('No pending stream ' + part.filename);
            req.socket.destroy();
            return;
        }

        var downRes = pendingStreams[id].downRes;

        var size = pendingStreams[id].length / (1024 * 1024);
        console.log('File: ' + part.filename + ', File size (MB): ' + size);

        downRes.header('Content-Disposition', 'attachment; filename=' + part.filename);
        if (pendingStreams[id].length) {
            downRes.header('Content-Length', pendingStreams[id].length);
        }

        part.on('end', function() {
            console.log('Part end ' + part.filename);
            delete pendingStreams[id];
            res.send({ ok: true });
        });

        part.pipe(downRes);

        req.on('close', function() {
            delete pendingStreams[id];
        });

        downRes.on('close', function() {
            console.log('Downstream close ' + part.filename);
            req.socket.destroy();
            delete pendingStreams[id];
        });
    };

    form.parse(req);
});

// serve static files
app.use(express.static(__dirname + '/../public'));

module.exports = app;
