// ============================================================
//  js/app.js — Main Application
//  ทำงานร่วมกับ api.js
// ============================================================

/* ---- State ---- */
let globalData = {};

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  showLoading(true);
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  initBackToTop();
  loadSite();
});

async function loadSite() {
  try {
    const data = await API.getAll();
    globalData = data;
    renderAll(data);
  } catch (err) {
    showError();
  } finally {
    showLoading(false);
  }
}

function renderAll(data) {
  renderBanners(data.banners || [], data.config || {});
  renderStats(data.stats || []);
  renderNews(data.news || []);
  renderCommittee(data.committee || []);
  initNewsSearch();

  if (data._status !== 'ok') showWarningBanner();
}

/* ============================================================
   LOADING / ERROR UI
============================================================ */
function showLoading(visible) {
  document.getElementById('loading').style.display = visible ? 'flex' : 'none';
}

function showError() {
  document.getElementById('loading').innerHTML = `
    <div class="text-center px-4">
      <i class="bi bi-exclamation-triangle-fill text-warning" style="font-size:3rem;"></i>
      <h5 class="mt-3 fw-bold" style="color:var(--tu-claret);">ไม่สามารถโหลดข้อมูลได้</h5>
      <p class="text-muted small mt-2">กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต แล้วลองใหม่อีกครั้ง</p>
      <button class="btn btn-outline-dark btn-sm rounded-1 mt-2" onclick="location.reload()">
        <i class="bi bi-arrow-clockwise me-1"></i>ลองใหม่
      </button>
    </div>`;
}

function showWarningBanner() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const banner = document.createElement('div');
  banner.className = 'alert alert-warning alert-dismissible fade show m-0 rounded-0';
  banner.innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>
    <strong>ข้อมูลบางส่วนอาจไม่สมบูรณ์</strong>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  nav.insertAdjacentElement('afterend', banner);
}

/* ============================================================
   NAVIGATION
============================================================ */
function showPage(pageId) {
  document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId)?.classList.add('active');

  // nav active
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  const navMap = {
    home: 'nav-home', committee: 'nav-committee', news: 'nav-news',
    'members-info': 'nav-member-parent', rights: 'nav-member-parent',
    history: 'nav-about', objectives: 'nav-about'
  };
  document.getElementById(navMap[pageId])?.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ปิด mobile navbar
  const nb = document.getElementById('navbarNav');
  if (nb?.classList.contains('show')) new bootstrap.Collapse(nb).hide();

  document.getElementById('back-to-top')?.classList.remove('visible');
}

/* ============================================================
   RENDER: BANNERS
============================================================ */
function renderBanners(banners, config) {
  const defaultUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Thammasat_University_Tha_Phrachan_Campus_-_landscape_from_Chao_Phraya_River.jpg/800px-Thammasat_University_Tha_Phrachan_Campus_-_landscape_from_Chao_Phraya_River.jpg';

  // สร้าง banner list จาก sheet Banners หรือ fallback จาก config
  let list = banners.length > 0 ? banners : [];
  if (list.length === 0) {
    const urls = (config.BannerURL || defaultUrl).toString().split(',').map(s => s.trim()).filter(Boolean);
    list = urls.map(url => ({
      ImageURL: url,
      Title: 'สมาคมนักศึกษาเก่าสังคมสงเคราะห์ศาสตร์ มหาวิทยาลัยธรรมศาสตร์',
      Subtitle: 'TU SOCIAL ADMINISTRATION ALUMNI ASSOCIATION',
      LinkURL: 'https://members.tuswalumni.com/',
      ButtonText: 'สมัครสมาชิก / ตรวจสอบสถานะ'
    }));
  }

  const indicators = document.getElementById('carousel-indicators');
  const inner      = document.getElementById('carousel-inner');

  indicators.innerHTML = list.map((_, i) =>
    `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${i}"
      class="${i === 0 ? 'active' : ''}" aria-label="Slide ${i + 1}"></button>`
  ).join('');

  inner.innerHTML = list.map((b, i) => `
    <div class="carousel-item ${i === 0 ? 'active' : ''}">
      <div class="hero-carousel-item" style="background-image:url('${esc(b.ImageURL)}')">
        <div class="hero-overlay"></div>
        <div class="container h-100">
          <div class="hero-content">
            <h1 class="display-4 hero-title">${esc(b.Title || '')}</h1>
            <h2 class="h5 hero-subtitle mt-2">${esc(b.Subtitle || '')}</h2>
            <a href="${esc(b.LinkURL || '#')}" target="_blank"
               class="btn btn-gold btn-lg mt-4 px-5 shadow rounded-1 fw-bold">
              ${esc(b.ButtonText || 'เข้าสู่ระบบสมาชิก')}
            </a>
          </div>
        </div>
      </div>
    </div>`
  ).join('');
}

/* ============================================================
   RENDER: STATS
============================================================ */
function renderStats(stats) {
  document.getElementById('stats-section').style.display = 'block';

  const map = { Ordinary: 0, Associate: 0, Honorary: 0 };
  stats.forEach(s => { map[s.Type] = parseInt(s.Count) || 0; });

  animateValue('count-ordinary',  map.Ordinary);
  animateValue('count-associate', map.Associate);
  animateValue('count-honorary',  map.Honorary);
  animateValue('count-total',     map.Ordinary + map.Associate + map.Honorary);
}

/* ============================================================
   RENDER: NEWS
============================================================ */
function renderNews(list) {
  if (!list.length) return;

  // Home: 4 ล่าสุด
  document.getElementById('home-news-container').innerHTML =
    list.slice(0, 4).map((n, i) => newsCard(n, i)).join('');

  // All news
  renderNewsList(list);
}

