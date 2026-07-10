// ============================================================
//  js/api.js — API Layer
//  จุดเดียวที่ติดต่อกับ Google Apps Script
//  เปลี่ยน GAS_URL เป็น Web App URL ที่ได้หลัง Deploy
// ============================================================

const API = (() => {

  // *** เปลี่ยน URL นี้หลัง Deploy Google Apps Script ***
  const GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

  // In-memory cache ฝั่ง browser (ป้องกัน fetch ซ้ำในหน้าเดียวกัน)
  const _cache = {};

  /**
   * fetch ข้อมูลจาก GAS
   * @param {string} action  - 'all' | 'news' | 'committee' | 'stats' | 'config' | 'banners'
   * @param {boolean} force  - true = บังคับ bypass cache
   */
  async function get(action = 'all', force = false) {
    if (!force && _cache[action]) return _cache[action];

    const url = `${GAS_URL}?action=${action}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json._status === 'error') {
        throw new Error(json._message || 'GAS returned error');
      }

      _cache[action] = json;
      return json;

    } catch (err) {
      console.error(`[API] action="${action}" failed:`, err);
      throw err; // ให้ caller จัดการ UI
    }
  }

  // Shorthand methods
  const getAll       = (force) => get('all', force);
  const getNews      = (force) => get('news', force);
  const getCommittee = (force) => get('committee', force);
  const getStats     = (force) => get('stats', force);
  const getConfig    = (force) => get('config', force);
  const getBanners   = (force) => get('banners', force);

  return { get, getAll, getNews, getCommittee, getStats, getConfig, getBanners };

})();
