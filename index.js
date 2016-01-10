'use strict';

var isPromise = require('is-promise');
var promiseResolver = require('promise-resolver');

/**
 * Return a function that will run a function asynchronously or synchronously
 *
 * example:
 * runAsync(wrappedFunction, callback)(...args);
 *
 * @param   {Object} [opts]
 * @param   {Object} [opts.fixedLength=false] Is true if the wrapped function can recieve
 *                                            a specific number of arguments.
 * @param   {Function} func  Function to run
 * @param   {Function} cb    Callback function passed the `func` returned value
 * @return  {Function(arguments)} Arguments to pass to `func`. This function will in turn
 *                                return a Promise (Node >= 0.12) or call the callbacks.
 */

module.exports = function (/*[opts], func, cb*/) {
  var opts, func, cb;
  if (typeof arguments[0] === 'function') {
    opts = {
      fixedLength: false,
    };
    func = arguments[0];
    cb = arguments[1];
  } else {
    opts = arguments[0];
    func = arguments[1];
    cb = arguments[2];
  }

  return function () {
    var async = false;
    var deferred = promiseResolver.defer(cb);

    try {
      var args = Array.prototype.slice.call(arguments);
      if (opts.fixedLength && func.length === args.length + 1) {
        args.push(deferred.cb);
        async = true;
      }

      var answer = func.apply({
        async: function () {
          async = true;
          return deferred.cb;
        }
      }, args);

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
