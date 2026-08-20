/* ============================================================================
   ERA · PGBL — CHONG DE NHAN POI TREN ANH 360        (19/08/2026)
   ----------------------------------------------------------------------------
   VAN DE Anh Tony bao (anh chup 19/08): cum Co.opmart / Ton Duc Thang /
   Vincom / Benh vien nam trong 6.6 do goc ngang ma bang rong ~230 px ->
   chong len nhau, khong doc duoc cai nao.

   🔴 GOC KY THUAT: hotspot POI deu dat `distorted = false` => KICH THUOC PIXEL
   CO DINH, khong co theo zoom. Zoom ra thi khoang cach GOC bi nen lai con chu
   giu nguyen be rong => de nhau. Zoom vao thi tu het. Bo POI truoc gio KHONG
   CO MOT DONG CHONG DE NAO — `onviewchange` chi lam moi viec xoay kim la ban.

   CACH CHUA: moi lan doi tam nhin, chieu tat ca nhan xuong toa do man hinh,
   xep theo HANG, hang cao dat truoc; ai de len nguoi da dat thi AN DI.
   Cham do (poi_dot_) LUON GIU LAI -> khach van thay co moc o do, zoom vao la
   chu hien ra.

   ============================ 5 BAY DA NE ==================================
   🔴 1. TUYET DOI KHONG DUNG `visible`.
        `era_layers_apply` trong era-layers-360.xml DA CHIEM thuoc tinh do:
        no an/hien theo 4 lop (Tien ich · Ha tang · Danh lam · San pham) va
        danh dau bang co `lay_hid`. Hai co che cung ghi 1 thuoc tinh thi
        hong ngam, khong bao loi. => File nay chi dung `alpha`, da grep xac
        nhan khong noi nao khac ghi `.alpha` cho hotspot poi_* (chi co
        `bgalpha`, la thuoc tinh khac).
   🔴 2. NHAN DANG BI LOP AN THI BO QUA HAN — khong tinh cho, khong tra alpha.
        Neu khong, tat lop "Tien ich" xong bat lai se bi file nay ghi de.
   🔴 3. DOC HET TOA DO TRUOC, GHI SAU. Doc-ghi xen ke ep krpano tinh lai
        layout tung buoc -> giat khi keo tren iPad (cung ho bay 18/08 tren
        ban do ha tang).
   🔴 4. XEP THEO HANG CO DINH, KHONG theo thu tu tren man hinh. Neu xep theo
        vi tri man hinh thi vua keo vua doi thu tu -> nhan nhap nhay lien tuc.
   🔴 5. CHE DO SUA POI (phim P) thi TAT HAN chong de, tra alpha ve 1. Dang
        keo nhan ma no tu an di thi khong the lam viec duoc.
   ============================================================================
   GO BO = xoa 1 dong <script> nap file nay trong tour.html. Tour ve y nhu cu.
   ========================================================================== */
