/* ERA · PGBL — Thanh NAV gim day trang dung chung cho moi trang web.
   Cach dung:  <script src="/assets/eranav.js" data-active="gallery"></script>
   data-active nhan 1 trong: tour360 | giohang | tienich | nhamau | gallery | ebro
   Dung duong dan tuyet doi (/...) -> chay dung khi goc site = 06-WEB/PGBL-web. */
(function () {
  var me = document.currentScript;
  var active = (me && me.getAttribute('data-active')) || '';

  // Bao dam co Phosphor Light (neu trang chua nap)
  if (!document.querySelector('link[href*="@phosphor-icons/web"]')) {
    var pl = document.createElement('link');
    pl.rel = 'stylesheet';
    pl.href = 'https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/light/style.css';
    document.head.appendChild(pl);
  }

  var ITEMS = [
    { id: 'tour360',  href: '/tour360/',             icon: 'ph-drone',           label: 'Flycam 360' },
    { id: 'giohang',  href: '/giohang/',             icon: 'ph-squares-four',    label: 'Sản phẩm' },
    { id: 'tienich',  href: '/tienich/',             icon: 'ph-map-trifold',     label: 'Tiện ích' },
    { id: 'nhamau',   href: '#',                     icon: 'ph-house-line',      label: 'Nhà mẫu', soon: true },
    /* 12/08: Anh Tony chot TAT TAM Gallery (hinh anh dang cap nhat).
       BAT LAI = doi href ve '/gallery/index.html' va bo 'soon: true'. Trang /gallery/ VAN CON. */
    { id: 'gallery',  href: '#',                     icon: 'ph-images',          label: 'Gallery', soon: true },
    { id: 'ebro',     href: '/ebro/',                icon: 'ph-book-open',       label: 'E-Brochure' }
  ];

  var css = '' +
    '#era-nav{position:fixed;left:0;right:0;bottom:0;z-index:9000;display:flex;justify-content:center;' +
    'padding:8px 10px calc(8px + env(safe-area-inset-bottom));pointer-events:none;font-family:"Inter",system-ui,-apple-system,"Segoe UI",Arial,sans-serif}' +
    '#era-nav .wrap{pointer-events:auto;display:flex;gap:2px;max-width:760px;width:100%;' +
    'background:rgba(14,40,33,.82);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);' +
    'border:1px solid rgba(203,240,214,.18);border-radius:16px;box-shadow:0 10px 34px rgba(0,0,0,.42);padding:6px}' +
    '#era-nav a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;' +
    'text-decoration:none;color:#BAD8C3;border-radius:11px;padding:8px 4px 6px;position:relative;' +
    'transition:background .18s ease,color .18s ease}' +
    '#era-nav a i{font-size:22px;line-height:1}' +
    '#era-nav a span{font-size:11px;font-weight:500;letter-spacing:.2px;white-space:nowrap}' +
    '#era-nav a:hover{color:#EDF8EF;background:rgba(159,220,76,.10)}' +
    '#era-nav a.active{color:#A9F0C4;background:rgba(95,229,190,.14)}' +
    '#era-nav a.active::before{content:"";position:absolute;top:3px;left:50%;transform:translateX(-50%);' +
    'width:20px;height:3px;border-radius:3px;background:linear-gradient(90deg,#9BDC4C,#5FE5BE)}' +
    '#era-nav a .soon{position:absolute;top:2px;right:8px;font-size:8px;letter-spacing:.4px;text-transform:uppercase;' +
    'color:#0D2620;background:#BF9642;border-radius:6px;padding:1px 4px;font-weight:700}' +
    '@media(max-width:560px){#era-nav a span{font-size:9.5px}#era-nav a i{font-size:20px}#era-nav a .soon{display:none}}' +
    'body{padding-bottom:86px}';

  var st = document.createElement('style');
  st.id = 'era-nav-style';
  st.textContent = css;
  document.head.appendChild(st);

  var html = '<div class="wrap">';
  ITEMS.forEach(function (it) {
    var cls = it.id === active ? ' class="active"' : '';
    var target = it.href === '#' ? '' : ' target="_top"';
    html += '<a href="' + it.href + '"' + target + cls + '>' +
      (it.soon ? '<span class="soon">Sắp có</span>' : '') +
      '<i class="ph-light ' + it.icon + '"></i>' +
      '<span>' + it.label + '</span></a>';
  });
  html += '</div>';

  function mount() {
    var nav = document.createElement('nav');
    nav.id = 'era-nav';
    nav.innerHTML = html;
    document.body.appendChild(nav);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
