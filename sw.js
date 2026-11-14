/* The Ledger service worker: keeps the app working offline. */
const VERSION = "0ae44e3896";
const SHELL = "ledger-shell-" + VERSION;
const FONTS = "ledger-fonts";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png", "./icons/out-96.png", "./icons/in-96.png", "./icons/transfer-96.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("ledger-shell-") && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname === "api.mfapi.in") return; // NAVs always come live from the network
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok || res.type === "opaque") c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // the app is one page: always serve it from the cache, so it opens offline
    e.respondWith(caches.open(SHELL).then((c) => c.match("./index.html").then((hit) => hit || fetch(req))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
