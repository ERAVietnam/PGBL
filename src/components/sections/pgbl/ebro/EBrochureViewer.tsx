"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PGBL_ROUTES } from "@/lib/routes";

type BrochurePage = {
  src: string;
  zoom: string;
  title: string;
};

type PageFlipInstance = {
  loadFromImages: (images: string[]) => void;
  flipPrev: () => void;
  flipNext: () => void;
  turnToPage: (index: number) => void;
  getCurrentPageIndex: () => number;
  getOrientation?: () => "portrait" | "landscape";
  on: (event: string, callback: () => void) => void;
  destroy?: () => void;
};

declare global {
  interface Window {
    St?: {
      PageFlip: new (element: HTMLElement, options: Record<string, unknown>) => PageFlipInstance;
    };
    __pgblPageFlipLoading?: Promise<void>;
  }
}

const pages: BrochurePage[] = [
  { src: "/pgbl/ebro/img/bia.webp", zoom: "/pgbl/ebro/img/zoom-bia.webp", title: "Bìa - Phú Gia Bảo Lộc" },
  { src: "/pgbl/ebro/img/ly-do.webp", zoom: "/pgbl/ebro/img/zoom-ly-do.webp", title: "03 lý do sở hữu" },
  {
    src: "/pgbl/ebro/img/vi-tri.webp",
    zoom: "/pgbl/ebro/img/zoom-vi-tri.webp",
    title: "Vị trí kết nối và liên kết vùng",
  },
  {
    src: "/pgbl/ebro/img/mb-tongthe-a.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-tongthe.webp",
    title: "Mặt bằng tổng thể",
  },
  {
    src: "/pgbl/ebro/img/mb-tongthe-b.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-tongthe.webp",
    title: "30+ tiện ích nội khu",
  },
  {
    src: "/pgbl/ebro/img/mb-nha-a.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-nha.webp",
    title: "Mặt bằng nhà đơn lập",
  },
  {
    src: "/pgbl/ebro/img/mb-nha-b.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-nha.webp",
    title: "Mặt bằng nhà song lập",
  },
  { src: "/pgbl/ebro/img/tien-ich.webp", zoom: "/pgbl/ebro/img/zoom-tien-ich.webp", title: "Top kỳ quan tiện ích" },
];

const sourceImages = pages.map((page) => page.src);
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function loadPageFlip() {
  if (window.St?.PageFlip) return Promise.resolve();
  if (window.__pgblPageFlipLoading) return window.__pgblPageFlipLoading;

  window.__pgblPageFlipLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="page-flip.browser.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__pgblPageFlipLoading;
}

