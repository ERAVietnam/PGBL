// ==================================================================
// PGBL - MAT BANG PHAN LO (chuyen tu giohang/index.html sang React)
// Ban do krpano (mb-tour.xml + lots_hotspots.xml) + sidebar bo loc React.
// krpano goi nguoc vao day qua window.eraPick (xem action showlot trong mb-tour.xml).
// ==================================================================
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DANH_SACH_TRANG_THAI,
  GIO_HANG_CONFIG,
  MAU_LOAI,
  MAU_TRANG_THAI,
  PGBL_LOT_AREA_RANGE,
  PGBL_LOTS,
} from "@/lib/pgblLots";
import { PGBL_ROUTES } from "@/lib/routes";
import { stOf, useSalesStatus, type SalesRecord } from "@/hooks/useSalesStatus";
import { matchLot, poolOf, sortZones, uniqueSorted, type ChipItem, type GioHangFilter } from "./gioHangFilter";
import { GioHangSidebar, type GioHangChips } from "./GioHangSidebar";
import { GioHangDetail } from "./GioHangDetail";

type KrpanoApi = {
  get: (path: string) => string | number | boolean | null | undefined;
  set: (path: string, value: string | number | boolean) => void;
  call: (action: string) => void;
};

declare global {
  interface Window {
    embedpano?: (config: Record<string, unknown>) => void;
    removepano?: (id: string) => void;
    eraPick?: (code: string) => void;
    __pgblGioHangPanoLoading?: Promise<void>;
  }
}

const DEFAULT_FILTER: GioHangFilter = {
  era: "era",
  st: "",
  lo: "",
  hu: "",
  zo: "",
  rmin: PGBL_LOT_AREA_RANGE.min,
  rmax: PGBL_LOT_AREA_RANGE.max,
  q: "",
  mode: "lo",
};

/** krpano can mau dang 0xRRGGBB */
const colOf = (hex: string) => "0x" + hex.replace("#", "");

function loadPanoScript(): Promise<void> {
  if (window.embedpano) return Promise.resolve();
  if (window.__pgblGioHangPanoLoading) return window.__pgblGioHangPanoLoading;

  window.__pgblGioHangPanoLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="/pgbl/giohang/pano.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/pgbl/giohang/pano.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__pgblGioHangPanoLoading;
}

/* ---- to mau + an/hien toan bo hotspot theo bo loc (port tu apply()) ---- */
function applyToKrpano(kp: KrpanoApi, filter: GioHangFilter, store: Record<string, SalesRecord>) {
  const coBlock = !!filter.zo;

  PGBL_LOTS.forEach((lot) => {
    const trongBlock = matchLot(lot, filter, store);
    const hienRa = matchLot(lot, filter, store, true);
    const h = `hotspot[lot_${lot.k}]`;
    kp.set(h + ".visible", hienRa);
    if (!hienRa) return;

    if (trongBlock) {
      const hex =
        filter.mode === "lo" ? MAU_LOAI[lot.l] || "#999999" : MAU_TRANG_THAI[stOf(store, lot.c)];
      const c = colOf(hex);
      const a = coBlock ? Math.min(GIO_HANG_CONFIG.doDam + 0.14, 1) : GIO_HANG_CONFIG.doDam;
      kp.set(h + ".fillcolor", c);
      kp.set(h + ".bordercolor", c);
      kp.set(h + ".borderwidth", coBlock ? GIO_HANG_CONFIG.vienBlock : 1.2);
      kp.set(h + ".borderalpha", 0.9);
      kp.set(h + ".fillalpha", a);
      kp.set(h + ".onover", `tween(fillalpha,${GIO_HANG_CONFIG.doDamRe},0.12);`);
      kp.set(h + ".onout", `tween(fillalpha,${a},0.12);`);
    } else {
      /* ngoai block dang chon -> lam mo di */
      kp.set(h + ".fillcolor", "0x0C0C44");
      kp.set(h + ".bordercolor", "0x0C0C44");
      kp.set(h + ".borderwidth", 0.6);
      kp.set(h + ".borderalpha", 0.25);
      kp.set(h + ".fillalpha", GIO_HANG_CONFIG.doDamMo);
      kp.set(h + ".onover", "tween(fillalpha,0.22,0.12);");
      kp.set(h + ".onout", `tween(fillalpha,${GIO_HANG_CONFIG.doDamMo},0.12);`);
    }
  });
}

