/* app.js — логика прашны: построение карты, классическая прашна с трактовками,
   Чандра чакра прашна (анализ от Луны). Все позиции сидерические. */
'use strict';

/* ================= СПРАВОЧНИКИ ================= */

const SIGNS = [
  { name: 'Овен', sa: 'Меша', abbr: 'Ов', lord: 'mars', type: 0, dir: 'восток' },
  { name: 'Телец', sa: 'Вришабха', abbr: 'Те', lord: 'venus', type: 1, dir: 'юг' },
  { name: 'Близнецы', sa: 'Митхуна', abbr: 'Бл', lord: 'mercury', type: 2, dir: 'запад' },
  { name: 'Рак', sa: 'Карка', abbr: 'Рк', lord: 'moon', type: 0, dir: 'север' },
  { name: 'Лев', sa: 'Симха', abbr: 'Лв', lord: 'sun', type: 1, dir: 'восток' },
  { name: 'Дева', sa: 'Канья', abbr: 'Де', lord: 'mercury', type: 2, dir: 'юг' },
  { name: 'Весы', sa: 'Тула', abbr: 'Вс', lord: 'venus', type: 0, dir: 'запад' },
  { name: 'Скорпион', sa: 'Вришчика', abbr: 'Ск', lord: 'mars', type: 1, dir: 'север' },
  { name: 'Стрелец', sa: 'Дхану', abbr: 'Ст', lord: 'jupiter', type: 2, dir: 'восток' },
  { name: 'Козерог', sa: 'Макара', abbr: 'Кз', lord: 'saturn', type: 0, dir: 'юг' },
  { name: 'Водолей', sa: 'Кумбха', abbr: 'Вд', lord: 'saturn', type: 1, dir: 'запад' },
  { name: 'Рыбы', sa: 'Мина', abbr: 'Рб', lord: 'jupiter', type: 2, dir: 'север' }
];
const SIGN_TYPE = ['подвижный (чара)', 'фиксированный (стхира)', 'двойственный (двисвабхава)'];

const PLANET_KEYS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
const PL = {
  sun: { name: 'Солнце', abbr: 'Со' }, moon: { name: 'Луна', abbr: 'Лу' },
  mars: { name: 'Марс', abbr: 'Ма' }, mercury: { name: 'Меркурий', abbr: 'Ме' },
  jupiter: { name: 'Юпитер', abbr: 'Юп' }, venus: { name: 'Венера', abbr: 'Ве' },
  saturn: { name: 'Сатурн', abbr: 'Са' }, rahu: { name: 'Раху', abbr: 'Ра' }, ketu: { name: 'Кету', abbr: 'Ке' }
};

const NAK_NAMES = ['Ашвини', 'Бхарани', 'Криттика', 'Рохини', 'Мригашира', 'Ардра', 'Пунарвасу', 'Пушья', 'Ашлеша',
  'Магха', 'Пурва-Пхалгуни', 'Уттара-Пхалгуни', 'Хаста', 'Читра', 'Свати', 'Вишакха', 'Анурадха', 'Джйештха',
  'Мула', 'Пурва-Ашадха', 'Уттара-Ашадха', 'Шравана', 'Дхаништха', 'Шатабхиша', 'Пурва-Бхадрапада', 'Уттара-Бхадрапада', 'Ревати'];
const NAK_LORDS = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];

// Мухуртовая классификация накшатр (используется и в прашне)
const NAK_CLASS_OF = {
  0: 'kshipra', 7: 'kshipra', 12: 'kshipra',
  4: 'mridu', 13: 'mridu', 16: 'mridu', 26: 'mridu',
  3: 'dhruva', 11: 'dhruva', 20: 'dhruva', 25: 'dhruva',
  6: 'chara', 14: 'chara', 21: 'chara', 22: 'chara', 23: 'chara',
  1: 'ugra', 9: 'ugra', 10: 'ugra', 19: 'ugra', 24: 'ugra',
  5: 'tikshna', 8: 'tikshna', 17: 'tikshna', 18: 'tikshna',
  2: 'mishra', 15: 'mishra'
};
const NAK_CLASS = {
  kshipra: { name: 'Кшипра (быстрая, лёгкая)', score: 1, text: 'обещает быстрое разрешение вопроса, лёгкий успех, выздоровление, удачу в торговле и начинаниях.' },
  mridu: { name: 'Мриду (мягкая, нежная)', score: 1, text: 'благоприятна: согласие, дружба, мягкое и приятное разрешение дела, особенно в вопросах отношений и искусства.' },
  dhruva: { name: 'Дхрува (постоянная, твёрдая)', score: 1, text: 'даёт устойчивый, прочный результат; хороша для долгосрочных дел, фундамента, стабильности; перемены идут медленно.' },
  chara: { name: 'Чара (подвижная)', score: 0, text: 'указывает на перемены, движение, переезды; ситуация не останется прежней — хороша для вопросов о переменах и дороге.' },
  ugra: { name: 'Угра (грозная, жёсткая)', score: -1, text: 'жёсткость, давление, конфликт; для мирных вопросов неблагоприятна, поддерживает лишь борьбу и решительные меры.' },
  tikshna: { name: 'Тикшна (острая, резкая)', score: -1, text: 'резкие повороты, разрывы, риск; вопрос связан с напряжением — требуется осторожность.' },
  mishra: { name: 'Мишра (смешанная)', score: 0, text: 'смешанный результат: успех придёт, но с оговорками и не без трений.' }
};

const TITHI_NAMES = ['Пратипада', 'Двитья', 'Тритья', 'Чатуртхи', 'Панчами', 'Шашти', 'Саптами', 'Аштами',
  'Навами', 'Дашами', 'Экадаши', 'Двадаши', 'Трайодаши', 'Чатурдаши'];
const YOGA_NAMES = ['Вишкамбха', 'Прити', 'Аюшман', 'Саубхагья', 'Шобхана', 'Атиганда', 'Сукарма', 'Дхрити', 'Шула',
  'Ганда', 'Вриддхи', 'Дхрува', 'Вьягхата', 'Харшана', 'Ваджра', 'Сиддхи', 'Вьятипата', 'Варияна', 'Паригха',
  'Шива', 'Сиддха', 'Садхья', 'Шубха', 'Шукла', 'Брахма', 'Индра', 'Вайдхрити'];
const KARANA_MOVABLE = ['Бава', 'Балава', 'Каулава', 'Тайтила', 'Гара', 'Ваниджа', 'Вишти'];
const VAARA = [
  { name: 'воскресенье', lord: 'sun' }, { name: 'понедельник', lord: 'moon' }, { name: 'вторник', lord: 'mars' },
  { name: 'среда', lord: 'mercury' }, { name: 'четверг', lord: 'jupiter' }, { name: 'пятница', lord: 'venus' },
  { name: 'суббота', lord: 'saturn' }
];

const EXALT = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6, rahu: 1, ketu: 7 };
const OWN = { sun: [4], moon: [3], mars: [0, 7], mercury: [2, 5], jupiter: [8, 11], venus: [1, 6], saturn: [9, 10], rahu: [10], ketu: [7] };
const FRIENDS = {
  sun: ['moon', 'mars', 'jupiter'], moon: ['sun', 'mercury'], mars: ['sun', 'moon', 'jupiter'],
  mercury: ['sun', 'venus'], jupiter: ['sun', 'moon', 'mars'], venus: ['mercury', 'saturn'],
  saturn: ['mercury', 'venus'], rahu: ['venus', 'saturn'], ketu: ['mars', 'venus']
};
const ENEMIES = {
  sun: ['venus', 'saturn'], moon: [], mars: ['mercury'], mercury: ['moon'],
  jupiter: ['mercury', 'venus'], venus: ['sun', 'moon'], saturn: ['sun', 'moon', 'mars'],
  rahu: ['sun', 'moon'], ketu: ['sun', 'moon']
};
const ASPECTS = {
  sun: [7], moon: [7], mercury: [7], venus: [7],
  mars: [4, 7, 8], jupiter: [5, 7, 9], saturn: [3, 7, 10], rahu: [5, 7, 9], ketu: [5, 7, 9]
};
const COMBUST_ORB = { moon: 12, mars: 17, mercury: 13, jupiter: 11, venus: 9, saturn: 15 };
const NATURAL_MALEFICS = ['sun', 'mars', 'saturn', 'rahu', 'ketu']; // Луна/Меркурий — по состоянию

