/*
 * dropdafile
 * http://dropdafile.com
 *
 * Copyright (c) 2013 Attila Incze
 * Licensed under the MIT license.
 */

'use strict';

var dropdafile = require('../lib/dropdafile.js'),
    expect = require('chai').expect,
    Browser = require('zombie');


describe('Dropdafile', function() {
    it('should open landing page', function(done) {
        this.timeout(10000);
        var browser = new Browser();

        browser.visit('http://localhost:3000', function() {
            expect(browser.success).to.be.true;
            expect(browser.text('h1')).to.equal('DropDaFile - Streaming file transfer');
            done();
        })
    });

    it('should transfer file', function(done) {
        this.timeout(10000);
        var browser = new Browser();

        browser.visit('http://localhost:3000', function() {
            expect(browser);
            expect(browser.success).to.be.true;
            expect(browser.text('h1')).to.equal('DropDaFile - Streaming file transfer');
            done();
        })
    });
});
