(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.AriCalmBenchmarkDiagnostics = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const configured_weights = {
    tree_canopy:        { fast: 0, calm_nature: 0.9, calm_quiet: 0.2, direction: 'reward',  label: 'Tree canopy' },
    green_space:        { fast: 0, calm_nature: 0.9, calm_quiet: 0.2, direction: 'reward',  label: 'Green space' },
    proximity_to_water: { fast: 0, calm_nature: 0.9, calm_quiet: 0.2, direction: 'reward',  label: 'Proximity to water' },
    noise_exposure:     { fast: 0, calm_nature: 0.2, calm_quiet: 0.9, direction: 'penalty', label: 'Noise exposure' },
    main_road_exposure: { fast: 0, calm_nature: 0.2, calm_quiet: 0.9, direction: 'penalty', label: 'Main-road exposure' },
    accident_risk:      { fast: 0, calm_nature: 0,   calm_quiet: 0.9, direction: 'penalty', label: 'Accident risk' }
  };

  const pairs = [
    {
      pairId: 'calm-route-comparison-01',
      origin_label: 'Enge',
      destination_label: 'Bürkliplatz',
      metric_averages: {
        fast:        { tree_canopy: 0.19, green_space: 0.22, proximity_to_water: 0.31, noise_exposure: 0.47, accident_risk: 0.32, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.44, green_space: 0.51, proximity_to_water: 0.58, noise_exposure: 0.31, accident_risk: 0.24, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.26, green_space: 0.30, proximity_to_water: 0.38, noise_exposure: 0.19, accident_risk: 0.14, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2640, calm_nature: 1870 },
        calm_quiet:  { fast: 2820, calm_quiet:  1950 }
      }
    },
    {
      pairId: 'calm-route-comparison-02',
      origin_label: 'Oerlikon',
      destination_label: 'Schwamendingen',
      metric_averages: {
        fast:        { tree_canopy: 0.14, green_space: 0.18, proximity_to_water: 0.09, noise_exposure: 0.52, accident_risk: 0.37, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.38, green_space: 0.43, proximity_to_water: 0.22, noise_exposure: 0.35, accident_risk: 0.26, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.21, green_space: 0.24, proximity_to_water: 0.13, noise_exposure: 0.21, accident_risk: 0.17, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 1720, calm_nature: 1290 },
        calm_quiet:  { fast: 1810, calm_quiet:  1310 }
      }
    },
    {
      pairId: 'calm-route-comparison-03',
      origin_label: 'Wiedikon',
      destination_label: 'Sihlfeld',
      metric_averages: {
        fast:        { tree_canopy: 0.21, green_space: 0.24, proximity_to_water: 0.14, noise_exposure: 0.45, accident_risk: 0.30, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.47, green_space: 0.53, proximity_to_water: 0.29, noise_exposure: 0.28, accident_risk: 0.20, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.28, green_space: 0.31, proximity_to_water: 0.17, noise_exposure: 0.17, accident_risk: 0.13, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2410, calm_nature: 1740 },
        calm_quiet:  { fast: 2530, calm_quiet:  1960 }
      }
    },
    {
      pairId: 'calm-route-comparison-04',
      origin_label: 'Wollishofen',
      destination_label: 'Leimbach',
      metric_averages: {
        fast:        { tree_canopy: 0.16, green_space: 0.20, proximity_to_water: 0.42, noise_exposure: 0.44, accident_risk: 0.29, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.39, green_space: 0.46, proximity_to_water: 0.61, noise_exposure: 0.30, accident_risk: 0.21, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.24, green_space: 0.28, proximity_to_water: 0.47, noise_exposure: 0.18, accident_risk: 0.13, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2310, calm_nature: 1650 },
        calm_quiet:  { fast: 2490, calm_quiet:  1980 }
      }
    },
    {
      pairId: 'calm-route-comparison-05',
      origin_label: 'Höngg',
      destination_label: 'Wipkingen',
      metric_averages: {
        fast:        { tree_canopy: 0.23, green_space: 0.27, proximity_to_water: 0.11, noise_exposure: 0.42, accident_risk: 0.28, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.52, green_space: 0.58, proximity_to_water: 0.34, noise_exposure: 0.27, accident_risk: 0.20, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.30, green_space: 0.33, proximity_to_water: 0.16, noise_exposure: 0.16, accident_risk: 0.12, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2890, calm_nature: 2100 },
        calm_quiet:  { fast: 3010, calm_quiet:  2230 }
      }
    },
    {
      pairId: 'calm-route-comparison-06',
      origin_label: 'Seefeld',
      destination_label: 'Riesbach',
      metric_averages: {
        fast:        { tree_canopy: 0.18, green_space: 0.22, proximity_to_water: 0.48, noise_exposure: 0.40, accident_risk: 0.26, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.41, green_space: 0.47, proximity_to_water: 0.64, noise_exposure: 0.27, accident_risk: 0.19, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.25, green_space: 0.29, proximity_to_water: 0.52, noise_exposure: 0.16, accident_risk: 0.12, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 3020, calm_nature: 2150 },
        calm_quiet:  { fast: 3180, calm_quiet:  2200 }
      }
    },
    {
      pairId: 'calm-route-comparison-07',
      origin_label: 'Fluntern',
      destination_label: 'Hirslanden',
      metric_averages: {
        fast:        { tree_canopy: 0.17, green_space: 0.20, proximity_to_water: 0.08, noise_exposure: 0.49, accident_risk: 0.33, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.43, green_space: 0.50, proximity_to_water: 0.27, noise_exposure: 0.32, accident_risk: 0.23, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.27, green_space: 0.31, proximity_to_water: 0.14, noise_exposure: 0.20, accident_risk: 0.15, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2720, calm_nature: 1940 },
        calm_quiet:  { fast: 2840, calm_quiet:  2070 }
      }
    },
    {
      pairId: 'calm-route-comparison-08',
      origin_label: 'Niederdorf',
      destination_label: 'Oberdorf',
      metric_averages: {
        fast:        { tree_canopy: 0.12, green_space: 0.15, proximity_to_water: 0.22, noise_exposure: 0.55, accident_risk: 0.38, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.35, green_space: 0.40, proximity_to_water: 0.44, noise_exposure: 0.37, accident_risk: 0.27, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.19, green_space: 0.23, proximity_to_water: 0.28, noise_exposure: 0.22, accident_risk: 0.16, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 1290, calm_nature:  920 },
        calm_quiet:  { fast: 1350, calm_quiet:   950 }
      }
    },
    {
      pairId: 'calm-route-comparison-09',
      origin_label: 'Albisrieden',
      destination_label: 'Altstetten',
      metric_averages: {
        fast:        { tree_canopy: 0.20, green_space: 0.23, proximity_to_water: 0.10, noise_exposure: 0.46, accident_risk: 0.31, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.45, green_space: 0.51, proximity_to_water: 0.28, noise_exposure: 0.30, accident_risk: 0.22, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.27, green_space: 0.31, proximity_to_water: 0.15, noise_exposure: 0.18, accident_risk: 0.13, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2430, calm_nature: 1750 },
        calm_quiet:  { fast: 2560, calm_quiet:  1790 }
      }
    },
    {
      pairId: 'calm-route-comparison-10',
      origin_label: 'Schwamendingen',
      destination_label: 'Seebach',
      metric_averages: {
        fast:        { tree_canopy: 0.15, green_space: 0.19, proximity_to_water: 0.07, noise_exposure: 0.50, accident_risk: 0.34, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.48, green_space: 0.55, proximity_to_water: 0.31, noise_exposure: 0.31, accident_risk: 0.22, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.29, green_space: 0.34, proximity_to_water: 0.16, noise_exposure: 0.18, accident_risk: 0.13, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 2700, calm_nature: 1920 },
        calm_quiet:  { fast: 2840, calm_quiet:  2210 }
      }
    },
    {
      pairId: 'calm-route-comparison-11',
      origin_label: 'Affoltern',
      destination_label: 'Oerlikon Süd',
      metric_averages: {
        fast:        { tree_canopy: 0.13, green_space: 0.17, proximity_to_water: 0.06, noise_exposure: 0.54, accident_risk: 0.36, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.36, green_space: 0.42, proximity_to_water: 0.19, noise_exposure: 0.36, accident_risk: 0.26, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.22, green_space: 0.25, proximity_to_water: 0.10, noise_exposure: 0.21, accident_risk: 0.15, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 1700, calm_nature: 1210 },
        calm_quiet:  { fast: 1780, calm_quiet:  1400 }
      }
    },
    {
      pairId: 'calm-route-comparison-12',
      origin_label: 'Zürich HB',
      destination_label: 'Langstrasse',
      metric_averages: {
        fast:        { tree_canopy: 0.11, green_space: 0.14, proximity_to_water: 0.18, noise_exposure: 0.58, accident_risk: 0.40, main_road_exposure: null },
        calm_nature: { tree_canopy: 0.11, green_space: 0.14, proximity_to_water: 0.18, noise_exposure: 0.58, accident_risk: 0.40, main_road_exposure: null },
        calm_quiet:  { tree_canopy: 0.22, green_space: 0.27, proximity_to_water: 0.25, noise_exposure: 0.24, accident_risk: 0.17, main_road_exposure: null }
      },
      effective_costs_m: {
        calm_nature: { fast: 1990, calm_nature: 1990 },
        calm_quiet:  { fast: 1980, calm_quiet:  1390 }
      }
    }
  ];

  return { configured_weights, pairs };
});
