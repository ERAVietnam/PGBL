/* ==================================================================
   ERA VIETNAM . NGUON TRANG THAI BAN HANG  (Phu Gia Bao Loc)
   File dung CHUNG cho:  banghang/index.html   va   giohang/index.html
   ------------------------------------------------------------------
   THU TU LAY DU LIEU (3 lop du phong, tu tren xuong):
     1. GOOGLE SHEET  (nguon that, ai cung thay giong nhau)
     2. FILE SNAPSHOT assets/trang-thai-snapshot.js  (khi mat mang)
     3. localStorage  (ban nhap tren may dang dung)
   ------------------------------------------------------------------
   ANH TONY CHI CAN SUA 1 DONG:  SHEET_ID  o ngay ben duoi.
   ================================================================== */

window.ERA_TT = (function () {

  var C = {

    /* ============ 1. GOOGLE SHEET NGUON ============
       File: "PGBL - Trang thai ban hang (ERA - nguon cho web 360)"
       tren Google Drive cua Anh Tony, tao ngay 12/08/2026.
       Mo bang: https://docs.google.com/spreadsheets/d/1_NaWEkuvexGYU4uDz_2ex6pRpLtYohBWomTTqp0hIvE/edit
       De trong  ''  thi trang tu dong dung snapshot + localStorage. */
    SHEET_ID   : '1_NaWEkuvexGYU4uDz_2ex6pRpLtYohBWomTTqp0hIvE',

    /* Ten TAB ben trong file Sheet.
       DE TRONG  ''  = dung TAB DAU TIEN . khuyen dung, khoi phu thuoc
       ten tab, doi ten tab thoai mai van chay. */
    SHEET_NAME : '',

    /* Cho phep trang mat bang doc Sheet hay khong.
       false = chi Anh dung bang van hanh, khach xem web khong goi Google. */
    DOC_SHEET_O_TRANG_MAT_BANG : true,

    /* Cho bao lau thi bo cuoc, quay ve snapshot (mili giay) */
    TIMEOUT_MS : 8000,

    /* Khoa localStorage . dung chung voi bang hang tu ban cu */
    KEY_LOCAL  : 'pgbl_banghang_v1',

    /* Ma mo khoa bang van hanh . chi de chan nguoi vo tinh mo,
       KHONG phai bao mat that (xem HUONG-DAN-TRANG-THAI.md muc 5). */
    MA_MO_KHOA : 'era2026',

    /* 5 trang thai chuan . phai TRUNG voi CAUHINH.mau ben giohang */
    DS : ['Còn hàng', 'Giữ chỗ', 'Đã cọc', 'Đã bán', 'Lock'],

    MAU : {
      'Còn hàng' : '#41B3E0',
      'Giữ chỗ'  : '#FF9015',
      'Đã cọc'   : '#5B2D86',
      'Đã bán'   : '#C8102E',
      'Lock'     : '#888888'
    },

    MAC_DINH : 'Còn hàng'
  };

  /* ================================================================
     TIEN ICH CHUNG
     ================================================================ */

  /* Chuoi tieng Viet doc tu Excel/Sheet hay o dang NFD .
     KHONG chuan hoa NFC thi 'Đông Bắc' != 'Đông Bắc'  (bay 12/08). */
  function nfc(s) {
    s = (s == null) ? '' : String(s);
    try { return s.normalize('NFC'); } catch (e) { return s; }
  }

  /* Bo dau + ve chu thuong . dung de so khop trang thai nguoi go tay */
  function khongDau(s) {
    s = nfc(s).toLowerCase().trim();
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    return s.replace(/đ/g, 'd').replace(/\s+/g, ' ');
  }

  /* Bang tra: moi kieu go tay -> 1 trong 5 trang thai chuan */
  var BANG_TRA = {};
  C.DS.forEach(function (t) { BANG_TRA[khongDau(t)] = t; });
  [['con', 'Còn hàng'], ['con hang', 'Còn hàng'], ['available', 'Còn hàng'],
   ['giu', 'Giữ chỗ'], ['giu cho', 'Giữ chỗ'], ['booking', 'Giữ chỗ'],
   ['coc', 'Đã cọc'], ['da coc', 'Đã cọc'], ['deposit', 'Đã cọc'],
   ['ban', 'Đã bán'], ['da ban', 'Đã bán'], ['sold', 'Đã bán'],
   ['lock', 'Lock'], ['khoa', 'Lock'], ['da khoa', 'Lock']
  ].forEach(function (p) { BANG_TRA[p[0]] = p[1]; });

  /* Tra ve trang thai chuan, khong nhan ra thi tra ve MAC_DINH */
  function chuan(s) {
    var k = khongDau(s);
    if (!k) return C.MAC_DINH;
    return BANG_TRA[k] || C.MAC_DINH;
  }

  /* Ma lo: 'A2-1' -> 'A2-01' (bay cu 12/08) */
  function chuanMa(s) {
    s = nfc(s).toUpperCase().replace(/\s+/g, '');
    var m = s.match(/^([AB]\d{1,2})-(\d{1,3})$/);
    return m ? (m[1] + '-' + (m[2].length < 2 ? '0' + m[2] : m[2])) : s;
  }

  /* Bo doc CSV co xu ly dau nhay kep va dau phay trong o */
  function docCSV(text) {
    var hang = [], o = '', d = [], trongNhay = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (trongNhay) {
        if (ch === '"') {
          if (text[i + 1] === '"') { o += '"'; i++; } else { trongNhay = false; }
        } else { o += ch; }
      } else if (ch === '"') { trongNhay = true; }
      else if (ch === ',') { d.push(o); o = ''; }
      else if (ch === '\n') { d.push(o); hang.push(d); d = []; o = ''; }
      else if (ch !== '\r') { o += ch; }
    }
    if (o !== '' || d.length) { d.push(o); hang.push(d); }
    return hang;
  }

  /* ================================================================
     LOP 1 . GOOGLE SHEET
     ================================================================ */

  /* Ten tab de trong -> khong gui tham so sheet -> Google dung TAB DAU TIEN */
  function urlSheet(tenTab) {
    return 'https://docs.google.com/spreadsheets/d/' + C.SHEET_ID
         + '/gviz/tq?tqx=out:csv'
         + (tenTab ? ('&sheet=' + encodeURIComponent(tenTab)) : '')
         + '&_=' + Date.now();
  }

  /* Lay 1 lan. Tra ve chuoi CSV, hoac nem loi CO NGHIA cho nguoi doc. */
  function layCSV(tenTab) {
    var huy = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var hetGio = setTimeout(function () { if (huy) huy.abort(); }, C.TIMEOUT_MS);
    return fetch(urlSheet(tenTab), huy ? { signal: huy.signal } : {})
      .then(function (r) {
        clearTimeout(hetGio);
        if (r.status === 401 || r.status === 403)
          throw new Error('Sheet chưa mở chia sẻ "Người có đường liên kết → Người xem"');
        if (!r.ok) throw new Error('Google trả về mã ' + r.status);
        return r.text();
      })
      .then(function (t) {
        /* Chua mo chia se thi Google tra ve TRANG HTML dang nhap, khong phai CSV.
           Khong bat cho nay thi bo doc CSV se nuot HTML roi bao loi lung tung. */
        var dau = t.replace(/^﻿/, '').slice(0, 400).toLowerCase();
        if (dau.indexOf('<html') >= 0 || dau.indexOf('<!doctype') >= 0)
          throw new Error('Sheet chưa mở chia sẻ "Người có đường liên kết → Người xem"');
        return t;
      })
      .catch(function (e) {
        clearTimeout(hetGio);
        if (e && e.name === 'AbortError')
          throw new Error('Quá ' + (C.TIMEOUT_MS / 1000) + 's không thấy Google trả lời');
        /* 🔴 Sheet chua mo chia se thi trinh duyet KHONG doc duoc noi dung loi,
           no chi nem 'Failed to fetch' (bi CORS chan tu truoc). Doi thanh
           cau co nghia, khong Anh Tony se ngoi do khong biet thieu buoc nao. */
        if (e instanceof TypeError) {
          if (typeof navigator !== 'undefined' && navigator.onLine === false)
            throw new Error('Máy đang mất mạng');
          throw new Error('Không gọi được Google — thường là Sheet chưa mở chia sẻ '
                        + '"Người có đường liên kết → Người xem" (xem HUONG-DAN-TRANG-THAI.md mục 2)');
        }
        throw e;
      });
  }

  function napSheet() {
    if (!C.SHEET_ID) return Promise.reject(new Error('Chưa dán SHEET_ID'));
    return layCSV(C.SHEET_NAME)
      .then(function (t) { return docBang(docCSV(t)); })
      .catch(function (e) {
        /* Co khai ten tab ma tab do khong ton tai -> lui ve tab dau tien */
        if (!C.SHEET_NAME) throw e;
        return layCSV('').then(function (t) { return docBang(docCSV(t)); });
      });
  }

  /* Doc bang CSV -> { 'A5-06': {st, gia, note, ngay, nguoi}, ... }
     Nhan cot theo TEN o dong dau, doi thu tu cot van chay dung. */
  function docBang(hang) {
    var out = {}, i, j;
    if (!hang.length) return out;

    var dau = hang[0].map(function (v) { return khongDau(v); });
    function cot() {
      for (var a = 0; a < arguments.length; a++) {
        var vt = dau.indexOf(arguments[a]);
        if (vt >= 0) return vt;
      }
      return -1;
    }
    var cMa    = cot('ma lo', 'ma', 'ma san pham');
    var cSt    = cot('trang thai', 'tinh trang', 'status');
    var cGia   = cot('gia', 'gia ban');
    var cNote  = cot('ghi chu', 'note');
    var cNgay  = cot('ngay cap nhat', 'ngay', 'cap nhat luc');
    var cNguoi = cot('nguoi cap nhat', 'nguoi', 'sale');

    if (cMa < 0) throw new Error('Sheet thieu cot "Ma lo"');

    for (i = 1; i < hang.length; i++) {
      var d = hang[i]; if (!d) continue;
      var ma = chuanMa(d[cMa] || ''); if (!ma) continue;
      var r = { st: chuan(cSt >= 0 ? d[cSt] : '') };
      if (cGia   >= 0) r.gia   = nfc(d[cGia]   || '').trim();
      if (cNote  >= 0) r.note  = nfc(d[cNote]  || '').trim();
      if (cNgay  >= 0) r.ngay  = nfc(d[cNgay]  || '').trim();
      if (cNguoi >= 0) r.nguoi = nfc(d[cNguoi] || '').trim();
      out[ma] = r;
    }
    return out;
  }

  /* ================================================================
     LOP 2 . FILE SNAPSHOT   (assets/trang-thai-snapshot.js)
     ================================================================ */

  function napSnapshot() {
    var s = window.ERA_TT_SNAPSHOT;
    if (!s || !Array.isArray(s.lots)) return null;
    var out = {};
    s.lots.forEach(function (l) {
      if (!l || !l.ma) return;
      out[chuanMa(l.ma)] = {
        st: chuan(l.st), gia: nfc(l.gia || ''), note: nfc(l.note || ''),
        ngay: nfc(l.ngay || ''), nguoi: nfc(l.nguoi || '')
      };
    });
    return { data: out, luc: nfc(s.luc || '') };
  }

  /* ================================================================
     LOP 3 . localStorage
     ================================================================ */

  function napLocal() {
    var out = {};
    try {
      var d = JSON.parse(localStorage.getItem(C.KEY_LOCAL) || '{}');
      (d.lots || []).forEach(function (l) {
        if (!l || !l.ma) return;
        out[chuanMa(l.ma)] = {
          st: chuan(l.st), gia: l.gia || '', note: l.note || '',
          ngay: l.ngay || '', nguoi: l.nguoi || ''
        };
      });
    } catch (e) {}
    return out;
  }

  function ghiLocal(ma, patch) {
    ma = chuanMa(ma);
    var d = {};
    try { d = JSON.parse(localStorage.getItem(C.KEY_LOCAL)) || {}; } catch (e) {}
    var ls = Array.isArray(d.lots) ? d.lots : [];
    var h = null, i;
    for (i = 0; i < ls.length; i++) { if (chuanMa(ls[i].ma) === ma) { h = ls[i]; break; } }
    if (!h) { h = { ma: ma }; ls.push(h); }
    for (var k in patch) { if (patch.hasOwnProperty(k)) h[k] = patch[k]; }
    d.lots = ls;
    try { localStorage.setItem(C.KEY_LOCAL, JSON.stringify(d)); } catch (e) {}
  }

  /* ================================================================
     HAM CHINH . nap()  -> Promise< {nguon, nhan, luc, data, loi} >
     nguon: 'sheet' | 'snapshot' | 'local'
     ================================================================ */

  function nap(opts) {
    opts = opts || {};
    var choSheet = (opts.sheet !== false) && !!C.SHEET_ID;

    function veSnapshot(loi) {
      var s = napSnapshot();
      if (s && Object.keys(s.data).length) {
        return { nguon: 'snapshot', nhan: 'File dự phòng trong web', luc: s.luc,
                 data: s.data, loi: loi || null };
      }
      return { nguon: 'local', nhan: 'Bản nháp trên máy này', luc: '',
               data: napLocal(), loi: loi || null };
    }

    if (!choSheet) return Promise.resolve(veSnapshot(C.SHEET_ID ? null : 'Chưa cấu hình Google Sheet'));

    return napSheet()
      .then(function (data) {
        if (!Object.keys(data).length) return veSnapshot('Sheet rỗng');
        return { nguon: 'sheet', nhan: 'Google Sheet', luc: nhanGio(new Date()),
                 data: data, loi: null };
      })
      .catch(function (e) { return veSnapshot(e && e.message ? e.message : String(e)); });
  }

  function nhanGio(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear()
         + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  return {
    C: C, DS: C.DS, MAU: C.MAU, MAC_DINH: C.MAC_DINH,
    nfc: nfc, khongDau: khongDau, chuan: chuan, chuanMa: chuanMa,
    docCSV: docCSV, nap: nap, napSheet: napSheet, napLocal: napLocal,
    ghiLocal: ghiLocal, nhanGio: nhanGio, urlSheet: urlSheet
  };
})();
