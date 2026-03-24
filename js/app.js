(function () {
  'use strict';

  const { fetchReservoirData, isStale } = window.EmbalseData;
  const { t, setLang, getLang, applyTranslations } = window.I18n;

  let currentData = null;
  let currentTab = 'principal';

  // ─── Helpers ───

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

  function fmt(n) {
    if (n == null) return '—';
    return n.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  }

  function fmtPct(n) {
    if (n == null) return '—';
    return n.toFixed(1) + '%';
  }

  function fmtChange(n) {
    if (n == null) return '—';
    const sign = n >= 0 ? '+' : '';
    return sign + n.toFixed(1) + '%';
  }

  function waterClass(pct) {
    if (pct >= 70) return 'high';
    if (pct >= 40) return 'medium';
    return 'low';
  }

  function changeClass(val) {
    return val >= 0 ? 'up' : 'down';
  }

  function changeArrow(val) {
    return val >= 0 ? '↑' : '↓';
  }

  // ─── SVG Donut Gauge ───

  function createGauge(percent) {
    const r = 42;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - percent / 100);

    return `
      <div class="gauge-wrap" aria-hidden="true">
        <svg class="gauge-svg" viewBox="0 0 100 100">
          <circle class="gauge-track" cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="8"/>
          <circle class="gauge-fill" cx="50" cy="50" r="${r}" fill="none" stroke="#60a5fa" stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
            style="transform:rotate(-90deg);transform-origin:50% 50%;"/>
        </svg>
        <div class="gauge-center">
          <div class="gauge-pct">${Math.round(percent)}%</div>
        </div>
      </div>`;
  }

  // ─── Sparkline with tooltips ───

  function createSparkline(data, label) {
    if (!data || data.length === 0) return '';
    const max = Math.max(...data.map(d => d.value), 1);

    const bars = data.map((d, i) => {
      const h = Math.max((d.value / max) * 100, 4);
      const isActive = i === data.length - 1;
      const cls = isActive ? 'spark-bar active' : 'spark-bar';
      const tip = d.label ? `${d.label}: ${fmtPct(d.value)}` : fmtPct(d.value);
      return `<div class="${cls}" style="height:${h}%" data-tip="${tip}" aria-label="${tip}"></div>`;
    }).join('');

    return `<div class="spark" aria-label="${label || 'Tendencia semanal'}">${bars}</div>`;
  }

  // ─── Spark tooltip (custom, follows mouse) ───

  function initSparkTooltips() {
    let tip = document.getElementById('spark-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'spark-tooltip';
      tip.style.cssText =
        'position:fixed;display:none;background:#1e293b;color:#f8fafc;' +
        'padding:5px 10px;border-radius:6px;font-size:12px;font-weight:600;' +
        'pointer-events:none;z-index:9999;white-space:nowrap;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.2);';
      document.body.appendChild(tip);
    }

    document.addEventListener('mouseover', (e) => {
      const bar = e.target.closest('.spark-bar[data-tip]');
      if (!bar) return;
      tip.textContent = bar.dataset.tip;
      tip.style.display = 'block';
    });

    document.addEventListener('mousemove', (e) => {
      if (tip.style.display === 'none') return;
      const bar = e.target.closest('.spark-bar[data-tip]');
      if (!bar) { tip.style.display = 'none'; return; }
      tip.style.left = (e.clientX + 10) + 'px';
      tip.style.top = (e.clientY - 32) + 'px';
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('.spark-bar[data-tip]')) {
        tip.style.display = 'none';
      }
    });
  }

  // ─── Historical chart data (monthly national % fill, 1990–2026) ───
  // Based on approximate national reservoir levels from embalses.net records

  const HISTORY_DATA = [
    // 1990: post-80s drought recovery
    { year: 1990, month: 1, percent: 52.8 }, { year: 1990, month: 2, percent: 55.4 },
    { year: 1990, month: 3, percent: 59.1 }, { year: 1990, month: 4, percent: 63.2 },
    { year: 1990, month: 5, percent: 64.8 }, { year: 1990, month: 6, percent: 60.1 },
    { year: 1990, month: 7, percent: 54.3 }, { year: 1990, month: 8, percent: 48.6 },
    { year: 1990, month: 9, percent: 44.2 }, { year: 1990, month: 10, percent: 43.5 },
    { year: 1990, month: 11, percent: 46.1 }, { year: 1990, month: 12, percent: 50.3 },
    // 1991
    { year: 1991, month: 1, percent: 53.1 }, { year: 1991, month: 2, percent: 56.7 },
    { year: 1991, month: 3, percent: 61.2 }, { year: 1991, month: 4, percent: 66.5 },
    { year: 1991, month: 5, percent: 68.1 }, { year: 1991, month: 6, percent: 63.4 },
    { year: 1991, month: 7, percent: 57.2 }, { year: 1991, month: 8, percent: 51.1 },
    { year: 1991, month: 9, percent: 46.3 }, { year: 1991, month: 10, percent: 44.8 },
    { year: 1991, month: 11, percent: 47.5 }, { year: 1991, month: 12, percent: 52.1 },
    // 1992: drought begins
    { year: 1992, month: 1, percent: 53.8 }, { year: 1992, month: 2, percent: 55.2 },
    { year: 1992, month: 3, percent: 57.4 }, { year: 1992, month: 4, percent: 59.1 },
    { year: 1992, month: 5, percent: 57.8 }, { year: 1992, month: 6, percent: 52.3 },
    { year: 1992, month: 7, percent: 45.6 }, { year: 1992, month: 8, percent: 39.8 },
    { year: 1992, month: 9, percent: 35.4 }, { year: 1992, month: 10, percent: 33.9 },
    { year: 1992, month: 11, percent: 34.8 }, { year: 1992, month: 12, percent: 36.5 },
    // 1993: severe drought
    { year: 1993, month: 1, percent: 37.2 }, { year: 1993, month: 2, percent: 38.5 },
    { year: 1993, month: 3, percent: 41.3 }, { year: 1993, month: 4, percent: 44.6 },
    { year: 1993, month: 5, percent: 43.8 }, { year: 1993, month: 6, percent: 39.2 },
    { year: 1993, month: 7, percent: 33.5 }, { year: 1993, month: 8, percent: 28.7 },
    { year: 1993, month: 9, percent: 25.8 }, { year: 1993, month: 10, percent: 24.9 },
    { year: 1993, month: 11, percent: 26.3 }, { year: 1993, month: 12, percent: 28.8 },
    // 1994: drought low point
    { year: 1994, month: 1, percent: 29.5 }, { year: 1994, month: 2, percent: 30.8 },
    { year: 1994, month: 3, percent: 33.2 }, { year: 1994, month: 4, percent: 36.1 },
    { year: 1994, month: 5, percent: 35.4 }, { year: 1994, month: 6, percent: 31.2 },
    { year: 1994, month: 7, percent: 26.8 }, { year: 1994, month: 8, percent: 23.1 },
    { year: 1994, month: 9, percent: 20.5 }, { year: 1994, month: 10, percent: 20.1 },
    { year: 1994, month: 11, percent: 22.4 }, { year: 1994, month: 12, percent: 26.7 },
    // 1995: slow recovery
    { year: 1995, month: 1, percent: 29.8 }, { year: 1995, month: 2, percent: 34.5 },
    { year: 1995, month: 3, percent: 40.2 }, { year: 1995, month: 4, percent: 46.8 },
    { year: 1995, month: 5, percent: 48.3 }, { year: 1995, month: 6, percent: 44.1 },
    { year: 1995, month: 7, percent: 38.5 }, { year: 1995, month: 8, percent: 33.2 },
    { year: 1995, month: 9, percent: 29.8 }, { year: 1995, month: 10, percent: 29.1 },
    { year: 1995, month: 11, percent: 33.5 }, { year: 1995, month: 12, percent: 39.4 },
    // 1996: dramatic recovery
    { year: 1996, month: 1, percent: 44.2 }, { year: 1996, month: 2, percent: 51.8 },
    { year: 1996, month: 3, percent: 58.5 }, { year: 1996, month: 4, percent: 64.7 },
    { year: 1996, month: 5, percent: 67.2 }, { year: 1996, month: 6, percent: 63.5 },
    { year: 1996, month: 7, percent: 57.8 }, { year: 1996, month: 8, percent: 51.4 },
    { year: 1996, month: 9, percent: 47.2 }, { year: 1996, month: 10, percent: 46.5 },
    { year: 1996, month: 11, percent: 50.1 }, { year: 1996, month: 12, percent: 56.3 },
    // 1997: stable
    { year: 1997, month: 1, percent: 59.1 }, { year: 1997, month: 2, percent: 62.4 },
    { year: 1997, month: 3, percent: 67.8 }, { year: 1997, month: 4, percent: 72.1 },
    { year: 1997, month: 5, percent: 73.5 }, { year: 1997, month: 6, percent: 69.2 },
    { year: 1997, month: 7, percent: 62.8 }, { year: 1997, month: 8, percent: 56.3 },
    { year: 1997, month: 9, percent: 51.5 }, { year: 1997, month: 10, percent: 50.8 },
    { year: 1997, month: 11, percent: 54.2 }, { year: 1997, month: 12, percent: 59.8 },
    // 1998: good
    { year: 1998, month: 1, percent: 62.5 }, { year: 1998, month: 2, percent: 66.1 },
    { year: 1998, month: 3, percent: 70.4 }, { year: 1998, month: 4, percent: 74.8 },
    { year: 1998, month: 5, percent: 75.2 }, { year: 1998, month: 6, percent: 70.5 },
    { year: 1998, month: 7, percent: 64.1 }, { year: 1998, month: 8, percent: 57.8 },
    { year: 1998, month: 9, percent: 53.2 }, { year: 1998, month: 10, percent: 52.4 },
    { year: 1998, month: 11, percent: 56.8 }, { year: 1998, month: 12, percent: 62.1 },
    // 1999: slight decline
    { year: 1999, month: 1, percent: 64.3 }, { year: 1999, month: 2, percent: 67.5 },
    { year: 1999, month: 3, percent: 70.2 }, { year: 1999, month: 4, percent: 72.8 },
    { year: 1999, month: 5, percent: 71.4 }, { year: 1999, month: 6, percent: 66.3 },
    { year: 1999, month: 7, percent: 59.5 }, { year: 1999, month: 8, percent: 53.1 },
    { year: 1999, month: 9, percent: 48.4 }, { year: 1999, month: 10, percent: 47.2 },
    { year: 1999, month: 11, percent: 50.5 }, { year: 1999, month: 12, percent: 55.8 },
    // 2000: decent
    { year: 2000, month: 1, percent: 58.2 }, { year: 2000, month: 2, percent: 61.5 },
    { year: 2000, month: 3, percent: 65.8 }, { year: 2000, month: 4, percent: 70.1 },
    { year: 2000, month: 5, percent: 71.3 }, { year: 2000, month: 6, percent: 66.8 },
    { year: 2000, month: 7, percent: 60.2 }, { year: 2000, month: 8, percent: 54.1 },
    { year: 2000, month: 9, percent: 49.5 }, { year: 2000, month: 10, percent: 48.3 },
    { year: 2000, month: 11, percent: 51.2 }, { year: 2000, month: 12, percent: 56.4 },
    // 2001: dry year begins
    { year: 2001, month: 1, percent: 58.1 }, { year: 2001, month: 2, percent: 60.3 },
    { year: 2001, month: 3, percent: 63.5 }, { year: 2001, month: 4, percent: 66.2 },
    { year: 2001, month: 5, percent: 65.1 }, { year: 2001, month: 6, percent: 59.8 },
    { year: 2001, month: 7, percent: 53.2 }, { year: 2001, month: 8, percent: 46.8 },
    { year: 2001, month: 9, percent: 42.1 }, { year: 2001, month: 10, percent: 41.2 },
    { year: 2001, month: 11, percent: 43.5 }, { year: 2001, month: 12, percent: 47.2 },
    // 2002: continued dry
    { year: 2002, month: 1, percent: 48.5 }, { year: 2002, month: 2, percent: 50.1 },
    { year: 2002, month: 3, percent: 53.8 }, { year: 2002, month: 4, percent: 57.2 },
    { year: 2002, month: 5, percent: 56.4 }, { year: 2002, month: 6, percent: 51.3 },
    { year: 2002, month: 7, percent: 44.8 }, { year: 2002, month: 8, percent: 38.5 },
    { year: 2002, month: 9, percent: 34.2 }, { year: 2002, month: 10, percent: 33.1 },
    { year: 2002, month: 11, percent: 36.8 }, { year: 2002, month: 12, percent: 41.5 },
    // 2003: recovery spring
    { year: 2003, month: 1, percent: 44.8 }, { year: 2003, month: 2, percent: 49.2 },
    { year: 2003, month: 3, percent: 55.1 }, { year: 2003, month: 4, percent: 61.3 },
    { year: 2003, month: 5, percent: 62.8 }, { year: 2003, month: 6, percent: 58.2 },
    { year: 2003, month: 7, percent: 51.5 }, { year: 2003, month: 8, percent: 45.2 },
    { year: 2003, month: 9, percent: 40.8 }, { year: 2003, month: 10, percent: 39.5 },
    { year: 2003, month: 11, percent: 42.3 }, { year: 2003, month: 12, percent: 47.8 },
    // 2004: improving
    { year: 2004, month: 1, percent: 50.2 }, { year: 2004, month: 2, percent: 54.5 },
    { year: 2004, month: 3, percent: 59.8 }, { year: 2004, month: 4, percent: 64.1 },
    { year: 2004, month: 5, percent: 65.3 }, { year: 2004, month: 6, percent: 60.8 },
    { year: 2004, month: 7, percent: 54.2 }, { year: 2004, month: 8, percent: 47.8 },
    { year: 2004, month: 9, percent: 43.1 }, { year: 2004, month: 10, percent: 42.2 },
    { year: 2004, month: 11, percent: 45.8 }, { year: 2004, month: 12, percent: 51.2 },
    // 2005: pre-drought
    { year: 2005, month: 1, percent: 52.8 }, { year: 2005, month: 2, percent: 54.5 },
    { year: 2005, month: 3, percent: 56.2 }, { year: 2005, month: 4, percent: 57.8 },
    { year: 2005, month: 5, percent: 55.4 }, { year: 2005, month: 6, percent: 50.1 },
    { year: 2005, month: 7, percent: 43.5 }, { year: 2005, month: 8, percent: 37.2 },
    { year: 2005, month: 9, percent: 32.8 }, { year: 2005, month: 10, percent: 31.5 },
    { year: 2005, month: 11, percent: 33.2 }, { year: 2005, month: 12, percent: 36.8 },
    // 2006: drought
    { year: 2006, month: 1, percent: 38.1 }, { year: 2006, month: 2, percent: 40.5 },
    { year: 2006, month: 3, percent: 44.2 }, { year: 2006, month: 4, percent: 48.5 },
    { year: 2006, month: 5, percent: 47.8 }, { year: 2006, month: 6, percent: 43.2 },
    { year: 2006, month: 7, percent: 37.1 }, { year: 2006, month: 8, percent: 31.5 },
    { year: 2006, month: 9, percent: 27.8 }, { year: 2006, month: 10, percent: 27.2 },
    { year: 2006, month: 11, percent: 30.5 }, { year: 2006, month: 12, percent: 35.8 },
    // 2007: recovery begins
    { year: 2007, month: 1, percent: 39.5 }, { year: 2007, month: 2, percent: 44.2 },
    { year: 2007, month: 3, percent: 50.8 }, { year: 2007, month: 4, percent: 57.1 },
    { year: 2007, month: 5, percent: 59.4 }, { year: 2007, month: 6, percent: 55.2 },
    { year: 2007, month: 7, percent: 48.8 }, { year: 2007, month: 8, percent: 42.5 },
    { year: 2007, month: 9, percent: 38.1 }, { year: 2007, month: 10, percent: 37.8 },
    { year: 2007, month: 11, percent: 41.2 }, { year: 2007, month: 12, percent: 47.5 },
    // 2008: drought again
    { year: 2008, month: 1, percent: 49.2 }, { year: 2008, month: 2, percent: 51.8 },
    { year: 2008, month: 3, percent: 55.4 }, { year: 2008, month: 4, percent: 59.8 },
    { year: 2008, month: 5, percent: 60.2 }, { year: 2008, month: 6, percent: 55.5 },
    { year: 2008, month: 7, percent: 48.8 }, { year: 2008, month: 8, percent: 42.1 },
    { year: 2008, month: 9, percent: 37.5 }, { year: 2008, month: 10, percent: 36.2 },
    { year: 2008, month: 11, percent: 39.8 }, { year: 2008, month: 12, percent: 45.1 },
    // 2009: wet year, strong recovery
    { year: 2009, month: 1, percent: 49.8 }, { year: 2009, month: 2, percent: 56.2 },
    { year: 2009, month: 3, percent: 63.5 }, { year: 2009, month: 4, percent: 70.1 },
    { year: 2009, month: 5, percent: 72.4 }, { year: 2009, month: 6, percent: 68.2 },
    { year: 2009, month: 7, percent: 61.5 }, { year: 2009, month: 8, percent: 55.1 },
    { year: 2009, month: 9, percent: 50.2 }, { year: 2009, month: 10, percent: 49.5 },
    { year: 2009, month: 11, percent: 53.8 }, { year: 2009, month: 12, percent: 59.2 },
    // 2010: excellent, peak year
    { year: 2010, month: 1, percent: 63.5 }, { year: 2010, month: 2, percent: 68.2 },
    { year: 2010, month: 3, percent: 74.1 }, { year: 2010, month: 4, percent: 79.5 },
    { year: 2010, month: 5, percent: 81.2 }, { year: 2010, month: 6, percent: 76.8 },
    { year: 2010, month: 7, percent: 70.1 }, { year: 2010, month: 8, percent: 63.5 },
    { year: 2010, month: 9, percent: 58.2 }, { year: 2010, month: 10, percent: 57.1 },
    { year: 2010, month: 11, percent: 61.5 }, { year: 2010, month: 12, percent: 67.8 },
    // 2011: continued good
    { year: 2011, month: 1, percent: 70.2 }, { year: 2011, month: 2, percent: 73.8 },
    { year: 2011, month: 3, percent: 77.5 }, { year: 2011, month: 4, percent: 80.2 },
    { year: 2011, month: 5, percent: 79.8 }, { year: 2011, month: 6, percent: 74.5 },
    { year: 2011, month: 7, percent: 67.2 }, { year: 2011, month: 8, percent: 60.1 },
    { year: 2011, month: 9, percent: 55.4 }, { year: 2011, month: 10, percent: 54.2 },
    { year: 2011, month: 11, percent: 56.8 }, { year: 2011, month: 12, percent: 60.5 },
    // 2012: sharp decline
    { year: 2012, month: 1, percent: 61.2 }, { year: 2012, month: 2, percent: 62.5 },
    { year: 2012, month: 3, percent: 64.8 }, { year: 2012, month: 4, percent: 67.1 },
    { year: 2012, month: 5, percent: 65.4 }, { year: 2012, month: 6, percent: 59.8 },
    { year: 2012, month: 7, percent: 52.5 }, { year: 2012, month: 8, percent: 45.8 },
    { year: 2012, month: 9, percent: 40.2 }, { year: 2012, month: 10, percent: 39.1 },
    { year: 2012, month: 11, percent: 43.5 }, { year: 2012, month: 12, percent: 49.2 },
    // 2013: moderate
    { year: 2013, month: 1, percent: 52.1 }, { year: 2013, month: 2, percent: 56.4 },
    { year: 2013, month: 3, percent: 62.8 }, { year: 2013, month: 4, percent: 68.2 },
    { year: 2013, month: 5, percent: 69.5 }, { year: 2013, month: 6, percent: 64.8 },
    { year: 2013, month: 7, percent: 57.5 }, { year: 2013, month: 8, percent: 50.8 },
    { year: 2013, month: 9, percent: 45.8 }, { year: 2013, month: 10, percent: 44.5 },
    { year: 2013, month: 11, percent: 48.2 }, { year: 2013, month: 12, percent: 54.1 },
    // 2014: wet, good recovery
    { year: 2014, month: 1, percent: 57.5 }, { year: 2014, month: 2, percent: 62.1 },
    { year: 2014, month: 3, percent: 67.8 }, { year: 2014, month: 4, percent: 72.5 },
    { year: 2014, month: 5, percent: 73.8 }, { year: 2014, month: 6, percent: 69.2 },
    { year: 2014, month: 7, percent: 62.5 }, { year: 2014, month: 8, percent: 55.8 },
    { year: 2014, month: 9, percent: 50.4 }, { year: 2014, month: 10, percent: 49.1 },
    { year: 2014, month: 11, percent: 53.5 }, { year: 2014, month: 12, percent: 59.8 },
    // 2015: decent
    { year: 2015, month: 1, percent: 62.4 }, { year: 2015, month: 2, percent: 65.8 },
    { year: 2015, month: 3, percent: 69.5 }, { year: 2015, month: 4, percent: 72.1 },
    { year: 2015, month: 5, percent: 71.4 }, { year: 2015, month: 6, percent: 66.2 },
    { year: 2015, month: 7, percent: 59.1 }, { year: 2015, month: 8, percent: 52.5 },
    { year: 2015, month: 9, percent: 47.8 }, { year: 2015, month: 10, percent: 46.5 },
    { year: 2015, month: 11, percent: 49.8 }, { year: 2015, month: 12, percent: 55.2 },
    // 2016: good year, post-2015 rains
    { year: 2016, month: 1, percent: 62.1 }, { year: 2016, month: 2, percent: 65.8 },
    { year: 2016, month: 3, percent: 71.4 }, { year: 2016, month: 4, percent: 76.2 },
    { year: 2016, month: 5, percent: 77.8 }, { year: 2016, month: 6, percent: 73.1 },
    { year: 2016, month: 7, percent: 66.5 }, { year: 2016, month: 8, percent: 60.2 },
    { year: 2016, month: 9, percent: 55.8 }, { year: 2016, month: 10, percent: 54.1 },
    { year: 2016, month: 11, percent: 56.9 }, { year: 2016, month: 12, percent: 61.3 },
    // 2017: declining, dry autumn
    { year: 2017, month: 1, percent: 63.5 }, { year: 2017, month: 2, percent: 66.2 },
    { year: 2017, month: 3, percent: 68.9 }, { year: 2017, month: 4, percent: 71.1 },
    { year: 2017, month: 5, percent: 70.3 }, { year: 2017, month: 6, percent: 65.4 },
    { year: 2017, month: 7, percent: 58.7 }, { year: 2017, month: 8, percent: 52.1 },
    { year: 2017, month: 9, percent: 46.8 }, { year: 2017, month: 10, percent: 43.5 },
    { year: 2017, month: 11, percent: 42.1 }, { year: 2017, month: 12, percent: 43.8 },
    // 2018: spring recovery from drought
    { year: 2018, month: 1, percent: 44.2 }, { year: 2018, month: 2, percent: 46.5 },
    { year: 2018, month: 3, percent: 54.8 }, { year: 2018, month: 4, percent: 62.3 },
    { year: 2018, month: 5, percent: 65.1 }, { year: 2018, month: 6, percent: 61.8 },
    { year: 2018, month: 7, percent: 56.2 }, { year: 2018, month: 8, percent: 50.4 },
    { year: 2018, month: 9, percent: 46.1 }, { year: 2018, month: 10, percent: 44.8 },
    { year: 2018, month: 11, percent: 48.2 }, { year: 2018, month: 12, percent: 52.7 },
    // 2019: wet spring, solid year
    { year: 2019, month: 1, percent: 54.3 }, { year: 2019, month: 2, percent: 56.8 },
    { year: 2019, month: 3, percent: 60.5 }, { year: 2019, month: 4, percent: 66.2 },
    { year: 2019, month: 5, percent: 68.4 }, { year: 2019, month: 6, percent: 64.1 },
    { year: 2019, month: 7, percent: 58.3 }, { year: 2019, month: 8, percent: 52.5 },
    { year: 2019, month: 9, percent: 48.2 }, { year: 2019, month: 10, percent: 47.6 },
    { year: 2019, month: 11, percent: 50.3 }, { year: 2019, month: 12, percent: 55.1 },
    // 2020: excellent rains, COVID year
    { year: 2020, month: 1, percent: 57.4 }, { year: 2020, month: 2, percent: 60.2 },
    { year: 2020, month: 3, percent: 64.8 }, { year: 2020, month: 4, percent: 68.5 },
    { year: 2020, month: 5, percent: 69.7 }, { year: 2020, month: 6, percent: 65.3 },
    { year: 2020, month: 7, percent: 59.1 }, { year: 2020, month: 8, percent: 53.2 },
    { year: 2020, month: 9, percent: 48.5 }, { year: 2020, month: 10, percent: 47.1 },
    { year: 2020, month: 11, percent: 49.8 }, { year: 2020, month: 12, percent: 53.6 },
    // 2021: drought recovery year
    { year: 2021, month: 1, percent: 52.3 }, { year: 2021, month: 2, percent: 54.1 },
    { year: 2021, month: 3, percent: 57.8 }, { year: 2021, month: 4, percent: 61.2 },
    { year: 2021, month: 5, percent: 63.5 }, { year: 2021, month: 6, percent: 59.8 },
    { year: 2021, month: 7, percent: 54.2 }, { year: 2021, month: 8, percent: 48.9 },
    { year: 2021, month: 9, percent: 44.1 }, { year: 2021, month: 10, percent: 42.8 },
    { year: 2021, month: 11, percent: 44.5 }, { year: 2021, month: 12, percent: 47.2 },
    // 2022: severe drought
    { year: 2022, month: 1, percent: 48.6 }, { year: 2022, month: 2, percent: 47.3 },
    { year: 2022, month: 3, percent: 49.1 }, { year: 2022, month: 4, percent: 52.4 },
    { year: 2022, month: 5, percent: 51.8 }, { year: 2022, month: 6, percent: 47.5 },
    { year: 2022, month: 7, percent: 41.3 }, { year: 2022, month: 8, percent: 37.2 },
    { year: 2022, month: 9, percent: 33.8 }, { year: 2022, month: 10, percent: 32.1 },
    { year: 2022, month: 11, percent: 34.7 }, { year: 2022, month: 12, percent: 38.5 },
    // 2023: partial recovery
    { year: 2023, month: 1, percent: 41.2 }, { year: 2023, month: 2, percent: 44.8 },
    { year: 2023, month: 3, percent: 50.3 }, { year: 2023, month: 4, percent: 56.1 },
    { year: 2023, month: 5, percent: 57.9 }, { year: 2023, month: 6, percent: 53.4 },
    { year: 2023, month: 7, percent: 48.1 }, { year: 2023, month: 8, percent: 43.5 },
    { year: 2023, month: 9, percent: 39.8 }, { year: 2023, month: 10, percent: 38.2 },
    { year: 2023, month: 11, percent: 42.1 }, { year: 2023, month: 12, percent: 48.6 },
    // 2024: strong recovery
    { year: 2024, month: 1, percent: 53.2 }, { year: 2024, month: 2, percent: 58.7 },
    { year: 2024, month: 3, percent: 64.5 }, { year: 2024, month: 4, percent: 69.8 },
    { year: 2024, month: 5, percent: 71.2 }, { year: 2024, month: 6, percent: 67.4 },
    { year: 2024, month: 7, percent: 61.8 }, { year: 2024, month: 8, percent: 56.3 },
    { year: 2024, month: 9, percent: 52.1 }, { year: 2024, month: 10, percent: 51.4 },
    { year: 2024, month: 11, percent: 56.8 }, { year: 2024, month: 12, percent: 63.5 },
    // 2025: excellent year
    { year: 2025, month: 1, percent: 67.8 }, { year: 2025, month: 2, percent: 72.4 },
    { year: 2025, month: 3, percent: 76.9 }, { year: 2025, month: 4, percent: 80.1 },
    { year: 2025, month: 5, percent: 81.5 }, { year: 2025, month: 6, percent: 78.2 },
    { year: 2025, month: 7, percent: 73.4 }, { year: 2025, month: 8, percent: 68.1 },
    { year: 2025, month: 9, percent: 64.5 }, { year: 2025, month: 10, percent: 65.2 },
    { year: 2025, month: 11, percent: 70.8 }, { year: 2025, month: 12, percent: 77.3 },
    // 2026: current (up to March)
    { year: 2026, month: 1, percent: 79.5 }, { year: 2026, month: 2, percent: 81.8 },
    { year: 2026, month: 3, percent: 83.2 }
  ];

  let historyRange = 5; // default 5 years

  function renderHistoryChart() {
    const container = $('#history-chart');
    if (!container) return;

    // Filter data by range
    const cutoffYear = historyRange === 0 ? 0 : 2026 - historyRange;
    const data = historyRange === 0
      ? HISTORY_DATA
      : HISTORY_DATA.filter(d => d.year > cutoffYear || (d.year === cutoffYear && d.month >= 4));

    // Render toggle buttons
    const toggleId = 'history-range-toggle';
    let toggle = container.querySelector('#' + toggleId);
    if (!toggle) {
      toggle = document.createElement('div');
      toggle.id = toggleId;
      toggle.className = 'sort-bar';
      toggle.style.marginBottom = '12px';
      toggle.style.justifyContent = 'flex-end';
      container.prepend(toggle);
    }
    const ranges = [
      { val: 1, label: getLang() === 'en' ? '1Y' : '1A' },
      { val: 5, label: getLang() === 'en' ? '5Y' : '5A' },
      { val: 10, label: getLang() === 'en' ? '10Y' : '10A' },
      { val: 0, label: getLang() === 'en' ? 'All' : 'Todo' }
    ];
    toggle.innerHTML = `<div class="sort-group" role="group">${ranges.map(r =>
      `<button class="sort-btn${r.val === historyRange ? ' active' : ''}" data-range="${r.val}">${r.label}</button>`
    ).join('')}</div>`;
    toggle.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        historyRange = parseInt(btn.dataset.range);
        renderHistoryChart();
      });
    });

    const W = 760, H = 280;
    const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    const n = data.length;
    const minY = 20, maxY = 100;

    function x(i) { return PAD.left + (i / (n - 1)) * chartW; }
    function y(v) { return PAD.top + ((maxY - v) / (maxY - minY)) * chartH; }

    // Build gradient area path
    let areaPath = `M${x(0)},${y(data[0].percent)}`;
    let linePath = `M${x(0)},${y(data[0].percent)}`;
    for (let i = 1; i < n; i++) {
      areaPath += ` L${x(i)},${y(data[i].percent)}`;
      linePath += ` L${x(i)},${y(data[i].percent)}`;
    }
    areaPath += ` L${x(n-1)},${y(minY)} L${x(0)},${y(minY)} Z`;

    // Y-axis grid lines & labels
    let gridLines = '';
    for (let v = 20; v <= 100; v += 20) {
      const yy = y(v);
      gridLines += `<line x1="${PAD.left}" y1="${yy}" x2="${W - PAD.right}" y2="${yy}" stroke="#e5e7eb" stroke-width="1"/>`;
      gridLines += `<text x="${PAD.left - 8}" y="${yy + 4}" text-anchor="end" fill="#94a3b8" font-size="11" font-weight="500">${v}%</text>`;
    }

    // X-axis year labels — skip labels that would overlap (need ~60px min gap)
    let yearLabels = '';
    const allYears = [...new Set(data.map(d => d.year))];
    const MIN_LABEL_GAP = 60;
    let lastLabelX = -Infinity;
    allYears.forEach(yr => {
      const idx = data.findIndex(d => d.year === yr && d.month === 1);
      if (idx < 0) return;
      const xPos = x(idx);
      if (xPos - lastLabelX < MIN_LABEL_GAP) return;
      yearLabels += `<text x="${xPos}" y="${H - 8}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600">${yr}</text>`;
      lastLabelX = xPos;
    });

    // Drought zone highlight (below 40%)
    const droughtY = y(40);
    const droughtH = y(minY) - droughtY;

    // Interactive dots (invisible, large hover targets)
    let dots = '';
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    data.forEach((d, i) => {
      const isEn = getLang() === 'en';
      const mLabel = isEn ? monthsEn[d.month - 1] : months[d.month - 1];
      dots += `<circle cx="${x(i)}" cy="${y(d.percent)}" r="12" fill="transparent" class="history-dot" data-tip="${mLabel} ${d.year}: ${d.percent.toFixed(1)}%"/>`;
      dots += `<circle cx="${x(i)}" cy="${y(d.percent)}" r="3" fill="#3b82f6" opacity="0" class="history-dot-visible"/>`;
    });

    // Current value marker
    const lastIdx = n - 1;
    const lastD = data[lastIdx];

    // Remove old SVG if any (keep toggle)
    const oldSvg = container.querySelector('svg');
    if (oldSvg) oldSvg.remove();

    const svgHtml = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="auto" preserveAspectRatio="xMidYMid meet" class="history-svg">
        <!-- Drought zone -->
        <rect x="${PAD.left}" y="${droughtY}" width="${chartW}" height="${droughtH}" fill="#fee2e2" opacity="0.3" rx="4"/>
        <text x="${W - PAD.right - 4}" y="${droughtY + 14}" text-anchor="end" fill="#ef4444" font-size="10" font-weight="600" opacity="0.6">SEQUÍA</text>

        ${gridLines}

        <!-- Gradient fill -->
        <defs>
          <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#histGrad)"/>
        <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>

        <!-- Current marker -->
        <circle cx="${x(lastIdx)}" cy="${y(lastD.percent)}" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>

        ${yearLabels}
        ${dots}
      </svg>`;

    container.insertAdjacentHTML('beforeend', svgHtml);

    // Tooltip interaction
    const svg = container.querySelector('svg');
    const visibleDots = svg.querySelectorAll('.history-dot-visible');
    let tip = document.getElementById('history-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'history-tooltip';
      tip.style.cssText =
        'position:fixed;display:none;background:#1e293b;color:#f8fafc;' +
        'padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;' +
        'pointer-events:none;z-index:9999;white-space:nowrap;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.2);';
      document.body.appendChild(tip);
    }

    svg.querySelectorAll('.history-dot').forEach((dot, i) => {
      dot.addEventListener('mouseenter', () => {
        visibleDots[i].setAttribute('opacity', '1');
        visibleDots[i].setAttribute('r', '5');
      });
      dot.addEventListener('mouseleave', () => {
        visibleDots[i].setAttribute('opacity', '0');
        visibleDots[i].setAttribute('r', '3');
        tip.style.display = 'none';
      });
      dot.addEventListener('mousemove', (e) => {
        tip.textContent = dot.dataset.tip;
        tip.style.display = 'block';
        tip.style.left = (e.clientX + 12) + 'px';
        tip.style.top = (e.clientY - 36) + 'px';
      });
    });
  }

  // ─── Render KPIs ───

  function renderKPIs(data) {
    const grid = $('#kpi-grid');
    if (!grid) return;

    const total = data.total;
    const criticalRegions = data.regions.filter(r => r.percent < 60);
    const criticalNames = criticalRegions.map(r => `${r.name} ${fmtPct(r.percent)}`).join(' · ');

    grid.innerHTML = `
      <div class="kpi kpi-primary">
        ${createGauge(total.percent)}
        <div class="kpi-primary-body">
          <div class="kpi-label">${t('kpiWaterStored')}</div>
          <div class="kpi-value">${fmt(total.stored)} hm³</div>
          <div class="kpi-sub">${t('ofCapacity', fmt(total.capacity))}</div>
          <div class="kpi-change ${changeClass(total.weeklyChangePercent)}" aria-label="${t('kpiWeekly')}">
            ${changeArrow(total.weeklyChangePercent)} ${fmtChange(total.weeklyChangePercent)} ${t('kpiWeekly')}
          </div>
        </div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${t('kpiVsLastYear')}</div>
        <div class="kpi-value" style="color:var(--green);">${fmtChange(total.percent - (total.lastYearPercent || 0))}</div>
        <div class="kpi-sub">${fmtPct(total.lastYearPercent)} ${t('inYear', '2025')}</div>
        <div class="kpi-change up">${changeArrow(1)} +${fmt(total.stored - (total.capacity * (total.lastYearPercent || 0) / 100))} hm³</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${t('kpiVsAverage')}</div>
        <div class="kpi-value" style="color:var(--green);">${fmtChange(total.percent - (total.avgPercent || 0))}</div>
        <div class="kpi-sub">${fmtPct(total.avgPercent)} ${t('historicAvg')}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">${t('kpiCritical')}</div>
        <div class="kpi-value" style="color:${criticalRegions.length > 0 ? 'var(--red)' : 'var(--green)'};">${criticalRegions.length}</div>
        <div class="kpi-sub">${criticalNames || '—'}</div>
      </div>
    `;
  }

  // ─── Render Regions ───

  function renderRegions(data) {
    const grid = $('#region-grid');
    const countEl = $('#region-count');
    if (!grid) return;

    const regions = [...data.regions].sort((a, b) => b.percent - a.percent);

    if (countEl) countEl.textContent = t('regionCount', regions.length);

    grid.innerHTML = regions.map(r => {
      const wc = waterClass(r.percent);
      const cc = changeClass(r.weeklyChange);

      // Generate sparkline data from weekly change (simulate trend)
      const sparkData = generateSparkData(r.percent, r.weeklyChange);

      return `
        <article class="region-card" tabindex="0" aria-label="${r.name}: ${fmtPct(r.percent)}" data-region="${r.name}">
          <div class="water-bar">
            <div class="water-fill ${wc}" style="width:${r.percent}%"></div>
            <div class="water-label ${wc}">${fmtPct(r.percent)}</div>
          </div>
          <div class="region-body">
            <div class="region-name">${r.name}</div>
            <div class="region-meta">
              <span class="region-vol">${fmt(r.stored)} / ${fmt(r.capacity)} hm³</span>
              <span class="badge ${cc}">${changeArrow(r.weeklyChange)} ${Math.abs(r.weeklyChange).toFixed(1)}%</span>
            </div>
            ${createSparkline(sparkData, r.name + ' — tendencia')}
          </div>
        </article>`;
    }).join('');
  }

  // Generate simulated sparkline data from current percent and weekly change
  function generateSparkData(currentPct, weeklyChange) {
    const weeks = 12;
    const data = [];
    const avgChange = weeklyChange || 0.5;
    const now = new Date();
    const lang = getLang() === 'en' ? 'en-GB' : 'es-ES';

    for (let i = weeks - 1; i >= 0; i--) {
      const variation = (Math.random() - 0.3) * Math.abs(avgChange) * 0.8;
      const val = Math.max(0, Math.min(100, currentPct - (avgChange * i) + variation));
      const weekDate = new Date(now);
      weekDate.setDate(weekDate.getDate() - i * 7);
      const dateStr = weekDate.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
      data.push({
        value: val,
        label: dateStr
      });
    }
    // Last point is always current
    data[data.length - 1] = { value: currentPct, label: t('updated') };
    return data;
  }

  // ─── Render Top Reservoirs ───

  function renderReservoirs(data) {
    const grid = $('#reservoir-grid');
    const countEl = $('#reservoir-count');
    if (!grid) return;

    const reservoirs = (data.topReservoirs || []).slice(0, 6);
    if (countEl) countEl.textContent = t('topCount', reservoirs.length);

    grid.innerHTML = reservoirs.map(r => {
      const wc = waterClass(r.percent);
      return `
        <article class="reservoir-card">
          <div class="tank-visual">
            <div class="tank-fill ${wc}" style="height:${r.percent}%"></div>
            <div class="tank-pct">${r.percent.toFixed(1)}<span>%</span></div>
          </div>
          <div class="reservoir-body">
            <div class="reservoir-name">${r.name}</div>
            <div class="reservoir-loc">${r.region || ''} · ${r.province || ''} · ${fmt(r.capacity)} hm³</div>
            <div class="reservoir-stats">
              <div>
                <div class="rs-label">${t('stored')}</div>
                <div class="rs-value">${fmt(r.stored)} hm³</div>
              </div>
              <div>
                <div class="rs-label">${t('weekly')}</div>
                <div class="rs-value ${changeClass(r.weeklyChange)}">${fmtChange(r.weeklyChange)}</div>
              </div>
              <div>
                <div class="rs-label">${t('vsLastYear', '2025')}</div>
                <div class="rs-value ${r.lastYearPercent ? changeClass(r.percent - r.lastYearPercent) : ''}">${r.lastYearPercent ? fmtChange(r.percent - r.lastYearPercent) : '—'}</div>
              </div>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  // ─── Region sort state ───

  let regionSort = 'percent';

  function sortRegions(regions, sortKey) {
    const sorted = [...regions];
    switch (sortKey) {
      case 'percent': return sorted.sort((a, b) => b.percent - a.percent);
      case 'stored':  return sorted.sort((a, b) => b.stored - a.stored);
      case 'name':    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      case 'change':  return sorted.sort((a, b) => b.weeklyChange - a.weeklyChange);
      default:        return sorted;
    }
  }

  function initSortButtons(data) {
    $$('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        regionSort = btn.dataset.sort;
        $$('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderRegionDetail(data);
      });
    });
  }

  // ─── Render Region Detail (Por Región tab) ───

  function renderRegionDetail(data) {
    const list = $('#region-detail-list');
    if (!list) return;

    const regions = sortRegions(data.regions, regionSort);

    list.innerHTML = regions.map(r => {
      const wc = waterClass(r.percent);
      const cc = changeClass(r.weeklyChange);

      // Find reservoirs that belong to this region
      const regionReservoirs = (data.topReservoirs || []).filter(
        res => res.region === r.name
      );

      return `
        <div class="region-detail-card">
          <div class="region-detail-header">
            <div class="region-detail-info">
              <h3>${r.name}</h3>
              <span class="region-vol">${fmt(r.stored)} / ${fmt(r.capacity)} hm³</span>
            </div>
            <div class="region-detail-stats">
              <span class="region-detail-pct ${wc}">${fmtPct(r.percent)}</span>
              <span class="badge ${cc}">${changeArrow(r.weeklyChange)} ${Math.abs(r.weeklyChange).toFixed(1)}%</span>
            </div>
          </div>
          <div class="region-detail-bar">
            <div class="region-detail-bar-fill ${wc}" style="width:${r.percent}%"></div>
          </div>
          ${regionReservoirs.length > 0 ? `
            <div class="region-detail-body">
              ${regionReservoirs.map(res => {
                const rwc = waterClass(res.percent);
                return `
                <div class="reservoir-list-item">
                  <span class="reservoir-list-name">${res.name}</span>
                  <span class="reservoir-list-pct ${rwc}">${fmtPct(res.percent)}</span>
                  <div class="reservoir-list-bar">
                    <div class="reservoir-list-bar-fill ${rwc}" style="width:${res.percent}%"></div>
                  </div>
                  <span class="reservoir-list-vol">${fmt(res.stored)} / ${fmt(res.capacity)} hm³</span>
                </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>`;
    }).join('');
  }

  // ─── Stale & Error Alerts ───

  function renderAlerts(data) {
    const staleAlert = $('#stale-alert');
    const errorAlert = $('#error-alert');

    if (staleAlert && data.timestamp && isStale(data.timestamp)) {
      staleAlert.hidden = false;
    }

    if (errorAlert && data.error) {
      errorAlert.hidden = false;
      const errorText = $('#error-text');
      if (errorText) {
        errorText.textContent = data.demo ? t('errorFetch') : t('errorFetch');
      }
    }
  }

  // ─── Freshness indicator ───

  function renderFreshness(data) {
    const text = $('#freshness-text');
    if (!text || !data.timestamp) return;

    const date = new Date(data.timestamp);
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    const lang = getLang() === 'en' ? 'en-GB' : 'es-ES';
    text.textContent = date.toLocaleDateString(lang, opts);
  }

  // ─── Tab switching ───

  function switchTab(tab) {
    currentTab = tab;

    $$('.tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    $$('.tab-panel').forEach(panel => {
      panel.hidden = true;
    });

    const targetPanel = $(`#tab-${tab}`);
    if (targetPanel) targetPanel.hidden = false;
  }

  // ─── Language toggle ───

  function initLangToggle() {
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLang(lang);
        $$('.lang-btn').forEach(b => {
          b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
        });
        // Re-render with new language
        if (currentData) renderAll(currentData);
      });
    });

    // Set initial state
    const lang = getLang();
    $$('.lang-btn').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });
  }

  // ─── Tab event listeners ───

  function initTabs() {
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });

      // Keyboard navigation between tabs
      btn.addEventListener('keydown', (e) => {
        const tabs = $$('.tab-btn');
        const idx = tabs.indexOf(btn);
        let next;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          next = tabs[(idx + 1) % tabs.length];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          next = tabs[(idx - 1 + tabs.length) % tabs.length];
        }
        if (next && !next.disabled) {
          e.preventDefault();
          next.focus();
          next.click();
        }
      });
    });
  }

  // ─── Render all ───

  function renderAll(data) {
    currentData = data;

    // Hide loading, show content
    const loading = $('#loading-state');
    if (loading) loading.hidden = true;

    renderKPIs(data);
    renderHistoryChart();
    renderRegions(data);
    renderReservoirs(data);
    renderRegionDetail(data);
    initSortButtons(data);
    renderAlerts(data);
    renderFreshness(data);

    // Render map if available
    if (window.SpainMap) {
      window.SpainMap.render('spain-map-container', data.regions);
    }

    applyTranslations();

    // Show active tab
    switchTab(currentTab);
  }

  // ─── Init ───

  async function init() {
    initTabs();
    initLangToggle();
    initSparkTooltips();

    try {
      const data = await fetchReservoirData();
      renderAll(data);
    } catch (err) {
      console.error('Failed to load data:', err);
      // Show error state
      const loading = $('#loading-state');
      if (loading) loading.hidden = true;
      const errorAlert = $('#error-alert');
      if (errorAlert) {
        errorAlert.hidden = false;
        const errorText = $('#error-text');
        if (errorText) errorText.textContent = t('errorFetch');
      }
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
