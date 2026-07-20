/**
 * api.js — เชื่อมต่อกับ Google Apps Script Web API (ContentService / JSON)
 * ==========================================================================
 *  1. Deploy Code.gs เป็น Web App บน Google Apps Script
 *     (Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone)
 *  2. เอา URL ที่ได้ (ลงท้ายด้วย /exec) มาใส่แทนค่า API_URL ด้านล่างนี้
 * ==========================================================================
 */
const API_URL = 'https://script.google.com/macros/s/AKfycbwu8rRaPshkM1cqrxFISjf9HcJ_N3IFH5PSjlnoqb_kGunbVii28_75KfydrF_AOTBb/exec';

/**
 * ดึงข้อมูลทั้งหมด (config, committee, news, banners, stats) จาก Apps Script
 * คืนค่าเป็น Promise<object> — throw error ถ้าเชื่อมต่อไม่ได้หรือฝั่ง server error
 */
async function fetchAllData() {
  let res;
  try {
    res = await fetch(API_URL, { method: 'GET' });
  } catch (networkErr) {
    throw new Error('เชื่อมต่ออินเทอร์เน็ต หรือ API ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }

  if (!res.ok) {
    throw new Error('เซิร์ฟเวอร์ตอบกลับผิดพลาด (HTTP ' + res.status + ')');
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุจากฝั่งเซิร์ฟเวอร์');
  }

  return json.data;
}
