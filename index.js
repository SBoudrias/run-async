'use strict';

var once = require('once');
var isPromise = require('is-promise');

function runAsync (func, cb, args) {
  var async = false;
  cb = once(cb);

  try {
    var answer = func.apply({
      async: function () {
        async = true;
        return cb;
      }
    }, args );

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
}

/**
 * Run a function asynchronously or synchronously
 * @param   {Function} func  Function to run
 * @param   {Function} cb    Callback function passed the `func` returned value
 * @...rest {Mixed}    rest  Arguments to pass to `func`
 * @return  {undefined}
 */
module.exports = function (func, cb) {
  runAsync(func, cb, Array.prototype.slice.call(arguments, 2));
};

/**
 * Convenience method for promisifying the API.
 * @param Promise an es6 Promise constructor.
 * @returns {Function} with identical signature as runAsync, but without the `cb` argument.
 */
module.exports.promisify = function(Promise) {
  Promise = Promise || global.Promise;
  return function(func) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve, reject) {
      runAsync(func, cb, args);

      function cb(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    });
  }
};
