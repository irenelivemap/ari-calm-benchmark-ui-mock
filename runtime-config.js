(function (root) {
  root.ARI_RUNTIME_CONFIG = Object.assign({
    production: false,
    basePath: '',
    publicUrl: '',
    routingApiBase: '/api/v1/routing',
    dataApiBase: '',
    supabaseUrl: 'https://xyrmytymcipyntdtsksu.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cm15dHltY2lweW50ZHRza3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDkyNTAsImV4cCI6MjEwMTQyNTI1MH0.eSYOBBKeLWF6lKA51sUcvK5xYjEaXb3yaZk1Mv1euSo',
    googleMapsKey: '',
    allowQueryConfig: true,
    showReset: true,
    enableTeamResults: true
  }, root.ARI_RUNTIME_CONFIG || {});
})(typeof globalThis !== 'undefined' ? globalThis : this);