export function EBrochureViewer() {
  const flipRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlipInstance | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [current, setCurrent] = useState(0);
  const [caption, setCaption] = useState(pages[0].title);
  const [label, setLabel] = useState(`1 / ${pages.length}`);
  const [fallback, setFallback] = useState(false);
  const [zoomPage, setZoomPage] = useState<BrochurePage | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const paint = useCallback((index: number, isSpread?: boolean) => {
    const hasRight = Boolean(isSpread && index > 0 && index + 1 < pages.length);
    setCurrent(index);
    setLabel(`${hasRight ? `${index + 1}-${index + 2}` : index + 1} / ${pages.length}`);
    setCaption(hasRight ? `${pages[index].title} · ${pages[index + 1].title}` : pages[index].title);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    loadPageFlip()
      .then(() => {
        if (cancelled || !flipRef.current || !window.St?.PageFlip) return;

        const pageFlip = new window.St.PageFlip(flipRef.current, {
          width: 775,
          height: 1000,
          size: "stretch",
          minWidth: 280,
          maxWidth: 620,
          minHeight: 361,
          maxHeight: 800,
          maxShadowOpacity: 0.5,
          showCover: true,
          drawShadow: true,
          mobileScrollSupport: true,
          usePortrait: true,
        });

        pageFlipRef.current = pageFlip;
        pageFlip.loadFromImages(sourceImages);

        let last = -1;
        const sync = () => {
          if (!pageFlipRef.current) return;
          const index = pageFlipRef.current.getCurrentPageIndex();
          if (index === last) return;
          last = index;
          paint(index, pageFlipRef.current.getOrientation?.() === "landscape");
        };

        pageFlip.on("flip", sync);
        pageFlip.on("init", sync);
        pageFlip.on("changeOrientation", () => {
          last = -1;
          sync();
        });

        interval = setInterval(sync, 250);
        window.setTimeout(sync, 300);
      })
      .catch(() => {
        if (!cancelled) setFallback(true);
      });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      pageFlipRef.current?.destroy?.();
      pageFlipRef.current = null;
    };
  }, [paint]);

  useEffect(() => {
    if (!zoomPage) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomPage(null);
      if (event.key === "+" || event.key === "=") setScale((value) => clamp(value * 1.25, 0.8, 8));
      if (event.key === "-") setScale((value) => clamp(value / 1.25, 0.8, 8));
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomPage]);

  function goTo(index: number) {
    const nextIndex = clamp(index, 0, pages.length - 1);
    if (fallback || !pageFlipRef.current) {
      paint(nextIndex);
      return;
    }
    pageFlipRef.current.turnToPage(nextIndex);
  }

  function previous() {
    if (fallback || !pageFlipRef.current) {
      paint(clamp(current - 1, 0, pages.length - 1));
      return;
    }
    pageFlipRef.current.flipPrev();
  }

  function next() {
    if (fallback || !pageFlipRef.current) {
      paint(clamp(current + 1, 0, pages.length - 1));
      return;
    }
    pageFlipRef.current.flipNext();
  }

  function openZoom(page: BrochurePage) {
    setZoomPage(page);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_-10%,#16342B_0%,#0D2620_46%,#081712_100%)] pb-28 text-[var(--pgbl-text)]">
      <header className="flex flex-wrap items-center justify-between gap-4 px-[26px] py-[18px]">
        <Link href={PGBL_ROUTES.home} className="block">
          <Image
            src="/pgbl/assets/wordmark.png"
            alt="Phú Gia Bảo Lộc"
            width={260}
            height={64}
            priority
            className="h-8 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,.4)]"
          />
        </Link>
        <div className="text-right">
          <h1 className="text-[22px] font-extrabold tracking-normal max-sm:text-lg">E-Brochure</h1>
          <p className="text-xs text-[var(--pgbl-text-muted)]">Ấn phẩm giới thiệu dự án · lật trang</p>
        </div>
      </header>

      <section className="flex flex-col items-center gap-3.5 px-4 pb-7">
        <div
          ref={flipRef}
          className={`w-[min(94vw,1080px)] touch-pan-y [&_.page]:overflow-hidden [&_.page]:bg-[var(--pgbl-panel)] [&_.page]:shadow-[0_10px_34px_rgba(0,0,0,.42)] [&_.page_img]:block [&_.page_img]:h-full [&_.page_img]:w-full [&_.page_img]:object-cover ${
            fallback ? "hidden" : ""
          }`}
        />

        {fallback && (
          <div ref={fallbackRef} className="w-[min(94vw,620px)]">
            <button type="button" onClick={() => openZoom(pages[current])} className="block w-full">
              <Image
                src={pages[current].src}
                alt={pages[current].title}
                width={775}
                height={1000}
                className="w-full rounded-xl border border-[var(--pgbl-line)] shadow-[0_12px_40px_rgba(0,0,0,.4)]"
              />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={previous}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] transition hover:border-[rgba(159,220,76,.5)] hover:bg-[rgba(95,229,190,.18)] hover:text-[var(--pgbl-accent)] max-sm:h-[42px] max-sm:w-[42px]"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-[74px] text-center text-[13px] font-bold text-[var(--pgbl-text-muted)]">
            {label}
          </div>
          <button
            type="button"
            onClick={next}
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] transition hover:border-[rgba(159,220,76,.5)] hover:bg-[rgba(95,229,190,.18)] hover:text-[var(--pgbl-accent)] max-sm:h-[42px] max-sm:w-[42px]"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => openZoom(pages[current])}
            className="flex h-[46px] items-center justify-center gap-2 rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] px-3.5 text-sm font-semibold transition hover:border-[rgba(159,220,76,.5)] hover:bg-[rgba(95,229,190,.18)] hover:text-[var(--pgbl-accent)] max-sm:h-[42px] max-sm:text-[13px]"
          >
            <Maximize2 className="h-5 w-5" />
            Phóng to
          </button>
        </div>

        <p className="min-h-[18px] text-center text-[13px] text-[#83A08D]">{caption}</p>

        <div className="flex w-full max-w-[min(94vw,1080px)] justify-center gap-2 overflow-x-auto px-0.5 pb-2 [scrollbar-width:thin]">
          {pages.map((page, index) => (
            <button
              key={page.src}
              type="button"
              onClick={() => goTo(index)}
              className={`shrink-0 overflow-hidden rounded-md border transition ${
                index === current
                  ? "border-[var(--pgbl-lime)] opacity-100 shadow-[0_0_0_1px_rgba(159,220,76,.5)]"
                  : "border-[var(--pgbl-line)] opacity-55 hover:-translate-y-0.5 hover:opacity-90"
              }`}
              aria-label={`Đến trang ${index + 1}`}
            >
              <Image
                src={page.src}
                alt=""
                width={96}
                height={124}
                className="h-[66px] w-auto max-sm:h-[52px]"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </section>

      {zoomPage && (
        <div
          className="fixed inset-0 z-[2147483000] overflow-hidden bg-[rgba(4,14,11,.97)]"
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-x-0 top-3.5 z-[2147483001] flex justify-center gap-2.5 px-3">
            <div className="flex h-11 items-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)] px-4 text-xs font-semibold text-[var(--pgbl-text-muted)] sm:text-sm">
              {zoomPage.title}
            </div>
            <button
              type="button"
              onClick={() => setScale((value) => clamp(value / 1.35, 0.8, 8))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)]"
              aria-label="Thu nhỏ"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setScale((value) => clamp(value * 1.35, 0.8, 8))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)]"
              aria-label="Phóng to"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomPage(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)]"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomPage.zoom}
            alt={zoomPage.title}
            className="absolute left-1/2 top-1/2 max-h-[82vh] max-w-[92vw] cursor-grab select-none rounded-lg shadow-[0_20px_60px_rgba(0,0,0,.6)] active:cursor-grabbing"
            style={{
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
              transformOrigin: "center",
            }}
            draggable={false}
            onDoubleClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            onWheel={(event) => {
              event.preventDefault();
              setScale((value) => clamp(value * (event.deltaY < 0 ? 1.15 : 1 / 1.15), 0.8, 8));
            }}
            onPointerDown={(event) => {
              if (event.pointerType === "touch") return;
              dragRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!dragRef.current) return;
              setOffset({ x: event.clientX - dragRef.current.x, y: event.clientY - dragRef.current.y });
            }}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          />
          <p className="fixed inset-x-0 bottom-4 z-[2147483001] px-4 text-center text-xs text-[#83A08D]">
            Lăn chuột để phóng · kéo để di chuyển · nhấn đúp để vừa khung · Esc để đóng
          </p>
        </div>
      )}
    </main>
  );
}