function renderNewsList(list) {
  const container = document.getElementById('news-full-container');
  if (!list.length) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted">
        <i class="bi bi-newspaper" style="font-size:2.5rem;opacity:0.3;"></i>
        <p class="mt-3">ไม่พบข่าวที่ตรงกับคำค้นหา</p>
      </div>`;
    return;
  }
  container.innerHTML = list.map((n, i) => newsCard(n, i, true)).join('');
}

function newsCard(n, index, isFullPage = false) {
  const img      = n.ImageURL || 'https://placehold.co/400x200/f0f0f0/aaaaaa?text=ไม่มีรูปภาพ';
  const excerpt  = stripHtml(n.Desc || '');
  const catBadge = n.Category
    ? `<span class="badge rounded-pill me-2" style="background:var(--tu-claret);color:white;font-size:0.7rem;">${esc(n.Category)}</span>`
    : '';
  return `
    <div class="col-md-4 col-sm-6">
      <div class="card-modern overflow-hidden h-100 d-flex flex-column">
        <div style="height:200px;overflow:hidden;flex-shrink:0;">
          <img src="${img}" class="w-100 h-100" style="object-fit:cover;transition:.3s;"
               alt="${esc(n.Title || '')}"
               onerror="this.src='https://placehold.co/400x200/f0f0f0/aaaaaa?text=ไม่มีรูปภาพ'">
        </div>
        <div class="p-3 d-flex flex-column flex-grow-1">
          <div>${catBadge}<small class="fw-bold" style="color:var(--tu-gold);">${esc(n.Date || '')}</small></div>
          <h5 class="fw-bold text-dark mb-2 mt-1" style="line-height:1.4;">${esc(n.Title || '')}</h5>
          <p class="text-secondary small news-excerpt mb-3">${esc(excerpt)}</p>
          <button class="btn btn-outline-dark btn-sm mt-auto" style="border-radius:20px;"
                  onclick="openNewsDetail(${index},${isFullPage})">
            อ่านรายละเอียด
          </button>
        </div>
      </div>
    </div>`;
}

function openNewsDetail(index, isFullPage = false) {
  const list = globalData.news || [];
  const n    = list[index];
  if (!n) return;

  document.getElementById('newsModalTitle').textContent = n.Title || '';
  document.getElementById('newsModalDate').textContent  = n.Date  || '';
  document.getElementById('newsModalDesc').innerHTML    = n.Desc  || '';

  const imgEl = document.getElementById('newsModalImg');
  const src   = n.DetailImageURL || n.ImageURL;
  imgEl.src           = src || '';
  imgEl.style.display = src ? 'block' : 'none';

  new bootstrap.Modal(document.getElementById('newsModal')).show();
}

/* ============================================================
   NEWS SEARCH / FILTER
============================================================ */
function initNewsSearch() {
  document.getElementById('news-search-input')?.addEventListener('input', filterNews);
  document.querySelectorAll('.news-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterNews();
    });
  });
}

function filterNews() {
  const keyword   = (document.getElementById('news-search-input')?.value || '').toLowerCase().trim();
  const activeBtn = document.querySelector('.news-filter-btn.active');
  const year      = activeBtn?.dataset.year || '';

  const filtered = (globalData.news || []).filter(n => {
    const matchKw   = !keyword || (n.Title || '').toLowerCase().includes(keyword) || stripHtml(n.Desc || '').toLowerCase().includes(keyword);
    const matchYear = !year    || (n.Date  || '').includes(year);
    return matchKw && matchYear;
  });

  renderNewsList(filtered);
}

/* ============================================================
   RENDER: COMMITTEE
============================================================ */
function renderCommittee(list) {
  const container = document.getElementById('committee-full-container');
  if (!list.length) {
    container.innerHTML = '<p class="text-muted text-center col-12">ยังไม่มีข้อมูลคณะกรรมการ</p>';
    return;
  }

  container.innerHTML = list.map(c => {
    const img        = c.ImageURL || 'https://placehold.co/300x300/f0f0f0/aaaaaa?text=รูปภาพ';
    const isAdvisor  = (c.Position || '').includes('ที่ปรึกษา');
    const badgeBg    = c.Color || (isAdvisor ? 'var(--slate-gray)' : 'var(--tu-claret)');
    return `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="card-modern text-center pb-3">
          <div class="committee-img-container">
            <img src="${img}" alt="${esc(c.Name || '')}"
                 onerror="this.src='https://placehold.co/300x300/f0f0f0/aaaaaa?text=รูปภาพ'">
          </div>
          <div class="px-3 pt-3">
            <h5 class="fw-bold mb-1" style="color:var(--slate-gray);">${esc(c.Name || '')}</h5>
            <span class="badge fw-light" style="background-color:${badgeBg};color:white;">
              ${esc(c.Position || '')}
            </span>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ============================================================
   ANIMATE VALUE
============================================================ */
function animateValue(id, end) {
  const el = document.getElementById(id);
  if (!el) return;
  end = parseInt(end) || 0;
  if (end === 0) { el.textContent = '0'; return; }

  let current  = 0;
  const range  = end;
  const step   = Math.max(Math.floor(1800 / range), 10);

  const timer = setInterval(() => {
    const inc = range > 100 ? Math.floor(Math.random() * 8) + 2 : 1;
    current   = Math.min(current + inc, end);
    el.textContent = current.toLocaleString('th-TH');
    if (current >= end) { clearInterval(timer); el.textContent = end.toLocaleString('th-TH'); }
  }, step);
}

/* ============================================================
   BACK TO TOP
============================================================ */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () =>
    btn.classList.toggle('visible', window.scrollY > 400)
  );
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   UTILITIES
============================================================ */
function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
