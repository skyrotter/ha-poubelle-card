/* Holiday / Workday calendars: one fetch per calendar per day, shared by every card on the page. */
import { addDays, dayKey, midnight, eventDays } from './schedule.js';

const cache = new Map(); // `${entity}|${day}` → Promise<Set|null>

/* First calendar entity created by an integration ('holiday' or 'workday'), from the entity registry. */
export function findCalendar(hass, platform) {
  const reg = hass?.entities || {};
  return Object.keys(reg).filter(id => id.startsWith('calendar.') && reg[id]?.platform === platform && hass.states?.[id]).sort()[0] || null;
}

/* Set of 'YYYY-MM-DD' days with an event, from about a year back to a year and a bit ahead
   (enough for seasonal schedules and holiday shifts). null if the calendar can't be read. */
export function calendarDays(hass, entityId) {
  if (!hass?.callWS || !entityId) return Promise.resolve(null);
  const today = midnight(new Date()), key = `${entityId}|${dayKey(today)}`;
  if (cache.has(key)) return cache.get(key);
  for (const k of cache.keys()) if (k.startsWith(entityId + '|')) cache.delete(k); // yesterday's copy
  const p = hass.callWS({
    type: 'call_service', domain: 'calendar', service: 'get_events', return_response: true,
    target: { entity_id: entityId },
    service_data: { start_date_time: addDays(today, -380).toISOString(), end_date_time: addDays(today, 420).toISOString() },
  }).then(r => eventDays(r?.response?.[entityId]?.events), () => {
    setTimeout(() => cache.delete(key), 10 * 60000); // retry in 10 min
    return null;
  });
  cache.set(key, p);
  return p;
}
