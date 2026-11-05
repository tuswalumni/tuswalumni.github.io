# คู่มือ Deploy — tuswalumni.com

```
GitHub Pages (หน้าเว็บ)            Google Apps Script (API)
index.html, style.css   fetch ──►  Code.gs  ──►  Google Sheets
api.js, app.js          ◄── JSON   (ContentService)   Main DB / Member DB
```

## โครงสร้างไฟล์ (ทุกไฟล์อยู่ที่ root ของ repo)

```
/
├── index.html
├── style.css
├── api.js              ← ใส่ API_URL (Web App URL ที่ลงท้ายด้วย /exec)
├── app.js
├── logo-tuswalumni.png
└── CNAME               ← tuswalumni.com
```

`Code.gs` อยู่ใน Google Apps Script เท่านั้น ไม่ต้องอัปโหลดขึ้น GitHub

## 1. Deploy Google Apps Script

1. เปิด script.google.com → โปรเจกต์ของสมาคม → แทนที่ `Code.gs` ด้วยไฟล์ใหม่
2. **Project Settings → Script properties** เพิ่ม `CLEAR_CACHE_SECRET` = รหัสลับที่คาดเดายาก
3. **Deploy → Manage deployments → แก้ไข (ไอคอนดินสอ) → Version: New version → Deploy**
   (ใช้ deployment เดิม URL จะไม่เปลี่ยน ไม่ต้องแก้ api.js)
   - Execute as: **Me**
   - Who has access: **Anyone**

ทดสอบ: เปิด Web App URL ในเบราว์เซอร์ ต้องได้

```json
{ "success": true, "data": { "config": {}, "committee": [], "news": [], "banners": [], "stats": [] } }
```

## 2. ตั้งค่า api.js

```javascript
const API_URL = 'https://script.google.com/macros/s/XXXXX/exec';
```

## 3. Deploy GitHub Pages

1. อัปโหลด/แทนที่ไฟล์ทั้งหมดในรายการด้านบนที่ root ของ repo
2. Settings → Pages → Deploy from a branch → `main` / `(root)`
3. Custom domain: `tuswalumni.com` และเปิด **Enforce HTTPS**

## การอัปเดตข้อมูล

| ต้องการอัปเดต | วิธีทำ |
|---|---|
| ข่าว / คณะกรรมการ / แบนเนอร์ | แก้ใน Google Sheet (เว็บอัปเดตเองภายใน 5 นาที) |
| อยากให้แสดงทันที | รัน `clearCache()` ใน Apps Script Editor หรือเปิด `.../exec?action=clearCache&key=รหัสลับ` |
| เนื้อหาคงที่ (ประวัติ, วัตถุประสงค์, ระเบียบ) | แก้ `index.html` แล้ว push |
| สี / ฟอนต์ | แก้ตัวแปรใน `:root` ของ `style.css` |

### ข้อแนะนำสำหรับชีต
- **Banners**: คอลัมน์ `ImageURL, Title, Subtitle, LinkURL, ButtonText` — ภาพกว้างอย่างน้อย 1920px ถ้าไม่มีแบนเนอร์ หน้าแรกจะแสดงตราสมาคมแทน
- **Committee**: คอลัมน์ `Color` รับเฉพาะรหัสสีแบบ `#8B1E3F` ค่าอื่นจะถูกข้าม
- ลิงก์ทุกช่องต้องขึ้นต้นด้วย `https://`
