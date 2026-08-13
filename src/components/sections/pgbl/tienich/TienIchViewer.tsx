"use client";

/* eslint-disable @next/next/no-img-element */
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Amenity = {
  id: number;
  name: string;
  description: string;
  ath?: number;
  atv?: number;
  points?: number;
};

type KrpanoApi = {
  get: (path: string) => string | number | boolean | null | undefined;
  set: (path: string, value: string | number | boolean) => void;
  call: (action: string) => void;
};

declare global {
  interface Window {
    embedpano?: (config: Record<string, unknown>) => void;
    removepano?: (id: string) => void;
    __pgblTienIchPanoLoading?: Promise<void>;
    tiOver?: (id: string | number) => void;
    tiOut?: () => void;
    tiClick?: (id: string | number) => void;
    tiSaveDraft?: () => void;
    tiPickPlace?: (ath: string | number, atv: string | number) => void;
    tiCollectedSave?: (data: string) => void;
    tiCollectedExport?: (data: string) => void;
  }
}

const AMENITIES: Amenity[] = [
  { id: 1, name: "Cafe Đôi Dép Phú Gia", description: "Quán cafe biểu tượng của khu, không gian gặp gỡ giữa cảnh quan xanh." },
  { id: 2, name: "Sales Gallery", description: "Nhà mẫu và trung tâm giao dịch, nơi tiếp đón và tư vấn khách hàng." },
  { id: 3, name: "Bãi đậu xe", description: "Bãi đậu xe nội khu, thuận tiện cho cư dân và khách tham quan." },
  { id: 4, name: "Trạm sạc", description: "Trạm sạc xe điện phục vụ nhu cầu di chuyển xanh của cư dân." },
  { id: 5, name: "Cupid Garden", description: "Vườn chủ đề tình yêu, điểm check-in lãng mạn giữa khu đô thị." },
  { id: 6, name: "Khu BBQ", description: "Khu tiệc nướng ngoài trời cho gia đình và nhóm bạn." },
  { id: 7, name: "Khu vui chơi trẻ em", description: "Sân chơi an toàn với nhiều trò vận động cho trẻ nhỏ." },
  { id: 8, name: "Khu mê cung", description: "Mê cung cây xanh, không gian khám phá thú vị cho mọi lứa tuổi." },
  { id: 9, name: "Cánh cổng thời gian", description: "Tiểu cảnh cổng biểu tượng, điểm nhấn nghệ thuật để check-in." },
  { id: 10, name: "Tiểu cảnh tượng Cupid & Psyche", description: "Cụm tượng nghệ thuật Cupid & Psyche giữa vườn cảnh quan." },
  { id: 11, name: "Trường mẫu giáo", description: "Trường mầm non nội khu, thuận tiện cho cư dân có con nhỏ." },
  { id: 12, name: "Vườn cây đặc hữu", description: "Vườn sưu tập cây bản địa Bảo Lộc, giữ mảng xanh đặc trưng cao nguyên." },
  { id: 13, name: "Khu vườn ánh sáng bồ công anh", description: "Vườn nghệ thuật ánh sáng chủ đề bồ công anh, lung linh về đêm." },
  { id: 14, name: "Khu vực để xe đạp", description: "Trạm gửi và thuê xe đạp phục vụ di chuyển xanh trong nội khu." },
  { id: 15, name: "Khu thể thao - Pickleball", description: "Sân Pickleball tiêu chuẩn, môn thể thao đang được ưa chuộng." },
  { id: 16, name: "Khu tiện ích công cộng", description: "Cụm tiện ích công cộng phục vụ sinh hoạt hằng ngày của cư dân." },
  { id: 17, name: "Trung tâm chăm sóc sức khỏe", description: "Trung tâm chăm sóc sức khỏe và làm đẹp cho cư dân nội khu." },
  { id: 18, name: "Eden Garden", description: "Vườn Eden xanh mát, không gian thư giãn giữa thiên nhiên." },
  { id: 19, name: "Cầu Firenzi", description: "Cây cầu biểu tượng phong cách Firenzi bắc qua cảnh quan." },
  { id: 20, name: "Minerva Garden", description: "Vườn Minerva chủ đề nữ thần trí tuệ, điểm nhấn cảnh quan." },
  { id: 21, name: "Japanese Garden", description: "Vườn Nhật với hồ cá Koi, tiểu cảnh đá và cây cắt tỉa tinh tế." },
  { id: 22, name: "Sân bóng rổ", description: "Sân bóng rổ tiêu chuẩn phục vụ thể thao cộng đồng." },
  { id: 23, name: "Nhà vệ sinh công cộng", description: "Nhà vệ sinh công cộng bố trí tại các khu cảnh quan chính." },
  { id: 24, name: "Quảng trường / Rạp chiếu phim ngoài trời", description: "Quảng trường trung tâm kết hợp rạp chiếu phim ngoài trời cho cộng đồng." },
  { id: 25, name: "Tháp nghiêng Pisa", description: "Biểu tượng tháp nghiêng Pisa, điểm check-in nổi bật của khu." },
  { id: 26, name: "Lamb Cà phê", description: "Quán cà phê thứ hai trong khu, phục vụ cư dân phía Gia An." },
  { id: 27, name: "Eden Dream", description: "Vườn mơ Eden, tiểu cảnh nghệ thuật lãng mạn." },
  { id: 28, name: "Apolo Garden", description: "Vườn Apollo chủ đề thần mặt trời, quảng trường cây xanh." },
  { id: 29, name: "Vườn rau", description: "Vườn rau cộng đồng, cư dân tự trồng và thu hoạch rau sạch." },
  { id: 30, name: "An ninh 24/7", description: "Chốt an ninh trực 24/7 tại cổng và các nút giao, đảm bảo an toàn." },
];