const TARAS = [
  { name: 'Джанма', good: false, text: 'тара рождения — напряжение для тела и личных начинаний; вопрос затрагивает вопрошающего лично, результат неустойчив.' },
  { name: 'Сампат', good: true, text: 'тара богатства и успеха — весьма благоприятна, обещает прибыль и удачу.' },
  { name: 'Випат', good: false, text: 'тара опасности — препятствия, потери, риск неудачи.' },
  { name: 'Кшема', good: true, text: 'тара благополучия — защита и благоприятный исход.' },
  { name: 'Пратьяк', good: false, text: 'тара противодействия — сопротивление среды, задержки, отказы.' },
  { name: 'Садхана', good: true, text: 'тара достижения — цель достижима через усилие; благоприятна.' },
  { name: 'Найдхана (Вадха)', good: false, text: 'тара разрушения — самая неблагоприятная, угроза краха дела.' },
  { name: 'Митра', good: true, text: 'дружественная тара — поддержка, помощь, благоприятный исход.' },
  { name: 'Парама-Митра', good: true, text: 'наилучшая дружественная тара — большая удача и покровительство.' }
];

// 28 накшатр для Чандра Каланала Чакры (Абхиджит — 22-я, между Уттара-Ашадхой и Шраваной)
const NAK28_NAMES = ['Ашвини', 'Бхарани', 'Криттика', 'Рохини', 'Мригашира', 'Ардра', 'Пунарвасу', 'Пушья', 'Ашлеша',
  'Магха', 'Пурва-Пхалгуни', 'Уттара-Пхалгуни', 'Хаста', 'Читра', 'Свати', 'Вишакха', 'Анурадха', 'Джйештха',
  'Мула', 'Пурва-Ашадха', 'Уттара-Ашадха', 'Абхиджит', 'Шравана', 'Дхаништха', 'Шатабхиша', 'Пурва-Бхадрапада', 'Уттара-Бхадрапада', 'Ревати'];
const NAK28_SHORT = ['Ашвини', 'Бхарани', 'Криттика', 'Рохини', 'Мригашира', 'Ардра', 'Пунарвасу', 'Пушья', 'Ашлеша',
  'Магха', 'П-Пхалгуни', 'У-Пхалгуни', 'Хаста', 'Читра', 'Свати', 'Вишакха', 'Анурадха', 'Джйештха',
  'Мула', 'П-Ашадха', 'У-Ашадха', 'Абхиджит', 'Шравана', 'Дхаништха', 'Шатабхиша', 'П-Бхадрапада', 'У-Бхадрапада', 'Ревати'];

// Абхиджит: 276°40′ – 280°53′20″ (последняя пада У-Ашадхи + 1/15 Шраваны)
const ABHIJIT_START = 276 + 40 / 60, ABHIJIT_END = 280 + 53 / 60 + 20 / 3600;
function lonToNak28(lon) {
  if (lon < ABHIJIT_START) return Math.floor(lon / (360 / 27));        // 0..20
  if (lon < ABHIJIT_END) return 21;                                     // Абхиджит
  if (lon < 293 + 20 / 60) return 22;                                   // Шравана (укороченная)
  return Math.floor(lon / (360 / 27)) + 1;                              // 23..27
}
// Зона позиции 1..28 в чакре: трезубцы / внутри круга / вне круга
function kalanalaZone(pos) {
  const r = pos % 7;
  if (r === 0 || r === 1 || r === 2) return 'trident';
  if (r === 4 || r === 5) return 'inside';
  return 'outside';
}

const CATEGORIES = {
  general: { name: 'Общий вопрос (о себе, о ситуации)', house: 1, karakas: ['jupiter'] },
  career: { name: 'Работа, карьера, должность', house: 10, karakas: ['sun', 'mercury', 'jupiter', 'saturn'] },
  marriage: { name: 'Брак, отношения, партнёрство', house: 7, karakas: ['venus'] },
  children: { name: 'Дети, беременность', house: 5, karakas: ['jupiter'] },
  health: { name: 'Здоровье, болезнь, выздоровление', house: 6, karakas: ['saturn'] },
  wealth: { name: 'Деньги, доход, прибыль', house: 11, karakas: ['jupiter', 'mercury'] },
  property: { name: 'Недвижимость, дом, транспорт', house: 4, karakas: ['mars', 'moon'] },
  travel: { name: 'Поездка, дорога, переезд', house: 9, karakas: ['moon'] },
  foreign: { name: 'Заграница, эмиграция, дальние земли', house: 12, karakas: ['rahu', 'saturn'] },
  lost: { name: 'Пропажа, возврат утраченного', house: 11, karakas: ['moon', 'mercury'] },
  court: { name: 'Спор, суд, конкуренция, враги', house: 6, karakas: ['mars'] },
  education: { name: 'Учёба, знание, экзамен', house: 5, karakas: ['mercury', 'jupiter'] },
  spiritual: { name: 'Духовный вопрос, дхарма, учитель', house: 9, karakas: ['jupiter', 'ketu'] }
};

const LAGNESHA_HOUSE = [null,
  ['Хозяин лагны в 1-м доме: вопрошающий сам держит ситуацию в руках, вопрос решается его собственными усилиями.', 2],
  ['Хозяин лагны во 2-м доме: внимание обращено к ресурсам, семье, накоплениям; умеренно благоприятно.', 1],
  ['Хозяин лагны в 3-м доме (упачая): потребуются личная инициатива и смелость; рост через усилие.', 1],
  ['Хозяин лагны в 4-м доме (кендра): устойчивость, опора, внутренний покой; благоприятно.', 2],
  ['Хозяин лагны в 5-м доме (трикона): удача и милость свыше на стороне вопрошающего; весьма благоприятно.', 2],
  ['Хозяин лагны в 6-м доме: борьба, препятствия, долги или нездоровье; исход добывается через конфликт.', -2],
  ['Хозяин лагны в 7-м доме (кендра): исход зависит от других людей, партнёра, открытого взаимодействия.', 1],
  ['Хозяин лагны в 8-м доме: скрытые препятствия, тревоги и задержки; классически неблагоприятное положение.', -3],
  ['Хозяин лагны в 9-м доме (трикона): дхарма и удача, поддержка старших и учителей; весьма благоприятно.', 3],
  ['Хозяин лагны в 10-м доме (кендра): успех через действие и признание; благоприятно.', 2],
  ['Хозяин лагны в 11-м доме (упачая): исполнение желаний, обретения; очень благоприятно.', 3],
  ['Хозяин лагны в 12-м доме: потери, расходы, отдалённые места; нити дела ускользают из рук вопрошающего.', -3]
];

const KARYESHA_HOUSE = [null,
  ['Карьеша (хозяин дома вопроса) в лагне: предмет вопроса сам «идёт в руки» вопрошающего — сильное обещание успеха.', 3],
  ['Карьеша во 2-м доме: вопрос подкреплён ресурсами; умеренно благоприятно.', 1],
  ['Карьеша в 3-м доме: результат потребует усилий и настойчивости.', 1],
  ['Карьеша в 4-м доме (кендра): дело обретает основание; благоприятно.', 2],
  ['Карьеша в 5-м доме (трикона): удача способствует предмету вопроса; благоприятно.', 2],
  ['Карьеша в 6-м доме: предмет вопроса под ударом — препятствия, противники, болезни.', -2],
  ['Карьеша в 7-м доме (кендра): дело движется через других людей; в целом поддержано.', 1],
  ['Карьеша в 8-м доме: предмет вопроса скрыт, подвержен крушению и задержкам; неблагоприятно.', -3],
  ['Карьеша в 9-м доме (трикона): благословение судьбы на предмете вопроса; благоприятно.', 2],
  ['Карьеша в 10-м доме (кендра): дело получает публичную поддержку и ход; благоприятно.', 2],
  ['Карьеша в 11-м доме: дом обретений — желание исполнится; очень благоприятно.', 3],
  ['Карьеша в 12-м доме: потери и растворение; предмет вопроса утекает.', -2]
];

