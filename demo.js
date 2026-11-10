'use strict';

const { createStore, DEFAULT_KEY, htmlTemplate } = require('./lib/store');

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k)
  };
}

const storage = fakeStorage();
const store = createStore(storage);

console.log('key:', store.key, '(default:', DEFAULT_KEY + ')');

store.create('index.html');
store.create('style.css');
store.set('style.css', 'body { background: #000; color: #fff; }');

console.log('files:', store.list());

const store2 = createStore(storage);
console.log('reloaded from same storage:', store2.list());

console.log('index.html starts with:', JSON.stringify(store2.get('index.html').split('\n')[0]));
console.log('style.css bytes:', Buffer.byteLength(store2.get('style.css'), 'utf8'));

store2.remove('style.css');
console.log('after remove:', store2.list());

try {
  store2.create('index.html');
} catch (e) {
  console.log('collision:', e.message);
}

console.log('template matches htmlTemplate():', store.get('index.html') === htmlTemplate('index.html'));
