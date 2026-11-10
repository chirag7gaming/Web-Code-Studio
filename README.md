# Web-Code-Studio

A small browser-based code editor — file tree, tabs, sandboxed HTML preview,
localStorage persistence. No server, no build step, no dependencies.

Made by [Fish Gang Co.](https://fish-gang.netlify.app/Company).

## Layout

```
lib/store.js            UMD file store — storage-agnostic, testable
index.html              Reference editor (browser, no server needed)
server.js               Local static server for index.html
css/theme.css           Design tokens + shared chrome
js/theme-toggle.js      Applies saved theme, exposes window.toggleTheme()
js/perf-tier.js         Sets data-perf-tier + data-motion on <html>
demo.js                 CLI: exercise the store with a fake storage
tests/store.test.js     node:test suite for the store
docs/STORAGE.md         Storage key, schema, lifecycle
```

## How it works

Files are stored in `localStorage` as a single JSON object:

```json
{
  "index.html": "<!DOCTYPE html>...",
  "style.css":  "body { background: #000; }"
}
```

`lib/store.js` wraps that object with a small API (`list`, `get`, `set`,
`remove`, `create`, `reload`, `has`, `key`) and handles JSON parse failures,
write failures, and filename collision. The editor UI in `index.html` never
touches `localStorage` directly.

Preview is a `<iframe srcdoc sandbox="allow-scripts allow-modals">` — so HTML
you write runs in an isolated origin with no access to `parent`, cookies,
or storage.

## Library

```js
const { createStore, DEFAULT_KEY, HTML_TEMPLATE } = require('./lib/store');

const store = createStore(localStorage);
// or: createStore(window.localStorage, 'my-key')

store.create('index.html');                       // scaffolds the HTML template
store.set('index.html', '<h1>hi</h1>');
store.get('index.html');                           // → '<h1>hi</h1>'
store.has('index.html');                           // → true
store.list();                                      // → ['index.html']
store.remove('index.html');                        // → true
store.reload();                                    // re-read from storage
```

`createStore(storage, key)` accepts any object with `getItem` / `setItem`
compatible methods — `localStorage`, `sessionStorage`, or a `Map`-backed
fake in tests.

`store.create(name)` throws if `name` already exists; `store.set` overwrites.

In the browser, `lib/store.js` assigns `window.CodeStudio`:

```html
<script src="lib/store.js"></script>
<script>
  const store = CodeStudio.createStore(localStorage);
  store.create('hello.html');
</script>
```

## Storage schema

See [`docs/STORAGE.md`](docs/STORAGE.md). Summary:

- **Key:** `code-studio-files` (override via `createStore(storage, key)`)
- **Shape:** flat `{ [filename]: string }`
- **Filenames:** unique, non-empty strings — no path semantics, no folders
- **Values:** always strings — the editor treats all content as text

## Running

```bash
npm start      # http://localhost:3000 — serves index.html + static assets
npm run demo   # exercises the store with a fake storage (no browser needed)
npm test       # node:test suite
```

`index.html` also opens directly from disk — double-click it, no server
needed. All asset paths are relative.

## Testing

`tests/store.test.js` uses Node's built-in test runner (`node:test`, Node 18+).
Covers list/get/set/remove/create, persistence across store instances,
filename collision, corrupted JSON, storage failure, HTML template shape,
and `reload()`.

## Forks

Forks are welcome — the contract is the `.cs-*` classnames, the preview
`<iframe sandbox>` attribute, and the storage schema above.

## License

MIT
