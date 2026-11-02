/*!
 * poubelle-card — animated Lovelace card for bin collection days
 * https://github.com/Roving-Ronin/ha-garbage-card — MIT License
 * Based on skyrotter/ha-poubelle-card.
 */
import { PB_IMG, PB_BINS, PB_BODY_RATIO, PB_WHEEL_HOLE, PB_BAG_COLORS, pbBagSvg, PB_BULKY_SVG, PB_CONTENT,
  PB_FX_FLY, PB_FX_STINK, PB_FX_SPARK } from './assets.js';
import { normalizeConfig, BINS, HOLIDAY_MODES, HOLIDAY_NEEDS_WORKDAY } from './normalize.js';
import { buildRule, computeFixed, midnight, addDays, dayKey, daysBetween, parseDate, weekdayIdx } from './schedule.js';
import { cardLanguage, haLanguage, resolveLang, t, weekdayName, shortDate } from './localize.js';
import { findCalendar, calendarDays } from './calendars.js';
import './editor.js';

const PB_VERSION = __VERSION__;
const CONTENT_ALIASES = { ordures: 'rubbish', recyclables: 'recycling', verre: 'glass', papier: 'paper', biodechets: 'organics' };
/* internal state → CSS class (French class names kept so existing card-mod styles still apply) */
const STATE_CLASS = { eve: 'veille', today: 'jour', emptied: 'videe', unknown: '', '': '' };

class PoubelleCard extends HTMLElement {
  static getStubConfig() { return { bin: 'yellow', days: [1], hour: 9 }; }
  static getConfigElement() { return document.createElement('poubelle-card-editor'); }

  setConfig(raw) {
    const err = (key, vars) => new Error('poubelle-card: ' + t(resolveLang(raw?.language && raw.language !== 'auto' ? raw.language : haLanguage(this._hass)), `errors.${key}`, vars));
    if (!raw) throw err('bin_required', { bins: BINS.join(', ') });
    let c = normalizeConfig(raw);
    // bulky waste: no bin colour needed, grey meter by default
    if (!c.bin && c.container === 'bulky') c = { ...c, bin: 'grey' };
    if (!c.bin) throw err('bin_required', { bins: BINS.join(', ') });
    if (!PB_BINS[c.bin]) throw err('bin_unknown', { bin: raw.bin, bins: BINS.join(', ') });
    if (c.holidays && !HOLIDAY_MODES.includes(c.holidays)) throw err('holidays_unknown', { value: raw.holidays, values: HOLIDAY_MODES.join(', ') });
    if (c.start_date != null && c.start_date !== '' && !parseDate(c.start_date)) throw err('start_date_invalid');
    const rule = buildRule(c);
    if (!c.entity && !rule.mday.length && !rule.days.length) throw err('schedule_required');
    this._rule = rule;
    this._bin = c.bin;
    this._bag = c.container === 'bag';
    this._bulky = c.container === 'bulky';
    this._c = Object.assign({ hour: 9, interval: 7, scale: 0.62, headroom: 70, language: 'auto' }, c);
    this._cal = null; this._calAt = 0; this._calKey = null;
    this._hol = null; this._work = null; this._holKey = null;
    this._build();
    this._loadCal(true);
    this._loadHolidays();
  }

  set hass(h) {
    const old = this._hass;
    this._hass = h;
    const e = this._c && this._c.entity;
    if (e && (!old || old.states[e] !== h.states[e])) this._loadCal(true);
    if (!old || old.entities !== h.entities) this._loadHolidays();
    if (!old || (e && old.states[e] !== h.states[e]) || (old.locale?.language !== h.locale?.language)) this._render();
  }

