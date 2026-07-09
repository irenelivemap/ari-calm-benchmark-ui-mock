(function () {
  window.AriCalmBenchmarkMockRoutePairs = [
    {
      pairId: 'zurich-limmat-evening-01',
      scenario: 'An evening walk home along the Limmat, no particular rush.',
      origin: { lat: 47.37818, lng: 8.54018, label: 'Zuerich HB' },
      destination: { lat: 47.36665, lng: 8.54437, label: 'Bellevue' },
      routes: {
        fast: {
          routeId: 'fast-demo-01',
          geometry: [
            [47.37818, 8.54018], [47.37692, 8.54072], [47.37573, 8.54122],
            [47.37452, 8.54175], [47.37319, 8.54222], [47.37184, 8.54282],
            [47.37038, 8.54334], [47.36884, 8.54386], [47.36665, 8.54437]
          ]
        },
        calm: {
          routeId: 'calm-demo-01',
          geometry: [
            [47.37818, 8.54018], [47.37742, 8.53874], [47.37618, 8.53762],
            [47.37476, 8.53712], [47.37322, 8.53756], [47.37186, 8.53874],
            [47.37054, 8.54022], [47.36921, 8.54146], [47.36786, 8.54274],
            [47.36665, 8.54437]
          ]
        }
      }
    }
  ];
})();
