(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CodeStudio = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_KEY = 'code-studio-files';

  function htmlTemplate(name) {
    return (
      '<!DOCTYPE html>\n' +
      '<html>\n' +
      '<head><title>New page</title></head>\n' +
      '<body>\n' +
      '  \n' +
      '</body>\n' +
      '</html>'
    );
  }

  function createStore(storage, key) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      throw new TypeError('storage must implement getItem/setItem');
    }
    key = key || DEFAULT_KEY;

    var cache = null;

    function read() {
      if (cache !== null) return cache;
      var raw = null;
      try {
        raw = storage.getItem(key);
      } catch (e) {
        cache = {};
        return cache;
      }
      if (raw == null) {
        cache = {};
        return cache;
      }
      try {
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          cache = {};
        } else {
          cache = parsed;
        }
      } catch (e) {
        cache = {};
      }
      return cache;
    }

    function persist() {
      try {
        storage.setItem(key, JSON.stringify(cache));
        return true;
      } catch (e) {
        return false;
      }
    }

    function list() {
      return Object.keys(read()).sort();
    }

    function has(name) {
      return Object.prototype.hasOwnProperty.call(read(), name);
    }

    function get(name) {
      var files = read();
      return Object.prototype.hasOwnProperty.call(files, name) ? files[name] : null;
    }

    function set(name, content) {
      if (typeof name !== 'string' || name.length === 0) {
        throw new Error('name must be a non-empty string');
      }
      if (typeof content !== 'string') {
        throw new Error('content must be a string');
      }
      read()[name] = content;
      return persist();
    }

    function remove(name) {
      var files = read();
      if (!Object.prototype.hasOwnProperty.call(files, name)) return false;
      delete files[name];
      return persist();
    }

    function create(name) {
      if (typeof name !== 'string' || name.length === 0) {
        throw new Error('name must be a non-empty string');
      }
      if (has(name)) {
        throw new Error('A file with that name already exists.');
      }
      var content = /\.html?$/i.test(name) ? htmlTemplate(name) : '';
      set(name, content);
      return content;
    }

    function reload() {
      cache = null;
    }

    return {
      key: key,
      list: list,
      has: has,
      get: get,
      set: set,
      remove: remove,
      create: create,
      reload: reload
    };
  }

  return {
    DEFAULT_KEY: DEFAULT_KEY,
    htmlTemplate: htmlTemplate,
    createStore: createStore
  };
});
