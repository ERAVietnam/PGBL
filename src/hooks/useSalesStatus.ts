// ==================================================================
// PGBL - NGUON TRANG THAI BAN HANG (port tu assets/trang-thai-config.js)
// Thu tu lay du lieu (3 lop du phong, tu tren xuong):
//   1. GOOGLE SHEET  (nguon that, ai cung thay giong nhau)
//   2. FILE SNAPSHOT /pgbl/assets/trang-thai-snapshot.js (khi mat mang)
//   3. localStorage  (ban nhap tren may dang dung)
// Trang mat bang CHI HIEN THI. Muon doi trang thai thi vao bang van hanh.
// ==================================================================
"use client";

import { useEffect, useState } from "react";

export type SalesRecord = {
  st: string;
  gia?: string;
  note?: string;
  ngay?: string;
  nguoi?: string;
};

export type SalesSource = "sheet" | "snapshot" | "local";

export type SalesStatus = {
  /** Map: ma lo da chuan hoa -> ban ghi trang thai */
  store: Record<string, SalesRecord>;
  nguon: SalesSource | null;
  /** Nhan nguon de hien thi, vd "Google Sheet" */
  nhan: string;
  /** Thoi diem du lieu, vd "12/08/2026 16:00" */
  luc: string;
  loi: string | null;
};

/* ============ CAU HINH ============ */

const C = {
  /* File: "PGBL - Trang thai ban hang (ERA - nguon cho web 360)" tren Google Drive.
     De trong '' thi trang tu dong dung snapshot + localStorage. */
  SHEET_ID: "1_NaWEkuvexGYU4uDz_2ex6pRpLtYohBWomTTqp0hIvE",

  /* Ten TAB ben trong file Sheet. DE TRONG '' = dung TAB DAU TIEN. */
  SHEET_NAME: "",

  /* Cho phep trang mat bang doc Sheet hay khong. */
  DOC_SHEET_O_TRANG_MAT_BANG: true,

  /* Cho bao lau thi bo cuoc, quay ve snapshot (mili giay) */
  TIMEOUT_MS: 8000,

  /* Khoa localStorage - dung chung voi bang van hanh */
  KEY_LOCAL: "pgbl_banghang_v1",

  /* 5 trang thai chuan - phai TRUNG voi MAU_TRANG_THAI trong lib/pgblLots.ts */
  DS: ["Còn hàng", "Giữ chỗ", "Đã cọc", "Đã bán", "Lock"],

  MAC_DINH: "Còn hàng",
};

const SNAPSHOT_URL = "/pgbl/assets/trang-thai-snapshot.js";

type SnapshotGlobal = { luc?: string; lots?: Array<{ ma?: string; st?: string; gia?: string; note?: string; ngay?: string; nguoi?: string }> };

declare global {
  interface Window {
    ERA_TT_SNAPSHOT?: SnapshotGlobal;
    __pgblSnapshotLoading?: Promise<void>;
  }
}

/* ============ TIEN ICH CHUNG ============ */

/* Chuoi tieng Viet doc tu Excel/Sheet hay o dang NFD.
   KHONG chuan hoa NFC thi 'Đông Bắc' != 'Đông Bắc' (bay 12/08). */
function nfc(s: unknown): string {
  const v = s == null ? "" : String(s);
  try {
    return v.normalize("NFC");
  } catch {
    return v;
  }
}

/* Bo dau + ve chu thuong - dung de so khop trang thai nguoi go tay */
function khongDau(s: unknown): string {
  let v = nfc(s).toLowerCase().trim();
  try {
    v = v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    // giu nguyen neu normalize loi
  }
  return v.replace(/đ/g, "d").replace(/\s+/g, " ");
}

/* Bang tra: moi kieu go tay -> 1 trong 5 trang thai chuan */
const BANG_TRA: Record<string, string> = {};
C.DS.forEach((t) => {
  BANG_TRA[khongDau(t)] = t;
});
([
  ["con", "Còn hàng"], ["con hang", "Còn hàng"], ["available", "Còn hàng"],
  ["giu", "Giữ chỗ"], ["giu cho", "Giữ chỗ"], ["booking", "Giữ chỗ"],
  ["coc", "Đã cọc"], ["da coc", "Đã cọc"], ["deposit", "Đã cọc"],
  ["ban", "Đã bán"], ["da ban", "Đã bán"], ["sold", "Đã bán"],
  ["lock", "Lock"], ["khoa", "Lock"], ["da khoa", "Lock"],
] as const).forEach(([k, v]) => {
  BANG_TRA[k] = v;
});

/* Tra ve trang thai chuan, khong nhan ra thi tra ve MAC_DINH */
function chuan(s: unknown): string {
  const k = khongDau(s);
  if (!k) return C.MAC_DINH;
  return BANG_TRA[k] || C.MAC_DINH;
}

