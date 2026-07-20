/**
 * app.js — ตรรกะหน้าเว็บทั้งหมด (routing + rendering)
 * ข้อมูลจริงถูกดึงมาจาก Apps Script ผ่าน api.js (fetchAllData)
 */

var globalData = {};
var DEFAULT_LOGO = 'logo-tuswalumni.png';

/* ------------------------------------------------------------------ */
/* Routing (มี URL hash เพื่อให้ refresh / กด back / แชร์ลิงก์ได้)      */
/* ------------------------------------------------------------------ */
var VALID_PAGES = ['home', 'history', 'objectives', 'members-info', 'rights', 'committee', 'news'];

function showPage(pageId, skipHashUpdate) {
  if (VALID_PAGES.indexOf(pageId) === -1) pageId = 'home';

  document.querySelectorAll('.app-page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(function (n) { n.classList.remove('active'); });
  if (pageId === 'home') document.getElementById('nav-home') && document.getElementById('nav-home').classList.add('active');
  if (pageId === 'committee') document.getElementById('nav-committee') && document.getElementById('nav-committee').classList.add('active');
  if (pageId === 'news') document.getElementById('nav-news') && document.getElementById('nav-news').classList.add('active');
  if (pageId === 'members-info' || pageId === 'rights') {
    var parent = document.getElementById('nav-member-parent');
    if (parent) parent.classList.add('active');
  }

  if (!skipHashUpdate) {
    history.pushState(null, '', pageId === 'home' ? '#' : '#' + pageId);
  }

  window.scrollTo(0, 0);

  var navCollapse = document.getElementById('navbarNav');
  if (navCollapse && navCollapse.classList.contains('show')) {
    new bootstrap.Collapse(navCollapse).hide();
  }
}

function routeFromHash() {
  var pageId = (location.hash || '').replace('#', '') || 'home';
  showPage(pageId, true);
}

window.addEventListener('popstate', routeFromHash);

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */
window.addEventListener('DOMContentLoaded', function () {
  var yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.innerText = new Date().getFullYear();

  initBackToTop();
  boot();
});

function boot() {
  fetchAllData()
    .then(function (data) {
      initSite(data);
      routeFromHash();
      hideLoading();
    })
    .catch(function (err) {
      showLoadingError(err.message);
    });
}

function hideLoading() {
  var loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
}

function showLoadingError(message) {
  hideLoading();
  var box = document.getElementById('loading-error');
  var msg = document.getElementById('loading-error-message');
  if (msg) msg.innerText = message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
  if (box) box.style.display = 'flex';
}

function retryBoot() {
  var box = document.getElementById('loading-error');
  if (box) box.style.display = 'none';
  var loading = document.getElementById('loading');
  if (loading) loading.style.display = 'flex';
  boot();
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */
function initSite(data) {
  globalData = data;

  // --- BANNER ---
  var defaultBanner = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Thammasat_University_Tha_Phrachan_Campus_-_landscape_from_Chao_Phraya_River.jpg/800px-Thammasat_University_Tha_Phrachan_Campus_-_landscape_from_Chao_Phraya_River.jpg';
  var banners = [];
  if (data.banners && data.banners.length > 0) {
    banners = data.banners;
  } else {
    var bannerStr = (data.config && data.config.BannerURL) ? data.config.BannerURL.toString() : defaultBanner;
    var oldBanners = bannerStr.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
    if (oldBanners.length === 0) oldBanners = [defaultBanner];

    banners = oldBanners.map(function (url) {
      return {
        ImageURL: url,
        Title: 'สมาคมนักศึกษาเก่าสังคมสงเคราะห์ศาสตร์ มหาวิทยาลัยธรรมศาสตร์',
        Subtitle: 'TU SOCIAL ADMINISTRATION ALUMNI ASSOCIATION',
        LinkURL: 'https://members.tuswalumni.com/',
        ButtonText: 'สมัครสมาชิก / ตรวจสอบสถานะ'
      };
    });
  }
  renderBanners(banners);

  // --- STATS (นับเฉพาะ "สมาชิกสมบูรณ์" จากฝั่ง Apps Script แล้ว) ---
  document.getElementById('stats-section').style.display = 'block';

  var stats = { Ordinary: 0, Associate: 0, Honorary: 0 };
  if (data.stats && Array.isArray(data.stats)) {
    data.stats.forEach(function (item) {
      if (item.Type === 'Ordinary') stats.Ordinary = parseInt(item.Count, 10) || 0;
      if (item.Type === 'Associate') stats.Associate = parseInt(item.Count, 10) || 0;
      if (item.Type === 'Honorary') stats.Honorary = parseInt(item.Count, 10) || 0;
    });
  }

  animateValue('count-ordinary', stats.Ordinary);
  animateValue('count-associate', stats.Associate);
  animateValue('count-honorary', stats.Honorary);

  renderNews(data.news);
  renderCommittee(data.committee);
}

function renderBanners(bannerList) {
  var indicators = document.getElementById('carousel-indicators');
  var inner = document.getElementById('carousel-inner');
  var indicatorsHtml = '';
  var innerHtml = '';

  bannerList.forEach(function (b, index) {
    var activeClass = (index === 0) ? 'active' : '';
    var title = escapeHtml(b.Title || 'สมาคมนักศึกษาเก่าสังคมสงเคราะห์ศาสตร์ มหาวิทยาลัยธรรมศาสตร์');
    var subtitle = escapeHtml(b.Subtitle || 'TU SOCIAL ADMINISTRATION ALUMNI ASSOCIATION');
    var linkUrl = b.LinkURL || 'https://members.tuswalumni.com/';
    var btnText = escapeHtml(b.ButtonText || 'สมัครสมาชิก / ตรวจสอบสถานะ');
    var imgUrl = b.ImageURL || '';

    indicatorsHtml += '<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="' + index + '" class="' + activeClass + '" aria-current="true" aria-label="Slide ' + (index + 1) + '"></button>';

    innerHtml += '<div class="carousel-item ' + activeClass + '">' +
      '<div class="hero-carousel-item" style="background-image: url(\'' + imgUrl + '\')">' +
      '<div class="hero-overlay"></div>' +
      '<div class="container h-100">' +
      '<div class="hero-content">' +
      '<h1 class="display-4 hero-title">' + title + '</h1>' +
      '<h2 class="h5 hero-subtitle mt-2">' + subtitle + '</h2>' +
      '<a href="' + linkUrl + '" target="_blank" rel="noopener" class="btn btn-gold btn-lg mt-4 px-5 shadow rounded-1 fw-bold">' + btnText + '</a>' +
      '</div></div></div></div>';
  });

  indicators.innerHTML = indicatorsHtml;
  inner.innerHTML = innerHtml;
}

function renderNews(newsList) {
  var homeContainer = document.getElementById('home-news-container');
  var allContainer = document.getElementById('news-full-container');

  if (!newsList || newsList.length === 0) {
    var emptyMsg = '<p class="text-muted text-center w-100 py-4">ยังไม่มีข่าวประชาสัมพันธ์ในขณะนี้</p>';
    homeContainer.innerHTML = emptyMsg;
    allContainer.innerHTML = emptyMsg;
    return;
  }

  var homeHtml = '';
  newsList.slice(0, 4).forEach(function (n, index) { homeHtml += createNewsCard(n, index); });
  homeContainer.innerHTML = homeHtml;

  var allHtml = '';
  newsList.forEach(function (n, index) { allHtml += createNewsCard(n, index); });
  allContainer.innerHTML = allHtml;
}

function stripHtml(html) {
  var tmp = document.createElement('DIV');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createNewsCard(n, index) {
  var img = n.ImageURL || 'https://placehold.co/400x200?text=News';
  var previewDesc = escapeHtml(stripHtml(n.Desc));
  var title = escapeHtml(n.Title);

  return '<div class="col-md-4 col-sm-6">' +
    '<div class="card-modern overflow-hidden">' +
    '<div style="height: 200px; overflow: hidden;">' +
    '<img src="' + img + '" class="w-100 h-100" style="object-fit:cover; transition:0.3s;" alt="' + title + '" loading="lazy">' +
    '</div>' +
    '<div class="p-3 d-flex flex-column h-100">' +
    '<small class="fw-bold mb-2" style="color: var(--tu-gold);">' + escapeHtml(n.Date) + '</small>' +
    '<h5 class="fw-bold text-dark mb-2">' + title + '</h5>' +
    '<p class="text-secondary small text-truncate mb-3">' + previewDesc + '</p>' +
    '<button class="btn btn-outline-dark btn-sm mt-auto stretched-link" style="border-radius:20px;" onclick="openNewsDetail(' + index + ')">อ่านรายละเอียด</button>' +
    '</div></div></div>';
}

function openNewsDetail(index) {
  var n = globalData.news[index];
  if (!n) return;

  document.getElementById('newsModalTitle').innerText = n.Title;
  document.getElementById('newsModalDate').innerText = n.Date;

  // Desc มาจากชีตที่ทีมงานคุมเนื้อหาเองเท่านั้น จึงอนุญาตให้ใส่ HTML (ลิงก์/ตัวหนา) ได้ตามที่ตั้งใจไว้
  document.getElementById('newsModalDesc').innerHTML = n.Desc;

  var imgElem = document.getElementById('newsModalImg');
  var detailImg = n.DetailImageURL || n.ImageURL;
  if (detailImg) {
    imgElem.src = detailImg;
    imgElem.style.display = 'block';
  } else {
    imgElem.style.display = 'none';
  }

  new bootstrap.Modal(document.getElementById('newsModal')).show();
}

function renderCommittee(list) {
  var container = document.getElementById('committee-full-container');
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="text-muted text-center">ยังไม่มีข้อมูลคณะกรรมการ</p>';
    return;
  }

  var html = '';
  list.forEach(function (c) {
    var img = c.ImageURL || 'https://placehold.co/300x300?text=Person';
    var name = escapeHtml(c.Name);
    var position = escapeHtml(c.Position);

    var badgeStyle = 'background-color: var(--tu-claret); color: white;';
    if (c.Color) {
      badgeStyle = 'background-color: ' + c.Color + '; color: white;';
    } else if (c.Position && c.Position.indexOf('ที่ปรึกษา') !== -1) {
      badgeStyle = 'background-color: var(--slate-gray); color: white;';
    }

    html += '<div class="col-lg-3 col-md-4 col-sm-6">' +
      '<div class="card-modern text-center pb-3">' +
      '<div class="committee-img-container"><img src="' + img + '" alt="' + name + '" loading="lazy"></div>' +
      '<div class="px-3 pt-3">' +
      '<h5 class="fw-bold mb-1" style="color: var(--slate-gray);">' + name + '</h5>' +
      '<span class="badge fw-light" style="' + badgeStyle + '">' + position + '</span>' +
      '</div></div></div>';
  });

  container.innerHTML = html;
}

function animateValue(id, end) {
  var obj = document.getElementById(id);
  if (!obj) return;

  var start = 0;
  var duration = 2000;
  var range = end - start;

  if (range === 0) {
    obj.innerHTML = '0';
    return;
  }

  var current = start;
  var increment = end > start ? 1 : -1;
  var stepTime = Math.abs(Math.floor(duration / range));
  if (stepTime < 10) stepTime = 10;

  var timer = setInterval(function () {
    current += increment;
    if (range > 100) current += Math.floor(Math.random() * 10);
    if (current >= end) {
      current = end;
      clearInterval(timer);
    }
    obj.innerHTML = current.toLocaleString();
  }, stepTime);
}

/* ------------------------------------------------------------------ */
/* Back to top button                                                  */
/* ------------------------------------------------------------------ */
function initBackToTop() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', function () {
    btn.classList.toggle('show', window.scrollY > 500);
  });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