  /* calendar.* entity: HA's state only shows the next event (any title), so read the events of the
     past and next 60 days (calendar.get_events) to filter by title and base the fill on the real last pickup. */
  async _loadCal(force) {
    const c = this._c, e = c && c.entity, h = this._hass;
    if (!h || !e || !e.startsWith('calendar.') || !h.callWS) return;
    const key = `${e}|${[].concat(c.calendar_filter ?? []).join('|')}|${c.calendar_offset ?? 0}`;
    if (!force && this._calKey === key && Date.now() - this._calAt < 30 * 60000) return;
    this._calKey = key; this._calAt = Date.now();
    const start = midnight(new Date()); start.setDate(start.getDate() - 60);
    const end = new Date(start); end.setDate(end.getDate() + 121);
    try {
      const r = await h.callWS({ type: 'call_service', domain: 'calendar', service: 'get_events', target: { entity_id: e },
        service_data: { start_date_time: start.toISOString(), end_date_time: end.toISOString() }, return_response: true });
      const words = [].concat(c.calendar_filter ?? []).map(w => String(w).trim().toLowerCase()).filter(Boolean);
      const evs = (r?.response?.[e]?.events || []).filter(ev => !words.length
        || words.some(w => String(ev.summary || '').toLowerCase().includes(w)));
      // all-day event: "2026-11-03" must stay a local date (otherwise UTC shifts it)
      this._cal = evs.map(ev => addDays(parseDate(String(ev.start?.date || ev.start?.dateTime || ev.start || '')) || new Date(NaN), c.calendar_offset))
        .filter(d => !isNaN(d));
    } catch (err) { this._cal = null; } // service unavailable: fall back to the entity's start_time
    this._render();
  }

  /* Holiday and Workday calendars (configured, or found automatically from the entity registry). */
  _calendars() {
    const c = this._c, h = this._hass, mode = this._rule?.holidays || 'none';
    if (!h || c.entity || mode === 'none') return { holiday: null, workday: null };
    return {
      holiday: c.holiday_calendar || findCalendar(h, 'holiday'),
      workday: HOLIDAY_NEEDS_WORKDAY.has(mode) ? (c.workday_calendar || findCalendar(h, 'workday')) : null,
    };
  }

