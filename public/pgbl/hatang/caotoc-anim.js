/* ============================================================================
   caotoc-anim.js  —  HIỆU ỨNG CHUYỂN ĐỘNG CHO LỚP CAO TỐC  (14/08/2026)
   ----------------------------------------------------------------------------
   ADDITIVE 100%. Gỡ 1 dòng <script src="caotoc-anim.js"> trong map3d.html
   là bản đồ về y như cũ. File này KHÔNG sửa dữ liệu, KHÔNG sửa lớp có sẵn
   (ngoài việc đổi thuộc tính line-dasharray của ct-thicong theo từng frame).

   LÀM 2 VIỆC:
     [1] NÉT ĐỨT CHẠY (marching ants) trên lớp 'ct-thicong'
         - Chỉ đổi paint 'line-dasharray', KHÔNG đụng toạ độ
         => chat khác đang nối các khoảng hở trong caotoc-data.js vẫn chạy
            song song, hai việc không giao nhau.
         - 🎁 Tác dụng phụ có ích: nét đứt trôi tới chỗ THIẾU DỮ LIỆU sẽ
           khựng lại rồi nhảy => nhìn 1 vòng là thấy khoảng hở nằm đâu.
     [4] GLOW PULSE khi bấm vào 1 tuyến — nhấp nháy 3 nhịp rồi tắt,
         để "chỉ chỗ" đúng đoạn khách vừa bấm.

   🔴 PHÁP LÝ (NĐ 02/2022) — RÀNG BUỘC KHÔNG ĐƯỢC PHÁ:
     - Đoạn đang thi công VẪN LÀ NÉT ĐỨT. Hiệu ứng chỉ làm nét đứt TRÔI CHẬM,
       tuyệt đối không biến thành nét liền, không mũi tên phóng vun vút —
       khách phải vẫn hiểu "đường CHƯA chạy được".
     - KHÔNG thêm chấm/xe chạy dọc tuyến, KHÔNG hiện số phút di chuyển.

   🔴 BẪY ĐÃ TRÁNH (chép từ nhật ký + tài liệu MapLibre):
     a) MapLibre KHÔNG nội suy được 'line-dasharray' (không có transition).
        => Phải đổi cả mảng dash theo từng frame, không dùng interpolate.
     b) Mảng dasharray ĐỘ DÀI LẺ bị nhân đôi và ĐẢO vai dash/gap
        => nét đứt ra dài ngắn lộn xộn. Ở đây LUÔN dùng mảng 6 phần tử (CHẴN),
        tổng LUÔN = 2*(dash+gap) nên chu kỳ không đổi khi trôi.
     c) Style của map3d.html viết tay, KHÔNG khai 'glyphs'
        => file này TUYỆT ĐỐI không dùng layer 'symbol'.
     d) addHighway() chạy trong map.on('load') nên lúc script này nạp xong
        lớp có thể CHƯA tồn tại => phải CHỜ, không giả định.
     e) Chat khác có thể ghi đè map3d.html hoặc đổi tên lớp
        => thiếu lớp thì thoát ÊM (console.warn), không làm hỏng bản đồ.
   ========================================================================== */
