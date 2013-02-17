'use strict';

var app = require('../lib/dropdafile'),
    expect = require('chai').expect,
    request = require('supertest');

describe('Dropdafile server', function() {

    it('serves the landing page', function(done) {
        request(app)
            .get('/')
            .expect(200)
            .end(function(err) {
                expect(err).to.be.null;
                done();
            });
    });

    it('refuses transfer with invalid ID', function(done) {
        request(app)
            .post('/pending')
            .send({
                id: 'INVALID'
            })
            .expect(400)
            .end(function(err) {
                expect(err).to.be.null;
                done();
            });
    });

    it('returns 404 for unexisting ID', function(done) {
        request(app)
            .get('/downstream/abc12')
            .expect(404)
            .end(function(err) {
                expect(err).to.be.null;
                done();
            });
    });

    it('transfers file in proper e2e scenario', function(done) {
        request(app)
            .post('/pending')
            .send({
                id: 'abc12'
            })
            .expect(200)
            .end(function(err, res) {
                expect(err).to.be.null;
                expect(res.body).to.eql({
                    go: true
                });
                request(app)
                    .post('/upstream/abc12')
                    .attach('myFile', 'test/fixtures/test.txt')
                    .end(function(err, res) {
                        expect(err).to.be.null;
                        expect(res.body).to.eql({
                            ok: true
                        });
                        almostDone();
                    });
            });

        process.nextTick(function() {
            request(app)
                .get('/downstream/abc12')
                .expect('Content-Disposition', 'attachment; filename=test.txt')
                .end(function(err, res) {
                    expect(err).to.be.null;
                    expect(res.text).to.equal('Some content\n');
                    almostDone();
                });
        });

        var _done = 0;

        function almostDone() {
            if (++_done === 2) {
                done();
            }
        }
    });

});