(function () {
	'use strict';

	var CH = {
		LE: 6,          // khoang ho toi thieu giua 2 nhan (px)
		GOC_TOI_DA: 88, // lech tam nhin qua nguong nay = dang o sau lung, bo qua
		BIEN: 40        // cho phep nho ra ngoai mep man bao nhieu px moi tinh la ngoai
	};

	var k = null;      // doi tuong krpano
	var ds = [];       // danh sach nhan da lap chi muc
	var daLap = false;
	var doiKhung = false;
	var tatVinhVien = false;

	function so(v, md) { var x = parseFloat(v); return isFinite(x) ? x : md; }

	/* ---------- lay krpano ---------- */
	function layKr() {
		if (k) return k;
		k = document.getElementById('krpanoSWFObject') ||
			(window.krpano || null) ||
			document.querySelector('#pano embed, #pano object, #pano canvas');
		if (k && typeof k.get !== 'function') k = null;
		return k;
	}

	/* ---------- CHIEU DIEM 3D XUONG MAN HINH ----------
	   🔴 BAY DA DO RA TRUOC KHI VIET: krpano 1.19 KHONG CO ham JS
	      `krpano.spheretoscreen()`. Da grep ca tour.js (161 KB): chuoi
	      'sphere' xuat hien 0 lan. Goi bua vao la loi "not a function",
	      ca file chet ngay dong dau. => TU CHIEU bang luong giac, va van
	      thu dung ham san co truoc phong khi ban krpano sau nay co.
	   Phep chieu phang chuan (rectilinear), dung `view.fovtype` de biet
	   `fov` dang do theo chieu DUNG (VFOV, mac dinh) hay NGANG / CHEO. */
	var R = Math.PI / 180;
	function chieu(kk, ath, atv, h0, v0, fov, fovtype, sw, sh) {
		if (typeof kk.spheretoscreen === 'function') {
			var r = kk.spheretoscreen(ath, atv);
			if (r && isFinite(r.x) && isFinite(r.y)) return r;
		}
		var a = (ath - h0) * R, b = atv * R, c = v0 * R;
		var x = Math.sin(a) * Math.cos(b);
		var y = -Math.sin(b);
		var z = Math.cos(a) * Math.cos(b);
		var y2 = y * Math.cos(c) - z * Math.sin(c);
		var z2 = y * Math.sin(c) + z * Math.cos(c);
		if (z2 <= 0.01) return null;            // sau lung may quay
		var nua;
		switch (String(fovtype || 'VFOV').toUpperCase()) {
			case 'HFOV': nua = sw / 2; break;
			case 'DFOV': nua = Math.sqrt(sw * sw + sh * sh) / 2; break;
			default:     nua = sh / 2;
		}
		var f = nua / Math.tan(fov / 2 * R);
		return { x: sw / 2 + f * x / z2, y: sh / 2 + f * y2 / z2 };
	}

	/* ---------- edge -> goc tren trai cua khoi ----------
	   krpano neo khoi tai diem `edge`. Doi ve goc tren trai de tinh hinh chu nhat.
	   🔴 Ten edge dung cua krpano la lefttop/leftbottom/righttop/rightbottom,
	      KHONG phai topleft/bottomleft (ghi chu da co san trong era-poi-360.xml). */
	function lechEdge(edge, w, h) {
		switch ((edge || 'center').toLowerCase()) {
			case 'lefttop':     return [0, 0];
			case 'left':        return [0, -h / 2];
			case 'leftbottom':  return [0, -h];
			case 'top':         return [-w / 2, 0];
			case 'center':      return [-w / 2, -h / 2];
			case 'bottom':      return [-w / 2, -h];
			case 'righttop':    return [-w, 0];
			case 'right':       return [-w, -h / 2];
			case 'rightbottom': return [-w, -h];
			default:            return [-w / 2, -h / 2];
		}
	}

	/* ---------- lap chi muc 1 lan: doc thu KHONG DOI khi xoay/zoom ---------- */
	function lapChiMuc() {
		var kk = layKr(); if (!kk) return false;
		var tong = parseInt(kk.get('poi_count'), 10);
		if (!isFinite(tong) || tong <= 0) return false;

		ds = [];
		for (var i = 0; i < tong; i++) {
			var b = 'hotspot[poi_board_' + i + ']';
			if (kk.get(b + '.name') == null) continue;

			var w = so(kk.get(b + '.pixelwidth'), 0);
			var h = so(kk.get(b + '.pixelheight'), 0);
			/* 🔴 Text hotspot cua krpano co `width` chi la GIOI HAN TOI DA, khong
			   phai be rong that (ghi chu 10/08 trong era-poi-360.xml). Nen phai lay
			   `pixelwidth`. Neu krpano chua ve xong thi ra 0 -> uoc luong tam theo
			   so ky tu roi lan sau do lai. */
			var tam = (w <= 1 || h <= 1);
			if (tam) {
				var tieu = String(kk.get(b + '.p_title') || '');
				var phu = String(kk.get(b + '.p_sub') || '');
				w = Math.max(90, Math.min(260, 16 + 8.2 * Math.max(tieu.length, phu.length + 6)));
				h = phu ? 52 : 36;
			}

			var ph = so(kk.get('hotspot[poi_pole_' + i + '].height'), 0);

			ds.push({
				i: i,
				ath: so(kk.get(b + '.ath'), 0),
				atv: so(kk.get(b + '.atv'), 0),
				ox: so(kk.get(b + '.ox'), 0),
				oy: so(kk.get(b + '.oy'), 0),
				edge: String(kk.get(b + '.edge') || 'center'),
				w: w, h: h, doTam: tam,
				/* 🔑 HANG = CHIEU CAO COT. Khong phai Em dat ra con so moi —
				   du lieu san co da xep san: San bay Lien Khuong 140 · Nga 5 Dai Binh 130 ·
				   Vincom 125 · Nui Dai Binh / Nut giao cao toc 110 · Co.opmart 60 ·
				   THCS Phan Boi Chau 44 · Dai hoc Ton Duc Thang 20.
				   Coc cao = moc lon = dang giu lai khi chat cho. Hoa nhau thi lay
				   cai co chi so nho hon truoc (co dinh, khong doi khi keo man). */
				hang: ph,
				an: null   // trang thai dang ap dung, null = chua biet
			});
		}
		if (!ds.length) return false;

		ds.sort(function (a, b2) { return (b2.hang - a.hang) || (a.i - b2.i); });
		daLap = true;
		return true;
	}

	function deNhau(a, b) {
		return !(a.x2 + CH.LE < b.x1 || b.x2 + CH.LE < a.x1 ||
		         a.y2 + CH.LE < b.y1 || b.y2 + CH.LE < a.y1);
	}

	/* ---------- ap dung: 1 luot doc, 1 luot ghi ---------- */
	function chay() {
		doiKhung = false;
		var kk = layKr(); if (!kk) return;
		if (!daLap && !lapChiMuc()) return;

		/* BAY 5 — dang sua POI (phim P) thi tra het ve sang, khong chong de */
		if (String(kk.get('poi_edit_on')) === 'true') {
			if (!tatVinhVien) { ds.forEach(function (p) { ghi(kk, p, false); }); tatVinhVien = true; }
			return;
		}
		tatVinhVien = false;

		var hl = so(kk.get('view.hlookat'), 0);
		var vl = so(kk.get('view.vlookat'), 0);
		var fov = so(kk.get('view.fov'), 90);
		var fovtype = kk.get('view.fovtype');
		var sw = so(kk.get('stagewidth'), window.innerWidth);
		var sh = so(kk.get('stageheight'), window.innerHeight);

		/* ---------- (1) DOC — tuyet doi khong ghi gi trong vong nay ---------- */
		var dat = [];
		var canAn = [];
		var canHien = [];
		var doLai = false;

		for (var n = 0; n < ds.length; n++) {
			var p = ds[n];

			/* BAY 2 — nhan dang bi bang LOP HIEN THI an thi khong dung toi */
			if (String(kk.get('hotspot[poi_board_' + p.i + '].visible')) === 'false') continue;

			/* sau lung thi bo qua han */
			var dh = ((p.ath - hl + 540) % 360) - 180;
			if (Math.abs(dh) > CH.GOC_TOI_DA) { canAn.push(p); continue; }

			var t = chieu(kk, p.ath, p.atv, hl, vl, fov, fovtype, sw, sh);
			if (!t || !isFinite(t.x) || !isFinite(t.y)) { canAn.push(p); continue; }

			if (p.doTam) {
				var w2 = so(kk.get('hotspot[poi_board_' + p.i + '].pixelwidth'), 0);
				var h2 = so(kk.get('hotspot[poi_board_' + p.i + '].pixelheight'), 0);
				if (w2 > 1 && h2 > 1) { p.w = w2; p.h = h2; p.doTam = false; doLai = true; }
			}

			var g = lechEdge(p.edge, p.w, p.h);
			var x1 = t.x + p.ox + g[0];
			var y1 = t.y + p.oy + g[1];
			var o = { x1: x1, y1: y1, x2: x1 + p.w, y2: y1 + p.h };

			/* ngoai man hinh -> an, va KHONG chiem cho cua ai */
			if (o.x2 < -CH.BIEN || o.x1 > sw + CH.BIEN ||
			    o.y2 < -CH.BIEN || o.y1 > sh + CH.BIEN) { canAn.push(p); continue; }

			var cham = false;
			for (var m = 0; m < dat.length; m++) { if (deNhau(o, dat[m])) { cham = true; break; } }
			if (cham) { canAn.push(p); } else { dat.push(o); canHien.push(p); }
		}

		/* ---------- (2) GHI — chi ghi cai nao THAT SU doi trang thai ---------- */
		canHien.forEach(function (p) { ghi(kk, p, false); });
		canAn.forEach(function (p) { ghi(kk, p, true); });

		if (doLai) hen();
	}

	/* An = alpha 0 cho bang + coc + 2 manh phu. GIU LAI cham do poi_dot_ de
	   khach van biet co moc o do, zoom vao la chu bung ra. */
	function ghi(kk, p, an) {
		if (p.an === an) return;      // khong ghi lai cai da dung -> khoi giat
		p.an = an;
		var a = an ? 0 : 1;
		var t = ['board', 'pole', 'a', 'b'];
		for (var j = 0; j < t.length; j++) {
			var ten = 'hotspot[poi_' + t[j] + '_' + p.i + ']';
			if (kk.get(ten + '.name') != null) kk.set(ten + '.alpha', a);
		}
	}

	/* ---------- nhip: gop moi thay doi vao 1 khung hinh ---------- */
	function hen() {
		if (doiKhung) return;
		doiKhung = true;
		requestAnimationFrame(chay);
	}

	/* krpano KHONG ban su kien JS khi doi tam nhin (da ghi 14/08 luc lam qua cau
	   dieu huong) -> phai hoi theo nhip. 120 ms la du muot ma nhe may; moi lan
	   hoi chi doc 3 con so, viec nang chi chay khi so THAT SU doi. */
	var truoc = '';
	function canh() {
		var kk = layKr();
		if (kk) {
			var nay = kk.get('view.hlookat') + '|' + kk.get('view.vlookat') + '|' +
			          kk.get('view.fov') + '|' + kk.get('stagewidth');
			if (nay !== truoc) { truoc = nay; hen(); }
		}
		setTimeout(canh, 120);
	}

	/* POI duoc dung lai tu localStorage sau khi tour chay (moc 2.5s va 7s trong
	   tour.html) -> lap lai chi muc o vai moc thoi gian cho chac. */
	function moc() {
		[1200, 3000, 7500, 12000].forEach(function (ms) {
			setTimeout(function () { daLap = false; truoc = ''; hen(); }, ms);
		});
	}

	if (document.readyState === 'complete') { canh(); moc(); }
	else { window.addEventListener('load', function () { canh(); moc(); }); }

	/* mo cua sau de Anh go trong Console khi nghiem thu */
	window.eraPoiDeclutter = {
		lai: function () { daLap = false; truoc = ''; hen(); },
		xem: function () {
			return ds.map(function (p) {
				return { i: p.i, hang: p.hang, w: Math.round(p.w), h: Math.round(p.h), dangAn: p.an };
			});
		}
	};
})();
