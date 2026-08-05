(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriMapLoading = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAPTILER_STYLE_BASE = 'https://api.maptiler.com/maps';
  const OPENFREEMAP_STYLE_BASE = 'https://tiles.openfreemap.org/styles';
  const DEFAULT_MAP_LOAD_TIMEOUT_MS = 8000;

  function mapTilerStyleUrl(mapTilerKey, variant = 'bright') {
    const style = variant === 'dark' ? 'streets-v4-dark' : 'streets-v4';
    return `${MAPTILER_STYLE_BASE}/${style}/style.json?key=${encodeURIComponent(mapTilerKey)}`;
  }

  function mapStyleCandidates({ mapTilerKey = '', variant = 'bright' } = {}) {
    const candidates = [];
    if (String(mapTilerKey).trim()) {
      candidates.push({
        id: 'maptiler',
        style: mapTilerStyleUrl(String(mapTilerKey).trim(), variant)
      });
    }
    candidates.push({
      id: 'openfreemap',
      style: `${OPENFREEMAP_STYLE_BASE}/${variant === 'dark' ? 'dark' : 'bright'}`
    });
    return candidates;
  }

  function waitForMapLoad(map, { timeoutMs = DEFAULT_MAP_LOAD_TIMEOUT_MS } = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        clearTimeout(timer);
        if (typeof map.off === 'function') {
          map.off('load', onLoad);
          map.off('error', onError);
        }
      };
      const finish = callback => value => {
        if (settled) return;
        settled = true;
        cleanup();
        callback(value);
      };
      const succeed = finish(resolve);
      const fail = finish(reject);
      const onLoad = () => succeed(map);
      const onError = event => {
        if (typeof map.isStyleLoaded === 'function' && map.isStyleLoaded()) return;
        const error = event?.error instanceof Error
          ? event.error
          : new Error('The map style could not be loaded.');
        error.code ||= 'MAP_LOAD_ERROR';
        fail(error);
      };
      const timer = setTimeout(() => {
        const error = new Error('The map took too long to load.');
        error.code = 'MAP_LOAD_TIMEOUT';
        fail(error);
      }, Math.max(1, Number(timeoutMs) || DEFAULT_MAP_LOAD_TIMEOUT_MS));

      map.once('load', onLoad);
      map.once('error', onError);
      if (typeof map.loaded === 'function' && map.loaded()) onLoad();
    });
  }

  async function createMapWithStyleFallback({
    MapClass,
    mapOptions,
    candidates,
    timeoutMs = DEFAULT_MAP_LOAD_TIMEOUT_MS,
    onAttemptFailure = null
  }) {
    let lastError = null;
    for (const candidate of candidates) {
      let map = null;
      try {
        map = new MapClass({ ...mapOptions, style: candidate.style });
        await waitForMapLoad(map, { timeoutMs });
        return { map, source: candidate.id };
      } catch (error) {
        lastError = error;
        try { map?.remove(); } catch (_) {}
        if (typeof onAttemptFailure === 'function') onAttemptFailure(candidate, error);
      }
    }
    const error = new Error('No map style could be loaded.');
    error.code = 'MAP_STYLES_UNAVAILABLE';
    error.cause = lastError;
    throw error;
  }

  return {
    DEFAULT_MAP_LOAD_TIMEOUT_MS,
    createMapWithStyleFallback,
    mapStyleCandidates,
    mapTilerStyleUrl,
    waitForMapLoad
  };
});