(function () {
  'use strict';

  var TAG = '[caotoc-anim]';

  /* ---------- CẤU HÌNH — Anh Tony sửa ở đây ---------- */
  var CH = {
    LOP_THICONG : 'ct-thicong',       /* lớp nét đứt vàng, đang thi công        */
    LOP_BAM     : ['ql-hienhuu', 'ct-khaithac', 'ct-thicong', 'ct-dexuat-dai'],
    LOP_GLOW    : 'ct-glow-pulse',    /* lớp glow do file này tạo               */
    CHEN_TRUOC  : 'ct-casing',        /* glow nằm DƯỚI viền tối => loè ra ngoài */

    DASH_DAI    : 2.0,                /* = dasharray gốc [2, 1.8], giữ nguyên   */
    DASH_HO     : 1.8,                /* cảm giác nét đứt để không phá pháp lý  */
    SO_BUOC     : 16,                 /* số frame cho 1 chu kỳ dịch             */
    MS_MOI_BUOC : 80,                 /* 16 x 80ms = 1,28s / 1 nhịp dash        */
    NGUOC_CHIEU : false,              /* true = trôi ngược hướng Đà Lạt -> HCM  */

    GLOW_NHIP_MS : 1300,              /* 1 nhịp sáng-tắt                        */
    GLOW_SO_NHIP : 3,
    GLOW_ALPHA   : 0.55
  };

  /* Màu glow theo trạng thái — khớp bảng màu trong map3d.html */
  var GLOW_MAU = {
    khaithac  : '#E8730C',
    thicong   : '#FFC94B',
    hienhuu   : '#E01B24',
    dexuat    : '#7FD1FF',
    vanphong  : '#FFFFFF',   /* đường VP ERA -> cao tốc (thêm 14/08 ở chat khác) */
    noicaotoc : '#8B5CF6'
    /* Trạng thái lạ (chat khác thêm sau) -> tự dùng trắng, không lỗi. */
  };

  var CHU_KY = CH.DASH_DAI + CH.DASH_HO;   /* 3.8 */
  var DASH_GOC = [CH.DASH_DAI, CH.DASH_HO];

  var map = null;
  var bat = true;          /* hiệu ứng đang bật?            */
  var buoc = 0;            /* frame hiện tại của dash        */
  var tLanCuoi = 0;
  var idRAF = null;
  var glowDangChay = false;

  /* ==========================================================================
     CÔNG THỨC DASH — trái tim của hiệu ứng
     --------------------------------------------------------------------------
     Cần: nét đứt D=2 / hở G=1.8 nhưng DỊCH đi một đoạn o (0 <= o < D+G).
     Mảng dasharray luôn bắt đầu bằng 1 nét kể từ đầu đường, nên phải tự
     dựng lại mẫu đã dịch. Dùng 6 phần tử (CHẴN) để MapLibre không nhân đôi
     sai vai dash/gap, và tổng LUÔN = 2*(D+G) = 7.6 để chu kỳ không co giãn.

       o <= G :  [0,      G-... ]  ->  [0,     o, D, G, D, G-o]
                 nét 0 (không vẽ) + hở o  => cả mẫu bị đẩy đi o
       o >  G :  r = o - G
                 [D-r,   G, D, G, r, 0]
                 nét đầu bị cắt còn D-r, phần r trả về cuối chu kỳ,
                 hở cuối = 0 để r dán liền với nét đầu của chu kỳ sau.

     Kiểm tay (đã tính):
       o = 0    -> [0,0,2,1.8,2,1.8]   = đúng mẫu gốc 2/1.8
       o = 1.0  -> [0,1,2,1.8,2,0.8]   nét 2 & 2, hở 1.8 & (0.8+0+1)=1.8  ✔
       o = 1.8  -> [0,1.8,2,1.8,2,0]   ✔
       o = 2.8  -> [1,1.8,2,1.8,1,0]   nét 1+(1 của chu kỳ sau)=2, hở 1.8 ✔
     ======================================================================== */
  function dashTai(o) {
    var D = CH.DASH_DAI, G = CH.DASH_HO;
    if (o <= G) return [0, o, D, G, D, G - o];
    var r = o - G;
    return [D - r, G, D, G, r, 0];
  }

  /* ---------- Chờ map + lớp cao tốc xuất hiện ---------- */
  function layMap() {
    try { if (window.map) return window.map; } catch (e) {}
    /* 🔴 BẪY TO — map3d.html khai `const map = ...` ở top-level script inline.
       `const/let` top-level KHÔNG gắn vào window, mà bên trong hàm bọc này
       cái tên `map` lại là BIẾN RIÊNG của file (var map = null) => viết
       `typeof map` ở đây là đọc biến của MÌNH, luôn null, tìm mãi không ra.
       Cách vòng: eval GIÁN TIẾP `(0, eval)` chạy ở PHẠM VI TOÀN CỤC nên đọc
       được `const map` của map3d.html, không bị biến nội bộ che. */
    try {
      var g = (0, eval)('typeof map !== "undefined" ? map : null');
      if (g) return g;
    } catch (e2) {}
    return null;
  }

  var demCho = 0;
  function cho() {
    var m = layMap();
    if (m && typeof m.getLayer === 'function' && m.getLayer(CH.LOP_THICONG)) {
      map = m;
      khoiDong();
      return;
    }
    if (++demCho > 100) {           /* 100 x 200ms = 20 giây rồi bỏ */
      console.warn(TAG + ' Không thấy lớp "' + CH.LOP_THICONG +
                   '" sau 20s — hiệu ứng bỏ qua, bản đồ vẫn chạy bình thường.');
      return;
    }
    setTimeout(cho, 200);
  }

  /* ==========================================================================
     KHỞI ĐỘNG
     ======================================================================== */
  function khoiDong() {
    themLopGlow();
    themNutGat();
    ganSuKienBam();

    /* Tôn trọng người bật "giảm chuyển động" trong hệ điều hành:
       vào là TẮT sẵn, Anh vẫn bấm nút bật lại được. */
    var itChuyenDong = false;
    try {
      itChuyenDong = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}
    if (itChuyenDong) {
      bat = false;
      capNhatNut();
      console.log(TAG + ' Hệ điều hành đang bật "giảm chuyển động" -> hiệu ứng tắt sẵn.');
    }

    /* Tab ẩn thì requestAnimationFrame tự ngủ, nhưng khi quay lại phải
       vẽ tiếp từ mốc thời gian mới, không dồn frame. */
    document.addEventListener('visibilitychange', function () {
      tLanCuoi = 0;
    });

    idRAF = requestAnimationFrame(vong);
    console.log(TAG + ' Đã bật: nét đứt chạy trên "' + CH.LOP_THICONG +
                '" + glow khi bấm tuyến. Nút gạt ở thanh nút dưới.');
  }

  /* ---------- Lớp glow: nằm DƯỚI ct-casing để loè ra hai bên ---------- */
  function themLopGlow() {
    if (!map.getSource('ct-tuyen')) return false;
    if (map.getLayer(CH.LOP_GLOW)) return true;
    var truoc = map.getLayer(CH.CHEN_TRUOC) ? CH.CHEN_TRUOC : undefined;
    map.addLayer({
      id: CH.LOP_GLOW,
      type: 'line',
      source: 'ct-tuyen',
      /* Chưa bấm gì thì không khớp feature nào. KHÔNG dùng visibility:none
         vì còn phải đổi filter/opacity liên tục. */
      filter: ['==', ['get', 'id'], '__khong_co__'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#FFFFFF',
        'line-opacity': 0,
        'line-blur': ['interpolate', ['linear'], ['zoom'], 7, 6, 12, 16, 16, 22],
        'line-width': ['interpolate', ['linear'], ['zoom'], 7, 14, 12, 28, 16, 44]
      }
    }, truoc);
    return true;
  }

  /* ---------- Nút gạt: tự chèn cạnh nút "Tắt lớp cao tốc" ---------- */
  var nut = null;
  function themNutGat() {
    var neo = document.getElementById('btnHwToggle');
    if (!neo || !neo.parentNode) {
      console.warn(TAG + ' Không thấy #btnHwToggle — không chèn được nút gạt hiệu ứng.');
      return;
    }
    nut = document.createElement('button');
    nut.id = 'btnAnimToggle';
    nut.className = neo.className;      /* mượn đúng class 'ghost' cho khỏi lệch giao diện */
    nut.onclick = function () {
      bat = !bat;
      capNhatNut();
      if (!bat) {
        /* Trả nét đứt về ĐÚNG mẫu gốc [2, 1.8] — không để lại dash lạ */
        if (map.getLayer(CH.LOP_THICONG)) {
          map.setPaintProperty(CH.LOP_THICONG, 'line-dasharray', DASH_GOC);
        }
        tatGlow();
      }
    };
    neo.parentNode.insertBefore(nut, neo.nextSibling);
    capNhatNut();
  }

  function capNhatNut() {
    if (nut) nut.textContent = bat ? '✨ Tắt hiệu ứng' : '✨ Bật hiệu ứng';
  }

  /* ==========================================================================
     VÒNG LẶP — nét đứt chạy
     ======================================================================== */
  function vong(t) {
    idRAF = requestAnimationFrame(vong);
    if (!bat) return;
    if (document.hidden) return;
    if (!map.getLayer(CH.LOP_THICONG)) return;   /* chat khác đổi tên lớp -> im lặng bỏ qua */

    /* Lớp đang bị Anh tắt bằng nút "Tắt lớp cao tốc" thì khỏi tính toán */
    var hien = 'visible';
    try { hien = map.getLayoutProperty(CH.LOP_THICONG, 'visibility') || 'visible'; } catch (e) {}
    if (hien === 'none') return;

    if (!tLanCuoi) tLanCuoi = t;
    if (t - tLanCuoi < CH.MS_MOI_BUOC) return;
    tLanCuoi = t;

    buoc = (buoc + 1) % CH.SO_BUOC;
    var i = CH.NGUOC_CHIEU ? (CH.SO_BUOC - buoc) % CH.SO_BUOC : buoc;
    var o = CHU_KY * i / CH.SO_BUOC;
    try {
      map.setPaintProperty(CH.LOP_THICONG, 'line-dasharray', dashTai(o));
    } catch (e) {
      console.warn(TAG + ' Không đặt được line-dasharray -> tự tắt hiệu ứng nét đứt.', e);
      bat = false; capNhatNut();
    }
  }

  /* ==========================================================================
     GLOW PULSE khi bấm tuyến
     ======================================================================== */
  function ganSuKienBam() {
    CH.LOP_BAM.forEach(function (id) {
      if (!map.getLayer(id)) return;
      /* Gắn THÊM handler — map3d.html đã có handler mở popup riêng,
         MapLibre cho nhiều handler trên cùng lớp, không đè nhau. */
      map.on('click', id, function (e) {
        if (!bat) return;
        if (!e.features || !e.features.length) return;
        nhapNhay(e.features[0].properties);
      });
    });
  }

  function nhapNhay(p) {
    if (!themLopGlow()) return;
    /* 🔴 Nhận diện feature bằng thuộc tính 'id' (s1..s6, q20, nvc...) —
       KHÔNG so !=null kiểu cũ: krpano/MapLibre đều trả CHUỖI cho thuộc
       tính rỗng, so sai là quét trúng mọi feature (bẫy 11/08). */
    var ma = (p && typeof p.id !== 'undefined' && p.id !== null) ? String(p.id) : '';
    if (!ma) return;

    var mau = GLOW_MAU[p.status] || '#FFFFFF';
    map.setPaintProperty(CH.LOP_GLOW, 'line-color', mau);
    map.setFilter(CH.LOP_GLOW, ['==', ['get', 'id'], ma]);

    var t0 = 0;
    var tong = CH.GLOW_NHIP_MS * CH.GLOW_SO_NHIP;
    glowDangChay = true;

    function nhip(t) {
      if (!glowDangChay) return;
      if (!t0) t0 = t;
      var da = t - t0;
      if (da >= tong || !bat) { tatGlow(); return; }
      /* sin^2 -> lên êm, xuống êm, không giật */
      var s = Math.sin(Math.PI * (da % CH.GLOW_NHIP_MS) / CH.GLOW_NHIP_MS);
      try {
        map.setPaintProperty(CH.LOP_GLOW, 'line-opacity', CH.GLOW_ALPHA * s * s);
      } catch (e) { tatGlow(); return; }
      requestAnimationFrame(nhip);
    }
    requestAnimationFrame(nhip);
  }

  function tatGlow() {
    glowDangChay = false;
    if (!map || !map.getLayer(CH.LOP_GLOW)) return;
    try {
      map.setPaintProperty(CH.LOP_GLOW, 'line-opacity', 0);
      map.setFilter(CH.LOP_GLOW, ['==', ['get', 'id'], '__khong_co__']);
    } catch (e) {}
  }

  /* ---------- Cửa sau để gỡ lỗi trong Console ---------- */
  window.caotocAnim = {
    bat: function () { bat = true; capNhatNut(); tLanCuoi = 0; },
    tat: function () {
      bat = false; capNhatNut(); tatGlow();
      if (map && map.getLayer(CH.LOP_THICONG)) {
        map.setPaintProperty(CH.LOP_THICONG, 'line-dasharray', DASH_GOC);
      }
    },
    dashTai: dashTai,
    cauHinh: CH
  };

  cho();
})();
