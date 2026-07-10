// Minimal zero-dependency static file server for running the example pages.
// ES modules require pages to be served over http (the file:// protocol blocks
// module imports), so run `npm start` and open the printed URL.
//
// It also proxies the Socket.IO endpoint (`/socket.io`) to the live event
// server. The browser talks same-origin to localhost and Node relays the
// request upstream, which sidesteps the cross-origin (CORS) restriction you
// hit connecting a localhost page straight to live.fluentcloud.com. Point the
// dispatcher config at this server (the "local development preset" in
// config/config.js) to use it.
//
// Requires Node 22+.

import { createServer } from "node:http";
import { request as httpsRequest } from "node:https";
import { connect as tlsConnect } from "node:tls";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath(new URL(".")) keeps a trailing separator; strip it so the
// path-traversal check below compares cleanly.
const ROOT = fileURLToPath(new URL(".", import.meta.url)).replace(/[/\\]$/, "");
const PORT = Number(process.env.PORT) || 3000;

// Upstream live event server that /socket.io traffic is proxied to.
const PROXY_TARGET = new URL(process.env.PROXY_TARGET || "https://live.fluentcloud.com");
const TARGET_HOST = PROXY_TARGET.hostname;
const TARGET_PORT = Number(PROXY_TARGET.port) || 443;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  // Strip the query string and decode, then default the root path to the
  // landing page.
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);

  // Proxy the Socket.IO handshake / polling transport upstream.
  if (requestPath.startsWith("/socket.io")) {
    // Drop Origin so the upstream server treats us as a non-browser client and
    // does not reject us on CORS grounds.
    const headers = { ...req.headers, host: PROXY_TARGET.host };
    delete headers.origin;
    delete headers.referer;

    const proxyReq = httpsRequest(
      { hostname: TARGET_HOST, port: TARGET_PORT, path: req.url, method: req.method, headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on("error", (error) => {
      console.error("Proxy error:", error.message);
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" }).end("Bad gateway");
    });
    req.pipe(proxyReq);
    return;
  }

  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");

  // Resolve against ROOT and guard against path traversal outside the repo.
  const filePath = normalize(join(ROOT, relativePath));
  if (!filePath.startsWith(ROOT + sep) && filePath !== ROOT) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType }).end(body);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end("Internal server error");
  }
});

// Proxy the WebSocket upgrade for the Socket.IO connection. We open a TLS
// socket to the upstream server, replay the upgrade request (minus Origin),
// then pipe the two sockets together for the life of the connection.
server.on("upgrade", (req, clientSocket, head) => {
  if (!req.url.startsWith("/socket.io")) {
    clientSocket.destroy();
    return;
  }

  const upstream = tlsConnect(TARGET_PORT, TARGET_HOST, { servername: TARGET_HOST }, () => {
    const headers = { ...req.headers, host: PROXY_TARGET.host };
    delete headers.origin;
    delete headers.referer;

    let rawRequest = `GET ${req.url} HTTP/1.1\r\n`;
    for (const [key, value] of Object.entries(headers)) {
      rawRequest += `${key}: ${value}\r\n`;
    }
    rawRequest += "\r\n";

    upstream.write(rawRequest);
    if (head && head.length) {
      upstream.write(head);
    }

    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });

  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
});

server.listen(PORT, () => {
  console.log(`live-dispatcher examples running at http://localhost:${PORT}`);
  console.log(`proxying /socket.io -> ${PROXY_TARGET.origin}`);
});
