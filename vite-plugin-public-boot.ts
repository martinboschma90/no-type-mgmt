import type { Plugin } from 'vite'

/** Start the roster fetch before React, without painting a separate boot UI. */
export function publicBootPlugin(env: Record<string, string>): Plugin {
  const url = JSON.stringify((env.VITE_SUPABASE_URL ?? '').trim())
  const key = JSON.stringify((env.VITE_SUPABASE_ANON_KEY ?? '').trim())

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
    window.__NOTYPE_BOOT__ = { cached: cached, promise: fetchArtists() };
  })();`

  return {
    name: 'public-boot',
    transformIndexHtml(html) {
      return html.replace('<!--public-boot-->', `<script>${source}</script>`)
    },
  }
}
