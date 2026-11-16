/* AI 주식 멘토 Service Worker
 * 전략: Network-First (매일 바뀌는 브리핑·데이터를 최우선으로 받아오고,
 *       실패 시에만 캐시로 화면을 유지). 설치 후 재방문 시 새 파일이
 *       바로 반영되도록 오래된 캐시는 매번 정리합니다.
 */
const CACHE = 'stock-mentor-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 네트워크 우선: 성공하면 캐시를 새 값으로 교체, 실패하면 캐시값 사용
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