const MOON_HOUSE = [null,
  ['Луна в лагне прашны: ум вопрошающего целиком в вопросе, вопрос искренний; исход проявится быстро.', 1],
  ['Луна во 2-м доме: мысли о ресурсах и семье; нейтрально-благоприятно.', 0],
  ['Луна в 3-м доме (упачая): решимость растёт; благоприятно.', 1],
  ['Луна в 4-м доме (кендра): глубокая эмоциональная вовлечённость; Луна в кендре поддерживает дело.', 1],
  ['Луна в 5-м доме (трикона): светлые мысли, творческое решение; благоприятно.', 1],
  ['Луна в 6-м доме: ум в тревоге, конфликте или болезни; неблагоприятно (кроме вопросов борьбы).', -2],
  ['Луна в 7-м доме (кендра): мысли о другом человеке; исход зависит от партнёра.', 1],
  ['Луна в 8-м доме: страх и неопределённость в уме; классически дурное место Луны в прашне.', -3],
  ['Луна в 9-м доме (трикона): благочестивый настрой, удача; благоприятно.', 2],
  ['Луна в 10-м доме (кендра, упачая): ум устремлён к делу и успеху; благоприятно.', 2],
  ['Луна в 11-м доме (упачая): ум предвкушает обретение; благоприятно.', 2],
  ['Луна в 12-м доме: рассеянность, сожаления, потери; неблагоприятно.', -2]
];

const CITIES = [
  { name: 'Москва', lat: 55.756, lon: 37.617, tz: 3 },
  { name: 'Санкт-Петербург', lat: 59.939, lon: 30.316, tz: 3 },
  { name: 'Новосибирск', lat: 55.030, lon: 82.920, tz: 7 },
  { name: 'Екатеринбург', lat: 56.839, lon: 60.608, tz: 5 },
  { name: 'Казань', lat: 55.796, lon: 49.106, tz: 3 },
  { name: 'Краснодар', lat: 45.035, lon: 38.975, tz: 3 },
  { name: 'Ростов-на-Дону', lat: 47.222, lon: 39.718, tz: 3 },
  { name: 'Владивосток', lat: 43.116, lon: 131.882, tz: 10 },
  { name: 'Киев', lat: 50.450, lon: 30.524, tz: 3 },
  { name: 'Минск', lat: 53.904, lon: 27.561, tz: 3 },
  { name: 'Алматы', lat: 43.238, lon: 76.945, tz: 5 },
  { name: 'Ташкент', lat: 41.311, lon: 69.280, tz: 5 },
  { name: 'Тбилиси', lat: 41.716, lon: 44.783, tz: 4 },
  { name: 'Ереван', lat: 40.177, lon: 44.513, tz: 4 },
  { name: 'Рига', lat: 56.946, lon: 24.106, tz: 3 },
  { name: 'Берлин', lat: 52.520, lon: 13.405, tz: 2 },
  { name: 'Прага', lat: 50.075, lon: 14.438, tz: 2 },
  { name: 'Белград', lat: 44.787, lon: 20.457, tz: 2 },
  { name: 'Стамбул', lat: 41.008, lon: 28.978, tz: 3 },
  { name: 'Лимасол', lat: 34.685, lon: 33.045, tz: 3 },
  { name: 'Тель-Авив', lat: 32.085, lon: 34.782, tz: 3 },
  { name: 'Дубай', lat: 25.205, lon: 55.271, tz: 4 },
  { name: 'Дели', lat: 28.614, lon: 77.209, tz: 5.5 },
  { name: 'Бангкок', lat: 13.756, lon: 100.502, tz: 7 },
  { name: 'Денпасар (Бали)', lat: -8.650, lon: 115.216, tz: 8 },
  { name: 'Лондон', lat: 51.507, lon: -0.128, tz: 1 },
  { name: 'Нью-Йорк', lat: 40.713, lon: -74.006, tz: -4 }
];

/* ================= РАСЧЁТ КАРТЫ ================= */

