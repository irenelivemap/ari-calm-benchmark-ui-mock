(function () {
  // UI-only fixtures. Real ARI and Google geometry will replace these through
  // the routePairProvider integration without changing the benchmark screens.
  window.AriFastGoogleMockRoutePairs = [
    {
      pairId: 'zurich-fast-google-hb-bellevue-01',
      origin: { lat: 47.37818, lng: 8.54018, label: 'Zuerich HB' },
      destination: { lat: 47.36665, lng: 8.54437, label: 'Bellevue' },
      routes: {
        livemap_fast: {
          routeId: 'ari-fast-preview-01',
          source: 'livemap_fast',
          metadata: { distanceMeters: 1680, durationSeconds: 1210 },
          geometry: [
            [47.37818, 8.54018], [47.37692, 8.54072], [47.37573, 8.54122],
            [47.37452, 8.54175], [47.37319, 8.54222], [47.37184, 8.54282],
            [47.37038, 8.54334], [47.36884, 8.54386], [47.36665, 8.54437]
          ]
        },
        google: {
          routeId: 'google-fast-preview-01',
          source: 'google',
          metadata: { distanceMeters: 1740, durationSeconds: 1240 },
          geometry: [
            [47.37818, 8.54018], [47.37742, 8.53874], [47.37618, 8.53762],
            [47.37476, 8.53712], [47.37322, 8.53756], [47.37186, 8.53874],
            [47.37054, 8.54022], [47.36921, 8.54146], [47.36786, 8.54274],
            [47.36665, 8.54437]
          ]
        }
      }
    },
    {
      pairId: 'zurich-fast-google-escher-helvetia-02',
      origin: { lat: 47.39072, lng: 8.52286, label: 'Escher-Wyss-Platz' },
      destination: { lat: 47.37623, lng: 8.52571, label: 'Helvetiaplatz' },
      routes: {
        livemap_fast: {
          routeId: 'ari-fast-preview-02',
          source: 'livemap_fast',
          metadata: { distanceMeters: 1870, durationSeconds: 1350 },
          geometry: [
            [47.39072, 8.52286], [47.38868, 8.52306], [47.38684, 8.52262],
            [47.38472, 8.52288], [47.38278, 8.52338], [47.38062, 8.52418],
            [47.37842, 8.52496], [47.37623, 8.52571]
          ]
        },
        google: {
          routeId: 'google-fast-preview-02',
          source: 'google',
          metadata: { distanceMeters: 1810, durationSeconds: 1320 },
          geometry: [
            [47.39072, 8.52286], [47.38916, 8.52428], [47.38718, 8.52516],
            [47.38508, 8.52548], [47.38288, 8.52522], [47.38058, 8.52504],
            [47.37836, 8.52542], [47.37623, 8.52571]
          ]
        }
      }
    },
    {
      pairId: 'zurich-fast-google-bellevue-kreuzplatz-03',
      origin: { lat: 47.36665, lng: 8.54437, label: 'Bellevue' },
      destination: { lat: 47.36522, lng: 8.55458, label: 'Kreuzplatz' },
      routes: {
        livemap_fast: {
          routeId: 'ari-fast-preview-03',
          source: 'livemap_fast',
          metadata: { distanceMeters: 980, durationSeconds: 710 },
          geometry: [
            [47.36665, 8.54437], [47.36654, 8.54612], [47.36628, 8.54806],
            [47.36602, 8.55018], [47.36564, 8.55236], [47.36522, 8.55458]
          ]
        },
        google: {
          routeId: 'google-fast-preview-03',
          source: 'google',
          metadata: { distanceMeters: 1030, durationSeconds: 740 },
          geometry: [
            [47.36665, 8.54437], [47.36582, 8.54582], [47.36536, 8.54784],
            [47.36558, 8.54996], [47.36572, 8.55216], [47.36522, 8.55458]
          ]
        }
      }
    }
  ];
})();
