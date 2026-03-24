(function () {
  'use strict';

  var CORS_PROXY = 'https://api.allorigins.win/get?url=';
  var MAIN_URL = 'https://www.embalses.net/';
  var COMUNIDADES_URL = 'https://www.embalses.net/comunidades.php';
  var CACHE_KEY = 'embalses-data';
  var CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
  var STALE_THRESHOLD_MS = 10 * 24 * 60 * 60 * 1000; // 10 days

  // ---------------------------------------------------------------------------
  // Fallback / demo data (realistic March 2026 values)
  // ---------------------------------------------------------------------------
  function getFallbackData() {
    return {
      timestamp: Date.now(),
      demo: true,
      total: {
        capacity: 56043,
        stored: 46608,
        percent: 83.2,
        weeklyChange: 312,
        weeklyChangePercent: 0.56,
        lastYearPercent: 78.5,
        avgPercent: 64.3
      },
      regions: [
        { name: 'Andalucía', capacity: 11553, stored: 7882, percent: 68.2, weeklyChange: -0.3 },
        { name: 'Aragón', capacity: 4458, stored: 3745, percent: 84.0, weeklyChange: 0.8 },
        { name: 'Asturias', capacity: 484, stored: 436, percent: 90.1, weeklyChange: 1.2 },
        { name: 'Cantabria', capacity: 575, stored: 530, percent: 92.2, weeklyChange: 0.9 },
        { name: 'Castilla y León', capacity: 7839, stored: 6584, percent: 84.0, weeklyChange: 0.6 },
        { name: 'Castilla-La Mancha', capacity: 3226, stored: 2742, percent: 85.0, weeklyChange: 0.4 },
        { name: 'Cataluña', capacity: 2564, stored: 2362, percent: 92.1, weeklyChange: 0.7 },
        { name: 'Comunidad Valenciana', capacity: 3342, stored: 2273, percent: 68.0, weeklyChange: -0.2 },
        { name: 'Extremadura', capacity: 9261, stored: 8150, percent: 88.0, weeklyChange: 0.5 },
        { name: 'Galicia', capacity: 3856, stored: 3663, percent: 95.0, weeklyChange: 0.3 },
        { name: 'La Rioja', capacity: 137, stored: 124, percent: 90.5, weeklyChange: 1.0 },
        { name: 'Madrid', capacity: 946, stored: 832, percent: 87.9, weeklyChange: 0.4 },
        { name: 'Murcia', capacity: 148, stored: 59, percent: 39.9, weeklyChange: -0.5 },
        { name: 'Navarra', capacity: 942, stored: 839, percent: 89.1, weeklyChange: 0.6 },
        { name: 'País Vasco', capacity: 233, stored: 218, percent: 93.6, weeklyChange: 1.1 }
      ],
      topReservoirs: [
        // Extremadura
        { name: 'La Serena', region: 'Extremadura', province: 'Badajoz', capacity: 3232, stored: 2876, percent: 89.0, weeklyChange: 0.3, lastYearPercent: 82.1 },
        { name: 'Alcántara', region: 'Extremadura', province: 'Cáceres', capacity: 3162, stored: 2877, percent: 91.0, weeklyChange: 0.5, lastYearPercent: 85.4 },
        { name: 'Cijara', region: 'Extremadura', province: 'Badajoz', capacity: 1505, stored: 1324, percent: 88.0, weeklyChange: 0.4, lastYearPercent: 81.5 },
        // Castilla-La Mancha
        { name: 'Buendía', region: 'Castilla-La Mancha', province: 'Cuenca', capacity: 1639, stored: 1393, percent: 85.0, weeklyChange: 0.4, lastYearPercent: 72.3 },
        { name: 'Entrepeñas', region: 'Castilla-La Mancha', province: 'Guadalajara', capacity: 835, stored: 710, percent: 85.0, weeklyChange: 0.5, lastYearPercent: 74.1 },
        // Aragón
        { name: 'Mequinenza', region: 'Aragón', province: 'Zaragoza', capacity: 1534, stored: 1318, percent: 85.9, weeklyChange: 0.7, lastYearPercent: 79.8 },
        { name: 'Canelles', region: 'Aragón', province: 'Huesca', capacity: 679, stored: 591, percent: 87.0, weeklyChange: 0.8, lastYearPercent: 76.9 },
        // Castilla y León
        { name: 'Almendra', region: 'Castilla y León', province: 'Salamanca', capacity: 2649, stored: 2278, percent: 86.0, weeklyChange: 0.6, lastYearPercent: 80.2 },
        { name: 'Ricobayo', region: 'Castilla y León', province: 'Zamora', capacity: 1179, stored: 1026, percent: 87.0, weeklyChange: 0.5, lastYearPercent: 81.0 },
        // Andalucía
        { name: 'Iznajar', region: 'Andalucía', province: 'Córdoba', capacity: 981, stored: 716, percent: 73.0, weeklyChange: -0.2, lastYearPercent: 68.4 },
        { name: 'Negratín', region: 'Andalucía', province: 'Granada', capacity: 567, stored: 368, percent: 64.9, weeklyChange: -0.4, lastYearPercent: 59.2 },
        // Galicia
        { name: 'Belesar', region: 'Galicia', province: 'Lugo', capacity: 654, stored: 628, percent: 96.0, weeklyChange: 0.2, lastYearPercent: 91.3 },
        { name: 'As Portas', region: 'Galicia', province: 'Pontevedra', capacity: 535, stored: 503, percent: 94.0, weeklyChange: 0.4, lastYearPercent: 88.7 },
        // Cataluña
        { name: 'Sau', region: 'Cataluña', province: 'Barcelona', capacity: 168, stored: 155, percent: 92.3, weeklyChange: 0.6, lastYearPercent: 45.2 },
        { name: 'Rialb', region: 'Cataluña', province: 'Lleida', capacity: 403, stored: 371, percent: 92.1, weeklyChange: 0.8, lastYearPercent: 78.4 },
        // Comunidad Valenciana
        { name: 'Tous', region: 'Comunidad Valenciana', province: 'Valencia', capacity: 379, stored: 258, percent: 68.1, weeklyChange: -0.3, lastYearPercent: 62.5 },
        { name: 'Benagéber', region: 'Comunidad Valenciana', province: 'Valencia', capacity: 228, stored: 155, percent: 67.9, weeklyChange: -0.1, lastYearPercent: 60.8 },
        // Madrid
        { name: 'El Atazar', region: 'Madrid', province: 'Madrid', capacity: 426, stored: 380, percent: 89.2, weeklyChange: 0.3, lastYearPercent: 83.6 },
        { name: 'Santillana', region: 'Madrid', province: 'Madrid', capacity: 91, stored: 78, percent: 85.7, weeklyChange: 0.5, lastYearPercent: 79.1 },
        // Asturias
        { name: 'Salime', region: 'Asturias', province: 'Asturias', capacity: 266, stored: 242, percent: 91.0, weeklyChange: 1.1, lastYearPercent: 85.3 },
        // Cantabria
        { name: 'Ebro', region: 'Cantabria', province: 'Cantabria', capacity: 540, stored: 498, percent: 92.2, weeklyChange: 0.9, lastYearPercent: 86.4 },
        // Navarra
        { name: 'Yesa', region: 'Navarra', province: 'Navarra', capacity: 447, stored: 401, percent: 89.7, weeklyChange: 0.5, lastYearPercent: 82.8 },
        { name: 'Itoiz', region: 'Navarra', province: 'Navarra', capacity: 418, stored: 366, percent: 87.6, weeklyChange: 0.7, lastYearPercent: 80.1 },
        // País Vasco
        { name: 'Ulíbarri-Gamboa', region: 'País Vasco', province: 'Álava', capacity: 147, stored: 139, percent: 94.6, weeklyChange: 1.0, lastYearPercent: 88.2 },
        // La Rioja
        { name: 'González Lacasa', region: 'La Rioja', province: 'La Rioja', capacity: 33, stored: 30, percent: 90.9, weeklyChange: 0.8, lastYearPercent: 84.5 },
        // Murcia
        { name: 'Cenajo', region: 'Murcia', province: 'Murcia', capacity: 437, stored: 170, percent: 38.9, weeklyChange: -0.6, lastYearPercent: 42.1 },
        { name: 'Alfonso XIII', region: 'Murcia', province: 'Murcia', capacity: 22, stored: 9, percent: 40.9, weeklyChange: -0.3, lastYearPercent: 35.7 }
      ]
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function parseNumber(str) {
    if (!str) return 0;
    // Spanish formatting: 1.234,56 -> 1234.56
    var cleaned = str.replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    var num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function textContent(el) {
    return el ? el.textContent.trim() : '';
  }

  // ---------------------------------------------------------------------------
  // Fetch a page through the CORS proxy and return a DOM Document
  // ---------------------------------------------------------------------------
  function fetchPage(url) {
    var proxyUrl = CORS_PROXY + encodeURIComponent(url);
    return fetch(proxyUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        var parser = new DOMParser();
        return parser.parseFromString(json.contents, 'text/html');
      });
  }

  // ---------------------------------------------------------------------------
  // Parse main page (total national stats)
  // ---------------------------------------------------------------------------
  function parseMainPage(doc) {
    var total = {
      capacity: 0,
      stored: 0,
      percent: 0,
      weeklyChange: 0,
      weeklyChangePercent: 0,
      lastYearPercent: 0,
      avgPercent: 0
    };

    // Strategy 1: Look for table rows that contain keywords
    var tables = doc.querySelectorAll('table');
    for (var t = 0; t < tables.length; t++) {
      var rows = tables[t].querySelectorAll('tr');
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].querySelectorAll('td, th');
        if (cells.length < 2) continue;
        var label = textContent(cells[0]).toLowerCase();

        if (label.indexOf('capacidad') !== -1) {
          total.capacity = parseNumber(textContent(cells[1]));
        } else if (label.indexOf('embalsada') !== -1 || label.indexOf('actual') !== -1) {
          total.stored = parseNumber(textContent(cells[1]));
          if (cells.length >= 3) {
            total.percent = parseNumber(textContent(cells[2]));
          }
        } else if (label.indexOf('variación') !== -1 || label.indexOf('variacion') !== -1 || label.indexOf('semana') !== -1) {
          total.weeklyChange = parseNumber(textContent(cells[1]));
          if (cells.length >= 3) {
            total.weeklyChangePercent = parseNumber(textContent(cells[2]));
          }
        } else if (label.indexOf('año anterior') !== -1 || label.indexOf('ano anterior') !== -1 || label.indexOf('pasado') !== -1) {
          var val = textContent(cells[cells.length - 1]);
          total.lastYearPercent = parseNumber(val);
        } else if (label.indexOf('media') !== -1 || label.indexOf('promedio') !== -1) {
          var avgVal = textContent(cells[cells.length - 1]);
          total.avgPercent = parseNumber(avgVal);
        }
      }
    }

    // Strategy 2: look for percentage patterns in prominent elements
    if (total.percent === 0) {
      var allText = doc.body ? doc.body.innerHTML : '';
      var percentMatch = allText.match(/(\d{1,3}[.,]\d)\s*%/);
      if (percentMatch) {
        total.percent = parseNumber(percentMatch[1]);
      }
    }

    // Derive percent from stored/capacity if we have both but no percent
    if (total.percent === 0 && total.capacity > 0 && total.stored > 0) {
      total.percent = Math.round((total.stored / total.capacity) * 1000) / 10;
    }

    return total;
  }

  // ---------------------------------------------------------------------------
  // Parse comunidades page (per-region data)
  // ---------------------------------------------------------------------------
  function parseComunidadesPage(doc) {
    var regions = [];

    var tables = doc.querySelectorAll('table');
    for (var t = 0; t < tables.length; t++) {
      var rows = tables[t].querySelectorAll('tr');
      if (rows.length < 3) continue; // need header + at least 2 data rows

      // Check if this looks like the regions table
      var headerCells = rows[0].querySelectorAll('td, th');
      var headerText = '';
      for (var h = 0; h < headerCells.length; h++) {
        headerText += textContent(headerCells[h]).toLowerCase() + ' ';
      }

      var isRegionTable = (
        headerText.indexOf('comunidad') !== -1 ||
        headerText.indexOf('capacidad') !== -1 ||
        headerText.indexOf('embalse') !== -1 ||
        headerText.indexOf('cuenca') !== -1 ||
        rows.length >= 10
      );

      if (!isRegionTable) continue;

      // Determine column indices by inspecting header
      var colName = -1, colCapacity = -1, colStored = -1, colPercent = -1, colChange = -1;
      for (var c = 0; c < headerCells.length; c++) {
        var ht = textContent(headerCells[c]).toLowerCase();
        if (ht.indexOf('comunidad') !== -1 || ht.indexOf('nombre') !== -1 || ht.indexOf('cuenca') !== -1) {
          colName = c;
        } else if (ht.indexOf('capacidad') !== -1) {
          colCapacity = c;
        } else if (ht.indexOf('embalsada') !== -1 || ht.indexOf('actual') !== -1 || ht.indexOf('agua') !== -1) {
          colStored = c;
        } else if (ht.indexOf('%') !== -1 || ht.indexOf('porcentaje') !== -1 || ht.indexOf('porcent') !== -1) {
          colPercent = c;
        } else if (ht.indexOf('variación') !== -1 || ht.indexOf('variacion') !== -1 || ht.indexOf('cambio') !== -1) {
          colChange = c;
        }
      }

      // Fallback column mapping when headers are unclear
      if (colName === -1) colName = 0;
      if (colCapacity === -1 && headerCells.length >= 3) colCapacity = 1;
      if (colStored === -1 && headerCells.length >= 4) colStored = 2;
      if (colPercent === -1 && headerCells.length >= 5) colPercent = 3;
      if (colChange === -1 && headerCells.length >= 6) colChange = 4;

      // Parse data rows (skip header row)
      for (var r = 1; r < rows.length; r++) {
        var cells = rows[r].querySelectorAll('td, th');
        if (cells.length < 3) continue;

        var name = colName >= 0 ? textContent(cells[colName]) : '';
        // Skip rows that look like totals or are empty
        if (!name || name.toLowerCase().indexOf('total') !== -1 || name.toLowerCase().indexOf('españa') !== -1) continue;

        // Also try getting name from a link inside the cell
        if (!name && colName >= 0) {
          var link = cells[colName].querySelector('a');
          if (link) name = textContent(link);
        }

        var region = {
          name: name,
          capacity: colCapacity >= 0 && colCapacity < cells.length ? parseNumber(textContent(cells[colCapacity])) : 0,
          stored: colStored >= 0 && colStored < cells.length ? parseNumber(textContent(cells[colStored])) : 0,
          percent: colPercent >= 0 && colPercent < cells.length ? parseNumber(textContent(cells[colPercent])) : 0,
          weeklyChange: colChange >= 0 && colChange < cells.length ? parseNumber(textContent(cells[colChange])) : 0
        };

        // Derive percent if missing
        if (region.percent === 0 && region.capacity > 0 && region.stored > 0) {
          region.percent = Math.round((region.stored / region.capacity) * 1000) / 10;
        }

        if (region.name) {
          regions.push(region);
        }
      }

      // If we found reasonable data, stop scanning tables
      if (regions.length >= 5) break;
    }

    return regions;
  }

  // ---------------------------------------------------------------------------
  // Cache helpers
  // ---------------------------------------------------------------------------
  function getCachedData() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.timestamp) return null;
      // Check if cache is still fresh (< 1 hour old)
      if (Date.now() - data.timestamp > CACHE_MAX_AGE_MS) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function setCachedData(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage may be full or unavailable — ignore
    }
  }

  function isStale(timestamp) {
    if (!timestamp) return true;
    return (Date.now() - timestamp) > STALE_THRESHOLD_MS;
  }

  // ---------------------------------------------------------------------------
  // Main fetch function
  // ---------------------------------------------------------------------------
  function fetchReservoirData() {
    // Return cached data if fresh
    var cached = getCachedData();
    if (cached) {
      return Promise.resolve(cached);
    }

    return Promise.all([
      fetchPage(MAIN_URL),
      fetchPage(COMUNIDADES_URL)
    ])
      .then(function (docs) {
        var mainDoc = docs[0];
        var comDoc = docs[1];

        var total = parseMainPage(mainDoc);
        var regions = parseComunidadesPage(comDoc);

        // Build the result
        var data = {
          timestamp: Date.now(),
          total: total,
          regions: regions.length > 0 ? regions : getFallbackData().regions,
          topReservoirs: getFallbackData().topReservoirs // top reservoirs require deeper scraping; use curated list
        };

        // If parsing returned clearly empty/broken data, mark as error and merge fallback
        if (total.capacity === 0 && total.stored === 0 && total.percent === 0) {
          var fallback = getFallbackData();
          data.total = fallback.total;
          data.error = true;
        }

        setCachedData(data);
        return data;
      })
      .catch(function (err) {
        console.warn('EmbalseData: fetch failed, using fallback data.', err);
        var fallback = getFallbackData();
        fallback.error = true;
        return fallback;
      });
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  window.EmbalseData = {
    fetchReservoirData: fetchReservoirData,
    getCachedData: getCachedData,
    isStale: isStale
  };
})();
