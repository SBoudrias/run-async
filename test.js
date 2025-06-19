const test = require("node:test");
const assert = require("node:assert");
const runAsync = require(".");

test("runAsync", async (t) => {
  await t.test("run synchronous method", async () => {
    let ranAsync = false;
    const aFunc = function () {
      return "pass1";
    };
    let called = false;
    await new Promise((resolve) => {
      runAsync(aFunc, function (err, _val) {
        assert.ifError(err);
        assert(ranAsync);
        assert.equal(_val, "pass1");
        called = true;
        resolve();
      })();
      ranAsync = true;
    });
    assert(called, "callback should have been called");
  });

  await t.test("run asynchronous method", async () => {
    const aFunc = function () {
      const returns = this.async();
      setImmediate(returns.bind(null, null, "pass2"));
    };

    await new Promise((resolve) => {
      runAsync(aFunc, function (err, _val) {
        assert.ifError(err);
        assert.equal(_val, "pass2");
        resolve();
      })();
    });
  });

  await t.test("pass arguments", async () => {
    const aFunc = function (a, b) {
      assert.equal(a, 1);
      assert.equal(b, "bar");
      return "pass1";
    };
    await new Promise((resolve) => {
      runAsync(aFunc, function (err, _val) {
        assert.ifError(err);
        resolve();
      })(1, "bar");
    });
  });

  await t.test("allow only callback once", async () => {
    const aFunc = function () {
      const returns = this.async();
      returns();
      returns();
    };

    await new Promise((resolve) => {
      runAsync(aFunc, function (err, _val) {
        assert.ifError(err);
        resolve();
      })();
    });
  });

  await t.test("handles promises", async () => {
    const fn = function () {
      return new Promise(function (resolve, _reject) {
        setImmediate(function () {
          resolve("as promised!");
        });
      });
    };

    await new Promise((resolve) => {
      runAsync(fn, function (err, _val) {
        assert.ifError(err);
        assert.equal("as promised!", _val);
        resolve();
      })();
    });
  });

  await t.test("throwing synchronously passes error to callback", async () => {
    const throws = function () {
      throw new Error("sync error");
    };

    await new Promise((resolve) => {
      runAsync(throws, function (err, _val) {
        assert(err);
        assert.equal(err.message, "sync error");
        resolve();
      })();
    });
  });

  await t.test("rejecting a promise passes error to callback", async () => {
    const rejects = function () {
      return new Promise(function (_resolve, reject) {
        setImmediate(function () {
          reject(new Error("broken promise"));
        });
      });
    };

    await new Promise((resolve) => {
      runAsync(rejects, function (err, _val) {
        assert(err);
        assert.equal(err.message, "broken promise");
        resolve();
      })();
    });
  });

  await t.test("returns a promise that is resolved", async () => {
    const returns = function () {
      return "hello";
    };

    runAsync(returns)().then((result) => {
      assert.equal(result, "hello");
    });
  });

  await t.test("returns a promise that is rejected", async () => {
    const throws = function () {
      throw new Error("sync error");
    };

    try {
      await runAsync(throws)();
      assert.fail("Expected an error");
    } catch (reason) {
      assert.equal(reason.message, "sync error");
    }
  });

  await t.test("handles async functions", async () => {
    const fn = async function () {
      return "as promised!";
    };

    await new Promise((resolve) => {
      runAsync(fn, function (err, _val) {
        assert.ifError(err);
        assert.equal("as promised!", _val);
        resolve();
      })();
    });
  });

  await t.test(
    "ignores async callback outside original function context",
    async () => {
      let outsideContext = false;
      const outsideContextCallback = async function () {
        outsideContext = true;
        this.async()(undefined, "not as promised!");
      };

      const fn = async function () {
        const self = this;
        setTimeout(function () {
          outsideContextCallback.call(self);
        }, 100);
        return new Promise(function (resolve, _reject) {
          setTimeout(function () {
            outsideContext = false;
            resolve("as promised!");
          }, 500);
        });
      };

      await new Promise((resolve) => {
        runAsync(fn, function (err, _val) {
          assert.equal(false, outsideContext);
          assert.ifError(err);
          assert.equal("as promised!", _val);
          resolve();
        })();
      });
    },
  );

  await t.test(
    "handles custom done factory with not bound function",
    async () => {
      const fn = function () {
        const cb = this.customAsync();
        setImmediate(function () {
          cb(null, "value");
        });
      };

      await runAsync(fn, "customAsync")();
    },
  );

  await t.test("handles bound function", async () => {
    const fn = function () {
      const cb = this.async();
      if (this.bar === "bar") {
        setImmediate(function () {
          cb(null, "value");
        });
      } else {
        cb(new Error("not bount"));
      }
    };

    await runAsync(fn).call({ bar: "bar" });
  });
});

test("runAsync.cb", async (t) => {
  await t.test("handles callback parameter", async () => {
    const fn = function (cb) {
      setImmediate(function () {
        cb(null, "value");
      });
    };

    await new Promise((resolve) => {
      runAsync.cb(fn, function (err, _val) {
        assert.ifError(err);
        assert.equal("value", _val);
        resolve();
      })();
    });
  });

  await t.test("run synchronous method", async () => {
    let ranAsync = false;
    const aFunc = function () {
      return "pass1";
    };
    let called = false;
    await new Promise((resolve) => {
      runAsync.cb(aFunc, function (err, _val) {
        assert.ifError(err);
        assert(ranAsync);
        assert.equal(_val, "pass1");
        called = true;
        resolve();
      })();
      ranAsync = true;
    });
    assert(called, "callback should have been called");
  });

  await t.test("handles a returned promise", async () => {
    const aFunc = function (a) {
      return Promise.resolve("foo" + a);
    };

    await new Promise((resolve) => {
      runAsync.cb(aFunc, function (err, result) {
        assert.ifError(err);
        assert.equal(result, "foobar");
        resolve();
      })("bar");
    });
  });
});
