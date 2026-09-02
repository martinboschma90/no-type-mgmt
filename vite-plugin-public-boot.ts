import type { Plugin } from 'vite'

/** Start the roster fetch before React, without painting a separate boot UI. */
export function publicBootPlugin(env: Record<string, string>): Plugin {
  const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').trim()
  const url = JSON.stringify(supabaseUrl)
  const key = JSON.stringify((env.VITE_SUPABASE_ANON_KEY ?? '').trim())
  const origin = JSON.stringify(supabaseUrl.replace(/\/$/, ''))

  const source = `(function(){
    if (location.pathname.indexOf('/cms') === 0) return;
    var STORAGE_KEY = 'notype-public-artists-v3';
    var STORAGE_KEY_V2 = 'notype-public-artists-v2';
    var SUPABASE_URL = ${url};
    var SUPABASE_ANON_KEY = ${key};
    function readCache() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY_V2);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
    function cardUrl(src) {
      if (!src || src.indexOf('http') !== 0) return src;
      var object = src.match(/^(https?:\\/\\/[^/?#]+)\\/storage\\/v1\\/object\\/public\\/(.+?)(?:\\?.*)?$/i);
      var render = src.match(/^(https?:\\/\\/[^/?#]+)\\/storage\\/v1\\/render\\/image\\/public\\/(.+?)(?:\\?.*)?$/i);
      var match = object || render;
      if (!match) return src;
      return match[1] + '/storage/v1/render/image/public/' + match[2] + '?width=720&quality=84&resize=contain&format=webp';
    }
    function preloadRosterImages(cached) {
      if (!cached) return;
      var list = Array.isArray(cached)
        ? cached
        : Object.keys(cached).map(function (k) { return cached[k]; });
      for (var i = 0; i < list.length && i < 4; i++) {
        var href = cardUrl(list[i] && list[i].imageUrl);
        if (!href) continue;
        var link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = href;
        document.head.appendChild(link);
      }
    }
    function load(storageKey) {
      return fetch(SUPABASE_URL + '/rest/v1/cms_content?key=eq.' + encodeURIComponent(storageKey) + '&select=data&limit=1', {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
          Accept: 'application/json'
        }
      }).then(function (res) { return res.ok ? res.json() : null; })
        .then(function (rows) { return rows && rows[0] ? rows[0].data : null; });
    }
    function fetchArtists() {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return Promise.resolve(readCache());
      return load(STORAGE_KEY).then(function (current) {
        if (current) return current;
        return load(STORAGE_KEY_V2).then(function (legacy) { return legacy || readCache(); });
      }).catch(function () { return readCache(); });
    }
    var cached = readCache();
    preloadRosterImages(cached);
    window.__NOTYPE_BOOT__ = { cached: cached, promise: fetchArtists() };
  })();`

  const preconnect = supabaseUrl
    ? `<link rel="preconnect" href=${origin} crossorigin /><link rel="dns-prefetch" href=${origin} />`
    : ''

  return {
    name: 'public-boot',
    transformIndexHtml(html) {
      return html
        .replace('<!--public-boot-->', `${preconnect}<script>${source}</script>`)
    },
  }
}
