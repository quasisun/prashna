/* astro.js — астрономическое ядро для расчёта прашна-карты.
   Алгоритмы: J. Meeus, "Astronomical Algorithms" (Солнце гл.25, Луна гл.47),
   планеты — кеплеровы элементы JPL (Standish, 1800–2050 AD).
   Точность: Солнце/Луна ~0.01°, планеты ~1-2′ — достаточно для знака/накшатры/пады. */
(function (global) {
  'use strict';
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  // Юлианский день из григорианской даты и времени UT (часы)
  function julianDay(y, m, d, utHours) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + utHours / 24;
  }

  // Приближённая дельта T (сек) для пересчёта UT -> TT (для эфемеридных формул)
  function deltaTsec(year) {
    // грубая аппроксимация для 1900–2100
    if (year < 1950) return 24 + (year - 1900) * 0.1;
    if (year < 2005) return 29 + (year - 1950) * 0.55;
    return 64 + (year - 2005) * 0.35;
  }

  function centuriesTT(jdUT, year) {
    const jdTT = jdUT + deltaTsec(year || 2000) / 86400;
    return (jdTT - 2451545.0) / 36525;
  }

  // ---------- Солнце (видимая эклиптическая долгота, равноденствие даты) ----------
  function sunLongitude(jdUT, year) {
    const T = centuriesTT(jdUT, year);
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
      + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
      + 0.000289 * Math.sin(3 * M);
    const Om = (125.04 - 1934.136 * T) * D2R;
    return norm360(L0 + C - 0.00569 - 0.00478 * Math.sin(Om));
  }

  // ---------- Луна (видимая эклиптическая долгота, равноденствие даты) ----------
  // Главные члены ELP-2000/82 по Meeus, табл. 47.A (коэф. в 1e-6 град)
  const MOON_TERMS = [
    [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
    [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
    [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
    [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
    [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
    [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
    [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665], [0, 1, -2, 0, -2689],
    [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390], [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236],
    [0, 1, 2, 0, -2120], [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
    [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110], [3, 0, -1, 0, -892],
    [2, 1, 1, 0, -810], [4, -1, -2, 0, 759], [0, 2, -1, 0, -713], [2, 2, -1, 0, -700],
    [2, 1, -2, 0, 691], [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
    [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399], [0, 0, 2, -2, -381],
    [1, 1, 1, 0, 351], [3, 0, -2, 0, -340], [4, 0, -3, 0, 330], [2, -1, 2, 0, 327],
    [0, 2, 1, 0, -323], [1, 1, -1, 0, 299], [2, 0, 3, 0, 294]
  ];

  function moonLongitude(jdUT, year) {
    const T = centuriesTT(jdUT, year);
    const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841);
    const D = norm360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868);
    const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    const Mp = norm360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699);
    const F = norm360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T);
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    let sum = 0;
    for (const [cd, cm, cmp, cf, coef] of MOON_TERMS) {
      let c = coef;
      if (cm === 1 || cm === -1) c *= E;
      else if (cm === 2 || cm === -2) c *= E * E;
      sum += c * Math.sin((cd * D + cm * M + cmp * Mp + cf * F) * D2R);
    }
    const A1 = norm360(119.75 + 131.849 * T);
    const A2 = norm360(53.09 + 479264.290 * T);
    sum += 3958 * Math.sin(A1 * D2R) + 1962 * Math.sin((Lp - F) * D2R) + 318 * Math.sin(A2 * D2R);
    const Om = (125.04 - 1934.136 * T) * D2R;
    const nutation = -0.00478 * Math.sin(Om);
    return norm360(Lp + sum / 1e6 + nutation);
  }

  // ---------- Планеты: кеплеровы элементы JPL (J2000, скорости за столетие) ----------
  // [a, e, I, L, varpi, Omega] + rates
  const ELEMENTS = {
    mercury: { el: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593],
               rt: [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081] },
    venus:   { el: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255],
               rt: [0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418] },
    earth:   { el: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0],
               rt: [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0] },
    mars:    { el: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891],
               rt: [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343] },
    jupiter: { el: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909],
               rt: [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106] },
    saturn:  { el: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448],
               rt: [-0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794] }
  };

  function helioXYZ(body, T) {
    const e0 = ELEMENTS[body].el, r = ELEMENTS[body].rt;
    const a = e0[0] + r[0] * T;
    const ec = e0[1] + r[1] * T;
    const I = (e0[2] + r[2] * T) * D2R;
    const L = e0[3] + r[3] * T;
    const vp = e0[4] + r[4] * T;
    const Om = (e0[5] + r[5] * T) * D2R;
    const w = (vp - (e0[5] + r[5] * T)) * D2R; // аргумент перигелия
    let M = norm360(L - vp) * D2R;
    if (M > Math.PI) M -= 2 * Math.PI;
    let Ecc = M;
    for (let i = 0; i < 20; i++) {
      const dE = (Ecc - ec * Math.sin(Ecc) - M) / (1 - ec * Math.cos(Ecc));
      Ecc -= dE;
      if (Math.abs(dE) < 1e-9) break;
    }
    const xp = a * (Math.cos(Ecc) - ec);
    const yp = a * Math.sqrt(1 - ec * ec) * Math.sin(Ecc);
    const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(Om), sO = Math.sin(Om), cI = Math.cos(I), sI = Math.sin(I);
    return [
      (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
      (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
      (sw * sI) * xp + (cw * sI) * yp
    ];
  }

  // Геоцентрическая эклиптическая долгота планеты, равноденствие даты
  function planetLongitude(jdUT, body, year) {
    const T = centuriesTT(jdUT, year);
    const p = helioXYZ(body, T);
    const g = helioXYZ('earth', T);
    const lamJ2000 = Math.atan2(p[1] - g[1], p[0] - g[0]) * R2D;
    const precession = 1.3969713 * T + 0.0003086 * T * T; // общая прецессия по долготе
    return norm360(lamJ2000 + precession);
  }

  // Средний восходящий узел Луны (Раху), равноденствие даты
  function meanRahu(jdUT, year) {
    const T = centuriesTT(jdUT, year);
    return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441);
  }

  // ---------- Аянамша ----------
  // Лахири (Читрапакша): аппроксимация ±1' ; KP и Раман — смещением
  function ayanamsa(jdUT, type) {
    const T19 = (jdUT - 2415020.0) / 36525; // столетия от 1900.0
    const lahiri = 22.460148 + 1.396042 * T19 + 0.000308 * T19 * T19;
    if (type === 'kp') return lahiri - 0.1054;
    if (type === 'raman') return lahiri - 1.3849;
    return lahiri;
  }

  // ---------- Звёздное время и асцендент ----------
  function gmstDeg(jdUT) {
    const T = (jdUT - 2451545.0) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (jdUT - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
  }

  function obliquity(jdUT) {
    const T = (jdUT - 2451545.0) / 36525;
    return 23.43929111 - 0.01300417 * T - 1.64e-7 * T * T;
  }

  // Тропический асцендент (град)
  function ascendant(jdUT, latDeg, lonEastDeg) {
    const ramc = norm360(gmstDeg(jdUT) + lonEastDeg) * D2R;
    const eps = obliquity(jdUT) * D2R;
    const phi = latDeg * D2R;
    const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
    return norm360(asc * R2D);
  }

  // ---------- Восход Солнца (приближённо, для определения вары) ----------
  // Возвращает местное время восхода в часах (по переданному смещению UTC) или null в полярных случаях
  function sunriseLocalHours(y, m, d, latDeg, lonEastDeg, tzHours) {
    const jd0 = julianDay(y, m, d, 12 - tzHours); // около местного полудня
    const lam = sunLongitude(jd0, y) * D2R;
    const eps = obliquity(jd0) * D2R;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const ra = norm360(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) * R2D);
    // уравнение времени (град): средняя долгота минус прямое восхождение
    const T = (jd0 - 2451545.0) / 36525;
    const L0 = norm360(280.46646 + 36000.76983 * T);
    let eot = L0 - 0.0057183 - ra;
    while (eot > 180) eot -= 360;
    while (eot < -180) eot += 360;
    const noonLocal = 12 - eot * 4 / 60 - lonEastDeg / 15 + tzHours; // местное время истинного полудня
    const phi = latDeg * D2R;
    const cosH = (Math.sin(-0.833 * D2R) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return null;
    const H = Math.acos(cosH) * R2D;
    return noonLocal - H / 15;
  }

  const Astro = {
    norm360, julianDay, sunLongitude, moonLongitude, planetLongitude,
    meanRahu, ayanamsa, gmstDeg, obliquity, ascendant, sunriseLocalHours
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Astro;
  else global.Astro = Astro;
})(typeof window !== 'undefined' ? window : globalThis);
