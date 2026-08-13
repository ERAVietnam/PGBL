"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, X } from "lucide-react";

type BrochurePage = {
  src: string;
  zoom: string;
  title: string;
};

const pages: BrochurePage[] = [
  { src: "/pgbl/ebro/img/bia.webp", zoom: "/pgbl/ebro/img/zoom-bia.webp", title: "Bia - Phu Gia Bao Loc" },
  { src: "/pgbl/ebro/img/ly-do.webp", zoom: "/pgbl/ebro/img/zoom-ly-do.webp", title: "03 ly do so huu" },
  {
    src: "/pgbl/ebro/img/vi-tri.webp",
    zoom: "/pgbl/ebro/img/zoom-vi-tri.webp",
    title: "Vi tri ket noi va lien ket vung",
  },
  {
    src: "/pgbl/ebro/img/mb-tongthe-a.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-tongthe.webp",
    title: "Mat bang tong the",
  },
  {
    src: "/pgbl/ebro/img/mb-tongthe-b.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-tongthe.webp",
    title: "30+ tien ich noi khu",
  },
  {
    src: "/pgbl/ebro/img/mb-nha-a.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-nha.webp",
    title: "Mat bang nha don lap",
  },
  {
    src: "/pgbl/ebro/img/mb-nha-b.webp",
    zoom: "/pgbl/ebro/img/zoom-mb-nha.webp",
    title: "Mat bang nha song lap",
  },
  {
    src: "/pgbl/ebro/img/tien-ich.webp",
    zoom: "/pgbl/ebro/img/zoom-tien-ich.webp",
    title: "Top ky quan tien ich",
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function EBrochureViewer() {
  const [current, setCurrent] = useState(0);
  const [spread, setSpread] = useState(false);
  const [zoomPage, setZoomPage] = useState<BrochurePage | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const update = () => setSpread(window.matchMedia("(min-width: 900px)").matches);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!zoomPage) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomPage(null);
      if (event.key === "+" || event.key === "=") setScale((value) => clamp(value * 1.25, 1, 5));
      if (event.key === "-") setScale((value) => clamp(value / 1.25, 1, 5));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomPage]);

  const visiblePages = useMemo(() => {
    if (!spread || current === 0 || current === pages.length - 1) return [pages[current]];
    return pages.slice(current, Math.min(current + 2, pages.length));
  }, [current, spread]);

  const pageLabel = visiblePages.length > 1 ? `${current + 1}-${current + visiblePages.length}` : `${current + 1}`;
  const caption = visiblePages.map((page) => page.title).join(" · ");

  function goTo(index: number) {
    setCurrent(clamp(index, 0, pages.length - 1));
  }

  function previous() {
    setCurrent((value) => clamp(value - (spread && value > 1 ? 2 : 1), 0, pages.length - 1));
  }

  function next() {
    setCurrent((value) => clamp(value + (spread && value > 0 ? 2 : 1), 0, pages.length - 1));
  }

  function openZoom(page: BrochurePage) {
    setZoomPage(page);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_80%_at_50%_-10%,#16342B_0%,#0D2620_46%,#081712_100%)] pb-28 text-[var(--pgbl-text)]">
      <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-7">
        <Link href="/" className="block">
          <Image
            src="/pgbl/assets/wordmark.png"
            alt="Phu Gia Bao Loc"
            width={260}
            height={64}
            priority
            className="h-8 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,.4)]"
          />
        </Link>
        <div className="text-right">
          <h1 className="text-xl font-extrabold tracking-normal sm:text-[22px]">E-Brochure</h1>
          <p className="text-xs text-[var(--pgbl-text-muted)]">An pham gioi thieu du an · xem theo trang</p>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-4 px-4">
        <div className="grid w-full touch-pan-y grid-cols-1 gap-3 md:grid-cols-[auto_auto] md:justify-center">
          {visiblePages.map((page) => (
            <button
              key={page.src}
              type="button"
              onClick={() => openZoom(page)}
              className="group overflow-hidden border border-[var(--pgbl-line)] bg-[var(--pgbl-panel)] text-left shadow-[0_10px_34px_rgba(0,0,0,.42)] transition hover:border-[rgba(159,220,76,.5)]"
              aria-label={`Phong to ${page.title}`}
            >
              <Image
                src={page.src}
                alt={page.title}
                width={775}
                height={1000}
                priority={current === 0}
                className="block h-auto max-h-[72vh] w-full object-contain md:w-[min(45vw,520px)]"
              />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={previous}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] transition hover:border-[rgba(159,220,76,.5)] hover:bg-[rgba(95,229,190,.18)] hover:text-[var(--pgbl-accent)]"
            aria-label="Trang truoc"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-20 text-center text-sm font-bold text-[var(--pgbl-text-muted)]">
            {pageLabel} / {pages.length}
          </div>
          <button
            type="button"
            onClick={next}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] transition hover:border-[rgba(159,220,76,.5)] hover:bg-[rgba(95,229,190,.18)] hover:text-[var(--pgbl-accent)]"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => openZoom(pages[current])}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.72)] px-4 text-sm font-semibold transition hover:border-[rgba(159,220,76,.5)] hover:bg-[rgba(95,229,190,.18)] hover:text-[var(--pgbl-accent)]"
          >
            <Maximize2 className="h-4 w-4" />
            Phong to
          </button>
        </div>

        <p className="min-h-5 text-center text-sm text-[#83A08D]">{caption}</p>

        <div className="flex w-full max-w-[1080px] gap-2 overflow-x-auto px-0.5 pb-2">
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
              aria-label={`Den trang ${index + 1}`}
            >
              <Image src={page.src} alt="" width={96} height={124} className="h-[52px] w-auto sm:h-[66px]" />
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
          <div className="fixed inset-x-0 top-3 z-[2147483001] flex justify-center gap-2.5 px-3">
            <div className="flex h-11 items-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)] px-4 text-xs font-semibold text-[var(--pgbl-text-muted)] sm:text-sm">
              {zoomPage.title}
            </div>
            <button
              type="button"
              onClick={() => setScale((value) => clamp(value / 1.25, 1, 5))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)]"
              aria-label="Thu nho"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setScale((value) => clamp(value * 1.25, 1, 5))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)]"
              aria-label="Phong to"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomPage(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--pgbl-line)] bg-[rgba(14,40,33,.82)]"
              aria-label="Dong"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Image
            src={zoomPage.zoom}
            alt={zoomPage.title}
            width={1600}
            height={1100}
            unoptimized
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
              setScale((value) => clamp(value * (event.deltaY < 0 ? 1.12 : 1 / 1.12), 1, 5));
            }}
            onPointerDown={(event) => {
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
            Lan chuot de phong · keo de di chuyen · nhan dup de vua khung · Esc de dong
          </p>
        </div>
      )}
    </main>
  );
}
