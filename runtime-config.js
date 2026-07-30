(function (root) {
  root.ARI_RUNTIME_CONFIG = Object.assign({
    production: false,
    basePath: '',
    publicUrl: '',
    routingApiBase: '/api/v1/routing',
    dataApiBase: '',
    googleMapsKey: '',
    allowQueryConfig: true,
    showReset: false,
    enableTeamResults: true
  }, root.ARI_RUNTIME_CONFIG || {});
})(typeof globalThis !== 'undefined' ? globalThis : this);
