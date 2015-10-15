'use strict';

var once = require('once');
var isPromise = require('is-promise');
var promiseResolver = require('promise-resolver');

/**
 * Run a function asynchronously or synchronously
 * @param   {Function} func  Function to run
 * @param   {Function} cb    Callback function passed the `func` returned value
 * @...rest {Mixed}    rest  Arguments to pass to `func`
 * @return  {Null}
 */

module.exports = function (func, cb) {
  return function () {
    var async = false;
    var promise = null;
    cb = cb && once(cb);
    if (typeof Promise !== 'undefined') {
      promise = new Promise(function (resolve, reject) {
        cb = promiseResolver(resolve, reject, cb);
      });
    } else if (!cb) {
      throw new Error('No Native Promise Implementation: You must upgrade to Node >= 0.11.13, or use callbacks.');
    }

    try {
      var answer = func.apply({
        async: function () {
          async = true;
          return cb;
        }
      }, Array.prototype.slice.call(arguments));

      if (!async) {
        if (isPromise(answer)) {
          answer.then(cb.bind(null, null), cb);
        } else {
          setImmediate(cb.bind(null, null, answer));
        }
      }
    } catch (e) {
      setImmediate(cb.bind(null, e));
    }

    return promise;
  }
};
