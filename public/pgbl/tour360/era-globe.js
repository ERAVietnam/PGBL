/* ============================================================================
   era-globe.js — QUẢ CẦU ĐIỀU HƯỚNG CHO TOUR FLYCAM  (14/08/2026)
   ----------------------------------------------------------------------------
   Vì sao có file này: Anh Tony tư vấn khách CHỦ YẾU BẰNG iPAD. Trên iPad,
   xoay/ngẩng panorama bằng cách miết ngón lên chính bức ảnh rất khó điều khiển
   — dễ trượt tay, dễ chạm nhầm hotspot. Quả cầu cho một chỗ bám CỐ ĐỊNH ở góc
   màn: kéo ngang = xoay, kéo dọc = ngẩng/cúi, chạm đúp = về hướng Bắc.

   ADDITIVE 100%: gỡ 1 dòng <script src="era-globe.js"> trong tour.html là tour
   về y như cũ. File này KHÔNG sửa XML, KHÔNG đụng skin, KHÔNG thêm layer krpano.

   🔴 CÁC BẪY ĐÃ TRÁNH (chép từ nhật ký dự án):
     a) krpano KHÔNG bắn sự kiện JS khi đổi tầm nhìn => phải HỎI theo nhịp.
        Dùng setInterval nhẹ (~20 lần/giây) + chỉ vẽ lại khi số THỰC SỰ đổi,
        KHÔNG dùng requestAnimationFrame liên tục (tốn pin iPad).
     b) Phải stopPropagation trong pointerdown/move, không thì krpano nhận luôn
        cú kéo và panorama trôi gấp đôi.
     c) krpano 1.19-pr16 chỉ VẼ LẠI khi tầm nhìn đổi — set xong là nó tự vẽ,
        không cần ép thêm.
     d) Quả cầu phải nằm TRÊN canvas krpano nhưng DƯỚI các hộp menu bật ra;
        z-index 60 (thanh nav krpano dùng zorder nội bộ, không phải z-index DOM).
     e) touch-action:none — thiếu dòng này iPad sẽ cuộn trang thay vì kéo cầu.
   ========================================================================== */
