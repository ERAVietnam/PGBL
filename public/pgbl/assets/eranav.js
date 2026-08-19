/* ERA · PGBL — Thanh NAV gim day trang dung chung cho moi trang web.
   Cach dung:  <script src="../assets/eranav.js" data-active="gallery"></script>
   data-active nhan 1 trong: tour360 | hientrang | giohang | tienich | hatang
   (18/08 da BO 3 muc: ebro | nhamau | gallery — xem ghi chu o mang ITEMS)
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

  /* 🔴 14/08 — THU TU CHUAN, PHAI KHOP 3 CHO:
       (1) day nay, (2) the o trang chu index.html, (3) thanh nav trong tour krpano
           (tour360\era-txv-skin-pgbl.xml, cac dong era_navitem).
     Quy tac: muc CHAY DUOC dung truoc, muc "SAP CO" don xuong CUOI.
     Muc "Vi Tri" da BO HAN 14/08 — Ha tang bao gom vi tri roi.

     🔴 18/08 — Anh Tony chot BO HAN 3 MUC: E-Brochure · Nha Mau · Gallery.
     Ly do phu: 8 muc lam thanh nav TRAN KHOI MAN iPad (anh Anh gui: chu bi cat
     ca 2 dau). Con 5 muc thi vua khit moi thiet bi.
     ⚠️ 3 THU MUC /ebro/ · /gallery/ VAN CON NGUYEN tren dia, chi go khoi menu.
     BAT LAI = them lai dong tuong ung vao mang ITEMS duoi day:
       { id:'ebro',    href:'/ebro/index.html',    icon:'ph-book-open',  label:'E-Brochure' }
       { id:'nhamau',  href:'#',                   icon:'ph-house-line', label:'Nhà mẫu', soon:true }
       { id:'gallery', href:'/gallery/index.html', icon:'ph-images',     label:'Gallery' }
     Nho bat lai DONG THOI o ca 3 cho (mang nay · index.html · era-txv-skin-pgbl.xml). */
  var ITEMS = [
    { id: 'tour360',  href: '/tour360/?startscene=scene_matbang_flycam', icon: 'ph-mountains', label: 'Toàn cảnh' },
    { id: 'hientrang', href: '/tour360/?startscene=scene_02-toan-canh',  icon: 'ph-drone',     label: 'Flycam hiện trạng' },
    { id: 'giohang',  href: '/giohang/',   icon: 'ph-squares-four',    label: 'Mặt bằng' },
    { id: 'tienich',  href: '/tienich/',   icon: 'ph-map-trifold',     label: 'Tiện ích' },
    { id: 'hatang',   href: '/hatang/',    icon: 'ph-road-horizon',    label: 'Hạ tầng' }
  ];

  var css = '' +
    '#era-nav{position:fixed;left:0;right:0;bottom:0;z-index:9000;display:flex;justify-content:center;' +
    'padding:8px 10px calc(8px + env(safe-area-inset-bottom));pointer-events:none;font-family:"Inter",system-ui,-apple-system,"Segoe UI",Arial,sans-serif}' +
    /* 🔴 18/08 — con 5 muc nen ha max-width 760 -> 620px, khoi bi keo dan qua rong.
       Doi so muc thi sua lai con so nay: uoc luong ~124px/muc. */
    '#era-nav .wrap{pointer-events:auto;display:flex;gap:2px;max-width:620px;width:100%;' +
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
    /* 🔴 14/08 Anh Tony: CHI RIENG trang gio hang moi can trai, cac trang khac
       giu nguyen can GIUA. Ly do: chi trang gio hang co cot bo loc ben phai,
       thanh nav can giua se de len no tren iPad ngang.
       Cach lam: mount() gan class 'trai' cho #era-nav khi data-active="giohang".
       => Sua vi tri o day KHONG anh huong 7 trang con lai. */
    '@media(min-width:821px){#era-nav.trai{justify-content:flex-start;padding-left:16px}' +
    '#era-nav.trai .wrap{max-width:min(620px,72vw)}}' +
    '@media(max-width:560px){#era-nav a span{font-size:8.8px}#era-nav a i{font-size:19px}#era-nav a{padding:7px 2px 5px}#era-nav a .soon{display:none}}' +
    'body{padding-bottom:86px}';

  var st = document.createElement('style');
  st.id = 'era-nav-style';
  st.textContent = css;
  document.head.appendChild(st);

  var html = '<div class="wrap">';
  ITEMS.forEach(function (it) {
    var cls = it.id === active ? ' class="active"' : '';
    html += '<a href="' + it.href + '" target="_top"' + cls + '>' +
      (it.soon ? '<span class="soon">Sắp có</span>' : '') +
      '<i class="ph-light ' + it.icon + '"></i>' +
      '<span>' + it.label + '</span></a>';
  });
  html += '</div>';

  function mount() {
    var nav = document.createElement('nav');
    nav.id = 'era-nav';
    /* chi trang gio hang moi day nav sang trai — xem ghi chu o khoi @media */
    if (active === 'giohang') nav.className = 'trai';
    nav.innerHTML = html;
    document.body.appendChild(nav);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
