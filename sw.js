// 앱 셸 캐싱 — 오프라인에서도 UI는 뜨고, playlist.json은 항상 최신을 시도
const CACHE = "ytp-v1";
const SHELL = ["./", "./index.html", "./manifest.json",
               "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // 유튜브/외부는 그냥 통과
  if (url.origin !== location.origin) return;
  // playlist.json: 네트워크 우선(최신), 실패하면 캐시
  if (url.pathname.endsWith("playlist.json")) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // 나머지: 캐시 우선
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
