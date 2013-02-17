'use strict';

var app = require('../lib/dropdafile'),
    expect = require('chai').expect,
    Browser = require('zombie');


describe('Dropdafile', function() {

    var port = 19472, browser;

    this.timeout(10000);

    beforeEach(function(done) {
        app.listen(port, function() {
            done();
        });
        browser = new Browser();
    });

    it('should open landing page', function(done) {
        browser.visit('http://127.0.0.1:' + port, function() {
            expect(browser.success).to.be.true;
            expect(browser.text('h1')).to.equal('DropDaFile - Streaming file transfer');
            done();
        })
    });

});