const pinSrc = (id: number | string) => `/pgbl/tienich/pins30/pin-ti-${id}.png`;
const TOOL_POSITION_KEY = "pgbl_tienich_tool_position";
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function readSavedToolPosition() {
  if (typeof window === "undefined") return null;

  try {
    const saved = JSON.parse(localStorage.getItem(TOOL_POSITION_KEY) || "null") as { x?: number; y?: number } | null;
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return { x: Number(saved.x), y: Number(saved.y) };
    }
  } catch {
    // Ignore invalid saved UI state.
  }

  return null;
}

function loadPanoScript() {
  if (window.embedpano) return Promise.resolve();
  if (window.__pgblTienIchPanoLoading) return window.__pgblTienIchPanoLoading;

  window.__pgblTienIchPanoLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="/pgbl/tienich/pano.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/pgbl/tienich/pano.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__pgblTienIchPanoLoading;
}

export function TienIchViewer() {
  const panoRef = useRef<HTMLDivElement>(null);
  const kpRef = useRef<KrpanoApi | null>(null);
  const orderRef = useRef<string[]>([]);
  const toolDragRef = useRef<{ dx: number; dy: number; pointerId: number } | null>(null);
  const latestToolPositionRef = useRef<{ x: number; y: number } | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hopHotspotsRef = useRef<string[]>([]);
  const mouseRef = useRef({ x: 140, y: 120 });
  const [amenities, setAmenities] = useState(AmenitiesWithDefaults());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [infoPosition, setInfoPosition] = useState({ x: 18, y: 18, centered: false });
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [editOn, setEditOn] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [pickPosition, setPickPosition] = useState<{ ath: number; atv: number } | null>(null);
  const [pickQuery, setPickQuery] = useState("");
  const [exportXml, setExportXml] = useState("");
  const [toolPosition, setToolPosition] = useState<{ x: number; y: number } | null>(null);

  const applyResponsiveViewLimit = useCallback(() => {
    const kp = kpRef.current;
    if (!kp) return;

    const isMobileLayout = window.matchMedia("(max-width: 767px)").matches;
    kp.set("view.vlookatmax", isMobileLayout ? 0.324 : 0.435);
  }, []);

  const activeAmenity = useMemo(
    () => amenities.find((amenity) => amenity.id === activeId) ?? null,
    [activeId, amenities],
  );

  const stopHop = useCallback(() => {
    if (hopTimerRef.current) clearInterval(hopTimerRef.current);
    hopTimerRef.current = null;

    const kp = kpRef.current;
    if (!kp) return;
    hopHotspotsRef.current.forEach((name) => {
      try {
        kp.set(`hotspot[${name}].scale`, Number(kp.get("ti_sc")) || 0.17);
        kp.set(`hotspot[${name}].oy`, 0);
      } catch {
        // krpano may remove a hotspot while the animation is ending.
      }
    });
    hopHotspotsRef.current = [];
  }, []);

  const syncHotspots = useCallback(() => {
    const kp = kpRef.current;
    if (!kp) return;

    const next = AmenitiesWithDefaults();
    const count = Number(kp.get("hotspot.count")) || 0;

    for (let index = 0; index < count; index += 1) {
      const tid = Number(kp.get(`hotspot[${index}].tid`));
      if (!Number.isFinite(tid)) continue;
      const amenity = next.find((item) => item.id === tid);
      if (!amenity) continue;

      amenity.ath = Number(kp.get(`hotspot[${index}].ath`));
      amenity.atv = Number(kp.get(`hotspot[${index}].atv`));
      amenity.points = (amenity.points ?? 0) + 1;
    }

    setAmenities(next);
  }, []);

  const collectHotspots = useCallback((mode: "save" | "export", data: string) => {
    const rows = String(data || "")
      .split("###")
      .map((line) => line.split("|"))
      .filter((parts) => parts.length >= 4)
      .map(([id, ath, atv, name]) => ({ id: Number(id), ath, atv, name }));

    orderRef.current = rows.map((row) => row.name);

    if (mode === "export") {
      setExportXml(
        rows
          .map(
            (row) =>
              `  <hotspot name="${row.name}" style="ti_pin" url="pins30/pin-ti-${row.id}.png" tid="${row.id}" ath="${row.ath}" atv="${row.atv}" zorder="30" />`,
          )
          .join("\n"),
      );
    }

    syncHotspots();
  }, [syncHotspots]);

  const showInfo = useCallback((id: number, centered = false) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (centered) {
      setInfoPosition({ x: 0, y: 16, centered: true });
    } else if (panoRef.current) {
      const rect = panoRef.current.getBoundingClientRect();
      const x = Math.max(8, Math.min(mouseRef.current.x + 16, rect.width - 272));
      const y = Math.max(8, Math.min(mouseRef.current.y - 40, rect.height - 150));
      setInfoPosition({ x, y, centered: false });
    }

    setActiveId(id);
  }, []);

  const hideInfo = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setActiveId(null), 120);
  }, []);

  const hotspotsOf = useCallback((id: number) => {
    const kp = kpRef.current;
    const out: string[] = [];
    if (!kp) return out;

    const count = Number(kp.get("hotspot.count")) || 0;
    for (let index = 0; index < count; index += 1) {
      const name = String(kp.get(`hotspot[${index}].name`) ?? "");
      const tid = String(kp.get(`hotspot[${index}].tid`) ?? "");
      if (tid === String(id) && name) out.push(name);
    }
    return out;
  }, []);

  const hop = useCallback((id: number) => {
    const kp = kpRef.current;
    if (!kp) return;

    stopHop();
    const hotspots = hotspotsOf(id);
    hopHotspotsRef.current = hotspots;
    if (!hotspots.length) return;

    const base = Number(kp.get("ti_sc")) || 0.17;
    const startedAt = Date.now();
    const duration = 1500;
    const bounces = 3;
    const up = 26;

    hopTimerRef.current = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1);
      const damp = 1 - progress;
      const bounce = Math.abs(Math.sin(progress * Math.PI * bounces)) * damp;
      const scale = base * (1 + 0.45 * (progress < 0.15 ? progress / 0.15 : damp * 0.9 + 0.1));

      hotspots.forEach((name) => {
        kp.set(`hotspot[${name}].scale`, scale);
        kp.set(`hotspot[${name}].oy`, -up * bounce);
      });

      if (progress >= 1) stopHop();
    }, 16);
  }, [hotspotsOf, stopHop]);

  const flyTo = useCallback((rawId: number | string) => {
    const id = Number(rawId);
    const amenity = amenities.find((item) => item.id === id);
    if (!amenity?.points) {
      setMessage(`Tiện ích ${id} chưa được chấm vị trí`);
      window.setTimeout(() => setMessage(""), 1600);
      return;
    }

    hop(id);
    showInfo(id, true);
    window.setTimeout(() => setInfoPosition((position) => ({ ...position, centered: false })), 1600);
  }, [amenities, hop, showInfo]);

  const hname = useCallback((id: number) => {
    let name = `ti_${id}`;
    let suffix = 0;
    while (orderRef.current.includes(name)) {
      suffix += 1;
      name = `ti_${id}${String.fromCharCode(97 + suffix)}`;
    }
    return name;
  }, []);

  const armAdd = useCallback(() => {
    const kp = kpRef.current;
    if (!kp || !editOn) return;
    setAddMode(true);
    kp.set("ti_add_mode", true);
    setMessage("CLICK lên ảnh tại vị trí tiện ích");
  }, [editOn]);

  const addPin = useCallback((ath: number, atv: number, id: number) => {
    const kp = kpRef.current;
    if (!kp) return;

    const name = hname(id);
    kp.call(`ti_add(${ath},${atv},${id},${name})`);
    if (!orderRef.current.includes(name)) orderRef.current.push(name);
    window.setTimeout(syncHotspots, 80);
  }, [hname, syncHotspots]);

  const toggleEdit = useCallback(() => {
    const next = !editOn;
    setEditOn(next);
    setAddMode(false);
    setActiveId(null);

    const kp = kpRef.current;
    kp?.set("ti_edit_on", next);
    kp?.set("ti_add_mode", false);
    setMessage(next ? "CHẾ ĐỘ CHẤM · bấm + CHẤM ĐIỂM rồi click lên ảnh" : "");
  }, [editOn]);

  const deleteLast = useCallback(() => {
    const kp = kpRef.current;
    const name = orderRef.current.pop();
    if (!kp || !name) {
      setMessage("Chưa có gim nào để xóa");
      return;
    }
    kp.call(`ti_remove(${name})`);
    window.setTimeout(syncHotspots, 80);
  }, [syncHotspots]);

  const wipeAll = useCallback(() => {
    const kp = kpRef.current;
    if (!kp || !window.confirm("Xóa toàn bộ gim tiện ích để chấm lại từ đầu?")) return;
    kp.call("ti_clear_all()");
    orderRef.current = [];
    window.setTimeout(syncHotspots, 80);
  }, [syncHotspots]);

  const exportPins = useCallback(() => {
    kpRef.current?.call("ti_collect_export()");
  }, []);

  useEffect(() => {
    window.tiOver = (id) => showInfo(Number(id));
    window.tiOut = hideInfo;
    window.tiClick = flyTo;
    window.tiSaveDraft = syncHotspots;
    window.tiCollectedSave = (data) => collectHotspots("save", data);
    window.tiCollectedExport = (data) => collectHotspots("export", data);
    window.tiPickPlace = (ath, atv) => {
      const nextAth = Math.round(Number(ath) * 100000) / 100000;
      const nextAtv = Math.round(Number(atv) * 100000) / 100000;
      if (!Number.isFinite(nextAth) || !Number.isFinite(nextAtv)) {
        setMessage("Chưa lấy được vị trí - bấm + CHẤM ĐIỂM rồi click lại");
        return;
      }
      setAddMode(false);
      setPickQuery("");
      setPickPosition({ ath: nextAth, atv: nextAtv });
    };

    return () => {
      delete window.tiOver;
      delete window.tiOut;
      delete window.tiClick;
      delete window.tiSaveDraft;
      delete window.tiCollectedSave;
      delete window.tiCollectedExport;
      delete window.tiPickPlace;
    };
  }, [collectHotspots, flyTo, hideInfo, showInfo, syncHotspots]);

  useEffect(() => {
    let cancelled = false;

    loadPanoScript()
      .then(() => {
        if (cancelled || !window.embedpano || !panoRef.current) return;

        window.embedpano({
          swf: "/pgbl/tienich/pano.swf",
          xml: `/pgbl/tienich/tour.xml?v=${Date.now()}`,
          target: "pgbl-tienich-pano",
          html5: "only",
          bgcolor: "#0D2620",
          mobilescale: 1.0,
          onready: (krpano: KrpanoApi) => {
            kpRef.current = krpano;
            krpano.set("ti_edit_on", false);
            krpano.set("ti_add_mode", false);
            applyResponsiveViewLimit();
            window.setTimeout(syncHotspots, 350);
            window.setTimeout(() => {
              const fov = Number(krpano.get("view.fov"));
              if (Number.isFinite(fov)) krpano.set("view.fov", fov * 0.995);
            }, 650);
          },
          onerror: (error: string) => setLoadError(error),
        });
      })
      .catch(() => setLoadError("Không tải được pano.js"));

    return () => {
      cancelled = true;
      stopHop();
      try {
        window.removepano?.("krpanoSWFObject");
      } catch {
        // krpano cleanup is best-effort.
      }
      kpRef.current = null;
    };
  }, [applyResponsiveViewLimit, stopHop, syncHotspots]);

  useEffect(() => {
    window.addEventListener("resize", applyResponsiveViewLimit);
    return () => window.removeEventListener("resize", applyResponsiveViewLimit);
  }, [applyResponsiveViewLimit]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = readSavedToolPosition();
      latestToolPositionRef.current = saved;
      setToolPosition(saved);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    latestToolPositionRef.current = toolPosition;
  }, [toolPosition]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-[var(--pgbl-base)] font-sans text-[#111]">
      <div className="flex h-full min-h-[560px] bg-[#f5f5f5] max-md:flex-col">
        <section
          id="pgbl-tienich-pano"
          ref={panoRef}
          className="relative min-w-0 flex-1 bg-[var(--pgbl-base)]"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            mouseRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          }}
        >
          {activeAmenity && (
            <div
              className="pointer-events-none absolute z-20 w-[260px] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_12px_34px_rgba(12,12,68,.28)]"
              style={
                infoPosition.centered
                  ? { left: "50%", top: infoPosition.y, transform: "translateX(-50%)" }
                  : { left: infoPosition.x, top: infoPosition.y }
              }
            >
              <div className="flex items-center gap-3 px-3.5 pb-2 pt-3">
                <img src={pinSrc(activeAmenity.id)} alt="" className="h-12 w-[38px] object-contain" />
                <div>
                  <div className="text-[9.5px] font-extrabold uppercase tracking-[.08em] text-[#c8102e]">
                    Tiện ích nội khu
                  </div>
                  <h3 className="mt-0.5 text-[15.5px] font-extrabold leading-[1.15] text-[#0c0c44]">
                    {activeAmenity.id}. {activeAmenity.name}
                  </h3>
                </div>
              </div>
              <p className="px-3.5 pb-3 text-xs leading-[1.55] text-[#555]">{activeAmenity.description}</p>
            </div>
          )}

          {message && (
            <div className="absolute left-1/2 top-3.5 z-40 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[rgba(12,12,68,.92)] px-4 py-2 text-[12.5px] text-white">
              {message}
            </div>
          )}

          {loadError && (
            <div className="absolute left-4 right-4 top-[60px] z-[60] whitespace-pre-wrap rounded-lg bg-[#c8102e] px-3.5 py-3 font-mono text-[12.5px] leading-normal text-white">
              Lỗi krpano - ảnh nền không hiện được:
              {"\n\n"}
              {loadError}
            </div>
          )}

          <div
            className="absolute z-40 flex touch-none flex-col items-end gap-2"
            style={toolPosition ? { left: toolPosition.x, top: toolPosition.y } : { right: 14, bottom: 96 }}
            onPointerMove={(event) => {
              const drag = toolDragRef.current;
              const panoBox = panoRef.current?.getBoundingClientRect();
              if (!drag || !panoBox) return;

              const box = event.currentTarget.getBoundingClientRect();
              const next = {
                x: clamp(event.clientX - panoBox.left - drag.dx, 8, panoBox.width - box.width - 8),
                y: clamp(event.clientY - panoBox.top - drag.dy, 8, panoBox.height - box.height - 96),
              };
              latestToolPositionRef.current = next;
              setToolPosition(next);
            }}
            onPointerUp={(event) => {
              if (toolDragRef.current?.pointerId !== event.pointerId) return;
              toolDragRef.current = null;
              if (latestToolPositionRef.current) {
                localStorage.setItem(TOOL_POSITION_KEY, JSON.stringify(latestToolPositionRef.current));
              }
            }}
            onPointerCancel={() => {
              toolDragRef.current = null;
            }}
          >
            {editOn && (
              <>
                <button
                  type="button"
                  onClick={exportPins}
                  className="rounded-lg bg-[#1b9e5a] px-3.5 py-2 text-xs font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,.22)]"
                >
                  XUẤT XML
                </button>
                <button
                  type="button"
                  onClick={wipeAll}
                  className="rounded-lg bg-[#5a5a5a] px-3.5 py-2 text-xs font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,.22)]"
                >
                  XÓA HẾT GIM
                </button>
                <button
                  type="button"
                  onClick={deleteLast}
                  className="rounded-lg bg-[#8a1020] px-3.5 py-2 text-xs font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,.22)]"
                >
                  XÓA GIM VỪA ĐẶT
                </button>
                <button
                  type="button"
                  onClick={armAdd}
                  className="rounded-lg bg-[#1565c0] px-3.5 py-2 text-xs font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,.22)]"
                >
                  {addMode ? "ĐANG CHỜ CLICK" : "+ CHẤM ĐIỂM"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={toggleEdit}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-[0_3px_10px_rgba(0,0,0,.22)] ${
                editOn ? "bg-[#c8102e]" : "bg-[#0c0c44]"
              }`}
            >
              <span
                className="cursor-move rounded bg-white/15 p-0.5 text-white/85"
                aria-label="Kéo vị trí nút"
                title="Kéo vị trí nút"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const box = event.currentTarget.closest("div")?.getBoundingClientRect();
                  const panoBox = panoRef.current?.getBoundingClientRect();
                  if (!box || !panoBox) return;
                  toolDragRef.current = {
                    dx: event.clientX - box.left,
                    dy: event.clientY - box.top,
                    pointerId: event.pointerId,
                  };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
              >
                <GripVertical className="h-4 w-4" strokeWidth={2.2} />
              </span>
              {editOn ? "XONG (V)" : "CHẤM VỊ TRÍ (V)"}
            </button>
          </div>
        </section>

        <aside className="flex w-[312px] min-w-[312px] flex-col overflow-y-auto border-l border-[#eee] bg-white pb-[calc(86px+env(safe-area-inset-bottom))] max-md:h-[38vh] max-md:w-full max-md:min-w-0 max-md:border-l-0 max-md:border-t">
          <header className="sticky top-0 z-10 border-b border-[#eee] bg-white px-4 pb-2 pt-3 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#0c0c44]">
            Danh sách tiện ích
            <small className="mt-0.5 block text-[11px] font-semibold normal-case tracking-normal text-[#888]">
              30 tiện ích · rê chuột gim / bấm 1 dòng để nổi bảng thông tin
            </small>
          </header>

          <div>
            {amenities.map((amenity) => {
              const isMissing = !amenity.points;

              return (
                <button
                  key={amenity.id}
                  type="button"
                  onMouseEnter={() => showInfo(amenity.id)}
                  onMouseLeave={hideInfo}
                  onClick={() => flyTo(amenity.id)}
                  className="flex w-full cursor-pointer items-center gap-2.5 border-b border-[#f4f4f4] px-3.5 py-[7px] text-left hover:bg-[#f4faef]"
                >
                  <img src={pinSrc(amenity.id)} alt="" className="h-[33px] w-[26px] shrink-0 object-contain" />
                  <span className="text-[12.5px] font-semibold leading-tight">
                    {amenity.id}. {amenity.name}
                  </span>
                  {isMissing ? (
                    <span className="ml-auto whitespace-nowrap rounded bg-[#fdeaed] px-1.5 py-0.5 text-[9px] font-extrabold text-[#c8102e]">
                      chưa chấm
                    </span>
                  ) : amenity.points && amenity.points > 1 ? (
                    <span className="ml-auto whitespace-nowrap rounded bg-[#eef7ea] px-1.5 py-0.5 text-[9px] font-extrabold text-[#2c7a2c]">
                      {amenity.points} điểm
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {pickPosition && (
        <div className="fixed left-1/2 top-1/2 z-[9999] flex max-h-[78vh] w-[min(420px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[14px] bg-white p-4 shadow-[0_16px_50px_rgba(12,12,68,.4)]">
          <div className="text-[15px] font-extrabold text-[#0c0c44]">Chọn tiện ích cho điểm vừa bấm</div>
          <div className="mb-3 mt-1 text-[11px] text-[#888]">
            vị trí ath {pickPosition.ath} · atv {pickPosition.atv}
          </div>
          <input
            value={pickQuery}
            onChange={(event) => setPickQuery(event.target.value)}
            placeholder="Gõ tên tiện ích, vd: bbq / pickleball / rau"
            className="w-full rounded-lg border border-[#ddd] px-2.5 py-2.5 text-[13px] outline-none"
            autoFocus
          />
          <div className="mt-2.5 min-h-0 flex-1 overflow-auto">
            {amenities
              .filter((amenity) => `${amenity.id}. ${amenity.name}`.toLowerCase().includes(pickQuery.toLowerCase().trim()))
              .map((amenity) => (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => {
                    addPin(pickPosition.ath, pickPosition.atv, amenity.id);
                    setPickPosition(null);
                    armAdd();
                    setMessage(`Đã chấm ${amenity.id}. ${amenity.name}`);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-[#f4faef]"
                >
                  <img src={pinSrc(amenity.id)} alt="" className="h-[30px] w-6 object-contain" />
                  <b className="text-[12.5px] font-semibold">
                    {amenity.id}. {amenity.name}
                  </b>
                  {amenity.points ? (
                    <span className="ml-auto text-[10px] font-bold text-[#6da544]">
                      đã có {amenity.points} điểm · thêm nữa
                    </span>
                  ) : null}
                </button>
              ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setPickPosition(null);
              armAdd();
            }}
            className="mt-3 rounded-lg bg-[#eee] p-2.5 font-bold"
          >
            Bỏ điểm này, chấm lại
          </button>
        </div>
      )}

      {exportXml && (
        <div className="fixed left-1/2 top-1/2 z-[9999] w-[min(660px,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-white p-4 shadow-[0_16px_50px_rgba(12,12,68,.4)]">
          <div className="flex items-center justify-between">
            <b className="text-sm text-[#0c0c44]">Tọa độ gim đã chốt</b>
            <button type="button" onClick={() => setExportXml("")} className="px-1.5 text-[22px] leading-none">
              &times;
            </button>
          </div>
          <div className="mb-2.5 mt-1 text-[11px] text-[#888]">
            Dán khối này thay cho khối hotspot ở cuối file tour.xml rồi lưu file.
          </div>
          <textarea
            value={exportXml}
            readOnly
            className="h-60 w-full resize-y rounded-lg border border-[#ddd] p-2.5 font-mono text-[11.5px]"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(exportXml)}
            className="mt-2.5 rounded-lg bg-[#1b9e5a] px-4 py-2.5 font-bold text-white"
          >
            COPY
          </button>
        </div>
      )}
    </main>
  );
}

function AmenitiesWithDefaults() {
  return AMENITIES.map((amenity) => ({ ...amenity }));
}
