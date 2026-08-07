(function (root) {
  // PRODUCTION PERSISTENCE: the hosted participant site writes to the Supabase project below.
  // The anon key is intentionally public/browser-safe and restricted by the RLS policies
  // in supabase-setup.sql. Do not blank these values merely because dataApiBase is empty;
  // the HTTP data API is an optional self-hosted alternative, not the current backend.
  const productionDefault = root.location?.protocol !== 'file:'
    && !['localhost', '127.0.0.1'].includes(root.location?.hostname || '');
  root.ARI_RUNTIME_CONFIG = Object.assign({
    production: productionDefault,
    basePath: '',
    publicUrl: '',
    routingApiBase: '/api/v1/routing',
    dataApiBase: '', // Optional self-hosted alternative; Supabase remains active when empty.
    supabaseUrl: 'https://xyrmytymcipyntdtsksu.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cm15dHltY2lweW50ZHRza3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDkyNTAsImV4cCI6MjEwMTQyNTI1MH0.eSYOBBKeLWF6lKA51sUcvK5xYjEaXb3yaZk1Mv1euSo',
    googleMapsKey: '',
    mapTilerKey: '',
    allowQueryConfig: !productionDefault,
    showReset: false,
    enableTeamResults: false
  }, root.ARI_RUNTIME_CONFIG || {});
})(typeof globalThis !== 'undefined' ? globalThis : this);
