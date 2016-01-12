'use strict';

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
    var deferred = promiseResolver.defer(cb);

    try {
      var answer = func.apply({
        async: function () {
          async = true;
          return deferred.cb;
        }
      }, Array.prototype.slice.call(arguments));

      if (!async) {
        if (isPromise(answer)) {
          answer.then(deferred.resolve, deferred.reject);
        } else {
          deferred.cb(null, answer);
        }
      }
    } catch (e) {
      deferred.cb(e);
    }

    return deferred.promise;
  }
};

module.exports.cb = function (func, cb) {
  return module.exports(function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === func.length - 1) {
      args.push(this.async());
    }
    return func.apply(this, args);
  }, cb);
};
