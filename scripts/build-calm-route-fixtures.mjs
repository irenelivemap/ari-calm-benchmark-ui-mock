// Compatibility entry point. Route geometry and diagnostics must be generated
// together so the participant and researcher views cannot drift.
console.warn('build-calm-route-fixtures.mjs now builds the complete versioned route corpus.');
await import('./build-calm-route-corpus.mjs');