(function () {
  'use strict';

  var TAG = '[era-globe]';

  /* ---------- CẤU HÌNH ---------- */
  var CH = {
    NHAY_NGANG : 0.55,   /* px kéo -> độ xoay ngang. Lớn hơn = nhạy hơn        */
    NHAY_DOC   : 0.40,   /* px kéo -> độ ngẩng/cúi                             */
    NHIP_MS    : 50,     /* nhịp hỏi krpano (20 lần/giây)                      */
    VE_BAC_MS  : 800     /* thời gian bay về hướng Bắc khi chạm đúp            */
  };

  function K() { return document.getElementById('krpanoSWFObject'); }

  /* ---------- CSS ---------- */
  var css = ''
    + '#eraGlobe{position:absolute;right:16px;bottom:88px;z-index:60;'
    + 'width:92px;height:92px;border-radius:50%;'
    + 'background:radial-gradient(circle at 35% 30%, rgba(20,52,43,.94), rgba(7,20,15,.94));'
    + 'border:2px solid rgba(203,240,214,.55);'
    + 'box-shadow:0 8px 26px rgba(0,0,0,.55), inset 0 0 22px rgba(95,229,190,.16);'
    + 'cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;'
    + 'opacity:0;transition:opacity .4s ease;}'
    + '#eraGlobe.hien{opacity:1;}'
    + '#eraGlobe:active{cursor:grabbing;}'
    + '#eraGlobe .gb-ball{position:absolute;inset:11px;transform-style:preserve-3d;'
    + 'transform:rotateX(0deg) rotateZ(0deg);transition:transform .06s linear;}'
    + '#eraGlobe .gb-ring{position:absolute;inset:0;border-radius:50%;'
    + 'border:1px solid rgba(140,220,190,.45);}'
    + '#eraGlobe .gb-ring.eq{border-color:rgba(191,150,66,.95);border-width:1.5px;}'
    + '#eraGlobe .gb-dial{position:absolute;inset:0;pointer-events:none;}'
    + '#eraGlobe .gb-kim{position:absolute;left:50%;top:3px;width:0;height:0;margin-left:-5px;'
    + 'border-left:5px solid transparent;border-right:5px solid transparent;'
    + 'border-bottom:11px solid #E01B24;filter:drop-shadow(0 0 2px rgba(0,0,0,.8));}'
    + '#eraGlobe .gb-h{position:absolute;font:700 9px/1 Inter,Arial,sans-serif;'
    + 'color:#EDF8EF;text-shadow:0 0 3px #000;}'
    + '#eraGlobe .gb-h.n{left:50%;top:15px;margin-left:-3px;color:#FF9AA0;}'
    + '#eraGlobe .gb-h.s{left:50%;bottom:4px;margin-left:-3px;}'
    + '#eraGlobe .gb-h.e{right:4px;top:50%;margin-top:-4px;}'
    + '#eraGlobe .gb-h.w{left:4px;top:50%;margin-top:-4px;}'
    + '#eraGlobe .gb-so{position:absolute;left:-14px;right:-14px;bottom:-17px;text-align:center;'
    + 'font:600 10px/1 Inter,Arial,sans-serif;color:#EDF8EF;text-shadow:0 1px 3px #000;'
    + 'pointer-events:none;white-space:nowrap;}'
    /* iPad dọc & điện thoại: thu nhỏ, nhấc cao hơn thanh nav krpano */
    + '@media (max-width:820px){#eraGlobe{width:74px;height:74px;right:10px;bottom:78px;}'
    + '#eraGlobe .gb-ball{inset:9px;}#eraGlobe .gb-so{bottom:-15px;font-size:9px;}}';

  /* ---------- DOM ---------- */
  function dung() {
    var st = document.createElement('style');
    st.id = 'era-globe-style';
    st.textContent = css;
    document.head.appendChild(st);

    var g = document.createElement('div');
    g.id = 'eraGlobe';
    g.title = 'Kéo ngang để xoay · kéo dọc để ngẩng/cúi · chạm đúp về hướng Bắc';
    g.innerHTML =
        '<div class="gb-ball">'
      +   '<div class="gb-ring" style="transform:rotateY(0deg)"></div>'
      +   '<div class="gb-ring" style="transform:rotateY(45deg)"></div>'
      +   '<div class="gb-ring" style="transform:rotateY(90deg)"></div>'
      +   '<div class="gb-ring" style="transform:rotateY(135deg)"></div>'
      +   '<div class="gb-ring eq" style="transform:rotateX(90deg)"></div>'
      + '</div>'
      + '<div class="gb-dial">'
      +   '<span class="gb-kim"></span>'
      +   '<span class="gb-h n">N</span><span class="gb-h e">E</span>'
      +   '<span class="gb-h s">S</span><span class="gb-h w">W</span>'
      + '</div>'
      + '<div class="gb-so">0° / 0°</div>';
    document.body.appendChild(g);
    return g;
  }

  /* ---------- CHẠY ---------- */
  function chay() {
    var k = K();
    if (!k || typeof k.get !== 'function') return false;
    if (document.getElementById('eraGlobe')) return true;

    var g    = dung();
    var ball = g.querySelector('.gb-ball');
    var dial = g.querySelector('.gb-dial');
    var so   = g.querySelector('.gb-so');

    var hCu = null, vCu = null;

    function ve() {
      var kk = K(); if (!kk) return;
      var h = Number(kk.get('view.hlookat'));
      var v = Number(kk.get('view.vlookat'));
      if (isNaN(h) || isNaN(v)) return;
      if (h === hCu && v === vCu) return;      /* 🔴 không đổi thì không vẽ lại */
      hCu = h; vCu = v;

      /* vlookat: âm = ngước lên, dương = cúi xuống. Quả cầu nghiêng theo. */
      ball.style.transform = 'rotateX(' + (-v).toFixed(1) + 'deg) rotateZ(' + (-h).toFixed(1) + 'deg)';
      dial.style.transform = 'rotate(' + (-h).toFixed(1) + 'deg)';
      var hDep = Math.round((h % 360 + 360) % 360);
      so.textContent = hDep + '° / ' + Math.round(v) + '°';
      if (!g.classList.contains('hien')) g.classList.add('hien');
    }

    ve();
    setInterval(ve, CH.NHIP_MS);

    /* ----- kéo ----- */
    var keo = null;
    g.addEventListener('pointerdown', function (e) {
      var kk = K(); if (!kk) return;
      keo = { x: e.clientX, y: e.clientY,
              h: Number(kk.get('view.hlookat')),
              v: Number(kk.get('view.vlookat')) };
      try { g.setPointerCapture(e.pointerId); } catch (x) {}
      e.preventDefault(); e.stopPropagation();
    });

    g.addEventListener('pointermove', function (e) {
      if (!keo) return;
      var kk = K(); if (!kk) return;
      /* 🔴 KHÔNG tự kẹp vlookat ở đây — mỗi scene có giới hạn riêng khai trong
         XML (view.vlookatmin/max). Cứ set, krpano tự kẹp theo scene. */
      kk.set('view.hlookat', keo.h - (e.clientX - keo.x) * CH.NHAY_NGANG);
      kk.set('view.vlookat', keo.v + (e.clientY - keo.y) * CH.NHAY_DOC);
      e.preventDefault(); e.stopPropagation();
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      g.addEventListener(t, function () { keo = null; });
    });

    /* ----- chạm đúp = về hướng Bắc, nhìn ngang ----- */
    g.addEventListener('dblclick', function (e) {
      var kk = K(); if (!kk) return;
      kk.call('tween(view.hlookat, 0, ' + (CH.VE_BAC_MS / 1000) + ', easeInOutQuad);'
            + 'tween(view.vlookat, 0, ' + (CH.VE_BAC_MS / 1000) + ', easeInOutQuad);');
      e.preventDefault(); e.stopPropagation();
    });
    /* iPad không bắn dblclick ổn định -> bắt 2 lần chạm nhanh */
    var chamCuoi = 0;
    g.addEventListener('pointerup', function () {
      var t = Date.now();
      if (t - chamCuoi < 320) {
        var kk = K(); if (kk) kk.call('tween(view.hlookat, 0, 0.8, easeInOutQuad);'
                                    + 'tween(view.vlookat, 0, 0.8, easeInOutQuad);');
      }
      chamCuoi = t;
    });

    console.log(TAG, 'da gan qua cau dieu huong');
    return true;
  }

  /* krpano nạp không đồng bộ -> dò cho tới khi có, tối đa 20 giây rồi bỏ ÊM */
  var lan = 0;
  var hen = setInterval(function () {
    lan++;
    if (chay() || lan > 200) {
      clearInterval(hen);
      if (lan > 200) console.warn(TAG, 'khong thay krpano sau 20s — bo qua qua cau');
    }
  }, 100);
})();