/* ---- lam noi lo dang chon: vien do dam + nhap nhay (port tu toLoChon()) ---- */
function paintSelection(
  kp: KrpanoApi,
  code: string,
  filter: GioHangFilter,
  store: Record<string, SalesRecord>,
  blinkRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  nhay: boolean,
) {
  const lot = PGBL_LOTS.find((x) => x.c === code);
  /* dang bi bo loc an di thi thoi */
  if (!lot || !matchLot(lot, filter, store, true)) return;

  const h = `hotspot[lot_${lot.k}]`;
  kp.set(h + ".visible", true);
  kp.set(h + ".bordercolor", colOf(GIO_HANG_CONFIG.mauChon));
  kp.set(h + ".borderwidth", GIO_HANG_CONFIG.vienChon);
  kp.set(h + ".borderalpha", 1);
  kp.set(h + ".fillalpha", GIO_HANG_CONFIG.doDamChon);
  kp.set(h + ".onover", `tween(fillalpha,${Math.min(GIO_HANG_CONFIG.doDamChon + 0.15, 1)},0.12);`);
  kp.set(h + ".onout", `tween(fillalpha,${GIO_HANG_CONFIG.doDamChon},0.12);`);

  if (!nhay || !GIO_HANG_CONFIG.nhayLan) return;
  let i = 0;
  blinkRef.current = setInterval(() => {
    kp.set(h + ".fillalpha", i % 2 ? GIO_HANG_CONFIG.doDamChon : 0.1);
    i += 1;
    if (i >= GIO_HANG_CONFIG.nhayLan * 2) {
      if (blinkRef.current) clearInterval(blinkRef.current);
      blinkRef.current = null;
      kp.set(h + ".fillalpha", GIO_HANG_CONFIG.doDamChon);
    }
  }, 240);
}