function degMin(x) {
  const d = Math.floor(x), mFull = (x - d) * 60, m = Math.floor(mFull), s = Math.round((mFull - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
}
function degMinShort(x) {
  const d = Math.floor(x), m = Math.round((x - d) * 60);
  return `${d}°${String(m).padStart(2, '0')}′`;
}

function siderealLon(tropical, ay) { return Astro.norm360(tropical - ay); }

function bodyTropical(jd, key, year) {
  if (key === 'sun') return Astro.sunLongitude(jd, year);
  if (key === 'moon') return Astro.moonLongitude(jd, year);
  if (key === 'rahu') return Astro.meanRahu(jd, year);
  if (key === 'ketu') return Astro.norm360(Astro.meanRahu(jd, year) + 180);
  return Astro.planetLongitude(jd, key, year);
}

function computeChart(inp) {
  // inp: {y,m,d,hh,mm, tz, lat, lon, ayanType, category, janmaNak (0-26|-1), janmaRashi (0-11|-1), questionText}
  const utHours = inp.hh + inp.mm / 60 - inp.tz;
  const jd = Astro.julianDay(inp.y, inp.m, inp.d, utHours);
  const ay = Astro.ayanamsa(jd, inp.ayanType);
  const year = inp.y;

  const planets = {};
  for (const key of PLANET_KEYS) {
    const trop = bodyTropical(jd, key, year);
    const lon = siderealLon(trop, ay);
    const lonBefore = bodyTropical(jd - 0.5, key, year);
    const lonAfter = bodyTropical(jd + 0.5, key, year);
    let speed = lonAfter - lonBefore;
    while (speed > 180) speed -= 360;
    while (speed < -180) speed += 360;
    planets[key] = {
      key, lon, trop, speed,
      sign: Math.floor(lon / 30),
      deg: lon % 30,
      nak: Math.floor(lon / (360 / 27)),
      pada: Math.floor(lon / (360 / 108)) % 4 + 1,
      navamsaSign: Math.floor(lon / (10 / 3)) % 12,
      retro: key === 'rahu' || key === 'ketu' ? true : speed < 0
    };
  }
  // сожжение
  for (const key of Object.keys(COMBUST_ORB)) {
    let el = Math.abs(planets[key].trop - planets.sun.trop);
    if (el > 180) el = 360 - el;
    planets[key].combust = el < COMBUST_ORB[key];
  }

  const ascTrop = Astro.ascendant(jd, inp.lat, inp.lon);
  const ascLon = siderealLon(ascTrop, ay);
  const asc = {
    lon: ascLon, sign: Math.floor(ascLon / 30), deg: ascLon % 30,
    nak: Math.floor(ascLon / (360 / 27)), pada: Math.floor(ascLon / (360 / 108)) % 4 + 1,
    navamsaSign: Math.floor(ascLon / (10 / 3)) % 12
  };

  // панчанга
  const elong = Astro.norm360(planets.moon.lon - planets.sun.lon);
  const tithiNum = Math.floor(elong / 12) + 1; // 1..30
  const paksha = tithiNum <= 15 ? 'шукла (растущая)' : 'кришна (убывающая)';
  let tithiName;
  const tIdx = (tithiNum - 1) % 15;
  if (tithiNum === 15) tithiName = 'Пурнима (полнолуние)';
  else if (tithiNum === 30) tithiName = 'Амавасья (новолуние)';
  else tithiName = TITHI_NAMES[tIdx];
  const yoga = Math.floor(Astro.norm360(planets.moon.lon + planets.sun.lon) / (360 / 27));
  const kIdx = Math.floor(elong / 6);
  let karana;
  if (kIdx === 0) karana = 'Кимстугхна';
  else if (kIdx >= 57) karana = ['Шакуни', 'Чатушпада', 'Нага'][kIdx - 57];
  else karana = KARANA_MOVABLE[(kIdx - 1) % 7];

  // вара (день недели по восходу)
  const jd0 = Math.floor(jd + 0.5);
  let weekday = (jd0 + 1) % 7; // 0=воскресенье для полудня этого JD
  const sunrise = Astro.sunriseLocalHours(inp.y, inp.m, inp.d, inp.lat, inp.lon, inp.tz);
  const localH = inp.hh + inp.mm / 60;
  // календарный день недели местной даты
  const a = Math.floor((14 - inp.m) / 12), yy = inp.y - a, mm2 = inp.m + 12 * a - 2;
  let wd = (inp.d + yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + Math.floor(31 * mm2 / 12)) % 7; // 0=вс
  let vaaraIdx = wd;
  let vaaraNote = '';
  if (sunrise !== null && localH < sunrise) {
    vaaraIdx = (wd + 6) % 7;
    vaaraNote = ' (вопрос задан до восхода — вара предыдущих суток)';
  }

  // светимость Луны: яркая от ~шукла-аштами до ~кришна-аштами
  const moonBright = elong >= 90 && elong <= 270;

  return {
    inp, jd, ay, planets, asc,
    elong, tithiNum, tithiName, paksha, moonBright,
    yogaName: YOGA_NAMES[yoga], karana,
    vaara: VAARA[vaaraIdx], vaaraNote, sunrise
  };
}

/* ================= ВСПОМОГАТЕЛЬНЫЕ ================= */

function houseOf(chart, key, fromSign) {
  const base = fromSign !== undefined ? fromSign : chart.asc.sign;
  return ((chart.planets[key].sign - base + 12) % 12) + 1;
}
function houseSign(chart, houseNum, fromSign) {
  const base = fromSign !== undefined ? fromSign : chart.asc.sign;
  return (base + houseNum - 1) % 12;
}
function lordOf(signIdx) { return SIGNS[signIdx].lord; }

function dignity(key, signIdx) {
  if (EXALT[key] === signIdx) return { v: 3, t: 'в экзальтации' };
  if ((EXALT[key] + 6) % 12 === signIdx) return { v: -3, t: 'в дебилитации (падении)' };
  if (OWN[key].includes(signIdx)) return { v: 2, t: 'в собственном знаке' };
  const lord = lordOf(signIdx);
  if (lord === key) return { v: 2, t: 'в собственном знаке' };
  if (FRIENDS[key] && FRIENDS[key].includes(lord)) return { v: 1, t: 'в знаке друга' };
  if (ENEMIES[key] && ENEMIES[key].includes(lord)) return { v: -1, t: 'в знаке врага' };
  return { v: 0, t: 'в нейтральном знаке' };
}

function isBenefic(chart, key) {
  if (key === 'jupiter' || key === 'venus') return true;
  if (key === 'moon') return chart.moonBright;
  if (key === 'mercury') {
    // Меркурий бенефик, если не в соединении с естественным малефиком
    const ms = chart.planets.mercury.sign;
    return !NATURAL_MALEFICS.some(k => chart.planets[k].sign === ms);
  }
  return false;
}
function isMalefic(chart, key) {
  if (NATURAL_MALEFICS.includes(key)) return true;
  if (key === 'moon') return !chart.moonBright;
  if (key === 'mercury') return !isBenefic(chart, 'mercury');
  return false;
}

// аспектирует ли планета key знак signIdx (граха-дришти по знакам)
function aspectsSign(chart, key, signIdx) {
  const from = chart.planets[key].sign;
  const diff = ((signIdx - from + 12) % 12) + 1;
  return ASPECTS[key].includes(diff);
}
function occupantsOfSign(chart, signIdx, excl) {
  return PLANET_KEYS.filter(k => chart.planets[k].sign === signIdx && k !== excl);
}

function planetLabel(key) { return PL[key].name; }

/* ================= КЛАССИЧЕСКАЯ ПРАШНА ================= */

function classicalAnalysis(chart) {
  const cat = CATEGORIES[chart.inp.category];
  const F = []; // {text, score}
  const add = (text, score) => F.push({ text, score });

  const ascSign = chart.asc.sign;
  const lagnesha = lordOf(ascSign);
  const karyaHouse = cat.house;
  const karyaSign = houseSign(chart, karyaHouse);
  const karyesha = lordOf(karyaSign);

  // 1. Лагна
  const st = SIGNS[ascSign].type;
  let lagnaText = `Лагна прашны — ${SIGNS[ascSign].name} (${SIGNS[ascSign].sa}), ${SIGN_TYPE[st]} знак: `;
  if (st === 0) lagnaText += 'ситуация подвижна, перемены наступят быстро; благоприятно для вопросов о переменах, дороге, новых делах, выздоровлении.';
  if (st === 1) lagnaText += 'ситуация устойчива, скорых перемен не будет; благоприятно для сохранения существующего (брак, должность, имущество), неблагоприятно для перемен и возврата утраченного.';
  if (st === 2) lagnaText += 'двойственное положение — исход неоднозначен, возможен компромисс или повторение вопроса; часть желаемого исполнится.';
  add(lagnaText, st === 0 ? 1 : 0);

  add(`Восходящая накшатра — ${NAK_NAMES[chart.asc.nak]} (пада ${chart.asc.pada}), класс «${NAK_CLASS[NAK_CLASS_OF[chart.asc.nak]].name}»: ${NAK_CLASS[NAK_CLASS_OF[chart.asc.nak]].text}`, NAK_CLASS[NAK_CLASS_OF[chart.asc.nak]].score);

  // 2. Лагнеша
  const lH = houseOf(chart, lagnesha);
  const ld = dignity(lagnesha, chart.planets[lagnesha].sign);
  add(`${LAGNESHA_HOUSE[lH][0]} (${planetLabel(lagnesha)} — хозяин лагны)`, LAGNESHA_HOUSE[lH][1]);
  add(`Хозяин лагны ${planetLabel(lagnesha)} ${ld.t} (${SIGNS[chart.planets[lagnesha].sign].name}) — ${ld.v > 0 ? 'вопрошающий силён, его позиции прочны' : ld.v < 0 ? 'силы вопрошающего ослаблены' : 'сила вопрошающего средняя'}.`, Math.sign(ld.v) * Math.min(Math.abs(ld.v), 2));
  if (chart.planets[lagnesha].combust) add(`Хозяин лагны сожжён Солнцем — воля вопрошающего подавлена обстоятельствами или начальством.`, -2);
  if (chart.planets[lagnesha].retro && lagnesha !== 'rahu' && lagnesha !== 'ketu') add(`Хозяин лагны ретрограден — вопрошающий возвращается к старому вопросу, возможны пересмотры решений.`, 0);

  // 3. Луна
  const mH = houseOf(chart, 'moon');
  add(`${MOON_HOUSE[mH][0]}`, MOON_HOUSE[mH][1]);
  add(`Луна ${chart.moonBright ? 'светлая (сильная)' : 'тёмная (слабая)'}, пакша — ${chart.paksha}, титхи — ${chart.tithiName}: ${chart.moonBright ? 'ум вопрошающего ясен, поддержка обстоятельств.' : 'ум неустойчив, поддержки меньше; решения лучше перепроверить.'}`, chart.moonBright ? 1 : -1);
  if ([4, 9, 14].includes((chart.tithiNum - 1) % 15 + 1)) add(`Титхи ${chart.tithiName} относится к рикта-титхи («пустым») — начинания на них классически слабы.`, -1);
  if (chart.tithiNum === 30) add('Амавасья (новолуние) — Луна без света: для прашны это серьёзное ослабление вопроса.', -2);
  const moonDig = dignity('moon', chart.planets.moon.sign);
  if (moonDig.v >= 2) add(`Луна ${moonDig.t} — ум вопрошающего опирается на твёрдую почву.`, 1);
  if (moonDig.v === -3) add(`Луна в падении (Скорпион) — внутренняя тревога искажает восприятие ситуации.`, -1);

  // 4. Бенефики/малефики в ключевых домах
  const kendras = [1, 4, 7, 10].map(h => houseSign(chart, h));
  const benInKendra = PLANET_KEYS.filter(k => isBenefic(chart, k) && kendras.includes(chart.planets[k].sign));
  const malInKendra = PLANET_KEYS.filter(k => isMalefic(chart, k) && k !== 'moon' && k !== 'mercury' && kendras.includes(chart.planets[k].sign));
  if (benInKendra.length) add(`Бенефики в кендрах (${benInKendra.map(planetLabel).join(', ')}) — опоры карты заняты благодетелями: защита дела и благоприятный ход событий.`, Math.min(benInKendra.length, 2) + 1);
  if (malInKendra.length) add(`Малефики в кендрах (${malInKendra.map(planetLabel).join(', ')}) — давление обстоятельств на главные опоры вопроса.`, -Math.min(malInKendra.length, 2));
  const benInLagna = occupantsOfSign(chart, ascSign).filter(k => isBenefic(chart, k));
  const malInLagna = occupantsOfSign(chart, ascSign).filter(k => isMalefic(chart, k) && !benInLagna.includes(k));
  if (benInLagna.length) add(`Бенефик в лагне (${benInLagna.map(planetLabel).join(', ')}) — классический знак удачи прашны: «вопрошающий получит желаемое».`, 2);
  if (malInLagna.length) add(`Малефик в лагне (${malInLagna.map(planetLabel).join(', ')}) — преграды у самого порога дела; результат омрачён.`, -2);
  const eighthSign = houseSign(chart, 8);
  const malIn8 = occupantsOfSign(chart, eighthSign).filter(k => isMalefic(chart, k));
  if (malIn8.length) add(`Малефик в 8-м доме (${malIn8.map(planetLabel).join(', ')}) — скрытая угроза делу, возможны потрясения.`, -1);

  // 5. Карья-бхава и карьеша
  if (chart.inp.category !== 'general') {
    add(`Дом вопроса — ${karyaHouse}-й (${SIGNS[karyaSign].name}), его хозяин (карьеша) — ${planetLabel(karyesha)}.`, 0);
    if (karyesha === lagnesha) {
      add('Хозяин лагны и карьеша — одна планета: вопрос и вопрошающий едины, исход в руках самого вопрошающего.', 1);
    } else {
      const kH = houseOf(chart, karyesha);
      add(`${KARYESHA_HOUSE[kH][0]}`, KARYESHA_HOUSE[kH][1]);
      const kd = dignity(karyesha, chart.planets[karyesha].sign);
      add(`Карьеша ${planetLabel(karyesha)} ${kd.t} — ${kd.v > 0 ? 'предмет вопроса крепок' : kd.v < 0 ? 'предмет вопроса ослаблен' : 'сила предмета вопроса средняя'}.`, Math.sign(kd.v));
      // самбандха лагнеша—карьеша
      const ls = chart.planets[lagnesha].sign, ks = chart.planets[karyesha].sign;
      if (ls === ks) add(`Соединение хозяина лагны и карьеши в одном знаке — прочная связь вопрошающего с предметом вопроса: желание исполнится.`, 3);
      else if (lordOf(ls) === karyesha && lordOf(ks) === lagnesha) add('Обмен знаками (паривартана) между лагнешей и карьешей — сильнейшая связь: дело состоится.', 3);
      else {
        const mutual = aspectsSign(chart, lagnesha, ks) && aspectsSign(chart, karyesha, ls);
        if (mutual) add('Взаимный аспект лагнеши и карьеши — связь установлена, вопрос движется к разрешению.', 2);
        else if (aspectsSign(chart, karyesha, ascSign)) add('Карьеша аспектирует лагну — предмет вопроса «смотрит» на вопрошающего: благоприятно.', 2);
        else if (aspectsSign(chart, lagnesha, karyaSign)) add('Лагнеша аспектирует дом вопроса — вопрошающий дотягивается до цели своим усилием.', 1);
        else add('Связи между хозяином лагны и карьешей нет — вопрошающий и предмет вопроса разобщены, без посредника дело буксует.', -2);
      }
      if (chart.planets[karyesha].combust) add('Карьеша сожжён Солнцем — предмет вопроса «выгорает», обещание слабое.', -2);
      if (chart.planets[karyesha].retro && karyesha !== 'rahu' && karyesha !== 'ketu') add('Карьеша ретрограден — задержки, возврат к прежним этапам дела; результат придёт со второй попытки.', -1);
    }
    // кто стоит в доме вопроса и кто его аспектирует
    const occ = occupantsOfSign(chart, karyaSign);
    const benOcc = occ.filter(k => isBenefic(chart, k));
    const malOcc = occ.filter(k => isMalefic(chart, k) && !benOcc.includes(k));
    if (benOcc.length) add(`Бенефики в доме вопроса (${benOcc.map(planetLabel).join(', ')}) — дело питается благом: сильное указание на успех.`, 2);
    if (malOcc.length) add(`Малефики в доме вопроса (${malOcc.map(planetLabel).join(', ')}) — предмет вопроса под давлением: преграды и порча.`, -2);
    const benAsp = PLANET_KEYS.filter(k => isBenefic(chart, k) && aspectsSign(chart, k, karyaSign) && !occ.includes(k));
    const malAsp = PLANET_KEYS.filter(k => isMalefic(chart, k) && !isBenefic(chart, k) && aspectsSign(chart, k, karyaSign) && !occ.includes(k));
    if (benAsp.length) add(`Дом вопроса под аспектом бенефиков (${benAsp.map(planetLabel).join(', ')}) — поддержка со стороны.`, 1);
    if (malAsp.length) add(`Дом вопроса под аспектом малефиков (${malAsp.map(planetLabel).join(', ')}) — вмешательство враждебных сил.`, -1);
    if (chart.planets.moon.sign === karyaSign || aspectsSign(chart, 'moon', karyaSign)) add('Луна связана с домом вопроса — ум вопрошающего точно настроен на дело: вопрос созрел, ответ карты надёжен.', 1);
    // караки
    for (const kk of cat.karakas) {
      const kkH = houseOf(chart, kk);
      const kkd = dignity(kk, chart.planets[kk].sign);
      if ([1, 4, 5, 7, 9, 10, 11].includes(kkH) && kkd.v >= 0) { add(`Карака вопроса ${planetLabel(kk)} в ${kkH}-м доме и не ослаблен — естественный показатель темы поддерживает успех.`, 1); break; }
      if ([6, 8, 12].includes(kkH) || kkd.v < 0) { add(`Карака вопроса ${planetLabel(kk)} ослаблен (${kkH}-й дом${kkd.v < 0 ? ', ' + kkd.t : ''}) — естественный показатель темы страдает.`, -1); break; }
    }
  }

  // 6. Специфика категории
  specialRules(chart, add, cat);

  // 7. День недели
  const vl = chart.vaara.lord;
  const dayBenefic = ['moon', 'mercury', 'jupiter', 'venus'].includes(vl);
  const fightCat = ['court', 'health'].includes(chart.inp.category);
  add(`Вопрос задан в ${chart.vaara.name}${chart.vaaraNote}, управитель дня — ${planetLabel(vl)}: ${dayBenefic ? 'день бенефика поддерживает мирные дела.' : fightCat ? 'день малефика поддерживает вопросы борьбы и преодоления.' : 'день малефика добавляет жёсткости обстоятельствам.'}`, dayBenefic ? 1 : (fightCat ? 1 : -1));
  if (chart.yogaName === 'Вьятипата' || chart.yogaName === 'Вайдхрити') add(`Йога дня — ${chart.yogaName}: классически неблагоприятная, дела на ней вязнут.`, -1);
  if (chart.karana === 'Вишти') add('Карана — Вишти (Бхадра): начатое на ней встречает помехи.', -1);

  // Итог и сроки
  const score = F.reduce((s, f) => s + f.score, 0);
  const moonLeft = 30 - chart.planets.moon.deg;
  const mtype = SIGNS[chart.planets.moon.sign].type;
  const unit = mtype === 0 ? 'дней' : mtype === 2 ? 'недель' : 'месяцев';
  const timing = `Луне осталось пройти ${degMinShort(moonLeft)} в знаке ${SIGNS[chart.planets.moon.sign].name} (${SIGN_TYPE[mtype]}): ориентир срока проявления результата — около ${Math.max(1, Math.round(moonLeft))} ${unit} (условная прашна-мера; уточняется по транзитам).`;

  return { factors: F, score, lagnesha, karyesha, karyaHouse, karyaSign, timing };
}

function specialRules(chart, add, cat) {
  const c = chart.inp.category;
  const ascSign = chart.asc.sign;
  if (c === 'marriage') {
    const v = chart.planets.venus;
    if (v.combust) add('Венера (карака брака) сожжена — чувства и притяжение ослаблены, союз под вопросом или откладывается.', -2);
    if (houseOf(chart, 'venus') === 7) add('Венера в 7-м доме прашны — прямое обещание союза.', 2);
    if (dignity('venus', v.sign).v >= 2) add('Венера сильна по знаку — любовь и согласие имеют опору.', 1);
  }
  if (c === 'children') {
    const jH = houseOf(chart, 'jupiter');
    if ([1, 5, 9].includes(jH)) add(`Юпитер (карака детей) в ${jH}-м доме — сильное обещание потомства/успеха детей.`, 2);
    if (dignity('jupiter', chart.planets.jupiter.sign).v < 0 || chart.planets.jupiter.combust) add('Юпитер ослаблен или сожжён — тема детей требует времени и ремонта (упай).', -1);
  }
  if (c === 'health') {
    const l8 = lordOf(houseSign(chart, 8));
    if (houseOf(chart, l8) === 1) add('Хозяин 8-го дома в лагне — болезнь «сидит» на вопрошающем: затяжное течение.', -2);
    if (houseOf(chart, lordOf(ascSign)) === 8) add('Хозяин лагны в 8-м — жизненная сила истощена; нужен серьёзный уход.', -2);
    const benInLagna = occupantsOfSign(chart, ascSign).some(k => isBenefic(chart, k));
    if (benInLagna) add('Бенефик в лагне при вопросе о болезни — выздоровление обещано.', 2);
    if (SIGNS[ascSign].type === 0) add('Подвижная лагна при болезни — состояние быстро изменится (при прочих благих знаках — к выздоровлению).', 1);
    if (SIGNS[ascSign].type === 1) add('Фиксированная лагна при болезни — состояние затягивается.', -1);
  }
  if (c === 'court') {
    const opp = lordOf(houseSign(chart, 7));
    const me = lordOf(ascSign);
    const myS = dignity(me, chart.planets[me].sign).v + ([1, 4, 7, 10, 5, 9, 11].includes(houseOf(chart, me)) ? 1 : 0);
    const opS = dignity(opp, chart.planets[opp].sign).v + ([1, 4, 7, 10, 5, 9, 11].includes(houseOf(chart, opp)) ? 1 : 0);
    if (me === opp) add('Лагной и 7-м домом управляет одна планета — спор разрешится примирением/договором.', 1);
    else if (myS > opS) add(`Хозяин лагны (${planetLabel(me)}) сильнее хозяина 7-го (${planetLabel(opp)}) — перевес на стороне вопрошающего: победа достижима.`, 2);
    else if (opS > myS) add(`Хозяин 7-го (${planetLabel(opp)}) сильнее хозяина лагны — противник в более сильной позиции.`, -2);
    else add('Силы сторон равны — исход решат детали и посредники.', 0);
    const malIn6 = occupantsOfSign(chart, houseSign(chart, 6)).filter(k => isMalefic(chart, k));
    if (malIn6.length) add('Малефик в 6-м доме — враг повержен/ослаблен: благоприятно для борьбы.', 1);
  }
  if (c === 'lost') {
    add(`Указание направления (по знаку лагны ${SIGNS[ascSign].name}): искать в стороне «${SIGNS[ascSign].dir}» от места пропажи.`, 0);
    const mH = houseOf(chart, 'moon');
    if ([1, 4, 7, 10].includes(mH)) add('Луна в кендре — вещь недалеко, в пределах дома/знакомого места.', 1);
    else if ([3, 6, 9, 12].includes(mH)) add('Луна в апоклиме (3/6/9/12) — вещь далеко или сменила несколько мест.', -1);
    const l11 = lordOf(houseSign(chart, 11));
    if (chart.planets[l11].sign === chart.planets[lordOf(ascSign)].sign || aspectsSign(chart, l11, ascSign)) add('Хозяин 11-го (возврат обретений) связан с лагной — вещь вернётся.', 2);
    if (SIGNS[ascSign].type === 1) add('Фиксированная лагна — вещь лежит на месте, её не унесли далеко.', 1);
    if (SIGNS[ascSign].type === 0) add('Подвижная лагна — вещь перемещается (могла быть унесена).', -1);
  }
  if (c === 'travel') {
    if (SIGNS[ascSign].type === 0 || SIGNS[chart.planets.moon.sign].type === 0) add('Лагна или Луна в подвижном знаке — дорога состоится.', 2);
    if (SIGNS[ascSign].type === 1 && SIGNS[chart.planets.moon.sign].type === 1) add('И лагна, и Луна в фиксированных знаках — поездка откладывается или не состоится.', -2);
  }
  if (c === 'career') {
    const tenth = houseSign(chart, 10);
    const sunD = dignity('sun', chart.planets.sun.sign);
    if (occupantsOfSign(chart, tenth).length === 0 && !PLANET_KEYS.some(k => aspectsSign(chart, k, tenth) && isBenefic(chart, k))) add('10-й дом пуст и без аспекта бенефика — делу не хватает покровителя; продвижение медленное.', -1);
    if (sunD.v >= 1 && [1, 4, 7, 10, 11].includes(houseOf(chart, 'sun'))) add('Солнце (карака власти) сильно и в видном доме — поддержка начальства/статуса.', 1);
  }
  if (c === 'wealth') {
    const l2 = lordOf(houseSign(chart, 2)), l11 = lordOf(houseSign(chart, 11));
    if (chart.planets[l2].sign === chart.planets[l11].sign) add('Хозяева 2-го и 11-го соединены — канал дохода открыт: деньги придут.', 2);
    if (houseOf(chart, l11) === 12) add('Хозяин 11-го в 12-м — прибыль утекает в расходы.', -1);
  }
}

/* ================= ЧАНДРА ЧАКРА ПРАШНА ================= */

// Чандра Каланала Чакра: 28 накшатр (включая Абхиджит).
// Накшатра транзитной Луны прашны — на вершине трезубца (позиция 1), остальные по часовой стрелке.
// Зоны: зубцы трезубцев — крайне неблагоприятно; внутри круга — благоприятно; вне круга — средне.
// Второй метод: накшатра Луны прашны или хозяина лагны на 8/15/22-й позиции от накшатры рождения — ответ отрицательный.
function chandraAnalysis(chart) {
  const F = [];
  const add = (text, score) => F.push({ text, score });
  const moon28 = lonToNak28(chart.planets.moon.lon);
  const lagnesha = lordOf(chart.asc.sign);
  const lagneshaNak28 = lonToNak28(chart.planets[lagnesha].lon);
  const janma28 = chart.inp.janmaNak;

  if (janma28 < 0) {
    return { available: false, moon28, factors: [], score: 0 };
  }

  add(`Накшатра транзитной Луны прашны — ${NAK28_NAMES[moon28]} (№${moon28 + 1} из 28): она встаёт на вершину трезубца (позиция 1), остальные 27 стоянок, включая Абхиджит, располагаются по кругу по часовой стрелке.`, 0);

  // Основной метод: куда попадает накшатра Луны рождения
  const posJ = ((janma28 - moon28 + 28) % 28) + 1;
  const zone = kalanalaZone(posJ);
  let zoneScore;
  if (zone === 'trident') {
    zoneScore = -3;
    add(`Накшатра Луны рождения (${NAK28_NAMES[janma28]}) занимает позицию ${posJ} — зубец трезубца: крайне неблагоприятно. День сулит потери, подчинение обстоятельствам, поражение; важные шаги по вопросу лучше отложить.`, zoneScore);
  } else if (zone === 'inside') {
    zoneScore = 2;
    add(`Накшатра Луны рождения (${NAK28_NAMES[janma28]}) занимает позицию ${posJ} — внутри круга: благоприятно. День обещает приобретения, комфорт и победу в спрошенном деле.`, zoneScore);
  } else {
    zoneScore = 0;
    add(`Накшатра Луны рождения (${NAK28_NAMES[janma28]}) занимает позицию ${posJ} — вне круга: средние результаты. День нейтрален, исход определят остальные факторы карты.`, zoneScore);
  }

  // Второй метод: 8/15/22 от накшатры рождения
  const negPos = [8, 15, 22];
  const posMoon = ((moon28 - janma28 + 28) % 28) + 1;
  if (negPos.includes(posMoon)) {
    add(`Второй метод: накшатра Луны прашны (${NAK28_NAMES[moon28]}) — ${posMoon}-я от накшатры Луны рождения. Позиции 8, 15 и 22 запретны: ответ на вопрос — отрицательный.`, -3);
  } else {
    add(`Второй метод: накшатра Луны прашны (${NAK28_NAMES[moon28]}) — ${posMoon}-я от накшатры Луны рождения; на запретные позиции (8, 15, 22) не попадает — отрицания ответа нет.`, 0);
  }
  const posLL = ((lagneshaNak28 - janma28 + 28) % 28) + 1;
  if (negPos.includes(posLL)) {
    add(`Накшатра хозяина лагны (${planetLabel(lagnesha)} в ${NAK28_NAMES[lagneshaNak28]}) — ${posLL}-я от накшатры Луны рождения: запретная позиция, ответ на вопрос — отрицательный.`, -3);
  } else {
    add(`Накшатра хозяина лагны (${planetLabel(lagnesha)} в ${NAK28_NAMES[lagneshaNak28]}) — ${posLL}-я от накшатры Луны рождения: запретные позиции (8, 15, 22) не задеты.`, 0);
  }

  add('Указание чакры реализуется в течение 72 часов от момента прашны.', 0);

  // Дополнение: классическая тара-бала (по 27 стоянкам; для Абхиджит не считается)
  if (janma28 !== 21) {
    const janma27 = janma28 < 21 ? janma28 : janma28 - 1;
    const count = ((chart.planets.moon.nak - janma27 + 27) % 27) + 1;
    const tara = TARAS[(count - 1) % 9];
    add(`Дополнительно, тара-бала (27 стоянок): накшатра Луны прашны — ${count}-я от накшатры Луны рождения, это ${tara.name}: ${tara.text}`, tara.good ? 1 : -1);
  }

  const score = F.reduce((s, f) => s + f.score, 0);
  return { available: true, factors: F, score, moon28, janma28, posJ, zone, posMoon, posLL, lagnesha, lagneshaNak28 };
}

/* ---------- Колесо Чандра Каланала Чакры (SVG) ---------- */
const ZONE_FILL = { trident: '#e7c0b2', inside: '#cfe0c5', outside: '#efe8d9' };

function renderKalanalaWheel(moon28, janma28) {
  const cx = 240, cy = 240, r1 = 64, r2 = 212;
  const step = 360 / 28;
  const pt = (r, a) => { const t = a * Math.PI / 180; return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; };
  let svg = `<svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg">`;
  for (let k = 1; k <= 28; k++) {
    const a0 = (k - 1.5) * step, a1 = (k - 0.5) * step, ac = (k - 1) * step;
    const [x1, y1] = pt(r1, a0), [x2, y2] = pt(r2, a0), [x3, y3] = pt(r2, a1), [x4, y4] = pt(r1, a1);
    const zone = kalanalaZone(k);
    const isJanma = janma28 >= 0 && k === ((janma28 - moon28 + 28) % 28) + 1;
    svg += `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${r2},${r2} 0 0 1 ${x3.toFixed(1)},${y3.toFixed(1)} L${x4.toFixed(1)},${y4.toFixed(1)} A${r1},${r1} 0 0 0 ${x1.toFixed(1)},${y1.toFixed(1)} Z"
      fill="${ZONE_FILL[zone]}" stroke="${isJanma ? '#8a3b24' : '#d9cfbd'}" stroke-width="${isJanma ? 3 : 1}"/>`;
    // подпись вдоль радиуса
    const nakIdx = (moon28 + k - 1) % 28;
    const [tx, ty] = pt((r1 + r2) / 2, ac);
    let rot = ac - 90;
    if (ac > 90 && ac < 270) rot += 180;
    const label = `${k}. ${NAK28_SHORT[nakIdx]}${k === 1 ? ' ☾' : ''}`;
    svg += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})"
      text-anchor="middle" dominant-baseline="middle" font-size="10.5" ${isJanma ? 'font-weight="bold"' : ''}
      fill="${zone === 'trident' ? '#8a3b24' : zone === 'inside' ? '#3f7a4e' : '#9c6a4d'}">${label}</text>`;
  }
  svg += `<circle cx="${cx}" cy="${cy}" r="${r1 - 6}" fill="#f6f1e8" stroke="#d9cfbd"/>
    <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="12" fill="#b08163">Луна прашны</text>
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#8a3b24">${NAK28_SHORT[moon28]}</text>
    <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="14" fill="#8a3b24">☾</text></svg>`;
  return `<div class="wheel-wrap">${svg}
    <div class="wheel-legend">
      <span><span class="sw" style="background:${ZONE_FILL.trident}"></span>зубцы трезубцев — крайне неблагоприятно</span>
      <span><span class="sw" style="background:${ZONE_FILL.inside}"></span>внутри круга — благоприятно</span>
      <span><span class="sw" style="background:${ZONE_FILL.outside}"></span>вне круга — средне</span>
      <span><span class="sw" style="border:2px solid #8a3b24"></span>накшатра Луны рождения</span>
    </div></div>`;
}

/* ================= ВЕРДИКТЫ ================= */

function verdict(score) {
  if (score >= 6) return { label: 'Весьма благоприятный исход', cls: 'good', pct: 90 };
  if (score >= 2) return { label: 'Скорее благоприятно', cls: 'good', pct: 70 };
  if (score >= -1) return { label: 'Смешанные указания, исход неопределён', cls: 'mixed', pct: 50 };
  if (score >= -5) return { label: 'Скорее неблагоприятно', cls: 'bad', pct: 30 };
  return { label: 'Неблагоприятный исход', cls: 'bad', pct: 12 };
}

/* ================= ОТРИСОВКА ================= */

const GRID_POS = { 11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 10: [1, 0], 3: [1, 3], 9: [2, 0], 4: [2, 3], 8: [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3] };

function renderChart(title, getSign, chart, baseSign, useNavamsa, centerLabel) {
  // baseSign — знак 1-го дома (для нумерации домов); getSign(key) — знак планеты
  let cells = Array.from({ length: 4 }, () => Array(4).fill(null));
  for (let s = 0; s < 12; s++) {
    const [r, c] = GRID_POS[s];
    cells[r][c] = { sign: s, items: [] };
  }
  const ascSign = useNavamsa ? chart.asc.navamsaSign : chart.asc.sign;
  for (const key of PLANET_KEYS) {
    const s = getSign(key);
    const [r, c] = GRID_POS[s];
    const p = chart.planets[key];
    let lbl = PL[key].abbr;
    if (!useNavamsa) lbl += ` ${Math.floor(p.deg)}°`;
    if (p.retro && key !== 'rahu' && key !== 'ketu') lbl += ' ↺';
    if (p.combust) lbl += ' ☉';
    cells[r][c].items.push({ lbl, mal: isMalefic(chart, key) && !isBenefic(chart, key) });
  }
  let html = `<div class="chart-block"><div class="chart-title">${title}</div><div class="schart">`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if ((r === 1 || r === 2) && (c === 1 || c === 2)) {
      if (r === 1 && c === 1) html += `<div class="scell center" style="grid-area:2/2/4/4"><span>${centerLabel || title}</span></div>`;
      continue;
    }
    const cell = cells[r][c];
    const houseNum = ((cell.sign - baseSign + 12) % 12) + 1;
    const isAsc = cell.sign === ascSign;
    html += `<div class="scell${isAsc ? ' asc' : ''}"><span class="sgn">${SIGNS[cell.sign].abbr}</span><span class="hn">${houseNum}</span>`;
    if (isAsc) html += `<span class="lg">Лг</span>`;
    html += `<div class="pl">${cell.items.map(i => `<span class="${i.mal ? 'm' : 'b'}">${i.lbl}</span>`).join(' ')}</div></div>`;
  }
  html += '</div></div>';
  return html;
}

function renderPlanetTable(chart) {
  let rows = '';
  const ascRow = chart.asc;
  rows += `<tr><td>Лагна</td><td>${SIGNS[ascRow.sign].name}</td><td>${degMin(ascRow.deg)}</td><td>${NAK_NAMES[ascRow.nak]} ${ascRow.pada}</td><td>${planetLabel(NAK_LORDS[ascRow.nak % 9])}</td><td>${SIGNS[ascRow.navamsaSign].name}</td><td>—</td></tr>`;
  for (const key of PLANET_KEYS) {
    const p = chart.planets[key];
    const flags = [];
    if (p.retro && key !== 'rahu' && key !== 'ketu') flags.push('ретро');
    if (key === 'rahu' || key === 'ketu') flags.push('ретро (узел)');
    if (p.combust) flags.push('сожжён');
    const d = dignity(key, p.sign);
    if (Math.abs(d.v) >= 2) flags.push(d.t);
    rows += `<tr><td>${PL[key].name}</td><td>${SIGNS[p.sign].name}</td><td>${degMin(p.deg)}</td><td>${NAK_NAMES[p.nak]} ${p.pada}</td><td>${planetLabel(NAK_LORDS[p.nak % 9])}</td><td>${SIGNS[p.navamsaSign].name}</td><td>${flags.join(', ') || '—'}</td></tr>`;
  }
  return `<table class="ptable"><thead><tr><th>Точка</th><th>Знак</th><th>Градус</th><th>Накшатра / пада</th><th>Упр. накшатры</th><th>Навамша</th><th>Особенности</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderFactors(factors) {
  const good = factors.filter(f => f.score > 0);
  const bad = factors.filter(f => f.score < 0);
  const neutral = factors.filter(f => f.score === 0);
  let html = '';
  const block = (title, arr, cls) => {
    if (!arr.length) return '';
    return `<div class="fgroup ${cls}"><h4>${title}</h4><ul>` +
      arr.map(f => `<li>${f.text} <span class="w">${f.score > 0 ? '+' + f.score : f.score || ''}</span></li>`).join('') + '</ul></div>';
  };
  html += block('Благоприятные указания', good, 'fg-good');
  html += block('Неблагоприятные указания', bad, 'fg-bad');
  html += block('Нейтральные и описательные указания', neutral, 'fg-neutral');
  return html;
}

function renderVerdict(v, score, title) {
  return `<div class="verdict ${v.cls}">
    <div class="vlabel">${title}: <b>${v.label}</b> <span class="score">(баланс указаний: ${score > 0 ? '+' + score : score})</span></div>
    <div class="vbar"><div class="vfill" style="width:${v.pct}%"></div></div>
  </div>`;
}

/* ================= UI ================= */

function $(id) { return document.getElementById(id); }

function initUI() {
  // город — текстовое поле с datalist
  const cityInput = $('city');
  cityInput.addEventListener('change', () => {
    const c = CITIES.find(x => x.name === cityInput.value.trim());
    if (c) { $('lat').value = c.lat; $('lon').value = c.lon; $('tz').value = c.tz; }
  });
  // текущее время и часовой пояс браузера
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  $('dt').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $('tz').value = -now.getTimezoneOffset() / 60;
  // координаты из кэша
  try {
    const saved = JSON.parse(localStorage.getItem('prashna_loc') || 'null');
    if (saved) { $('lat').value = saved.lat; $('lon').value = saved.lon; }
  } catch (e) { }
  // кнопка геолокации — только по явному нажатию пользователя
  $('geoBtn').addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Геолокация не поддерживается вашим браузером'); return; }
    $('geoBtn').textContent = '⏳ Определяю...';
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      $('lat').value = lat.toFixed(3);
      $('lon').value = lon.toFixed(3);
      // обратное геокодирование через OpenStreetMap Nominatim (любой нас. пункт)
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ru`, {
        headers: { 'User-Agent': 'PrashnaDjyotish/1.0' }
      })
        .then(r => r.json())
        .then(d => {
          const a = d.address || {};
          const place = a.village || a.hamlet || a.suburb || a.town || a.city ||
                        a.municipality || a.county || (d.display_name || '').split(',')[0].trim();
          if (place) $('city').value = place;
        })
        .catch(() => {})
        .finally(() => { $('geoBtn').textContent = '📍 Моё место'; });
    }, () => {
      $('geoBtn').textContent = '📍 Моё место';
      alert('Не удалось определить местоположение. Разрешите доступ к геолокации в настройках браузера.');
    });
  });
  $('calc').addEventListener('click', calculate);
  $('printBtn').addEventListener('click', () => window.print());
}

function calculate() {
  const dt = $('dt').value;
  if (!dt) { alert('Укажите дату и время вопроса'); return; }
  const [datePart, timePart] = dt.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const inp = {
    y, m, d, hh, mm,
    tz: parseFloat($('tz').value),
    lat: parseFloat($('lat').value),
    lon: parseFloat($('lon').value),
    ayanType: $('ayan').value,
    category: $('category').value,
    janmaNak: parseInt($('janmaNak').value, 10),
    questionText: $('qtext').value.trim()
  };
  if (isNaN(inp.lat) || isNaN(inp.lon) || isNaN(inp.tz)) { alert('Укажите широту, долготу и смещение UTC (или выберите город)'); return; }
  try { localStorage.setItem('prashna_loc', JSON.stringify({ lat: inp.lat, lon: inp.lon, tz: inp.tz })); } catch (e) { }

  const chart = computeChart(inp);
  const cls = classicalAnalysis(chart);
  const ch = chandraAnalysis(chart);

  // Шапка
  const pad = n => String(n).padStart(2, '0');
  $('repHead').innerHTML = `
    <h2>Прашна-карта</h2>
    ${inp.questionText ? `<p class="q">«${inp.questionText}»</p>` : ''}
    <p class="meta">Тема: <b>${CATEGORIES[inp.category].name}</b> · ${pad(d)}.${pad(m)}.${y} ${pad(hh)}:${pad(mm)} (UTC${inp.tz >= 0 ? '+' : ''}${inp.tz}) ·
    ${inp.lat.toFixed(2)}°, ${inp.lon.toFixed(2)}° · аянамша ${$('ayan').selectedOptions[0].text}: ${degMin(chart.ay % 30)} </p>
    <p class="meta">Панчанга: ${chart.vaara.name}${chart.vaaraNote} (упр. ${planetLabel(chart.vaara.lord)}) · титхи ${chart.tithiName} (${chart.paksha}) ·
    накшатра Луны ${NAK_NAMES[chart.planets.moon.nak]} · йога ${chart.yogaName} · карана ${chart.karana}${chart.sunrise !== null ? ' · восход ' + pad(Math.floor(chart.sunrise)) + ':' + pad(Math.round((chart.sunrise % 1) * 60)) : ''}</p>`;

  // Карты
  $('charts').innerHTML =
    renderChart('Раши (D1)', k => chart.planets[k].sign, chart, chart.asc.sign, false) +
    renderChart('Навамша (D9)', k => chart.planets[k].navamsaSign, chart, chart.asc.navamsaSign, true);
  $('ptableWrap').innerHTML = renderPlanetTable(chart);

  // Классическая прашна
  const v1 = verdict(cls.score);
  $('classical').innerHTML = `
    <h2>I. Классическая прашна</h2>
    <p class="lead">Лагна — ${SIGNS[chart.asc.sign].name} ${degMin(chart.asc.deg)}, хозяин лагны — ${planetLabel(cls.lagnesha)};
    дом вопроса — ${cls.karyaHouse}-й (${SIGNS[cls.karyaSign].name}), карьеша — ${planetLabel(cls.karyesha)}.</p>
    ${renderFactors(cls.factors)}
    ${renderVerdict(v1, cls.score, 'Вердикт классической прашны')}
    <p class="timing">⏳ ${cls.timing}</p>`;

  // Чандра Каланала Чакра
  if (ch.available) {
    const v2 = verdict(ch.score);
    $('chandra').innerHTML = `
      <h2>II. Чандра чакра прашна (Чандра Каланала Чакра, 28 накшатр)</h2>
      ${renderKalanalaWheel(ch.moon28, ch.janma28)}
      ${renderFactors(ch.factors)}
      ${renderVerdict(v2, ch.score, 'Вердикт Чандра чакры')}`;
    // Сводный итог
    const total = Math.round(cls.score * 0.6 + ch.score * 0.4);
    const v3 = verdict(total);
    let agree;
    if (v1.cls === v2.cls) agree = 'Оба метода согласуются — ответу можно доверять с большей уверенностью.';
    else if ((v1.cls === 'good' && v2.cls === 'bad') || (v1.cls === 'bad' && v2.cls === 'good')) agree = 'Методы прямо противоречат друг другу: классическая карта и Чандра чакра дают противоположные ответы — вопрос либо задан преждевременно, либо исход неустойчив. Рекомендуется повторить прашну позже.';
    else agree = 'Один из методов даёт определённый ответ, другой — нейтральный: опирайтесь на более выраженное указание, учитывая оговорки нейтрального.';
    $('summary').innerHTML = `
      <h2>III. Сводное заключение</h2>
      ${renderVerdict(v3, total, 'Общий итог (классика 60% + Чандра чакра 40%)')}
      <p>${agree}</p>`;
  } else {
    $('chandra').innerHTML = `
      <h2>II. Чандра чакра прашна (Чандра Каланала Чакра, 28 накшатр)</h2>
      ${renderKalanalaWheel(ch.moon28, -1)}
      <p class="lead">Чтобы построить чтение чакры, укажите накшатру Луны при рождении вопрошающего — её положение относительно транзитной Луны (вершина трезубца) даёт ответ.</p>`;
    $('summary').innerHTML = `
      <h2>III. Сводное заключение</h2>
      ${renderVerdict(v1, cls.score, 'Общий итог (только классическая прашна)')}
      <p>Чандра чакра не учитывалась: не указана накшатра Луны при рождении вопрошающего.</p>`;
  }

  $('report').style.display = 'block';
  $('report').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', initUI);
