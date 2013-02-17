var app = require('./lib/dropdafile');

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('Dropdafile is listening on ' + port);
});
