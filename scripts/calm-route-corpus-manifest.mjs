export const CALM_ROUTE_CORPUS_VERSION = 'calm-curated-v2';

export const CALM_ROUTE_CORPUS = [
  [1, 'Oerlikon', 'Oberstrass'],
  [2, 'Unterstrass', 'Gewerbeschule'],
  [3, 'Unterstrass', 'Rathaus'],
  [4, 'Albisrieden', 'Sihlfeld'],
  [5, 'Höngg', 'Werdwies'],
  [6, 'Oberstrass', 'Fluntern'],
  [7, 'Seefeld', 'Hottingen'],
  [8, 'Enge', 'Werd'],
  [9, 'City', 'Hottingen'],
  [10, 'Mühlebach', 'Lindenhof'],
  [11, 'Lindenhof', 'Langstrasse'],
  [12, 'Hard', 'Wipkingen'],
  [13, 'Langstrasse', 'Wipkingen'],
  [14, 'Albisrieden', 'Escher Wyss'],
  [15, 'Unterstrass', 'Unterstrass'],
  [16, 'Alt-Wiedikon', 'Enge'],
  [17, 'Sihlfeld', 'Langstrasse'],
  [18, 'Sihlfeld', 'Friesenberg'],
  [19, 'Hard', 'Escher Wyss'],
  [20, 'Enge', 'City'],
  [21, 'Wipkingen', 'Höngg'],
  [23, 'Hottingen', 'Fluntern'],
  [25, 'Oberstrass', 'Wipkingen']
].map(([sourceRound, originLabel, destinationLabel], index) => ({
  pairNumber: index + 1,
  sourceRound,
  originLabel,
  destinationLabel,
  geoJsonFile: `round${sourceRound}-v2.geojson`,
  diagnosticsFile: `round${sourceRound}-v2-diagnostics.json`
}));
