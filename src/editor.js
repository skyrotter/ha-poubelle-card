/* Visual editor: ha-form with labels in the HA user's language, fields shown only when they apply,
 * and legacy (French) values shown as their English equivalents. */
import { normalizeConfig, BINS, CONTAINERS, WEEKS, HOLIDAY_MODES, parseDay, parseMonth } from './normalize.js';
import { LANGS, cardLanguage, t, weekdayName, monthName } from './localize.js';

/* ha-form is only registered once HA has loaded one of its own editors */
let formReady;
const ensureForm = () => formReady ??= (async () => {
  if (customElements.get('ha-form')) return;
  try {
    const helpers = await window.loadCardHelpers?.();
    const el = await helpers?.createCardElement({ type: 'entities', entities: [] });
    await el?.constructor?.getConfigElement?.();
  } catch (e) { /* ignore: falls back to whenDefined */ }
  await customElements.whenDefined('ha-form');
})();

const isEmpty = v => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);

export class PoubelleCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = normalizeConfig(config || {});
    this._render();
  }

  set hass(h) {
    this._hass = h;
    if (this._form) this._form.hass = h;
    else this._render();
  }

  _schema(lang, loc) {
    const c = this._config, opt = (group, values) => values.map(v => ({ value: v, label: t(lang, `editor.options.${group}.${v}`) }));
    const sel = options => ({ select: { mode: 'dropdown', options } });
    const entity = String(c.entity || ''), mode = c.holidays || 'none';
    const s = [
      { name: 'bin', required: true, selector: sel(BINS.map(b => ({ value: b, label: t(lang, `card.bin.${b}`) }))) },
      { name: 'name', selector: { text: {} } },
      { name: 'container', selector: sel(opt('container', CONTAINERS)) },
      { name: 'image', selector: { text: {} } },
      { name: 'entity', selector: { entity: { filter: { domain: ['sensor', 'calendar', 'input_datetime'] } } } },
    ];
    if (entity.startsWith('calendar.')) s.push(
      { name: 'calendar_filter', selector: { text: {} } },
      { name: 'calendar_offset', selector: { number: { min: -7, max: 7, mode: 'box' } } });
    if (!entity) {
      s.push(
        { name: 'days', selector: { select: { multiple: true, options: [0, 1, 2, 3, 4, 5, 6].map(i => ({ value: String(i), label: weekdayName(loc, i) })) } } },
        { name: 'start_date', selector: { date: {} } });
      if (c.start_date) s.push({ name: 'every', selector: { number: { min: 1, max: 12, mode: 'box' } } });
      else s.push({ name: 'weeks', selector: sel(opt('weeks', WEEKS)) });
      s.push(
        { name: 'month_week', selector: sel(['', '1', '2', '3', '4', 'last'].map(v => ({ value: v, label: t(lang, `editor.options.month_week.${v}`) }))) },
        { name: 'month_day', selector: { number: { min: 1, max: 31, mode: 'box' } } },
        { name: 'months', selector: { select: { multiple: true, options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: monthName(loc, i + 1) })) } } },
        { name: 'holidays', selector: sel(opt('holidays', HOLIDAY_MODES)) });
      if (mode !== 'none') s.push({ name: 'holiday_calendar', selector: { entity: { filter: { domain: 'calendar', integration: 'holiday' } } } });
      if (mode === 'next_work_day') s.push({ name: 'workday_calendar', selector: { entity: { filter: { domain: 'calendar', integration: 'workday' } } } });
    }
    s.push(
      { type: 'grid', name: '', schema: [
        { name: 'hour', selector: { number: { min: 0, max: 23.5, step: 0.5, mode: 'box' } } },
        ...(entity && !entity.startsWith('calendar.') ? [{ name: 'interval', selector: { number: { min: 1, max: 60, mode: 'box' } } }] : []),
        { name: 'scale', selector: { number: { min: 0.3, max: 1.2, step: 0.01, mode: 'slider' } } },
        { name: 'headroom', selector: { number: { min: 0, max: 70, mode: 'box' } } },
      ] },
      { type: 'grid', name: '', schema: ['compact', 'show_meter', 'show_status', 'theme_background', 'full_color'].map(n => ({ name: n, selector: { boolean: {} } })) },
      { name: 'language', selector: sel([{ value: 'auto', label: t(lang, 'editor.options.language.auto') },
        ...Object.entries(LANGS).map(([k, v]) => ({ value: k, label: v.language_name }))]) },
    );
    return s;
  }

  async _render() {
    if (!this._hass || !this._config) return;
    await ensureForm();
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.addEventListener('value-changed', e => this._changed(e));
      this.appendChild(this._form);
    }
    const { lang, dateLocale } = cardLanguage('auto', this._hass); // the editor follows the HA user's language
    const c = this._config;
    this._form.hass = this._hass;
    this._form.data = {
      show_meter: true, show_status: true, ...c,
      container: c.container || 'wheelie_bin', weeks: c.weeks || 'all', holidays: c.holidays || 'none', language: c.language || 'auto',
      month_week: c.month_week == null ? '' : String(c.month_week),
      days: [].concat(c.days ?? []).map(parseDay).filter(d => d >= 0 && d <= 6).map(String),
      months: [].concat(c.months ?? []).map(parseMonth).filter(m => m >= 1 && m <= 12).map(String),
    };
    this._form.schema = this._schema(lang, dateLocale);
    this._form.computeLabel = s => t(lang, `editor.labels.${s.name}`);
    this._form.computeHelper = s => { const h = t(lang, `editor.helpers.${s.name}`); return h.startsWith('editor.') ? undefined : h; };
  }

  _changed(ev) {
    ev.stopPropagation();
    const v = { ...ev.detail.value };
    if (Array.isArray(v.days)) v.days = v.days.map(Number);
    if (Array.isArray(v.months)) v.months = v.months.map(Number);
    if (v.language === 'auto') delete v.language;
    if (v.show_meter === true) delete v.show_meter;
    if (v.show_status === true) delete v.show_status;
    if (!v.start_date) delete v.every;
    if (!v.holidays || v.holidays === 'none') { delete v.holiday_calendar; delete v.workday_calendar; }
    if (v.holidays !== 'next_work_day') delete v.workday_calendar;
    for (const k of Object.keys(v)) if (isEmpty(v[k])) delete v[k];
    const config = normalizeConfig(v);
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
    this._render();
  }
}

if (!customElements.get('poubelle-card-editor')) customElements.define('poubelle-card-editor', PoubelleCardEditor);
