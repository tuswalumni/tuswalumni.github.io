# คู่มือ Deploy — TUSWA Website (New Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                     Architecture                        │
│                                                         │
│  GitHub Pages (Frontend)          Google Apps Script    │
│  ┌─────────────────────┐          ┌──────────────────┐  │
│  │  index.html         │  fetch   │  Code.gs         │  │
│  │  css/style.css      │ ───────► │  ?action=all     │  │
│  │  js/api.js          │  JSON ◄─ │  ContentService  │  │
│  │  js/app.js          │          │  (JSON API)      │  │
│  └─────────────────────┘          └──────────────────┘  │
│                                          │               │
│                                   ┌──────┴───────┐       │
│                                   │ Google Sheets │       │
│                                   │ Main DB       │       │
│                                   │ Member DB     │       │
│                                   └──────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## ขั้นตอนที่ 1 — Deploy Google Apps Script (JSON API)

### 1.1 อัปโหลด Code.gs
1. เปิด [script.google.com](https://script.google.com)
2. เปิด Project สมาคมฯ เดิม
3. **แทนที่** `Code.gs` ทั้งหมดด้วยไฟล์ `tuswa-gas/Code.gs`
4. **ลบไฟล์** `index.html`, `JS.html`, `history.html` ออกทั้งหมด (ไม่ใช้แล้ว)

### 1.2 Deploy เป็น Web App
1. คลิก **Deploy** → **New Deployment**
2. เลือก Type: **Web app**
3. ตั้งค่า:
   - Execute as: **Me**
   - Who has access: **Anyone** ← สำคัญมาก (ให้ GitHub Pages fetch ได้)
4. คลิก **Deploy**
5. **คัดลอก Web App URL** รูปแบบ:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### 1.3 ทดสอบ API
เปิด URL ด้านล่างในเบราว์เซอร์ ต้องได้ JSON กลับมา:
```
https://script.google.com/macros/s/YOUR_ID/exec?action=all
https://script.google.com/macros/s/YOUR_ID/exec?action=stats
https://script.google.com/macros/s/YOUR_ID/exec?action=news
```

ตัวอย่าง response ที่ถูกต้อง:
```json
{
  "_status": "ok",
  "config": { ... },
  "news": [ ... ],
  "stats": [
    { "Type": "Ordinary", "Count": 57 },
    { "Type": "Associate", "Count": 1 },
    { "Type": "Honorary", "Count": 0 }
  ]
}
```

---

## ขั้นตอนที่ 2 — แก้ไข api.js ใส่ URL จริง

เปิดไฟล์ `tuswa-github/js/api.js` แก้บรรทัดนี้:

```javascript
// บรรทัดที่ 10 ใน api.js
const GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
//                                                    ^^^^^^^^^^^^^^
//                                       เปลี่ยนเป็น Script ID จริงที่ได้จากขั้นตอน 1.2
```

---

## ขั้นตอนที่ 3 — Deploy GitHub Pages

### 3.1 สร้าง Repository
1. ไปที่ [github.com](https://github.com) → **New repository**
2. ตั้งชื่อ: `tuswa-website` (หรือชื่ออื่น)
3. เลือก **Public**
4. คลิก **Create repository**

### 3.2 อัปโหลดไฟล์
อัปโหลดโฟลเดอร์ `tuswa-github/` ทั้งหมด:
```
tuswa-github/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── api.js      ← อย่าลืมใส่ GAS URL ก่อน!
    └── app.js
```

วิธีที่ง่ายที่สุด: ลาก folder ทิ้งใน GitHub web interface

### 3.3 เปิด GitHub Pages
1. ไปที่ Repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / folder: **/ (root)**
4. คลิก **Save**
5. รอ 1-2 นาที จะได้ URL:
   ```
   https://yourusername.github.io/tuswa-website/
   ```

---

## โครงสร้างไฟล์สุดท้าย

```
tuswa-github/           ← push ขึ้น GitHub ทั้งโฟลเดอร์นี้
├── index.html          ← หน้าเว็บหลัก (ทุกหน้ารวมกัน)
├── css/
│   └── style.css       ← CSS ทั้งหมด
└── js/
    ├── api.js          ← ติดต่อ GAS API (ใส่ URL ที่นี่)
    └── app.js          ← Logic การ render ทั้งหมด

tuswa-gas/              ← ใช้ใน Google Apps Script เท่านั้น
└── Code.gs             ← JSON API (ไม่มี HTML แล้ว)
```

---

## การอัปเดตข้อมูลในอนาคต

| ต้องการอัปเดต | วิธีทำ |
|---|---|
| ข่าว / คณะกรรมการ / banner | แก้ใน Google Sheet → รัน `clearCache()` ใน GAS Editor |
| เนื้อหาหน้าเว็บ (ประวัติ, วัตถุประสงค์) | แก้ใน `index.html` แล้ว push ขึ้น GitHub |
| CSS / สีสัน | แก้ใน `css/style.css` แล้ว push ขึ้น GitHub |
| Logic การ render | แก้ใน `js/app.js` แล้ว push ขึ้น GitHub |
| เพิ่ม API endpoint ใหม่ | แก้ `Code.gs` (GAS) + `js/api.js` (Frontend) |

---

## หมายเหตุสำคัญ

> **CORS:** Google Apps Script Web App ที่ตั้ง "Anyone" access จะอนุญาต cross-origin
> request โดยอัตโนมัติ ไม่ต้องตั้งค่าเพิ่ม

> **Cache:** GAS cache ข้อมูล 5 นาที ถ้าอยากให้แสดงผลทันทีหลังแก้ Sheet
> ให้รัน `clearCache()` ใน Apps Script Editor

> **HTTPS:** GitHub Pages ใช้ HTTPS โดยอัตโนมัติ ✓
