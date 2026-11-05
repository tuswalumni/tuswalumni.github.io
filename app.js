/**
 * app.js — routing + rendering
 * เนื้อหาคงที่ (ประวัติ/วัตถุประสงค์/ระเบียบ) แสดงทันที ไม่ต้องรอ API
 * ส่วนที่มาจาก Apps Script (แบนเนอร์ ข่าว กรรมการ สถิติ) แสดง skeleton ระหว่างโหลด
 */

var globalData = {};
var FOUNDED_BE = 2520;
var MEMBER_URL = 'https://members.tuswalumni.com/';
var SITE_NAME = 'สมาคมนักศึกษาเก่าสังคมสงเคราะห์ศาสตร์ มหาวิทยาลัยธรรมศาสตร์';
var SITE_SUB = 'TU SOCIAL ADMINISTRATION ALUMNI ASSOCIATION';

/* ---------------- Routing (hash) ---------------- */
var VALID_PAGES = ['home', 'history', 'objectives', 'members-info', 'rights', 'committee', 'news'];

function showPage(pageId) {
  if (VALID_PAGES.indexOf(pageId) === -1) pageId = 'home';

  document.querySelectorAll('.app-page').forEach(function (p) {
    p.classList.toggle('active', p.id === pageId);
  });

  document.querySelectorAll('[data-nav]').forEach(function (n) {
    var pages = n.getAttribute('data-nav').split(' ');
    var on = pages.indexOf(pageId) !== -1;
    n.classList.toggle('active', on);
    if (on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
  });

  window.scrollTo(0, 0);

  var navCollapse = document.getElementById('navbarNav');
  if (navCollapse && navCollapse.classList.contains('show')) {
    bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
  }
}

function routeFromHash() {
  showPage((location.hash || '').replace('#', '') || 'home');
}

window.addEventListener('hashchange', routeFromHash);

/* ---------------- Boot ---------------- */
window.addEventListener('DOMContentLoaded', function () {
  var be = new Date().getFullYear() + 543;
  document.getElementById('currentYear').textContent = new Date().getFullYear();
  document.querySelectorAll('.js-years').forEach(function (el) { el.textContent = be - FOUNDED_BE; });

  routeFromHash();
  initBackToTop();
  boot();
});

function boot() {
  fetchAllData()
    .then(function (data) {
      document.getElementById('data-error').classList.remove('show');
      initSite(data || {});
    })
    .catch(function (err) {
      showDataError(err.message);
    });
}

function showDataError(message) {
  var box = document.getElementById('data-error');
  document.getElementById('data-error-message').textContent = message || 'โหลดข่าวและข้อมูลสมาชิกไม่สำเร็จ';
  box.classList.add('show');
  renderHero([]);
  ['home-news-container', 'news-full-container', 'committee-full-container'].forEach(function (id) {
    document.getElementById(id).innerHTML = '<p class="text-ink-3 text-center w-100 py-4">ไม่สามารถโหลดข้อมูลได้ในขณะนี้</p>';
  });
}

function retryBoot() {
  document.getElementById('data-error').classList.remove('show');
  boot();
}

/* ---------------- Render ---------------- */
function initSite(data) {
  globalData = data;

  var banners = [];
  if (data.banners && data.banners.length > 0) {
    banners = data.banners.filter(function (b) { return b.ImageURL; });
  } else if (data.config && data.config.BannerURL) {
    banners = String(data.config.BannerURL).split(',')
      .map(function (s) { return s.trim(); })
      .filter(Boolean)
      .map(function (url) { return { ImageURL: url }; });
  }
  renderHero(banners);

  var stats = { Ordinary: 0, Associate: 0, Honorary: 0 };
  (Array.isArray(data.stats) ? data.stats : []).forEach(function (item) {
    if (item.Type in stats) stats[item.Type] = parseInt(item.Count, 10) || 0;
  });
  animateValue('count-ordinary', stats.Ordinary);
  animateValue('count-associate', stats.Associate);
  animateValue('count-honorary', stats.Honorary);

  renderNews(data.news);
  renderCommittee(data.committee);
}

function renderHero(bannerList) {
  var hero = document.getElementById('hero');

  if (!bannerList || bannerList.length === 0) {
    hero.innerHTML =
      '<section class="hero-logo"><div class="container"><div class="row g-5 align-items-center">' +
      '<div class="col-lg-7">' +
      '<div class="hero-eyebrow">ก่อตั้ง พ.ศ. ' + FOUNDED_BE + ' · ' + (new Date().getFullYear() + 543 - FOUNDED_BE) + ' ปี</div>' +
      '<h1 class="hero-title">' + SITE_NAME + '</h1>' +
      '<p class="hero-lead">ศูนย์กลางความร่วมมือและการแลกเปลี่ยนเรียนรู้ของพี่น้องชาวสังคมสงเคราะห์ศาสตร์ มธ. ร่วมสานต่อเจตนารมณ์ในการรับใช้สังคมและพัฒนาประเทศ</p>' +
      '<div class="d-flex flex-wrap gap-2 mt-4">' +
      '<a href="' + MEMBER_URL + '" target="_blank" rel="noopener" class="btn btn-light-claret">สมัครสมาชิก / ตรวจสอบสถานะ</a>' +
      '<a href="#history" class="btn btn-ghost-light">อ่านประวัติสมาคม</a>' +
      '</div></div>' +
      '<div class="col-lg-5"><div class="hero-emblem"><img src="logo-tuswalumni.png" alt="ตราสัญลักษณ์สมาคมฯ"></div></div>' +
      '</div></div></section>';
    return;
  }

  var indicators = '';
  var items = '';
  bannerList.forEach(function (b, i) {
    var active = i === 0 ? ' active' : '';
    var title = escapeHtml(b.Title || SITE_NAME);
    var subtitle = escapeHtml(b.Subtitle || SITE_SUB);
    var link = safeUrl(b.LinkURL) || MEMBER_URL;
    var btn = escapeHtml(b.ButtonText || 'สมัครสมาชิก / ตรวจสอบสถานะ');
    var img = safeUrl(b.ImageURL);

    indicators += '<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="' + i + '" class="' + active.trim() + '"' +
      (i === 0 ? ' aria-current="true"' : '') + ' aria-label="สไลด์ที่ ' + (i + 1) + '"></button>';

    items += '<div class="carousel-item' + active + '">' +
      '<div class="hero-slide" style="background-image:url(\'' + img.replace(/'/g, '%27') + '\')">' +
      '<div class="container">' +
      '<div class="hero-eyebrow">' + subtitle + '</div>' +
      (i === 0 ? '<h1 class="hero-title">' + title + '</h1>' : '<h2 class="hero-title">' + title + '</h2>') +
      '<a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" class="btn btn-light-claret">' + btn + '</a>' +
      '</div></div></div>';
  });

  var multi = bannerList.length > 1;
  hero.innerHTML =
    '<div id="heroCarousel" class="carousel slide carousel-fade"' + (multi ? ' data-bs-ride="carousel" data-bs-interval="6000"' : '') + '>' +
    (multi ? '<div class="carousel-indicators">' + indicators + '</div>' : '') +
    '<div class="carousel-inner">' + items + '</div>' +
    (multi ?
      '<button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">ก่อนหน้า</span></button>' +
      '<button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">ถัดไป</span></button>'
      : '') +
    '</div>';

  if (multi) bootstrap.Carousel.getOrCreateInstance(document.getElementById('heroCarousel'));
}

function renderNews(newsList) {
  var home = document.getElementById('home-news-container');
  var all = document.getElementById('news-full-container');

  if (!newsList || newsList.length === 0) {
    var empty = '<p class="text-ink-3 text-center w-100 py-4">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</p>';
    home.innerHTML = empty;
    all.innerHTML = empty;
    return;
  }

  home.innerHTML = newsList.slice(0, 3).map(createNewsCard).join('');
  all.innerHTML = newsList.map(createNewsCard).join('');
}

function createNewsCard(n, index) {
  var img = safeUrl(n.ImageURL);
  var title = escapeHtml(n.Title);
  return '<div class="col-md-4 col-sm-6">' +
    '<button type="button" class="news-card" onclick="openNewsDetail(' + index + ')">' +
    '<div class="news-img">' + (img ? '<img src="' + escapeHtml(img) + '" alt="" loading="lazy">' : '') + '</div>' +
    '<div class="news-body">' +
    '<div class="news-date">' + escapeHtml(n.Date) + '</div>' +
    '<div class="news-title">' + title + '</div>' +
    '<div class="news-desc">' + escapeHtml(stripHtml(n.Desc)) + '</div>' +
    '</div></button></div>';
}

function openNewsDetail(index) {
  var n = globalData.news && globalData.news[index];
  if (!n) return;

  document.getElementById('newsModalTitle').textContent = n.Title || '';
  document.getElementById('newsModalDate').textContent = n.Date || '';
  // Desc มาจากชีตที่ทีมงานคุมเอง จึงอนุญาต HTML (ลิงก์/ตัวหนา)
  document.getElementById('newsModalDesc').innerHTML = n.Desc || '';

  var imgEl = document.getElementById('newsModalImg');
  var src = safeUrl(n.DetailImageURL || n.ImageURL);
  imgEl.style.display = src ? 'block' : 'none';
  if (src) imgEl.src = src;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('newsModal')).show();
}

function renderCommittee(list) {
  var container = document.getElementById('committee-full-container');
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-ink-3 text-center">ยังไม่มีข้อมูลคณะกรรมการ</p>';
    return;
  }

  container.innerHTML = list.map(function (c) {
    var img = safeUrl(c.ImageURL);
    var name = escapeHtml(c.Name);
    var bg = '';
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(c.Color || '').trim())) {
      bg = ' style="background:' + c.Color.trim() + '"';
    } else if (c.Position && c.Position.indexOf('ที่ปรึกษา') !== -1) {
      bg = ' style="background:var(--ink-2)"';
    }
    return '<div class="col-lg-3 col-md-4 col-6">' +
      '<div class="person">' +
      '<div class="person-img">' + (img ? '<img src="' + escapeHtml(img) + '" alt="' + name + '" loading="lazy">' : '') + '</div>' +
      '<div class="person-body"><div class="person-name">' + name + '</div>' +
      '<span class="person-role"' + bg + '>' + escapeHtml(c.Position) + '</span></div>' +
      '</div></div>';
  }).join('');
}

/* ---------------- Helpers ---------------- */
function stripHtml(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || '';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeUrl(url) {
  url = String(url || '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

function animateValue(id, end) {
  var el = document.getElementById(id);
  if (!el) return;
  if (!end || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = (end || 0).toLocaleString('th-TH');
    return;
  }
  var duration = 1200;
  var t0 = null;
  function step(t) {
    if (!t0) t0 = t;
    var p = Math.min((t - t0) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * eased).toLocaleString('th-TH');
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