/* Ma lo: 'A2-1' -> 'A2-01' (bay cu 12/08) */
function chuanMa(s: unknown): string {
  const v = nfc(s).toUpperCase().replace(/\s+/g, "");
  const m = v.match(/^([AB]\d{1,2})-(\d{1,3})$/);
  return m ? m[1] + "-" + (m[2].length < 2 ? "0" + m[2] : m[2]) : v;
}

/* Bo doc CSV co xu ly dau nhay kep va dau phay trong o */
function docCSV(text: string): string[][] {
  const hang: string[][] = [];
  let o = "";
  let d: string[] = [];
  let trongNhay = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (trongNhay) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          o += '"';
          i += 1;
        } else {
          trongNhay = false;
        }
      } else {
        o += ch;
      }
    } else if (ch === '"') {
      trongNhay = true;
    } else if (ch === ",") {
      d.push(o);
      o = "";
    } else if (ch === "\n") {
      d.push(o);
      hang.push(d);
      d = [];
      o = "";
    } else if (ch !== "\r") {
      o += ch;
    }
  }
  if (o !== "" || d.length) {
    d.push(o);
    hang.push(d);
  }
  return hang;
}

/* ============ LOP 1 - GOOGLE SHEET ============ */

function urlSheet(tenTab: string): string {
  return (
    "https://docs.google.com/spreadsheets/d/" +
    C.SHEET_ID +
    "/gviz/tq?tqx=out:csv" +
    (tenTab ? "&sheet=" + encodeURIComponent(tenTab) : "") +
    "&_=" +
    Date.now()
  );
}

/* Lay 1 lan. Tra ve chuoi CSV, hoac nem loi CO NGHIA cho nguoi doc. */
async function layCSV(tenTab: string): Promise<string> {
  const huy = typeof AbortController !== "undefined" ? new AbortController() : null;
  const hetGio = setTimeout(() => huy?.abort(), C.TIMEOUT_MS);

  try {
    const r = await fetch(urlSheet(tenTab), huy ? { signal: huy.signal } : {});
    clearTimeout(hetGio);
    if (r.status === 401 || r.status === 403)
      throw new Error('Sheet chưa mở chia sẻ "Người có đường liên kết → Người xem"');
    if (!r.ok) throw new Error("Google trả về mã " + r.status);

    const t = await r.text();
    /* Chua mo chia se thi Google tra ve TRANG HTML dang nhap, khong phai CSV. */
    const dau = t.replace(/^﻿/, "").slice(0, 400).toLowerCase();
    if (dau.indexOf("<html") >= 0 || dau.indexOf("<!doctype") >= 0)
      throw new Error('Sheet chưa mở chia sẻ "Người có đường liên kết → Người xem"');
    return t;
  } catch (e) {
    clearTimeout(hetGio);
    if (e && (e as Error).name === "AbortError")
      throw new Error("Quá " + C.TIMEOUT_MS / 1000 + "s không thấy Google trả lời");
    /* Sheet chua mo chia se thi trinh duyet KHONG doc duoc noi dung loi (CORS),
       no chi nem 'Failed to fetch'. Doi thanh cau co nghia. */
    if (e instanceof TypeError) {
      if (typeof navigator !== "undefined" && navigator.onLine === false)
        throw new Error("Máy đang mất mạng");
      throw new Error(
        'Không gọi được Google — thường là Sheet chưa mở chia sẻ "Người có đường liên kết → Người xem"',
      );
    }
    throw e;
  }
}

/* Doc bang CSV -> { 'A5-06': {st, gia, note, ngay, nguoi}, ... }
   Nhan cot theo TEN o dong dau, doi thu tu cot van chay dung. */
function docBang(hang: string[][]): Record<string, SalesRecord> {
  const out: Record<string, SalesRecord> = {};
  if (!hang.length) return out;

  const dau = hang[0].map((v) => khongDau(v));
  const cot = (...names: string[]) => {
    for (const n of names) {
      const vt = dau.indexOf(n);
      if (vt >= 0) return vt;
    }
    return -1;
  };

  const cMa = cot("ma lo", "ma", "ma san pham");
  const cSt = cot("trang thai", "tinh trang", "status");
  const cGia = cot("gia", "gia ban");
  const cNote = cot("ghi chu", "note");
  const cNgay = cot("ngay cap nhat", "ngay", "cap nhat luc");
  const cNguoi = cot("nguoi cap nhat", "nguoi", "sale");

  if (cMa < 0) throw new Error('Sheet thieu cot "Ma lo"');

  for (let i = 1; i < hang.length; i += 1) {
    const d = hang[i];
    if (!d) continue;
    const ma = chuanMa(d[cMa] || "");
    if (!ma) continue;
    const r: SalesRecord = { st: chuan(cSt >= 0 ? d[cSt] : "") };
    if (cGia >= 0) r.gia = nfc(d[cGia] || "").trim();
    if (cNote >= 0) r.note = nfc(d[cNote] || "").trim();
    if (cNgay >= 0) r.ngay = nfc(d[cNgay] || "").trim();
    if (cNguoi >= 0) r.nguoi = nfc(d[cNguoi] || "").trim();
    out[ma] = r;
  }
  return out;
}

