/**
 * Interactive SVG Map of Spain's Autonomous Communities
 * For the Embalses (Reservoirs) Dashboard
 *
 * Paths are simplified polygons derived from geographic coordinates of Spain's
 * autonomous community boundaries, projected into a 1000x800 viewBox.
 *
 * Projection: approximate Mercator, lon [-9.8, 4.8] -> x [0, 1000], lat [35.8, 44.0] -> y [800, 0]
 */
(function () {
  'use strict';

  // --- Projection helpers ---
  // Map geographic coords to SVG viewBox [0,0,1000,800]
  var LON_MIN = -9.8, LON_MAX = 4.8;
  var LAT_MIN = 35.8, LAT_MAX = 44.0;

  function lonToX(lon) {
    return ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * 1000;
  }
  function latToY(lat) {
    return ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 800;
  }
  function coordsToPath(coords) {
    return coords.map(function (pt, i) {
      var cmd = i === 0 ? 'M' : 'L';
      return cmd + lonToX(pt[0]).toFixed(1) + ',' + latToY(pt[1]).toFixed(1);
    }).join(' ') + ' Z';
  }

  // --- Simplified boundary coordinates [lon, lat] for each community ---
  // These are approximate but geographically recognizable outlines.
  var REGIONS = {
    'Galicia': {
      coords: [
        [-8.88, 43.72], [-8.33, 43.75], [-7.86, 43.79], [-7.68, 43.73],
        [-7.40, 43.72], [-7.20, 43.56], [-7.02, 43.55], [-7.02, 43.18],
        [-6.82, 43.02], [-6.82, 42.85], [-6.95, 42.68], [-7.05, 42.52],
        [-7.05, 42.35], [-6.85, 42.20], [-7.02, 42.08], [-7.42, 41.87],
        [-7.70, 41.87], [-7.92, 41.87], [-8.15, 41.82], [-8.19, 42.00],
        [-8.82, 41.93], [-8.87, 42.05], [-8.72, 42.14], [-8.85, 42.25],
        [-8.87, 42.44], [-8.72, 42.44], [-8.67, 42.32], [-8.83, 42.19],
        [-8.95, 42.22], [-9.03, 42.10], [-8.95, 42.34], [-9.28, 42.52],
        [-9.00, 42.56], [-8.84, 42.66], [-9.03, 42.79], [-8.92, 42.88],
        [-9.28, 42.87], [-9.26, 43.04], [-9.04, 43.15], [-9.22, 43.23],
        [-9.17, 43.35], [-8.98, 43.35], [-9.00, 43.50], [-8.88, 43.72]
      ],
      labelPos: [-8.2, 42.8]
    },
    'Asturias': {
      coords: [
        [-7.02, 43.55], [-6.72, 43.57], [-6.30, 43.58], [-5.85, 43.60],
        [-5.50, 43.55], [-5.20, 43.50], [-4.90, 43.42], [-4.90, 43.25],
        [-5.02, 43.10], [-5.25, 43.05], [-5.42, 42.98], [-5.68, 42.92],
        [-5.95, 42.92], [-6.25, 42.95], [-6.55, 43.02], [-6.82, 43.02],
        [-7.02, 43.18], [-7.02, 43.55]
      ],
      labelPos: [-5.95, 43.25]
    },
    'Cantabria': {
      coords: [
        [-4.90, 43.42], [-4.50, 43.45], [-4.10, 43.42], [-3.75, 43.42],
        [-3.45, 43.46], [-3.32, 43.40], [-3.32, 43.22], [-3.45, 43.15],
        [-3.48, 43.00], [-3.62, 42.95], [-3.80, 42.92], [-3.95, 42.85],
        [-4.10, 42.85], [-4.30, 42.87], [-4.55, 42.82], [-4.75, 42.90],
        [-4.90, 42.95], [-5.02, 43.10], [-4.90, 43.25], [-4.90, 43.42]
      ],
      labelPos: [-4.05, 43.15]
    },
    'País Vasco': {
      coords: [
        [-3.32, 43.40], [-3.05, 43.38], [-2.72, 43.42], [-2.40, 43.38],
        [-2.00, 43.32], [-1.80, 43.35], [-1.78, 43.18], [-1.92, 43.05],
        [-2.05, 42.95], [-2.15, 42.80], [-2.40, 42.75], [-2.55, 42.82],
        [-2.70, 42.78], [-2.85, 42.82], [-2.95, 42.78], [-3.10, 42.82],
        [-3.25, 42.88], [-3.45, 42.95], [-3.62, 42.95], [-3.48, 43.00],
        [-3.45, 43.15], [-3.32, 43.22], [-3.32, 43.40]
      ],
      labelPos: [-2.65, 43.08]
    },
    'Navarra': {
      coords: [
        [-1.78, 43.18], [-1.80, 43.35], [-1.55, 43.28], [-1.30, 43.10],
        [-1.05, 43.00], [-0.72, 42.95], [-0.72, 42.82], [-0.85, 42.68],
        [-0.82, 42.52], [-0.92, 42.40], [-1.10, 42.35], [-1.20, 42.22],
        [-1.40, 42.12], [-1.60, 42.05], [-1.85, 42.02], [-2.08, 42.02],
        [-2.15, 42.15], [-2.10, 42.32], [-1.92, 42.45], [-1.78, 42.55],
        [-1.80, 42.68], [-1.95, 42.72], [-2.15, 42.80], [-2.05, 42.95],
        [-1.92, 43.05], [-1.78, 43.18]
      ],
      labelPos: [-1.55, 42.72]
    },
    'La Rioja': {
      coords: [
        [-2.95, 42.78], [-2.85, 42.82], [-2.70, 42.78], [-2.55, 42.82],
        [-2.40, 42.75], [-2.15, 42.80], [-1.95, 42.72], [-1.80, 42.68],
        [-1.78, 42.55], [-1.85, 42.40], [-1.92, 42.28], [-2.08, 42.22],
        [-2.30, 42.18], [-2.45, 42.08], [-2.62, 42.02], [-2.82, 42.08],
        [-2.98, 42.15], [-3.12, 42.10], [-3.15, 42.25], [-3.12, 42.38],
        [-2.98, 42.50], [-2.90, 42.62], [-2.95, 42.78]
      ],
      labelPos: [-2.50, 42.42]
    },
    'Aragón': {
      coords: [
        [-0.72, 42.95], [-0.45, 42.82], [-0.15, 42.80], [0.10, 42.72],
        [0.35, 42.70], [0.65, 42.70], [0.72, 42.58], [0.68, 42.42],
        [0.52, 42.22], [0.35, 42.12], [0.18, 42.00], [0.08, 41.85],
        [-0.02, 41.68], [-0.10, 41.42], [-0.08, 41.18], [-0.12, 40.95],
        [-0.22, 40.72], [-0.42, 40.52], [-0.55, 40.35], [-0.60, 40.12],
        [-0.72, 39.88], [-0.85, 39.88], [-1.05, 39.92], [-1.18, 40.02],
        [-1.10, 40.22], [-1.20, 40.38], [-1.22, 40.52], [-1.05, 40.68],
        [-0.95, 40.82], [-1.02, 40.98], [-1.18, 41.08], [-1.30, 41.18],
        [-1.42, 41.28], [-1.62, 41.38], [-1.72, 41.55], [-1.78, 41.72],
        [-1.85, 41.88], [-1.85, 42.02], [-1.60, 42.05], [-1.40, 42.12],
        [-1.20, 42.22], [-1.10, 42.35], [-0.92, 42.40], [-0.82, 42.52],
        [-0.85, 42.68], [-0.72, 42.82], [-0.72, 42.95]
      ],
      labelPos: [-0.65, 41.65]
    },
    'Cataluña': {
      coords: [
        [0.65, 42.70], [0.85, 42.65], [1.15, 42.50], [1.45, 42.45],
        [1.72, 42.50], [2.05, 42.45], [2.40, 42.42], [2.85, 42.45],
        [3.15, 42.42], [3.22, 42.32], [3.18, 42.15], [3.10, 41.98],
        [2.88, 41.72], [2.75, 41.55], [2.52, 41.42], [2.22, 41.32],
        [1.95, 41.18], [1.72, 41.05], [1.42, 40.88], [1.18, 40.78],
        [0.95, 40.72], [0.72, 40.65], [0.55, 40.58], [0.45, 40.55],
        [0.22, 40.62], [0.05, 40.68], [-0.08, 40.78], [-0.12, 40.95],
        [-0.08, 41.18], [-0.10, 41.42], [-0.02, 41.68], [0.08, 41.85],
        [0.18, 42.00], [0.35, 42.12], [0.52, 42.22], [0.68, 42.42],
        [0.72, 42.58], [0.65, 42.70]
      ],
      labelPos: [1.52, 41.72]
    },
    'Castilla y León': {
      coords: [
        [-7.02, 43.18], [-6.82, 43.02], [-6.55, 43.02], [-6.25, 42.95],
        [-5.95, 42.92], [-5.68, 42.92], [-5.42, 42.98], [-5.25, 43.05],
        [-5.02, 43.10], [-4.90, 42.95], [-4.75, 42.90], [-4.55, 42.82],
        [-4.30, 42.87], [-4.10, 42.85], [-3.95, 42.85], [-3.80, 42.92],
        [-3.62, 42.95], [-3.45, 42.95], [-3.25, 42.88], [-3.10, 42.82],
        [-2.95, 42.78], [-2.90, 42.62], [-2.98, 42.50], [-3.12, 42.38],
        [-3.15, 42.25], [-3.12, 42.10], [-2.98, 42.15], [-2.82, 42.08],
        [-2.62, 42.02], [-2.45, 42.08], [-2.30, 42.18], [-2.08, 42.22],
        [-1.92, 42.28], [-1.85, 42.40], [-1.78, 42.55], [-1.92, 42.45],
        [-2.10, 42.32], [-2.15, 42.15], [-2.08, 42.02], [-1.85, 42.02],
        [-1.85, 41.88], [-1.78, 41.72], [-1.72, 41.55], [-1.62, 41.38],
        [-1.42, 41.28], [-1.30, 41.18], [-1.18, 41.08], [-1.02, 40.98],
        [-0.95, 40.82], [-1.05, 40.68], [-1.22, 40.52], [-1.20, 40.38],
        [-1.10, 40.22], [-1.18, 40.02], [-1.38, 40.08], [-1.58, 40.18],
        [-1.88, 40.22], [-2.15, 40.32], [-2.42, 40.35], [-2.65, 40.42],
        [-2.85, 40.42], [-3.05, 40.32], [-3.22, 40.38], [-3.42, 40.42],
        [-3.52, 40.48], [-3.55, 40.58], [-3.68, 40.62], [-3.85, 40.62],
        [-4.02, 40.58], [-4.18, 40.42], [-4.35, 40.32], [-4.55, 40.22],
        [-4.82, 40.12], [-5.02, 40.15], [-5.15, 40.22], [-5.38, 40.25],
        [-5.55, 40.32], [-5.72, 40.25], [-5.88, 40.18], [-6.08, 40.25],
        [-6.32, 40.28], [-6.48, 40.35], [-6.68, 40.38], [-6.72, 40.55],
        [-6.68, 40.72], [-6.55, 40.88], [-6.48, 41.05], [-6.42, 41.22],
        [-6.38, 41.38], [-6.52, 41.48], [-6.68, 41.58], [-6.82, 41.65],
        [-6.88, 41.82], [-6.85, 42.00], [-6.95, 42.08], [-7.02, 42.08],
        [-6.85, 42.20], [-7.05, 42.35], [-7.05, 42.52], [-6.95, 42.68],
        [-6.82, 42.85], [-7.02, 43.18]
      ],
      labelPos: [-4.7, 41.65]
    },
    'Madrid': {
      coords: [
        [-3.52, 40.48], [-3.42, 40.42], [-3.22, 40.38], [-3.05, 40.32],
        [-3.05, 40.22], [-3.18, 40.08], [-3.32, 39.98], [-3.42, 39.88],
        [-3.55, 39.88], [-3.72, 39.92], [-3.88, 40.02], [-3.98, 40.12],
        [-4.02, 40.28], [-4.02, 40.42], [-4.02, 40.58], [-3.85, 40.62],
        [-3.68, 40.62], [-3.55, 40.58], [-3.52, 40.48]
      ],
      labelPos: [-3.55, 40.28]
    },
    'Castilla-La Mancha': {
      coords: [
        [-3.05, 40.32], [-2.85, 40.42], [-2.65, 40.42], [-2.42, 40.35],
        [-2.15, 40.32], [-1.88, 40.22], [-1.58, 40.18], [-1.38, 40.08],
        [-1.18, 40.02], [-1.05, 39.92], [-0.85, 39.88], [-0.72, 39.88],
        [-0.72, 39.72], [-0.85, 39.55], [-1.02, 39.38], [-1.12, 39.22],
        [-1.18, 39.05], [-1.28, 38.88], [-1.38, 38.72], [-1.52, 38.55],
        [-1.62, 38.42], [-1.85, 38.42], [-2.02, 38.52], [-2.22, 38.55],
        [-2.42, 38.52], [-2.62, 38.42], [-2.85, 38.35], [-3.05, 38.40],
        [-3.22, 38.48], [-3.42, 38.58], [-3.55, 38.72], [-3.55, 38.88],
        [-3.52, 39.02], [-3.38, 39.08], [-3.28, 39.22], [-3.22, 39.38],
        [-3.38, 39.45], [-3.55, 39.52], [-3.72, 39.52], [-3.92, 39.48],
        [-4.15, 39.42], [-4.32, 39.48], [-4.55, 39.52], [-4.72, 39.42],
        [-4.88, 39.32], [-4.98, 39.35], [-5.15, 39.42], [-5.18, 39.58],
        [-5.05, 39.72], [-4.88, 39.82], [-4.72, 39.88], [-4.55, 39.88],
        [-4.55, 40.02], [-4.55, 40.22], [-4.35, 40.32], [-4.18, 40.42],
        [-4.02, 40.42], [-4.02, 40.28], [-3.98, 40.12], [-3.88, 40.02],
        [-3.72, 39.92], [-3.55, 39.88], [-3.42, 39.88], [-3.32, 39.98],
        [-3.18, 40.08], [-3.05, 40.22], [-3.05, 40.32]
      ],
      labelPos: [-3.0, 39.45]
    },
    'Comunidad Valenciana': {
      coords: [
        [-0.72, 39.88], [-0.60, 40.12], [-0.55, 40.35], [-0.42, 40.52],
        [-0.22, 40.72], [-0.12, 40.95], [-0.08, 40.78], [0.05, 40.68],
        [0.22, 40.62], [0.45, 40.55], [0.35, 40.38], [0.25, 40.18],
        [0.12, 39.98], [0.02, 39.82], [-0.08, 39.68], [-0.15, 39.52],
        [-0.20, 39.38], [-0.25, 39.22], [-0.18, 39.02], [-0.12, 38.85],
        [-0.22, 38.72], [-0.38, 38.55], [-0.48, 38.38], [-0.55, 38.22],
        [-0.62, 38.08], [-0.72, 37.92], [-0.82, 37.85], [-0.92, 37.88],
        [-1.05, 37.92], [-1.18, 38.02], [-1.22, 38.12], [-1.32, 38.18],
        [-1.42, 38.22], [-1.50, 38.32], [-1.52, 38.42], [-1.62, 38.42],
        [-1.52, 38.55], [-1.38, 38.72], [-1.28, 38.88], [-1.18, 39.05],
        [-1.12, 39.22], [-1.02, 39.38], [-0.85, 39.55], [-0.72, 39.72],
        [-0.72, 39.88]
      ],
      labelPos: [-0.40, 39.35]
    },
    'Extremadura': {
      coords: [
        [-6.68, 40.38], [-6.48, 40.35], [-6.32, 40.28], [-6.08, 40.25],
        [-5.88, 40.18], [-5.72, 40.25], [-5.55, 40.32], [-5.38, 40.25],
        [-5.15, 40.22], [-5.02, 40.15], [-4.82, 40.12], [-4.55, 40.22],
        [-4.55, 40.02], [-4.55, 39.88], [-4.72, 39.88], [-4.88, 39.82],
        [-5.05, 39.72], [-5.18, 39.58], [-5.15, 39.42], [-4.98, 39.35],
        [-4.88, 39.32], [-4.92, 39.18], [-5.05, 39.02], [-5.18, 38.88],
        [-5.32, 38.72], [-5.42, 38.52], [-5.52, 38.38], [-5.65, 38.22],
        [-5.85, 38.15], [-6.05, 38.08], [-6.22, 38.02], [-6.42, 37.95],
        [-6.52, 38.05], [-6.58, 38.18], [-6.48, 38.38], [-6.42, 38.52],
        [-6.52, 38.68], [-6.62, 38.82], [-6.72, 38.95], [-6.88, 39.02],
        [-7.02, 39.12], [-7.18, 39.22], [-7.32, 39.35], [-7.38, 39.48],
        [-7.28, 39.62], [-7.12, 39.72], [-6.98, 39.85], [-6.85, 39.98],
        [-6.75, 40.12], [-6.72, 40.22], [-6.68, 40.38]
      ],
      labelPos: [-5.95, 39.35]
    },
    'Andalucía': {
      coords: [
        [-6.42, 37.95], [-6.22, 38.02], [-6.05, 38.08], [-5.85, 38.15],
        [-5.65, 38.22], [-5.52, 38.38], [-5.42, 38.52], [-5.32, 38.72],
        [-5.18, 38.88], [-5.05, 39.02], [-4.92, 39.18], [-4.88, 39.32],
        [-4.72, 39.42], [-4.55, 39.52], [-4.32, 39.48], [-4.15, 39.42],
        [-3.92, 39.48], [-3.72, 39.52], [-3.55, 39.52], [-3.38, 39.45],
        [-3.22, 39.38], [-3.28, 39.22], [-3.38, 39.08], [-3.52, 39.02],
        [-3.55, 38.88], [-3.55, 38.72], [-3.42, 38.58], [-3.22, 38.48],
        [-3.05, 38.40], [-2.85, 38.35], [-2.62, 38.42], [-2.42, 38.52],
        [-2.22, 38.55], [-2.02, 38.52], [-1.85, 38.42], [-1.62, 38.42],
        [-1.50, 38.32], [-1.42, 38.22], [-1.32, 38.18], [-1.22, 38.12],
        [-1.18, 38.02], [-1.15, 37.88], [-1.25, 37.72], [-1.48, 37.55],
        [-1.62, 37.42], [-1.82, 37.35], [-2.05, 37.25], [-2.35, 37.18],
        [-2.72, 37.08], [-3.02, 36.92], [-3.28, 36.72], [-3.52, 36.68],
        [-3.78, 36.72], [-4.05, 36.72], [-4.35, 36.68], [-4.55, 36.72],
        [-4.78, 36.78], [-5.02, 36.82], [-5.25, 36.88], [-5.35, 36.78],
        [-5.42, 36.62], [-5.52, 36.52], [-5.55, 36.18], [-5.62, 36.02],
        [-5.78, 36.02], [-5.92, 36.08], [-6.02, 36.18], [-6.15, 36.22],
        [-6.38, 36.42], [-6.35, 36.55], [-6.42, 36.72], [-6.52, 36.85],
        [-6.62, 36.92], [-6.72, 36.98], [-6.88, 37.02], [-7.05, 37.02],
        [-7.22, 37.15], [-7.38, 37.18], [-7.42, 37.25], [-7.32, 37.32],
        [-7.22, 37.42], [-7.18, 37.55], [-7.22, 37.68], [-7.12, 37.82],
        [-6.92, 37.88], [-6.72, 37.92], [-6.42, 37.95]
      ],
      labelPos: [-4.2, 37.78]
    },
    'Murcia': {
      coords: [
        [-1.52, 38.42], [-1.50, 38.32], [-1.42, 38.22], [-1.32, 38.18],
        [-1.22, 38.12], [-1.18, 38.02], [-1.05, 37.92], [-0.92, 37.88],
        [-0.82, 37.85], [-0.72, 37.78], [-0.72, 37.65], [-0.78, 37.55],
        [-0.88, 37.58], [-1.02, 37.55], [-1.15, 37.58], [-1.28, 37.55],
        [-1.42, 37.62], [-1.55, 37.68], [-1.62, 37.82], [-1.72, 37.92],
        [-1.82, 38.02], [-1.88, 38.18], [-1.85, 38.35], [-1.85, 38.42],
        [-1.62, 38.42], [-1.52, 38.42]
      ],
      labelPos: [-1.28, 37.98]
    },
    'Islas Baleares': {
      // Mallorca (main island)
      coords: [
        [2.35, 39.92], [2.55, 39.88], [2.78, 39.82], [2.98, 39.72],
        [3.12, 39.62], [3.28, 39.52], [3.42, 39.42], [3.45, 39.32],
        [3.38, 39.22], [3.22, 39.28], [3.05, 39.35], [2.85, 39.42],
        [2.72, 39.48], [2.55, 39.52], [2.42, 39.55], [2.32, 39.62],
        [2.28, 39.72], [2.25, 39.82], [2.35, 39.92]
      ],
      // Menorca
      extraPaths: [
        [
          [3.82, 40.08], [3.95, 40.05], [4.08, 40.00], [4.22, 39.95],
          [4.28, 39.88], [4.15, 39.88], [3.98, 39.92], [3.85, 39.98],
          [3.82, 40.08]
        ],
        // Ibiza
        [
          [1.22, 39.08], [1.35, 39.02], [1.48, 38.92], [1.52, 38.82],
          [1.42, 38.78], [1.28, 38.82], [1.18, 38.92], [1.15, 39.02],
          [1.22, 39.08]
        ]
      ],
      labelPos: [2.85, 39.58]
    }
  };

  // --- Color thresholds ---
  function getFillColor(percent) {
    if (percent >= 80) return '#dbeafe';
    if (percent >= 60) return '#fef3c7';
    if (percent >= 40) return '#fed7aa';
    return '#fee2e2';
  }

  function darkenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // --- Tooltip ---
  function createTooltip() {
    var tip = document.createElement('div');
    tip.id = 'spain-map-tooltip';
    tip.style.cssText = [
      'position:fixed',
      'display:none',
      'background:#1e293b',
      'color:#f8fafc',
      'padding:10px 14px',
      'border-radius:8px',
      'font-size:13px',
      'line-height:1.5',
      'pointer-events:none',
      'z-index:9999',
      'box-shadow:0 4px 12px rgba(0,0,0,0.25)',
      'max-width:260px',
      'font-family:system-ui,-apple-system,sans-serif'
    ].join(';');
    document.body.appendChild(tip);
    return tip;
  }

  function showTooltip(tip, e, data) {
    var changeColor = data.weeklyChange >= 0 ? '#4ade80' : '#f87171';
    var changeSign = data.weeklyChange >= 0 ? '+' : '';
    var changeText = changeSign + data.weeklyChange.toFixed(1) + '%';

    tip.innerHTML =
      '<div style="font-weight:600;font-size:14px;margin-bottom:4px">' + data.name + '</div>' +
      '<div style="font-size:20px;font-weight:700;margin-bottom:4px">' + data.percent.toFixed(1) + '%</div>' +
      '<div style="color:#94a3b8;margin-bottom:4px">' +
        data.stored.toLocaleString('es-ES') + ' / ' + data.capacity.toLocaleString('es-ES') + ' hm\u00B3' +
      '</div>' +
      '<div style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;' +
        'background:' + changeColor + '22;color:' + changeColor + '">' +
        changeText + ' semanal' +
      '</div>';

    tip.style.display = 'block';

    // Position above-right of cursor
    var x = e.clientX + 16;
    var y = e.clientY - tip.offsetHeight - 8;
    // Keep in viewport
    if (x + tip.offsetWidth > window.innerWidth) {
      x = e.clientX - tip.offsetWidth - 16;
    }
    if (y < 0) {
      y = e.clientY + 16;
    }
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  // --- Main render ---
  function render(containerId, regions) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.error('SpainMap: container "' + containerId + '" not found');
      return;
    }

    // Build lookup
    var dataMap = {};
    if (regions && regions.length) {
      regions.forEach(function (r) {
        dataMap[r.name] = r;
      });
    }

    // Create SVG
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 800');
    svg.setAttribute('width', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';

    var tooltip = document.getElementById('spain-map-tooltip') || createTooltip();

    // Draw each region
    Object.keys(REGIONS).forEach(function (name) {
      var region = REGIONS[name];
      var data = dataMap[name] || { name: name, percent: 0, stored: 0, capacity: 0, weeklyChange: 0 };
      var fill = getFillColor(data.percent);

      // Create group for region
      var g = document.createElementNS(svgNS, 'g');
      g.setAttribute('data-name', name);
      g.style.cursor = 'pointer';

      // Main path
      var path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', coordsToPath(region.coords));
      path.setAttribute('fill', fill);
      path.setAttribute('stroke', '#94a3b8');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('data-name', name);
      g.appendChild(path);

      // Extra paths (e.g., Balearic Islands)
      if (region.extraPaths) {
        region.extraPaths.forEach(function (extraCoords) {
          var ep = document.createElementNS(svgNS, 'path');
          ep.setAttribute('d', coordsToPath(extraCoords));
          ep.setAttribute('fill', fill);
          ep.setAttribute('stroke', '#94a3b8');
          ep.setAttribute('stroke-width', '1.5');
          ep.setAttribute('stroke-linejoin', 'round');
          ep.setAttribute('data-name', name);
          g.appendChild(ep);
        });
      }

      // Label
      var labelX = lonToX(region.labelPos[0]);
      var labelY = latToY(region.labelPos[1]);
      var text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', labelX.toFixed(1));
      text.setAttribute('y', labelY.toFixed(1));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('font-size', name === 'Madrid' || name === 'La Rioja' || name === 'Murcia' ? '11' : '13');
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text.setAttribute('fill', '#334155');
      text.setAttribute('pointer-events', 'none');
      text.textContent = data.percent > 0 ? data.percent.toFixed(0) + '%' : '';
      g.appendChild(text);

      // Hover interactions
      var allPaths = g.querySelectorAll('path');

      g.addEventListener('mouseenter', function () {
        for (var i = 0; i < allPaths.length; i++) {
          allPaths[i].setAttribute('fill', darkenColor(fill, 30));
          allPaths[i].setAttribute('stroke-width', '2.5');
          allPaths[i].setAttribute('stroke', '#475569');
        }
      });

      g.addEventListener('mouseleave', function () {
        for (var i = 0; i < allPaths.length; i++) {
          allPaths[i].setAttribute('fill', fill);
          allPaths[i].setAttribute('stroke-width', '1.5');
          allPaths[i].setAttribute('stroke', '#94a3b8');
        }
        tooltip.style.display = 'none';
      });

      g.addEventListener('mousemove', function (e) {
        showTooltip(tooltip, e, data);
      });

      svg.appendChild(g);
    });

    // Clear and insert
    container.innerHTML = '';
    container.appendChild(svg);

    // Add legend
    var legend = document.createElement('div');
    legend.className = 'map-legend';
    var items = [
      { color: '#dbeafe', label: '≥ 80%' },
      { color: '#fef3c7', label: '60 – 79%' },
      { color: '#fed7aa', label: '40 – 59%' },
      { color: '#fee2e2', label: '< 40%' }
    ];
    items.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'map-legend-item';
      el.innerHTML =
        '<div class="map-legend-swatch" style="background:' + item.color + '"></div>' +
        '<span>' + item.label + '</span>';
      legend.appendChild(el);
    });
    container.appendChild(legend);
  }

  // --- Export ---
  window.SpainMap = { render: render };
})();
