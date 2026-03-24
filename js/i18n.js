/* ------------------------------------------------------------------ */
/*  i18n.js – Internationalization module for Embalses de España       */
/* ------------------------------------------------------------------ */
(function () {
  'use strict';

  var STORAGE_KEY = 'embalses-lang';
  var DEFAULT_LANG = 'es';

  var translations = {
    es: {
      skipLink:           'Saltar al contenido',
      tabMain:            'Principal',
      tabRegion:          'Por Región',
      tabMap:             'Mapa',
      pageTitle:          'Panel de Embalses',
      pageDesc:           'Estado actual de los embalses de España',
      staleAlert:         'Los datos no se actualizan desde hace más de 10 días.',
      sectionRegions:     'Comunidades Autónomas',
      sectionReservoirs:  'Embalses Principales',
      footerData:         'Datos:',
      footerMinistry:     'Ministerio para la Transición Ecológica',
      kpiWaterStored:     'Agua embalsada',
      kpiVsLastYear:      'vs Año Anterior',
      kpiVsAverage:       'vs Media 10 Años',
      kpiCritical:        'Regiones Críticas',
      kpiWeekly:          'semanal',
      ofCapacity:         'de {0} hm³ capacidad total',
      inYear:             'en {0}',
      historicAvg:        'media histórica',
      regionCount:        '{0} regiones',
      topCount:           'Los {0} más grandes',
      stored:             'Embalsada',
      weekly:             'Semanal',
      vsLastYear:         'vs {0}',
      full:               'lleno',
      loading:            'Cargando datos...',
      errorFetch:         'No se pudieron cargar los datos en vivo. Mostrando datos de ejemplo.',
      demoMode:           'Modo demo — datos de ejemplo',
      updated:            'Actualizado',
      regionDetailTitle:  'Embalses de {0}',
      backToList:         '← Volver',
      sortBy:             'Ordenar por',
      sortPercent:        '% Llenado',
      sortVolume:         'Volumen',
      sortName:           'Nombre',
      sortChange:         'Cambio',
      sectionHistory:     'Evolución Histórica',
      historyRange:       'Desde 1990'
    },
    en: {
      skipLink:           'Skip to content',
      tabMain:            'Overview',
      tabRegion:          'By Region',
      tabMap:             'Map',
      pageTitle:          'Reservoir Dashboard',
      pageDesc:           'Current status of Spain\'s reservoirs',
      staleAlert:         'Data has not been updated for more than 10 days.',
      sectionRegions:     'Autonomous Communities',
      sectionReservoirs:  'Top Reservoirs',
      footerData:         'Data:',
      footerMinistry:     'Ministry for Ecological Transition',
      kpiWaterStored:     'Water stored',
      kpiVsLastYear:      'vs Last Year',
      kpiVsAverage:       'vs 10-Year Average',
      kpiCritical:        'Critical Regions',
      kpiWeekly:          'weekly',
      ofCapacity:         'of {0} hm³ total capacity',
      inYear:             'in {0}',
      historicAvg:        'historic average',
      regionCount:        '{0} regions',
      topCount:           'Top {0} largest',
      stored:             'Stored',
      weekly:             'Weekly',
      vsLastYear:         'vs {0}',
      full:               'full',
      loading:            'Loading data...',
      errorFetch:         'Could not load live data. Showing sample data.',
      demoMode:           'Demo mode — sample data',
      updated:            'Updated',
      regionDetailTitle:  'Reservoirs in {0}',
      backToList:         '← Back',
      sortBy:             'Sort by',
      sortPercent:        '% Full',
      sortVolume:         'Volume',
      sortName:           'Name',
      sortChange:         'Change',
      sectionHistory:     'Historical Trend',
      historyRange:       'Since 1990'
    }
  };

  /* Current language */
  var currentLang = DEFAULT_LANG;

  /* ---- Public API ------------------------------------------------ */

  /**
   * Retrieve a translated string, replacing {0}, {1}, … placeholders
   * with the supplied arguments.
   */
  function t(key) {
    var dict = translations[currentLang] || translations[DEFAULT_LANG];
    var str  = dict[key];
    if (str === undefined) {
      return key;               // fallback: return key itself
    }
    for (var i = 1; i < arguments.length; i++) {
      str = str.replace('{' + (i - 1) + '}', arguments[i]);
    }
    return str;
  }

  /**
   * Change the active language, persist the choice and refresh the DOM.
   */
  function setLang(lang) {
    if (!translations[lang]) {
      return;                   // unsupported language — do nothing
    }
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) { /* localStorage may be unavailable */ }
    applyTranslations();
  }

  /**
   * Return the current language code ('es' or 'en').
   */
  function getLang() {
    return currentLang;
  }

  /**
   * Walk the DOM and set textContent for every element carrying a
   * data-i18n attribute whose value matches a translation key.
   */
  function applyTranslations() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var key = elements[i].getAttribute('data-i18n');
      var dict = translations[currentLang] || translations[DEFAULT_LANG];
      if (dict[key] !== undefined) {
        elements[i].textContent = dict[key];
      }
    }
  }

  /* ---- Initialise on load ---------------------------------------- */
  function init() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) {
        currentLang = saved;
      }
    } catch (_) { /* localStorage may be unavailable */ }
    applyTranslations();
  }

  /* Run init when the DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---- Export ----------------------------------------------------- */
  window.I18n = {
    t:                  t,
    setLang:            setLang,
    getLang:            getLang,
    applyTranslations:  applyTranslations
  };
})();
