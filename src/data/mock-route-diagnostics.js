(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.AriCalmBenchmarkDiagnostics = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Generated from route diagnostics exports (rounds 1-21, 23, 25).
  // Labels reverse-geocoded from route endpoints; metric averages are 0-5 scale.
  return {
  "configured_weights": {
    "tree_canopy": {
      "fast": 0,
      "calm_nature": 0.9,
      "calm_quiet": 0.2,
      "direction": "reward",
      "label": "Tree canopy"
    },
    "green_space": {
      "fast": 0,
      "calm_nature": 0.9,
      "calm_quiet": 0.2,
      "direction": "reward",
      "label": "Green space"
    },
    "proximity_to_water": {
      "fast": 0,
      "calm_nature": 0.9,
      "calm_quiet": 0.2,
      "direction": "reward",
      "label": "Proximity to water"
    },
    "noise_exposure": {
      "fast": 0,
      "calm_nature": 0.2,
      "calm_quiet": 0.9,
      "direction": "penalty",
      "label": "Noise exposure"
    },
    "main_road_exposure": {
      "fast": 0,
      "calm_nature": 0.2,
      "calm_quiet": 0.9,
      "direction": "penalty",
      "label": "Main-road exposure"
    },
    "accident_risk": {
      "fast": 0,
      "calm_nature": 0,
      "calm_quiet": 0.9,
      "direction": "penalty",
      "label": "Accident risk"
    }
  },
  "pairs": [
    {
      "pairId": "calm-route-comparison-01",
      "origin_label": "Oerlikon",
      "destination_label": "Oberstrass",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.78,
          "lights": 2.92,
          "water": 0,
          "green": 0.36,
          "accident": 2.39,
          "crime": 0.12,
          "noise": 2.35,
          "presence": 0.2
        },
        "calm_quiet": {
          "tree_coverage": 3.21,
          "lights": 2.77,
          "water": 1.06,
          "green": 1.1,
          "accident": 1.09,
          "crime": 0.11,
          "noise": 1.51,
          "presence": 0.29
        },
        "calm_nature": {
          "tree_coverage": 3.79,
          "lights": 2.86,
          "water": 0.55,
          "green": 0.38,
          "accident": 2.23,
          "crime": 0.22,
          "noise": 1.94,
          "presence": 0.16
        }
      }
    },
    {
      "pairId": "calm-route-comparison-02",
      "origin_label": "Unterstrass",
      "destination_label": "Gewerbeschule",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.59,
          "lights": 4.3,
          "water": 1.09,
          "green": 1.31,
          "accident": 3.25,
          "crime": 0.07,
          "noise": 2.78,
          "presence": 0.28
        },
        "calm_quiet": {
          "tree_coverage": 2.52,
          "lights": 4.11,
          "water": 1.02,
          "green": 1.89,
          "accident": 2.57,
          "crime": 0.19,
          "noise": 2.48,
          "presence": 0.24
        },
        "calm_nature": {
          "tree_coverage": 3.7,
          "lights": 4.2,
          "water": 3.45,
          "green": 2.35,
          "accident": 2.98,
          "crime": 1,
          "noise": 3.3,
          "presence": 1.2
        }
      }
    },
    {
      "pairId": "calm-route-comparison-03",
      "origin_label": "Unterstrass",
      "destination_label": "Rathaus",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.28,
          "lights": 4.11,
          "water": 0,
          "green": 1.3,
          "accident": 3.69,
          "crime": 0.28,
          "noise": 2.12,
          "presence": 2.1
        },
        "calm_quiet": {
          "tree_coverage": 2.19,
          "lights": 3.73,
          "water": 0.16,
          "green": 0.92,
          "accident": 2.16,
          "crime": 0.2,
          "noise": 1.33,
          "presence": 0.76
        },
        "calm_nature": {
          "tree_coverage": 3.72,
          "lights": 4.49,
          "water": 2.12,
          "green": 2.39,
          "accident": 3.29,
          "crime": 0.85,
          "noise": 1.7,
          "presence": 1.66
        }
      }
    },
    {
      "pairId": "calm-route-comparison-04",
      "origin_label": "Albisrieden",
      "destination_label": "Sihlfeld",
      "metric_averages": {
        "fast": {
          "tree_coverage": 4.55,
          "lights": 4.06,
          "water": 0.03,
          "green": 1.68,
          "accident": 2.13,
          "crime": 0.05,
          "noise": 1.6,
          "presence": 1.64
        },
        "calm_quiet": {
          "tree_coverage": 4.64,
          "lights": 2.57,
          "water": 0,
          "green": 2.85,
          "accident": 0.87,
          "crime": 0,
          "noise": 1.02,
          "presence": 0.48
        },
        "calm_nature": {
          "tree_coverage": 4.53,
          "lights": 3.95,
          "water": 0.21,
          "green": 2.79,
          "accident": 1.99,
          "crime": 1.01,
          "noise": 2.36,
          "presence": 1.6
        }
      }
    },
    {
      "pairId": "calm-route-comparison-05",
      "origin_label": "H\u00f6ngg",
      "destination_label": "Werdwies",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.71,
          "lights": 3.92,
          "water": 0.51,
          "green": 1.77,
          "accident": 1.89,
          "crime": 0.48,
          "noise": 2.07,
          "presence": 1.65
        },
        "calm_quiet": {
          "tree_coverage": 3.57,
          "lights": 4.1,
          "water": 0.95,
          "green": 3.32,
          "accident": 1.32,
          "crime": 0.33,
          "noise": 1.01,
          "presence": 1.13
        },
        "calm_nature": {
          "tree_coverage": 3.83,
          "lights": 3.97,
          "water": 1.32,
          "green": 3.7,
          "accident": 1.64,
          "crime": 0.49,
          "noise": 1.11,
          "presence": 0.69
        }
      }
    },
    {
      "pairId": "calm-route-comparison-06",
      "origin_label": "Oberstrass",
      "destination_label": "Fluntern",
      "metric_averages": {
        "fast": {
          "tree_coverage": 1.36,
          "lights": 1.67,
          "water": 0.3,
          "green": 1,
          "accident": 0.68,
          "crime": 0,
          "noise": 0.36,
          "presence": 1.1
        },
        "calm_quiet": {
          "tree_coverage": 1.33,
          "lights": 1.64,
          "water": 0.29,
          "green": 1.5,
          "accident": 0.42,
          "crime": 0,
          "noise": 0.34,
          "presence": 0.82
        },
        "calm_nature": {
          "tree_coverage": 1.44,
          "lights": 1.96,
          "water": 0.15,
          "green": 1.75,
          "accident": 0.68,
          "crime": 0,
          "noise": 0.42,
          "presence": 1.14
        }
      }
    },
    {
      "pairId": "calm-route-comparison-07",
      "origin_label": "Seefeld",
      "destination_label": "Hottingen",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.2,
          "lights": 3.95,
          "water": 2.35,
          "green": 3.01,
          "accident": 2.55,
          "crime": 0.74,
          "noise": 3.02,
          "presence": 0.4
        },
        "calm_quiet": {
          "tree_coverage": 3.39,
          "lights": 3.42,
          "water": 0.43,
          "green": 1.64,
          "accident": 2.29,
          "crime": 0.33,
          "noise": 2.42,
          "presence": 0.91
        },
        "calm_nature": {
          "tree_coverage": 3.41,
          "lights": 3.97,
          "water": 2.34,
          "green": 2.99,
          "accident": 2.61,
          "crime": 0.74,
          "noise": 3.01,
          "presence": 0.31
        }
      }
    },
    {
      "pairId": "calm-route-comparison-08",
      "origin_label": "Enge",
      "destination_label": "Werd",
      "metric_averages": {
        "fast": {
          "tree_coverage": 4.5,
          "lights": 4.69,
          "water": 0.83,
          "green": 1.89,
          "accident": 3.77,
          "crime": 0.52,
          "noise": 3.84,
          "presence": 1.56
        },
        "calm_quiet": {
          "tree_coverage": 4.24,
          "lights": 3.85,
          "water": 3.06,
          "green": 2.44,
          "accident": 2.22,
          "crime": 0.56,
          "noise": 2.27,
          "presence": 0
        },
        "calm_nature": {
          "tree_coverage": 4.35,
          "lights": 4.12,
          "water": 3.35,
          "green": 2.5,
          "accident": 2.22,
          "crime": 0.38,
          "noise": 2.3,
          "presence": 0
        }
      }
    },
    {
      "pairId": "calm-route-comparison-09",
      "origin_label": "City",
      "destination_label": "Hottingen",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.08,
          "lights": 4.45,
          "water": 1.62,
          "green": 1.52,
          "accident": 3.57,
          "crime": 1.37,
          "noise": 3.16,
          "presence": 0.84
        },
        "calm_quiet": {
          "tree_coverage": 2.05,
          "lights": 4.48,
          "water": 1.08,
          "green": 1.49,
          "accident": 3.22,
          "crime": 0.58,
          "noise": 2.1,
          "presence": 0
        },
        "calm_nature": {
          "tree_coverage": 3.74,
          "lights": 4.59,
          "water": 2.22,
          "green": 2.45,
          "accident": 3.55,
          "crime": 1.15,
          "noise": 2.42,
          "presence": 0.81
        }
      }
    },
    {
      "pairId": "calm-route-comparison-10",
      "origin_label": "M\u00fchlebach",
      "destination_label": "Lindenhof",
      "metric_averages": {
        "fast": {
          "tree_coverage": 1.92,
          "lights": 4.36,
          "water": 0.89,
          "green": 0.77,
          "accident": 3.53,
          "crime": 0.56,
          "noise": 3.36,
          "presence": 2.14
        },
        "calm_quiet": {
          "tree_coverage": 1.59,
          "lights": 3.94,
          "water": 0.75,
          "green": 0.75,
          "accident": 2.23,
          "crime": 0.96,
          "noise": 1.89,
          "presence": 0.21
        },
        "calm_nature": {
          "tree_coverage": 3.85,
          "lights": 4.45,
          "water": 2.78,
          "green": 2.17,
          "accident": 3.87,
          "crime": 0.21,
          "noise": 2.78,
          "presence": 0.71
        }
      }
    },
    {
      "pairId": "calm-route-comparison-11",
      "origin_label": "Lindenhof",
      "destination_label": "Langstrasse",
      "metric_averages": {
        "fast": {
          "tree_coverage": 1.3,
          "lights": 4.01,
          "water": 0.52,
          "green": 0.53,
          "accident": 2.99,
          "crime": 2.36,
          "noise": 2.01,
          "presence": 0.74
        },
        "calm_quiet": {
          "tree_coverage": 0.81,
          "lights": 3.24,
          "water": 1.73,
          "green": 1.06,
          "accident": 1.93,
          "crime": 0.53,
          "noise": 0.76,
          "presence": 1.33
        },
        "calm_nature": {
          "tree_coverage": 2.89,
          "lights": 4.23,
          "water": 0.49,
          "green": 1.28,
          "accident": 2.88,
          "crime": 1.02,
          "noise": 1.76,
          "presence": 0.88
        }
      }
    },
    {
      "pairId": "calm-route-comparison-12",
      "origin_label": "Hard",
      "destination_label": "Wipkingen",
      "metric_averages": {
        "fast": {
          "tree_coverage": 1.57,
          "lights": 4.57,
          "water": 0.45,
          "green": 0.01,
          "accident": 3.87,
          "crime": 0.52,
          "noise": 3.32,
          "presence": 3.68
        },
        "calm_quiet": {
          "tree_coverage": 2.3,
          "lights": 3.91,
          "water": 0.34,
          "green": 1.18,
          "accident": 2.46,
          "crime": 0.78,
          "noise": 2.49,
          "presence": 1.3
        },
        "calm_nature": {
          "tree_coverage": 1.57,
          "lights": 4.57,
          "water": 0.45,
          "green": 0.01,
          "accident": 3.87,
          "crime": 0.52,
          "noise": 3.32,
          "presence": 3.68
        }
      }
    },
    {
      "pairId": "calm-route-comparison-13",
      "origin_label": "Langstrasse",
      "destination_label": "Wipkingen",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.81,
          "lights": 4.25,
          "water": 0.31,
          "green": 0.14,
          "accident": 3.59,
          "crime": 1.36,
          "noise": 2.29,
          "presence": 1.86
        },
        "calm_quiet": {
          "tree_coverage": 2.85,
          "lights": 4.1,
          "water": 1.09,
          "green": 1.1,
          "accident": 3.27,
          "crime": 1.49,
          "noise": 2.42,
          "presence": 0.99
        },
        "calm_nature": {
          "tree_coverage": 2.94,
          "lights": 3.97,
          "water": 1.11,
          "green": 1.13,
          "accident": 3.31,
          "crime": 1.3,
          "noise": 2.35,
          "presence": 1.05
        }
      }
    },
    {
      "pairId": "calm-route-comparison-14",
      "origin_label": "Albisrieden",
      "destination_label": "Escher Wyss",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.94,
          "lights": 4.13,
          "water": 0,
          "green": 1.14,
          "accident": 3.44,
          "crime": 2.58,
          "noise": 3.2,
          "presence": 1.85
        },
        "calm_quiet": {
          "tree_coverage": 2.9,
          "lights": 3.93,
          "water": 0,
          "green": 1.49,
          "accident": 2.2,
          "crime": 1.49,
          "noise": 2.62,
          "presence": 1.47
        },
        "calm_nature": {
          "tree_coverage": 3.58,
          "lights": 4.26,
          "water": 0,
          "green": 1.73,
          "accident": 3.03,
          "crime": 1.21,
          "noise": 3.09,
          "presence": 2.7
        }
      }
    },
    {
      "pairId": "calm-route-comparison-15",
      "origin_label": "Unterstrass",
      "destination_label": "Unterstrass",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.62,
          "lights": 4.12,
          "water": 0.63,
          "green": 1.81,
          "accident": 3.87,
          "crime": 1.35,
          "noise": 3.19,
          "presence": 0.3
        },
        "calm_quiet": {
          "tree_coverage": 4.05,
          "lights": 3.07,
          "water": 0.65,
          "green": 2.05,
          "accident": 2.05,
          "crime": 0.65,
          "noise": 1.93,
          "presence": 1.52
        },
        "calm_nature": {
          "tree_coverage": 3.62,
          "lights": 4.12,
          "water": 0.63,
          "green": 1.81,
          "accident": 3.87,
          "crime": 1.35,
          "noise": 3.19,
          "presence": 0.3
        }
      }
    },
    {
      "pairId": "calm-route-comparison-16",
      "origin_label": "Alt-Wiedikon",
      "destination_label": "Enge",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.2,
          "lights": 4.09,
          "water": 0.39,
          "green": 1.8,
          "accident": 2.79,
          "crime": 0.33,
          "noise": 2.46,
          "presence": 0
        },
        "calm_quiet": {
          "tree_coverage": 3.86,
          "lights": 3.91,
          "water": 1.44,
          "green": 2.92,
          "accident": 1.95,
          "crime": 0,
          "noise": 1.86,
          "presence": 0.55
        },
        "calm_nature": {
          "tree_coverage": 4.05,
          "lights": 3.78,
          "water": 1.52,
          "green": 3.34,
          "accident": 2.22,
          "crime": 0,
          "noise": 1.99,
          "presence": 0.59
        }
      }
    },
    {
      "pairId": "calm-route-comparison-17",
      "origin_label": "Sihlfeld",
      "destination_label": "Langstrasse",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.24,
          "lights": 3.89,
          "water": 0,
          "green": 0.78,
          "accident": 3.94,
          "crime": 1.12,
          "noise": 3.05,
          "presence": 0.81
        },
        "calm_quiet": {
          "tree_coverage": 3.41,
          "lights": 3.84,
          "water": 0,
          "green": 1.68,
          "accident": 3.48,
          "crime": 0.5,
          "noise": 2.56,
          "presence": 0.72
        },
        "calm_nature": {
          "tree_coverage": 2.86,
          "lights": 3.78,
          "water": 0,
          "green": 1.36,
          "accident": 3.88,
          "crime": 0.78,
          "noise": 3.21,
          "presence": 1.6
        }
      }
    },
    {
      "pairId": "calm-route-comparison-18",
      "origin_label": "Sihlfeld",
      "destination_label": "Friesenberg",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.41,
          "lights": 3.67,
          "water": 0.78,
          "green": 1.54,
          "accident": 2.42,
          "crime": 1.38,
          "noise": 2.65,
          "presence": 2.31
        },
        "calm_quiet": {
          "tree_coverage": 3,
          "lights": 3,
          "water": 2.91,
          "green": 1.93,
          "accident": 1.49,
          "crime": 0.84,
          "noise": 1.83,
          "presence": 1.85
        },
        "calm_nature": {
          "tree_coverage": 3.33,
          "lights": 3.52,
          "water": 0.77,
          "green": 2.07,
          "accident": 2.41,
          "crime": 1.37,
          "noise": 2.63,
          "presence": 2.31
        }
      }
    },
    {
      "pairId": "calm-route-comparison-19",
      "origin_label": "Hard",
      "destination_label": "Escher Wyss",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.13,
          "lights": 4.19,
          "water": 0,
          "green": 1.14,
          "accident": 3.27,
          "crime": 0.2,
          "noise": 3.65,
          "presence": 2.01
        },
        "calm_quiet": {
          "tree_coverage": 3.04,
          "lights": 3.8,
          "water": 0,
          "green": 2.58,
          "accident": 2.02,
          "crime": 0,
          "noise": 2.67,
          "presence": 2.43
        },
        "calm_nature": {
          "tree_coverage": 2.61,
          "lights": 3.76,
          "water": 0,
          "green": 2.58,
          "accident": 2.33,
          "crime": 0,
          "noise": 3.23,
          "presence": 2.36
        }
      }
    },
    {
      "pairId": "calm-route-comparison-20",
      "origin_label": "Enge",
      "destination_label": "City",
      "metric_averages": {
        "fast": {
          "tree_coverage": 3.82,
          "lights": 4.49,
          "water": 0.32,
          "green": 0.91,
          "accident": 3.72,
          "crime": 1.79,
          "noise": 3.32,
          "presence": 0.25
        },
        "calm_quiet": {
          "tree_coverage": 3.15,
          "lights": 4.36,
          "water": 0.4,
          "green": 0.88,
          "accident": 3.18,
          "crime": 1.66,
          "noise": 2.38,
          "presence": 0.22
        },
        "calm_nature": {
          "tree_coverage": 4.25,
          "lights": 4.58,
          "water": 0.44,
          "green": 0.95,
          "accident": 3.4,
          "crime": 2.35,
          "noise": 2.58,
          "presence": 0.24
        }
      }
    },
    {
      "pairId": "calm-route-comparison-21",
      "origin_label": "Wipkingen",
      "destination_label": "H\u00f6ngg",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.95,
          "lights": 2.88,
          "water": 0.79,
          "green": 1,
          "accident": 1.12,
          "crime": 0.02,
          "noise": 0.93,
          "presence": 1.01
        },
        "calm_quiet": {
          "tree_coverage": 2.95,
          "lights": 2.88,
          "water": 0.79,
          "green": 1,
          "accident": 1.12,
          "crime": 0.02,
          "noise": 0.93,
          "presence": 1.01
        },
        "calm_nature": {
          "tree_coverage": 4.23,
          "lights": 3.69,
          "water": 1.35,
          "green": 2.78,
          "accident": 1.48,
          "crime": 0.32,
          "noise": 0.8,
          "presence": 1.16
        }
      }
    },
    {
      "pairId": "calm-route-comparison-22",
      "origin_label": "Hottingen",
      "destination_label": "Fluntern",
      "metric_averages": {
        "fast": {
          "tree_coverage": 1.36,
          "lights": 3.91,
          "water": 0.17,
          "green": 0.97,
          "accident": 2.26,
          "crime": 0,
          "noise": 2.04,
          "presence": 0.55
        },
        "calm_quiet": {
          "tree_coverage": 2.12,
          "lights": 3.8,
          "water": 0.29,
          "green": 0.63,
          "accident": 1.52,
          "crime": 0,
          "noise": 1.06,
          "presence": 0.2
        },
        "calm_nature": {
          "tree_coverage": 1.46,
          "lights": 3.96,
          "water": 0.17,
          "green": 1.09,
          "accident": 2.23,
          "crime": 0,
          "noise": 2,
          "presence": 0.54
        }
      }
    },
    {
      "pairId": "calm-route-comparison-23",
      "origin_label": "Oberstrass",
      "destination_label": "Wipkingen",
      "metric_averages": {
        "fast": {
          "tree_coverage": 2.87,
          "lights": 3.58,
          "water": 0,
          "green": 1.69,
          "accident": 1.59,
          "crime": 0,
          "noise": 1.6,
          "presence": 0.53
        },
        "calm_quiet": {
          "tree_coverage": 2.99,
          "lights": 3.63,
          "water": 0,
          "green": 0.07,
          "accident": 1.58,
          "crime": 0,
          "noise": 1.29,
          "presence": 0.84
        },
        "calm_nature": {
          "tree_coverage": 3.07,
          "lights": 3.56,
          "water": 0,
          "green": 1.68,
          "accident": 1.74,
          "crime": 0,
          "noise": 1.64,
          "presence": 0.53
        }
      }
    }
  ]
};
});