async function napSheet(): Promise<Record<string, SalesRecord>> {
  if (!C.SHEET_ID) throw new Error("Chưa dán SHEET_ID");
  try {
    return docBang(docCSV(await layCSV(C.SHEET_NAME)));
  } catch (e) {
    /* Co khai ten tab ma tab do khong ton tai -> lui ve tab dau tien */
    if (!C.SHEET_NAME) throw e;
    return docBang(docCSV(await layCSV("")));
  }
}

/* ============ LOP 2 - FILE SNAPSHOT ============ */

function loadSnapshotScript(): Promise<void> {
  if (window.ERA_TT_SNAPSHOT) return Promise.resolve();
  if (window.__pgblSnapshotLoading) return window.__pgblSnapshotLoading;

  window.__pgblSnapshotLoading = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SNAPSHOT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SNAPSHOT_URL;
    script.async = true;
    script.onload = () => resolve();
    /* Thieu snapshot van chay tiep duoc bang localStorage */
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return window.__pgblSnapshotLoading;
}

function napSnapshot(): { data: Record<string, SalesRecord>; luc: string } | null {
  const s = window.ERA_TT_SNAPSHOT;
  if (!s || !Array.isArray(s.lots)) return null;
  const out: Record<string, SalesRecord> = {};
  s.lots.forEach((l) => {
    if (!l || !l.ma) return;
    out[chuanMa(l.ma)] = {
      st: chuan(l.st),
      gia: nfc(l.gia || ""),
      note: nfc(l.note || ""),
      ngay: nfc(l.ngay || ""),
      nguoi: nfc(l.nguoi || ""),
    };
  });
  return { data: out, luc: nfc(s.luc || "") };
}

/* ============ LOP 3 - localStorage ============ */

function napLocal(): Record<string, SalesRecord> {
  const out: Record<string, SalesRecord> = {};
  try {
    const d = JSON.parse(localStorage.getItem(C.KEY_LOCAL) || "{}");
    (d.lots || []).forEach((l: { ma?: string } & SalesRecord) => {
      if (!l || !l.ma) return;
      out[chuanMa(l.ma)] = {
        st: chuan(l.st),
        gia: l.gia || "",
        note: l.note || "",
        ngay: l.ngay || "",
        nguoi: l.nguoi || "",
      };
    });
  } catch {
    // localStorage hong/loi parse -> bo qua
  }
  return out;
}

/* ============ HAM CHINH ============ */

function nhanGio(d: Date): string {
  const p = (n: number) => (n < 10 ? "0" : "") + n;
  return (
    p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes())
  );
}

async function nap(): Promise<SalesStatus> {
  const veSnapshot = (loi: string | null): SalesStatus => {
    const s = napSnapshot();
    if (s && Object.keys(s.data).length) {
      return { store: s.data, nguon: "snapshot", nhan: "File dự phòng trong web", luc: s.luc, loi };
    }
    return { store: napLocal(), nguon: "local", nhan: "Bản nháp trên máy này", luc: "", loi };
  };

  const choSheet = C.DOC_SHEET_O_TRANG_MAT_BANG && !!C.SHEET_ID;
  if (!choSheet) return veSnapshot(C.SHEET_ID ? null : "Chưa cấu hình Google Sheet");

  try {
    const data = await napSheet();
    if (!Object.keys(data).length) return veSnapshot("Sheet rỗng");
    return { store: data, nguon: "sheet", nhan: "Google Sheet", luc: nhanGio(new Date()), loi: null };
  } catch (e) {
    return veSnapshot(e instanceof Error ? e.message : String(e));
  }
}

/* ============ REACT HOOK ============ */

export function useSalesStatus(): SalesStatus {
  /* Ve tam ban nhap local ngay tu lan render dau de ban do co mau som.
     Chi chay tren client (localStorage khong co luc SSR). */
  const [status, setStatus] = useState<SalesStatus>(() => {
    if (typeof window === "undefined") {
      return { store: {}, nguon: null, nhan: "", luc: "", loi: null };
    }
    const local = napLocal();
    if (!Object.keys(local).length) {
      return { store: {}, nguon: null, nhan: "", luc: "", loi: null };
    }
    return { store: local, nguon: "local", nhan: "Bản nháp trên máy này", luc: "", loi: null };
  });

  useEffect(() => {
    let cancelled = false;

    loadSnapshotScript()
      .then(nap)
      .then((kq) => {
        if (!cancelled) setStatus(kq);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

/** Trang thai chuan cua 1 lo (mac dinh "Còn hàng" neu chua co du lieu) */
export function stOf(store: Record<string, SalesRecord>, ma: string): string {
  return store[ma]?.st || C.MAC_DINH;
}
