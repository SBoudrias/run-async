'use strict';
module.exports = runAsync;

var once = require('once');
var isPromise = require('is-promise');
var promiseShim = require('promise-shim');

/**
 * Run a function asynchronously or synchronously
 * @param   {Function} func  Function to run
 * @param   {Function} cb    Callback function passed the `func` returned value
 * @...rest {Mixed}    rest  Arguments to pass to `func`
 * @return  {undefined}
 */
function runAsync (cb, func) {
  var async = false;
  cb = once(cb);

  try {
    var answer = func.apply({
      async: function () {
        async = true;
        return cb;
      }
    }, Array.prototype.slice.call(arguments, 2));

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
 * Convenience method for promisifying the API.
 * @param Promise an es6 Promise constructor.
 * @returns {Function} with identical signature as runAsync, but without the `cb` argument.
 */
module.exports.promisify = function(Promise) {
  return promiseShim(Promise).bind(null, runAsync);
};