export function GioHangViewer() {
  const panoRef = useRef<HTMLDivElement>(null);
  const kpRef = useRef<KrpanoApi | null>(null);
  const blinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<GioHangFilter>(DEFAULT_FILTER);
  const [sel, setSel] = useState<string | null>(null);

  const status = useSalesStatus();

  /* KPI la ham thuan cua filter + du lieu trang thai, khong can hoi krpano */
  const kpi = useMemo(() => {
    let show = 0;
    let con = 0;
    PGBL_LOTS.forEach((lot) => {
      if (!matchLot(lot, filter, status.store)) return;
      show += 1;
      if (stOf(status.store, lot.c) === "Còn hàng") con += 1;
    });
    return { show, con };
  }, [filter, status.store]);

  const closeDetail = useCallback(() => setSel(null), []);

  const handleFilter = useCallback(
    (patch: Partial<GioHangFilter>) => {
      const next = { ...filter, ...patch };
      setFilter(next);
      /* tim kiem: chi con dung 1 lo khop thi mo chi tiet luon */
      if (patch.q !== undefined && patch.q.trim()) {
        const hits = PGBL_LOTS.filter((lot) => matchLot(lot, next, status.store));
        if (hits.length === 1) setSel(hits[0].c);
      }
    },
    [filter, status.store],
  );

  const handleClear = useCallback(() => {
    setFilter((prev) => ({ ...DEFAULT_FILTER, mode: prev.mode }));
  }, []);

  /* ---- nhung krpano ---- */
  useEffect(() => {
    let cancelled = false;

    window.eraPick = (code) => setSel(code);

    loadPanoScript()
      .then(() => {
        if (cancelled || !window.embedpano || !panoRef.current) return;

        window.embedpano({
          swf: "/pgbl/giohang/pano.swf",
          xml: `/pgbl/giohang/mb-tour.xml?v=${Date.now()}`,
          target: "pgbl-giohang-pano",
          html5: "only",
          bgcolor: "#FFFFFF",
          mobilescale: 1.0,
          passQueryParameters: true,
          onready: (krpano: KrpanoApi) => {
            kpRef.current = krpano;
            /* doi krpano render on dinh roi moi to mau (nhu ban goc delay 600ms) */
            window.setTimeout(() => {
              if (!cancelled) setReady(true);
            }, 600);
          },
          onerror: (error: string) => setLoadError(error),
        });
      })
      .catch(() => setLoadError("Không tải được pano.js"));

    return () => {
      cancelled = true;
      delete window.eraPick;
      if (blinkRef.current) clearInterval(blinkRef.current);
      try {
        window.removepano?.("krpanoSWFObject");
      } catch {
        // krpano cleanup la best-effort
      }
      kpRef.current = null;
    };
  }, []);

  /* ---- to lai ban do khi filter / du lieu trang thai / lo chon thay doi ---- */
  useEffect(() => {
    const kp = kpRef.current;
    if (!ready || !kp) return;

    if (blinkRef.current) clearInterval(blinkRef.current);
    blinkRef.current = null;

    applyToKrpano(kp, filter, status.store);
    if (sel) paintSelection(kp, sel, filter, status.store, blinkRef, true);
  }, [ready, filter, status.store, sel]);

  /* ---- du lieu chips cho sidebar (chi phu thuoc ro ERA + trang thai) ---- */
  const chips = useMemo<GioHangChips>(() => {
    const pool = poolOf(filter);
    const store = status.store;
    const cnt = (fn: (lot: (typeof pool)[number]) => boolean) => pool.filter(fn).length;

    return {
      era: [
        { v: "all", t: "Tất cả", n: PGBL_LOTS.length },
        { v: "era", t: "ERA phân phối", n: PGBL_LOTS.filter((l) => l.e).length },
        { v: "out", t: "Ngoài rổ", n: PGBL_LOTS.filter((l) => !l.e).length },
      ],
      st: ([{ v: "", t: "Tất cả", n: pool.length }] as ChipItem[]).concat(
        DANH_SACH_TRANG_THAI.map((s): ChipItem => ({ v: s, t: s, n: cnt((l) => stOf(store, l.c) === s) })),
      ),
      lo: ([{ v: "", t: "Tất cả" }] as ChipItem[]).concat(
        uniqueSorted(pool, (l) => l.l).map((s): ChipItem => ({ v: s, t: s, n: cnt((l) => l.l === s) })),
      ),
      hu: ([{ v: "", t: "Tất cả" }] as ChipItem[]).concat(
        uniqueSorted(pool, (l) => l.h).map((s): ChipItem => ({ v: s, t: s, n: cnt((l) => l.h === s) })),
      ),
      zo: ([{ v: "", t: "Tất cả" }] as ChipItem[]).concat(
        sortZones([...new Set(pool.map((l) => l.z))]).map((z): ChipItem => ({ v: z, t: z })),
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.era, status.store]);

  /* ---- chu giai duoi goc trai, doi theo che do to mau ---- */
  const legend = useMemo<Array<[string, string]>>(() => {
    const pool = poolOf(filter);
    if (filter.mode === "lo") {
      return uniqueSorted(pool, (l) => l.l).map((k) => [k, MAU_LOAI[k] || "#999999"]);
    }
    return Object.entries(MAU_TRANG_THAI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.mode, filter.era]);

  const selectedLot = sel ? PGBL_LOTS.find((lot) => lot.c === sel) ?? null : null;

  const nguonMau =
    status.nguon === "sheet" ? "#1B7F49" : status.nguon === "snapshot" ? "#9A6400" : "#C8102E";

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-[#F5F5F5] font-sans text-black">
      {/* thanh tren cung */}
      <div className="flex flex-shrink-0 items-center justify-between gap-3.5 border-b-[3px] border-[#0D2620] bg-white px-[18px] py-[9px]">
        <Link
          href={PGBL_ROUTES.home}
          title="Về trang chủ Phú Gia Bảo Lộc"
          className="inline-flex flex-shrink-0 items-center gap-[7px] rounded-[9px] border border-[#E4EAE6] bg-white px-[13px] py-2 text-[11.5px] font-bold whitespace-nowrap text-[#0D2620] transition hover:border-[#0D2620] hover:bg-[#0D2620] hover:text-white"
        >
          <b className="text-sm font-normal leading-none">&#8592;</b> Trang chủ
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-extrabold uppercase tracking-[.3px] text-[#0D2620] max-sm:text-[13px]">
            Mặt bằng phân lô - Khu đô thị Phú Gia Bảo Lộc
          </h1>
          <div className="mt-[1px] text-[11px] text-[#666] max-sm:hidden">
            Bấm vào lô để xem chi tiết &middot; lăn chuột phóng to &middot; kéo để di chuyển
          </div>
        </div>
        <div className="flex gap-5 max-sm:gap-3">
          <div className="text-right">
            <b className="block text-[19px] font-extrabold leading-none text-[#BF9642]">{kpi.show}</b>
            <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#6E8579]">Lô hiển thị</span>
          </div>
          <div className="text-right">
            <b className="block text-[19px] font-extrabold leading-none text-[#0D2620]">{PGBL_LOTS.length}</b>
            <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#6E8579]">Tổng số lô</span>
          </div>
          <div className="text-right">
            <b className="block text-[19px] font-extrabold leading-none text-[#0D2620]">{kpi.con}</b>
            <span className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#6E8579]">Còn hàng</span>
          </div>
        </div>
      </div>

      {/* ban do + sidebar */}
      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <section id="pgbl-giohang-pano" ref={panoRef} className="relative min-w-0 flex-1 bg-white">
          <div className="absolute left-3 top-3 z-[5] rounded-[7px] bg-[#0D2620] px-3 py-1.5 text-[11.5px] font-bold text-white">
            {ready ? `${kpi.show} lô đang hiển thị` : "Đang tải sa bàn..."}
          </div>

          {loadError && (
            <div className="absolute left-4 right-4 top-[60px] z-[60] whitespace-pre-wrap rounded-lg bg-[#C8102E] px-3.5 py-3 font-mono text-[12.5px] leading-normal text-white">
              Lỗi krpano - bản đồ không hiện được:
              {"\n\n"}
              {loadError}
            </div>
          )}

          {selectedLot && (
            <GioHangDetail
              lot={selectedLot}
              store={status.store}
              onClose={closeDetail}
              onZoom={() =>
                kpRef.current?.call(`lookto(${selectedLot.x},${selectedLot.y},0.055,smooth(),true,true)`)
              }
            />
          )}

          {/* chu giai + nhan nguon du lieu */}
          <div className="absolute bottom-24 left-3 z-[5] max-md:bottom-3">
            <div className="flex flex-wrap gap-[13px] rounded-[9px] bg-white/95 px-[13px] py-[9px] text-[10.5px] font-semibold shadow-[0_2px_10px_rgba(0,0,0,.09)]">
              {legend.map(([label, color]) => (
                <span key={label}>
                  <i
                    className="mr-[5px] inline-block h-[11px] w-[11px] rounded-[3px] align-[-1px]"
                    style={{ background: color }}
                  />
                  {label}
                </span>
              ))}
              <span>
                <i
                  className="mr-[5px] inline-block h-[11px] w-[11px] rounded-[3px] align-[-1px]"
                  style={{ background: "#0C0C44", opacity: 0.18 }}
                />
                {filter.zo ? `Ngoài block ${filter.zo}` : "Ngoài rổ ERA"}
              </span>
            </div>
            {status.nhan && (
              <div className="mt-1.5 text-[10.5px] leading-[1.4] text-[#6B7280]">
                <span className="font-bold" style={{ color: nguonMau }}>
                  &#9679;
                </span>{" "}
                Tình trạng bán hàng: {status.nhan}
                {status.luc ? ` . ${status.luc}` : ""}
              </div>
            )}
          </div>
        </section>

        <GioHangSidebar
          filter={filter}
          chips={chips}
          areaRange={PGBL_LOT_AREA_RANGE}
          onFilter={handleFilter}
          onClear={handleClear}
        />
      </div>
    </main>
  );
}
