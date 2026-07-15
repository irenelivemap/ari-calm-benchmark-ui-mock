(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AriBenchmarkRuntime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CHALLENGE_SLUGS = Object.freeze({
    google: 'fast-vs-google',
    calm: 'fast-vs-calm'
  });
  const SLUG_CHALLENGES = Object.freeze(Object.fromEntries(
    Object.entries(CHALLENGE_SLUGS).map(([challenge, slug]) => [slug, challenge])
  ));

  function normalizeBasePath(value) {
    const path = String(value || '').trim();
    if (!path || path === '/') return '';
    return `/${path.replace(/^\/+|\/+$/g, '')}`;
  }

  function inferBasePath(pathname, configuredBasePath = '') {
    const configured = normalizeBasePath(configuredBasePath);
    if (configured) return configured;
    const segments = String(pathname || '/').split('/').filter(Boolean);
    const routingIndex = segments.lastIndexOf('routing');
    if (routingIndex < 0) return '';
    return `/${segments.slice(0, routingIndex + 1).join('/')}`;
  }

  function challengeFromPath(pathname, basePath = '') {
    const normalizedPath = String(pathname || '/').replace(/\/+$/, '');
    const normalizedBase = normalizeBasePath(basePath);
    const relative = normalizedBase && normalizedPath.startsWith(normalizedBase)
      ? normalizedPath.slice(normalizedBase.length)
      : normalizedPath;
    const slug = relative.split('/').filter(Boolean).at(-1) || '';
    return SLUG_CHALLENGES[slug] || null;
  }

  function resolveChallenge(locationLike, config = {}) {
    const pathname = locationLike?.pathname || '/';
    const basePath = inferBasePath(pathname, config.basePath);
    const pathChallenge = challengeFromPath(pathname, basePath);
    if (pathChallenge) return pathChallenge;
    const params = new URLSearchParams(locationLike?.search || '');
    const queryChallenge = params.get('game');
    return CHALLENGE_SLUGS[queryChallenge] ? queryChallenge : null;
  }

  function challengeUrl(locationLike, challenge, config = {}) {
    if (!CHALLENGE_SLUGS[challenge]) throw new TypeError(`Unknown challenge: ${challenge}`);
    const url = new URL(locationLike.href);
    const basePath = inferBasePath(url.pathname, config.basePath);
    const useCleanPaths = Boolean(basePath || config.production);
    if (useCleanPaths) {
      url.pathname = `${basePath}/${CHALLENGE_SLUGS[challenge]}`.replace(/\/{2,}/g, '/');
      url.searchParams.delete('game');
    } else {
      url.searchParams.set('game', challenge);
    }
    return url;
  }

  function rootUrl(locationLike, config = {}) {
    const url = new URL(locationLike.href);
    const basePath = inferBasePath(url.pathname, config.basePath);
    url.pathname = basePath ? `${basePath}/` : url.pathname.replace(/[^/]*$/, '');
    url.search = '';
    url.hash = '';
    return url;
  }

  function resolveConfig(rootLike = {}) {
    const supplied = rootLike.ARI_RUNTIME_CONFIG || {};
    const production = supplied.production === true;
    return {
      production,
      basePath: normalizeBasePath(supplied.basePath),
      publicUrl: String(supplied.publicUrl || ''),
      routingApiBase: String(
        supplied.routingApiBase || rootLike.ARI_ROUTING_API || '/api/v1/routing'
      ).replace(/\/$/, ''),
      dataApiBase: String(supplied.dataApiBase || '').replace(/\/$/, ''),
      googleMapsKey: String(supplied.googleMapsKey || rootLike.ARI_GOOGLE_MAPS_KEY || ''),
      allowQueryConfig: supplied.allowQueryConfig ?? !production,
      showReset: supplied.showReset ?? !production,
      enableTeamResults: supplied.enableTeamResults ?? !production
    };
  }

  return {
    CHALLENGE_SLUGS,
    normalizeBasePath,
    inferBasePath,
    challengeFromPath,
    resolveChallenge,
    challengeUrl,
    rootUrl,
    resolveConfig
  };
});
