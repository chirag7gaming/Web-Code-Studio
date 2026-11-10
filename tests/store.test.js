'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, DEFAULT_KEY, htmlTemplate } = require('../lib/store');

function fakeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    removeItem: (k) => { data.delete(k); }
  };
}

function throwingStorage() {
  return {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('quota'); }
  };
}

// ---- basics --------------------------------------------------------------

test('default key', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.key, DEFAULT_KEY);
});

test('custom key is honored', () => {
  const storage = fakeStorage();
  const s = createStore(storage, 'my-files');
  s.set('a.txt', 'hi');
  assert.ok(storage.getItem('my-files'));
});

test('empty store returns empty list', () => {
  const s = createStore(fakeStorage());
  assert.deepEqual(s.list(), []);
});

test('has/get return false/null for missing files', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.has('nope'), false);
  assert.equal(s.get('nope'), null);
});

test('set then get roundtrips', () => {
  const s = createStore(fakeStorage());
  s.set('a.txt', 'hello');
  assert.equal(s.get('a.txt'), 'hello');
  assert.equal(s.has('a.txt'), true);
});

test('list is sorted', () => {
  const s = createStore(fakeStorage());
  s.set('c.txt', '');
  s.set('a.txt', '');
  s.set('b.txt', '');
  assert.deepEqual(s.list(), ['a.txt', 'b.txt', 'c.txt']);
});

test('set overwrites', () => {
  const s = createStore(fakeStorage());
  s.set('a.txt', 'one');
  s.set('a.txt', 'two');
  assert.equal(s.get('a.txt'), 'two');
});

test('remove deletes and returns true', () => {
  const s = createStore(fakeStorage());
  s.set('a.txt', '');
  assert.equal(s.remove('a.txt'), true);
  assert.equal(s.has('a.txt'), false);
});

test('remove of missing file returns false', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.remove('nope'), false);
});

// ---- validation ----------------------------------------------------------

test('set rejects empty name', () => {
  const s = createStore(fakeStorage());
  assert.throws(() => s.set('', 'x'), /non-empty string/);
});

test('set rejects non-string content', () => {
  const s = createStore(fakeStorage());
  assert.throws(() => s.set('a.txt', 42), /content must be a string/);
});

test('create rejects empty name', () => {
  const s = createStore(fakeStorage());
  assert.throws(() => s.create(''), /non-empty string/);
});

test('create rejects collision', () => {
  const s = createStore(fakeStorage());
  s.create('a.txt');
  assert.throws(() => s.create('a.txt'), /already exists/);
});

// ---- create --------------------------------------------------------------

test('create html scaffolds template', () => {
  const s = createStore(fakeStorage());
  const content = s.create('page.html');
  assert.equal(content, htmlTemplate('page.html'));
  assert.match(content, /^<!DOCTYPE html>/);
});

test('create htm (short ext) also scaffolds', () => {
  const s = createStore(fakeStorage());
  const content = s.create('page.htm');
  assert.match(content, /^<!DOCTYPE html>/);
});

test('create non-html leaves content empty', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.create('style.css'), '');
});

test('htmlTemplate name is unused', () => {
  assert.equal(htmlTemplate('a.html'), htmlTemplate('b.html'));
});

// ---- persistence ---------------------------------------------------------

test('persistence across instances', () => {
  const storage = fakeStorage();
  const a = createStore(storage);
  a.set('a.txt', 'hello');

  const b = createStore(storage);
  assert.equal(b.get('a.txt'), 'hello');
  assert.deepEqual(b.list(), ['a.txt']);
});

test('reload re-reads from storage', () => {
  const storage = fakeStorage();
  const s = createStore(storage);

  s.set('a.txt', 'first');
  storage.setItem(DEFAULT_KEY, JSON.stringify({ 'a.txt': 'second' }));
  assert.equal(s.get('a.txt'), 'first');

  s.reload();
  assert.equal(s.get('a.txt'), 'second');
});

// ---- corruption / failures ----------------------------------------------

test('corrupt JSON is treated as empty', () => {
  const storage = fakeStorage();
  storage.setItem(DEFAULT_KEY, 'not-json{{{');
  const s = createStore(storage);
  assert.deepEqual(s.list(), []);
});

test('array JSON is treated as empty', () => {
  const storage = fakeStorage();
  storage.setItem(DEFAULT_KEY, '[1,2,3]');
  const s = createStore(storage);
  assert.deepEqual(s.list(), []);
});

test('null JSON is treated as empty', () => {
  const storage = fakeStorage();
  storage.setItem(DEFAULT_KEY, 'null');
  const s = createStore(storage);
  assert.deepEqual(s.list(), []);
});

test('throwing storage does not crash reads', () => {
  const s = createStore(throwingStorage());
  assert.deepEqual(s.list(), []);
});

test('throwing storage does not crash writes', () => {
  const s = createStore(throwingStorage());
  const ok = s.set('a.txt', 'hi');
  assert.equal(ok, false);
  assert.equal(s.get('a.txt'), 'hi'); // in-memory cache survives
});

// ---- prototype safety ---------------------------------------------------

test('set does not pollute prototype', () => {
  const s = createStore(fakeStorage());
  s.set('__proto__', 'x');
  assert.equal({}.x, undefined);
});

// ---- html template shape ------------------------------------------------

test('htmlTemplate includes doctype, html, head, body', () => {
  const t = htmlTemplate();
  assert.match(t, /^<!DOCTYPE html>/);
  assert.match(t, /<html>/);
  assert.match(t, /<head><title>New page<\/title><\/head>/);
  assert.match(t, /<body>/);
  assert.match(t, /<\/body>/);
  assert.match(t, /<\/html>$/);
});
