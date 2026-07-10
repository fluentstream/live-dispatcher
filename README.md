liveDispatcher
==============

Example client library for integrating with the FluentStream Technologies phone
system to capture and handle live events (calls, queues, agents, phone status,
SMS, auto attendant, and FluentCloud events). Use this as a starting point for a
custom integration with CRM software or other web pages.

## Setup

1. Use Node **22+** (the dev server requires it): `nvm use` (or install Node 22).
2. No dependencies to install — the dev server is zero-dependency.
3. Set your `tenant` and `apikey` once at the top of `config/config.js`.
4. Start the server: `npm start`.
5. Open <http://localhost:3000> and pick an example. Events are logged to the
   browser console (open your dev tools).

If the connection is blocked by a CORS error, see
[CORS during local testing](#cors-during-local-testing) below.

## Requirements

- Node.js **22+** (see `.nvmrc`). Only needed to run the local dev server.
- A modern browser. The dispatchers are native ES modules and pull the
  Socket.IO client from a CDN, so the pages must be **served over http** — the
  `file://` protocol blocks module imports.

## Running the examples

`npm start` serves on port 3000; change it with `PORT=8080 npm start`.

## CORS during local testing

A localhost page connecting straight to `https://live.fluentcloud.com` is a
cross-origin request, so the browser blocks the Socket.IO handshake with a CORS
error. (This only affects local testing) Two ways around
it:

**Proxy through the dev server (recommended).** `server.js` proxies `/socket.io`
to the live server, so the browser stays same-origin with `localhost`. To use
it, switch `config/config.js` to the **local development preset** (points the
dispatcher at `http://localhost:3000`) and run `npm start`. Override the
upstream with `PROXY_TARGET=https://beta.fluentcloud.com npm start`.

**Disable browser security (quick alternative).** Launch a throwaway Chrome
that ignores CORS, then open the page from it:

```sh
# macOS
open -na "Google Chrome" --args --disable-web-security --user-data-dir=/tmp/chrome-cors-test
```

Only browse the test pages in this window — it has web security turned off.

## How it works

- `liveDispatcher.js` — the base `LiveDispatcher` class. Handles connecting,
  subscribing to rooms, reconnection, and the ping/pong keep-alive. Imports the
  Socket.IO client and is extended by each dispatcher.
- `*Dispatcher.js` — one subclass per event namespace (calls, queues, agents,
  etc.). Each sets its `namespace` / `initEvent` and wires up the events it
  cares about to the handlers you pass in `options`.
- `*.index.html` — runnable example pages. Each defines a set of handler
  functions, passes them into the dispatcher via `options`, and calls `run()`.
- `config/config.js` — connection configuration. Exports a `config` object;
  swap in one of the commented presets to target local/beta environments.

To handle an event, pass a handler with the matching key in `options` (e.g.
`callConnectHandler`, `joinHandler`, `agentDataHandler`). Handlers that are not
provided are simply skipped.
