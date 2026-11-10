# Storage

The editor persists files in `localStorage` under a single key. `lib/store.js`
is the only module that reads or writes that key — everything else goes
through the store API.

## Key

| | |
|---|---|
| **Default** | `code-studio-files` |
| **Override** | `createStore(storage, key)` |

Only one key is used. All files live in one JSON object under that key.

## Shape

```json
{
  "index.html": "<!DOCTYPE html>\n<html>...</html>",
  "style.css":  "body { background: #000; }",
  "app.js":     "console.log('hi');"
}
```

- **Top level:** plain object, filename → content.
- **Filenames:** any non-empty string. No path semantics — `a/b.html` is a
  valid single name, but the editor never creates folders.
- **Content:** always a string. The editor treats all content as text; there
  is no binary mode.
- **Order:** insertion order, but `list()` sorts alphabetically.

## Lifecycle

```
createStore(storage)
     │
     ├── cache = null
     │
     ├── list()  ─┐
     ├── get()   ─┼─► read()  ─► storage.getItem(key) ─► JSON.parse
     ├── has()   ─┤                                  │
     ├── set()   ─┤                                  ▼
     ├── remove()─┤                               cache (memoized)
     ├── create()─┘
     │
     └── reload() ─► cache = null
```

- The first read populates `cache`. Subsequent reads are in-memory until
  `reload()`.
- Every write (`set`, `remove`, `create`) serializes the full cache back to
  storage.
- Writes are best-effort: if `storage.setItem` throws (quota exceeded, private
  mode, blocked), the operation returns `false` but the in-memory cache stays
  updated. A later `reload()` will drop those changes.

## Corruption handling

`read()` defensively parses stored JSON:

| Stored value | Behavior |
|---|---|
| missing (`null`) | empty object |
| invalid JSON | empty object |
| JSON `null` | empty object |
| JSON array | empty object |
| JSON object | used as-is |

A corrupted key is never thrown to the caller — the store always behaves as
if it were empty.

## Filename collision

`create(name)` throws if `name` already exists. `set(name, content)` does not
throw — it overwrites. The editor's "New file" button uses `create()` (so it
rejects duplicates), and the editor's textarea uses `set()` (so typing does
not need a collision check).

## Prototype safety

Files are stored as own properties on a fresh object. Setting `__proto__` as
a filename does not affect `Object.prototype`. `has()` uses
`Object.prototype.hasOwnProperty.call` rather than `in` / direct access.
