const test = require('node:test');
const assert = require('node:assert/strict');

const MapLoading = require('../src/maps/map-loading.js');

function fakeMap({ styleLoaded = false } = {}) {
  const listeners = new Map();
  return {
    once(event, handler) {
      listeners.set(event, handler);
    },
    off(event, handler) {
      if (listeners.get(event) === handler) listeners.delete(event);
    },
    emit(event, payload) {
      listeners.get(event)?.(payload);
    },
    isStyleLoaded() {
      return styleLoaded;
    },
    listenerCount() {
      return listeners.size;
    }
  };
}

test('prefers the configured MapTiler streets style and keeps a public fallback', () => {
  const candidates = MapLoading.mapStyleCandidates({
    mapTilerKey: 'browser-key',
    variant: 'bright'
  });

  assert.deepEqual(candidates, [
    {
      id: 'maptiler',
      style: 'https://api.maptiler.com/maps/streets-v4/style.json?key=browser-key'
    },
    {
      id: 'openfreemap',
      style: 'https://tiles.openfreemap.org/styles/bright'
    }
  ]);
});

test('uses OpenFreeMap directly when no MapTiler browser key is configured', () => {
  assert.deepEqual(MapLoading.mapStyleCandidates({ mapTilerKey: '' }), [
    {
      id: 'openfreemap',
      style: 'https://tiles.openfreemap.org/styles/bright'
    }
  ]);
});

test('rejects a MapLibre startup that stalls instead of waiting forever', async () => {
  const map = fakeMap();
  await assert.rejects(
    MapLoading.waitForMapLoad(map, { timeoutMs: 10 }),
    error => error?.code === 'MAP_LOAD_TIMEOUT'
  );
  assert.equal(map.listenerCount(), 0);
});

test('resolves on load and rejects fatal startup errors', async () => {
  const loadedMap = fakeMap();
  const loaded = MapLoading.waitForMapLoad(loadedMap, { timeoutMs: 100 });
  loadedMap.emit('load');
  await loaded;
  assert.equal(loadedMap.listenerCount(), 0);

  const failedMap = fakeMap();
  const failed = MapLoading.waitForMapLoad(failedMap, { timeoutMs: 100 });
  failedMap.emit('error', { error: new Error('style request failed') });
  await assert.rejects(failed, /style request failed/);
  assert.equal(failedMap.listenerCount(), 0);
});

test('ignores non-fatal asset errors after the style is ready', async () => {
  const map = fakeMap({ styleLoaded: true });
  const ready = MapLoading.waitForMapLoad(map, { timeoutMs: 100 });
  map.emit('error', { error: new Error('one optional tile failed') });
  map.emit('load');
  await ready;
});

test('removes a failed MapLibre instance and continues with the next style', async () => {
  const instances = [];
  class FakeMap {
    constructor(options) {
      this.options = options;
      this.listeners = new Map();
      this.removed = false;
      instances.push(this);
      setImmediate(() => {
        if (options.style === 'primary') this.emit('error', { error: new Error('primary failed') });
        else this.emit('load');
      });
    }
    once(event, handler) { this.listeners.set(event, handler); }
    off(event, handler) {
      if (this.listeners.get(event) === handler) this.listeners.delete(event);
    }
    emit(event, payload) { this.listeners.get(event)?.(payload); }
    isStyleLoaded() { return false; }
    loaded() { return false; }
    remove() { this.removed = true; }
  }

  const result = await MapLoading.createMapWithStyleFallback({
    MapClass: FakeMap,
    mapOptions: { container: {} },
    candidates: [
      { id: 'primary', style: 'primary' },
      { id: 'fallback', style: 'fallback' }
    ],
    timeoutMs: 100
  });

  assert.equal(result.source, 'fallback');
  assert.equal(result.map, instances[1]);
  assert.equal(instances[0].removed, true);
  assert.equal(instances[1].removed, false);
});
