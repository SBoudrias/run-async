'use strict';

var hasGlobalPromise = typeof Promise !== 'undefined';
var ifPromise = hasGlobalPromise ? it : it.skip;
var notPromise = hasGlobalPromise ? it.skip : it;
var assert = require('assert');
var runAsync = require('./index');

describe('runAsync', function () {
  var Promise = require('bluebird');

  it('run synchronous method', function (done) {
    var ranAsync = false;
    var aFunc = function () {
      return 'pass1';
    };
    runAsync(aFunc, function (err, val) {
      assert.ifError(err);
      assert(ranAsync);
      assert.equal(val, 'pass1');
      done();
    })();
    ranAsync = true;
  });

  it('run asynchronous method', function (done) {
    var aFunc = function () {
      var returns = this.async();
      setImmediate(returns.bind(null, null, 'pass2'));
    };

    runAsync(aFunc, function (err, val) {
      assert.ifError(err);
      assert.equal(val, 'pass2');
      done();
    })();
  });

  it('pass arguments', function (done) {
    var aFunc = function (a, b) {
      assert.equal(a, 1);
      assert.equal(b, 'bar');
      return 'pass1';
    };
    runAsync(aFunc, function (err, val) {
      assert.ifError(err);
      done();
    })(1, 'bar');
  });

  it('allow only callback once', function (done) {
    var aFunc = function () {
      var returns = this.async();
      returns();
      returns();
    };

    runAsync(aFunc, function (err, val) {
      assert.ifError(err);
      done();
    })();
  });

  it('handles promises', function (done) {
    var fn = function () {
      return new Promise(function (resolve, reject) {
        setImmediate(function () {
          resolve('as promised!');
        });
      });
    };

    runAsync(fn, function (err, val) {
      assert.ifError(err);
      assert.equal('as promised!', val);
      done();
    })();
  });

  it('throwing synchronously passes error to callback', function (done) {
    var throws = function () {
      throw new Error('sync error');
    };

    runAsync(throws, function (err, val) {
      assert(err);
      assert.equal(err.message, 'sync error');
      done();
    })();
  });

  it('rejecting a promise passes error to callback', function (done) {
    var rejects = function () {
      return new Promise(function (resolve, reject) {
        setImmediate(function () {
          reject(new Error('broken promise'));
        });
      });
    };

    runAsync(rejects, function (err, val) {
      assert(err);
      assert.equal(err.message, 'broken promise');
      done();
    })();
  });

  ifPromise('returns a promise that is resolved', function (done) {
    var returns = function () {
      return 'hello';
    };

    runAsync(returns)().then(function (result) {
      assert.equal(result, 'hello');
      done();
    });
  });

  ifPromise('returns a promise that is rejected', function (done) {
    var throws = function () {
      throw new Error('sync error');
    };

    runAsync(throws)().catch(function (reason) {
      assert.equal(reason.message, 'sync error');
      done();
    });
  });

  notPromise('throws a helpful error message if no cb, and no global.Promise', function () {
    var returns = function () {
      return 'hello';
    };

    assert.throws(function () {
      runAsync(returns)();
    }, /No Native Promise Implementation/);
  });
});