  async _loadHolidays() {
    const h = this._hass; if (!h || !this._c) return;
    const { holiday, workday } = this._calendars();
    const key = `${holiday}|${workday}|${dayKey(new Date())}`;
    if (key === this._holKey) return;
    this._holKey = key;
    const [hol, work] = await Promise.all([calendarDays(h, holiday), calendarDays(h, workday)]);
    if (key !== this._holKey) return; // config changed meanwhile
    this._hol = hol; this._work = work;
    this._render();
  }

  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 'auto', min_columns: 3 }; }
  connectedCallback() {
    clearInterval(this._t);
    this._t = setInterval(() => { this._loadCal(); this._loadHolidays(); this._render(); }, 60000);
    this._render();
  }
  disconnectedCallback() { clearInterval(this._t); }

  _lang() { return cardLanguage(this._c?.language, this._hass); }

  _build() {
    const c = this._c, s = Number(c.scale), hr = Number(c.headroom ?? 70), B = PB_BINS[this._bin];
    const color = c.color || B.color;
    const content = PB_CONTENT[CONTENT_ALIASES[c.content] || c.content] || PB_CONTENT[B.content];
    // full_color : tout le bac prend la couleur (et pas seulement le couvercle). Une couche de la couleur,
    // découpée à la forme du corps, colorise le gris en gardant ses ombres et ses reflets (mix-blend-mode: color).
    const img = String(c.image || '').trim();
    const paint = c.full_color && !this._bag && !this._bulky && !img ? (c.body_color || B.paint || '') : '';
    // dark colours (burgundy) darken the grey body under the paint, which only sets hue and saturation
    const bodyF = c.body_filter || (paint && !c.body_color && B.paintBody) || B.body || '', lidF = c.lid_filter || B.lid || '';
    const [bagCol, bagOp] = PB_BAG_COLORS[this._bin];
    const bodyImg = PB_IMG[B.img].body;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>
    :host{display:block}
    ha-card{background:var(--poubelle-card-background,linear-gradient(170deg,rgba(30,36,56,.75),rgba(20,24,38,.7)));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--poubelle-card-border-color,rgba(255,255,255,.08));border-radius:var(--ha-card-border-radius,22px);padding:12px 12px 14px;display:grid;gap:8px;justify-items:center;overflow:hidden;transition:box-shadow .6s,border-color .6s;animation:fadeUp .6s ease both;color:var(--poubelle-card-text-color,#eef1f8)}
    ${c.theme_background ? 'ha-card{background:var(--ha-card-background,var(--card-background-color));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color));color:var(--primary-text-color)}'
      // fond du thème (souvent clair) : textes des badges mélangés à la couleur de texte du thème, lisibles en clair comme en sombre
      // (préfixe ha-card : passe devant les règles .pill plus bas)
      + 'ha-card .pill{color:var(--poubelle-card-secondary-color,var(--secondary-text-color))}'
      + 'ha-card .pill.veille{color:color-mix(in srgb,#ff5a4e 65%,var(--primary-text-color))}ha-card .pill.jour{color:color-mix(in srgb,#3d7bff 65%,var(--primary-text-color))}ha-card .pill.videe{color:color-mix(in srgb,#3a9b3e 65%,var(--primary-text-color))}' : ''}
    ha-card.clickable{cursor:pointer}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    .card.veille{border-color:rgba(255,90,78,.55);box-shadow:0 0 0 1px rgba(255,90,78,.25),0 10px 34px rgba(255,90,78,.18)}
    .card.videe{border-color:rgba(76,175,80,.5);box-shadow:0 10px 34px rgba(76,175,80,.16)}
    .head{width:100%;display:flex;justify-content:space-between;align-items:center;gap:6px}
    .name{font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pill{font-weight:600;font-size:11px;padding:4px 8px;border-radius:999px;background:rgba(127,127,127,.14);color:var(--poubelle-card-secondary-color,#9aa3b8);white-space:nowrap}
    .pill.veille{background:rgba(255,90,78,.18);color:#ffb3ad}.pill.jour{background:rgba(111,168,255,.18);color:#bcd4ff}.pill.videe{background:rgba(76,175,80,.18);color:#a8e0aa}
    .scaler{width:${150 * s}px;height:${(253 + hr) * s}px;position:relative}
    .stage-wrap{position:absolute;left:0;top:${-(70 - hr) * s}px;transform:scale(${s});transform-origin:0 0;width:150px;height:${253 + 70}px}
    /* ---- la poubelle ---- */
    .stage{position:relative;width:150px;height:253px;margin-top:70px}
    .bin{position:absolute;inset:0;transform-origin:50% 100%}
    .body{position:absolute;left:0;bottom:0;width:150px;z-index:2;filter:${bodyF} drop-shadow(0 14px 16px rgba(0,0,0,.45))}
    /* .lift éclaircit les gris moyens (overlay blanc : le noir des roues reste noir), puis .paint les colore */
    .lift,.paint{position:absolute;left:0;bottom:0;width:150px;aspect-ratio:${PB_BODY_RATIO[B.img]};z-index:2;pointer-events:none;
      -webkit-mask:url("${bodyImg}") center/100% 100% no-repeat,${PB_WHEEL_HOLE};-webkit-mask-composite:source-in;
      mask:url("${bodyImg}") center/100% 100% no-repeat,${PB_WHEEL_HOLE};mask-composite:intersect;${paint ? '' : 'display:none'}}
    .lift{background:#fff;mix-blend-mode:overlay;opacity:.75}
    .paint{background:${paint || 'transparent'};mix-blend-mode:color}
    .trash{position:absolute;left:12px;right:12px;top:-44px;height:80px;z-index:1;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)}
    .lid{position:absolute;left:0;top:${B.img === 'yellow' ? 3 : 0}px;width:150px;z-index:3;transform-origin:92% 100%;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1);${lidF ? `filter:${lidF};` : ''}}
    .bagsvg{position:absolute;left:0;bottom:0;width:150px;height:253px;z-index:2;overflow:visible;filter:drop-shadow(0 14px 16px rgba(0,0,0,.45))}
    .bagg{transform-origin:75px 250px;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)}
    .bagmode .fx{top:40px}
    .bulkysvg{position:absolute;left:0;bottom:0;width:150px;height:253px;z-index:2;overflow:visible;filter:drop-shadow(0 14px 16px rgba(0,0,0,.45))}
    .bulkyg{transform-origin:75px 252px;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)}
    .custom{position:absolute;left:0;bottom:0;width:150px;height:253px;object-fit:contain;object-position:50% 100%;z-index:2;filter:drop-shadow(0 14px 16px rgba(0,0,0,.45))}
    .shadow{position:absolute;left:10px;right:10px;bottom:-8px;height:14px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(6px);z-index:0}
    .card.veille .bin{animation:shake 1.8s ease-in-out infinite}
    .card.jour .bin{animation:hop 1.1s ease-in-out infinite}
    .card.plein .trash{animation:wobble 2.6s ease-in-out infinite}
    @keyframes shake{0%,55%,100%{transform:rotate(0)}60%{transform:rotate(-4deg)}66%{transform:rotate(3.5deg)}72%{transform:rotate(-3deg)}78%{transform:rotate(2deg)}84%{transform:rotate(-1deg)}}
    @keyframes hop{0%,100%{transform:translateY(0)}45%{transform:translateY(-8px)}}
    @keyframes wobble{0%,100%{rotate:0deg}50%{rotate:-1.5deg}}
    /* mouches + odeurs quand c'est plein */
    .fx{position:absolute;inset:-95px -20px auto -20px;height:110px;z-index:4;pointer-events:none;opacity:0;transition:opacity .6s}
    .card.plein .fx{opacity:1}
    .fly{position:absolute;width:5px;height:5px;border-radius:50%;background:#0b0b0b;box-shadow:0 0 0 1px rgba(255,255,255,.25)}
    .fly::before,.fly::after{content:"";position:absolute;top:-3px;width:5px;height:4px;border-radius:50%;background:rgba(220,235,255,.55)}
    .fly::before{left:-3px}.fly::after{right:-3px}
    .f1{animation:orbit1 3.2s linear infinite}.f2{animation:orbit2 2.6s linear infinite}.f3{animation:orbit1 4.1s linear infinite reverse}
    @keyframes orbit1{0%{transform:translate(40px,60px)}25%{transform:translate(110px,30px)}50%{transform:translate(160px,70px)}75%{transform:translate(90px,95px)}100%{transform:translate(40px,60px)}}
    @keyframes orbit2{0%{transform:translate(150px,40px)}33%{transform:translate(70px,20px)}66%{transform:translate(120px,90px)}100%{transform:translate(150px,40px)}}
    .stink{position:absolute;bottom:18px;width:14px;height:40px;opacity:0;animation:rise 2.8s ease-in infinite}
    .stink svg{width:100%;height:100%}
    .s1{left:60px}.s2{left:100px;animation-delay:1s}.s3{left:135px;animation-delay:1.8s}
    @keyframes rise{0%{transform:translateY(20px);opacity:0}30%{opacity:.8}100%{transform:translateY(-30px);opacity:0}}
    /* étincelles quand c'est vidé */
    .spark{position:absolute;z-index:4;width:14px;height:14px;opacity:0;pointer-events:none}
    .card.videe .spark{animation:twinkle 2.4s ease-in-out infinite}
    .sp1{left:6px;top:40px}.sp2{right:8px;top:70px;animation-delay:.8s!important}.sp3{left:40px;top:4px;animation-delay:1.5s!important}
    @keyframes twinkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}40%{opacity:1;transform:scale(1) rotate(45deg)}}
    .status{font-size:13px;font-weight:600;text-align:center;min-height:1.3em}
    .warn{font-size:11px;text-align:center;color:var(--warning-color,#ffa600)}.warn[hidden]{display:none}
    .meter{width:100%;display:grid;gap:4px}
    .meter-top{display:flex;justify-content:space-between;color:var(--poubelle-card-secondary-color,#9aa3b8);font-size:11px;font-variant-numeric:tabular-nums}
    .bar{height:6px;border-radius:99px;background:rgba(127,127,127,.14);overflow:hidden}
    .bar i{display:block;height:100%;border-radius:99px;transition:width 1.1s ease;background:${color}}
    ${c.show_meter === false ? '.meter{display:none}' : ''}
    ${c.show_status === false ? '.status{display:none}' : ''}
    ${c.compact ? 'ha-card{padding:8px 10px 10px;gap:4px}.status{font-size:12px}' : ''}
    @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    </style>
    <ha-card class="card${c.entity ? ' clickable' : ''}"><div class="head"><span class="name"></span><span class="pill"></span></div>
     <div class="scaler"><div class="stage-wrap"><div class="stage${this._bag || this._bulky || img ? ' bagmode' : ''}">
      <div class="fx">${PB_FX_FLY}${PB_FX_STINK}</div>${PB_FX_SPARK}<div class="shadow"></div>
      <div class="bin">${img ? `<img class="custom" src="${img.replace(/["<>]/g, '')}" alt="">` : this._bulky ? PB_BULKY_SVG : this._bag ? pbBagSvg(bagCol, bagOp, content) : `<div class="trash">${content}</div>
       <img class="body" src="${bodyImg}" alt=""><div class="lift"></div><div class="paint"></div><img class="lid" src="${PB_IMG[B.img].lid}" alt="">`}</div>
     </div></div></div>
     <div class="status"></div><div class="warn" hidden></div>
     <div class="meter"><div class="meter-top"><span class="ml"></span><span class="pct"></span></div><div class="bar"><i></i></div></div>
    </ha-card>`;
    this.shadowRoot.querySelector('ha-card').addEventListener('click', () => {
      if (!this._c.entity) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: this._c.entity } }));
    });
    this._render();
  }

  /* Next pickup date read from an entity (null if unknown) */
  _entityDate() {
    const st = this._hass?.states?.[this._c.entity];
    if (!st) return null;
    const a = st.attributes || {}, s = st.state;
    const today = midnight(new Date());
    const fromDays = n => addDays(today, Number(n));
    if (a.daysTo !== undefined && !isNaN(a.daysTo)) return fromDays(a.daysTo);          // Waste Collection Schedule
    if (st.entity_id.startsWith('calendar.')) return a.start_time ? addDays(new Date(String(a.start_time).replace(' ', 'T')), this._c.calendar_offset) : null;
    if (st.entity_id.startsWith('input_datetime.') && a.year) return new Date(a.year, a.month - 1, a.day);
    if (s === 'unknown' || s === 'unavailable' || s === '' || s == null) return null;
    if (!isNaN(s)) return fromDays(s);                                                   // number of days
    const lower = String(s).toLowerCase();
    if (['today', "aujourd'hui", 'aujourdhui'].includes(lower)) return today;
    if (['tomorrow', 'demain'].includes(lower)) return fromDays(1);
    return parseDate(s);                                                                 // date / timestamp
  }

  /* Card state: { state: ''|'eve'|'today'|'emptied'|'unknown', n, fill, moved } */
  _compute() {
    const c = this._c, now = new Date();
    const h = now.getHours() + now.getMinutes() / 60, H = Number(c.hour);
    if (c.entity && this._cal) {
      // calendar: real next and last pickups, as with a fixed schedule
      const ks = this._cal.map(d => daysBetween(now, d));
      const next = ks.filter(k => k > 0 || (k === 0 && h < H)).sort((a, b) => a - b)[0];
      const last = ks.filter(k => k < 0 || (k === 0 && h >= H)).sort((a, b) => b - a)[0];
      if (next === undefined) return { state: last === 0 ? 'emptied' : 'unknown', n: null, fill: 0 };
      const n = next;
      if (n === 0) return { state: 'today', n, fill: 1 };
      // no earlier pickup in the calendar: estimate the fill from interval
      if (last === undefined) return { state: n === 1 ? 'eve' : '', n, fill: Math.max(0, 1 - n / Math.max(1, Number(c.interval) || 7)) };
      if (last === 0) return { state: 'emptied', n, fill: 0 };
      return { state: n === 1 ? 'eve' : '', n, fill: Math.min(1, Math.max(0, -last / (n - last))) };
    }
    if (c.entity) {
      const d = this._entityDate();
      if (!d) return { state: 'unknown', n: null, fill: 0 };
      const n = daysBetween(now, d);
      const I = Math.max(1, Number(c.interval) || 7);
      if (n < 0) return { state: 'unknown', n: null, fill: 0 };
      if (n === 0) return h < H ? { state: 'today', n, fill: 1 } : { state: 'emptied', n, fill: 0 };
      // far-off pickup (n >= interval): empty bin but date shown, not "emptied today"
      return { state: n === 1 ? 'eve' : '', n, fill: Math.min(1, Math.max(0, 1 - n / I)) };
    }
    const extra = new Set([].concat(c.holiday_dates ?? []).map(v => { const d = parseDate(v); return d ? dayKey(d) : String(v); }));
    const hol = this._hol, work = this._work;
    return computeFixed(this._rule, now, {
      isHoliday: d => extra.has(dayKey(d)) || !!hol?.has(dayKey(d)),
      isWorkday: d => (work ? work.has(dayKey(d)) : null),
    });
  }

  /* Warning shown when the holiday mode needs a calendar that doesn't exist */
  _warning(lang) {
    const mode = this._rule?.holidays || 'none';
    if (this._c.entity || mode === 'none' || !this._hass?.entities) return '';
    const { holiday, workday } = this._calendars();
    if (!holiday && !(this._c.holiday_dates || []).length) return t(lang, 'card.warn_no_holiday_calendar');
    if (HOLIDAY_NEEDS_WORKDAY.has(mode) && !workday) return t(lang, 'card.warn_no_workday_calendar');
    return '';
  }

  _render() {
    const r = this.shadowRoot; if (!r || !this._c) return;
    const q = x => r.querySelector(x), { lang, dateLocale } = this._lang(), now = new Date();
    const { state, n, fill, moved } = this._compute();
    let pill, text;
    if (state === 'unknown') { pill = '—'; text = t(lang, 'card.unknown'); }
    else if (state === 'emptied') { pill = t(lang, 'card.emptied'); text = t(lang, 'card.emptied_txt'); }
    else if (state === 'today') { pill = t(lang, 'card.today'); text = t(lang, 'card.today_txt'); }
    else if (state === 'eve') { pill = t(lang, 'card.eve'); text = t(lang, 'card.eve_txt'); }
    else {
      const d = addDays(midnight(now), n);
      pill = t(lang, 'card.in_days', { n });
      text = n < 7 ? t(lang, 'card.next_weekday', { day: weekdayName(dateLocale, weekdayIdx(d)) })
        : t(lang, 'card.next_date', { date: shortDate(dateLocale, d) });
    }
    const cls = STATE_CLASS[state] ?? '';
    q('ha-card').className = 'card ' + cls + (fill >= 0.6 && state !== 'emptied' ? ' plein' : '') + (this._c.entity ? ' clickable' : '');
    q('.name').textContent = this._c.name || (this._bulky ? t(lang, 'card.bulky') : t(lang, `card.${this._bag ? 'bag' : 'bin'}.${this._bin}`));
    const p = q('.pill'); p.className = 'pill ' + cls; p.textContent = pill;
    q('.status').textContent = moved && state !== 'emptied' ? `${text} · ${t(lang, 'card.moved')}` : text;
    const w = this._warning(lang), we = q('.warn'); we.textContent = w; we.hidden = !w;
    q('.ml').textContent = t(lang, 'card.fill');
    const f = state === 'emptied' ? 0 : (state === 'today' ? 1 : fill), pct = Math.round(f * 100);
    q('.pct').textContent = pct + ' %'; q('.bar i').style.width = pct + '%';
    const peek = f * 72;
    if (String(this._c.image || '').trim()) return; // custom image: no animation of the drawing
    if (this._bulky) {
      // the pile grows with the fill level: a few items at first, a big heap the day before pickup
      q('.bulkyg').style.transform = `scale(${(0.72 + 0.28 * f).toFixed(3)})`;
      return;
    }
    if (this._bag) {
      // the bag inflates with the fill level: flat and crumpled when empty, round when full
      q('.bagg').style.transform = `scale(${(0.82 + 0.18 * f).toFixed(3)}, ${(0.38 + 0.62 * f).toFixed(3)})`;
      return;
    }
    q('.trash').style.transform = `translateY(${86 - peek}px)`;
    q('.lid').style.transform = f > 0.25 ? `translateY(${-peek * 0.85}px) rotate(${-f * 26}deg)` : 'none';
  }
}

if (!customElements.get('poubelle-card')) customElements.define('poubelle-card', PoubelleCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'poubelle-card'))
  window.customCards.push({ type: 'poubelle-card', name: 'Poubelle Card', preview: true,
    description: 'Animated bin that fills up and empties with your collection days',
    documentationURL: 'https://github.com/Roving-Ronin/ha-garbage-card' });
console.info(`%c POUBELLE-CARD %c v${PB_VERSION} `, 'background:#ffc107;color:#000;font-weight:700', 'background:#333;color:#fff');
