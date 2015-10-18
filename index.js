'use strict';

var once = require('once');
var isPromise = require('is-promise');
var promiseResolver = require('promise-resolver');

/**
 * Return a function that will run a function asynchronously or synchronously
 *
 * example:
 * runAsync(wrappedFunction, callback)(...args);
 *
 * @param   {Function} func  Function to run
 * @param   {Function} cb    Callback function passed the `func` returned value
 * @return  {Function(arguments)} Arguments to pass to `func`. This function will in turn
 *                                return a Promise (Node >= 0.12) or call the callbacks.
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
      throw new Error('No Native Promise Implementation: You must use a callback function or upgrade to Node >= 0.11.13');
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
