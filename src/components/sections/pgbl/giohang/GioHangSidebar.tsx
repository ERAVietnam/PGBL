// ==================================================================
// PGBL - SIDEBAR BO LOC MAT BANG PHAN LO (port tu giohang/index.html)
// Component thuan hien thi: nhan filter + du lieu chips, goi onFilter.
// ==================================================================
"use client";

import type { ChipItem, GioHangFilter } from "./gioHangFilter";

export type GioHangChips = {
  era: ChipItem[];
  st: ChipItem[];
  lo: ChipItem[];
  hu: ChipItem[];
  zo: ChipItem[];
};

type GioHangSidebarProps = {
  filter: GioHangFilter;
  chips: GioHangChips;
  areaRange: { min: number; max: number };
  onFilter: (patch: Partial<GioHangFilter>) => void;
  onClear: () => void;
};

const MODE_CHIPS: ChipItem[] = [
  { v: "lo", t: "Loại sản phẩm" },
  { v: "st", t: "Trạng thái" },
];

function ChipGroup({
  items,
  value,
  onPick,
  grid,
}: {
  items: ChipItem[];
  value: string;
  onPick: (v: string) => void;
  grid?: boolean;
}) {
  return (
    <div className={grid ? "grid grid-cols-5 gap-[5px]" : "flex flex-wrap gap-1.5"}>
      {items.map((item) => {
        const on = value === item.v;
        return (
          <button
            key={item.v || "__all"}
            type="button"
            onClick={() => onPick(item.v)}
            className={`cursor-pointer rounded-[7px] border px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap transition ${
              grid ? "px-0.5 py-[5px] text-center" : ""
            } ${
              on
                ? "border-[#0D2620] bg-[#0D2620] text-white"
                : "border-[#E4EAE6] bg-white text-[#3C4A43] hover:border-[#0D2620] hover:text-[#0D2620]"
            }`}
          >
            {item.t}
            {item.n !== undefined && (
              <b className={`ml-[3px] font-extrabold ${on ? "text-[#9BDC4C] opacity-90" : "opacity-75"}`}>
                {item.n}
              </b>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Tier({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E4EAE6] bg-white px-[15px] pb-4 pt-3.5 shadow-[0_1px_3px_rgba(13,38,32,.06)]">
      <div className="mb-[13px] flex items-center gap-2 text-[9.5px] font-extrabold uppercase tracking-[.15em] text-[#0D2620]">
        <span className="w-[3px] self-stretch rounded-sm bg-[#9BDC4C]" />
        {title}
        <i className="h-px flex-1 bg-[#E4EAE6]" />
      </div>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-[15px] last:mb-0">
      <h3 className="mb-2 text-[9.5px] font-bold uppercase tracking-[.13em] text-[#6E8579]">{title}</h3>
      {children}
    </div>
  );
}

export function GioHangSidebar({ filter, chips, areaRange, onFilter, onClear }: GioHangSidebarProps) {
  return (
    <aside className="flex w-[326px] min-w-[326px] flex-col gap-[13px] overflow-y-auto border-l border-[#E4EAE6] bg-[#F3F7F4] px-3.5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[15px] max-md:h-[42vh] max-md:w-full max-md:min-w-0 max-md:border-l-0 max-md:border-t">
      {/* TANG 1 - xem nhanh */}
      <Tier title="Xem nhanh">
        <Group title="Tra cứu mã lô">
          <input
            value={filter.q}
            onChange={(event) => onFilter({ q: event.target.value })}
            placeholder="Nhập mã lô, VD: A12-05"
            autoComplete="off"
            className="w-full rounded-md border border-[#ccc] px-2.5 py-2 text-[13px] focus:outline-2 focus:-outline-offset-1 focus:outline-[#5FE5BE]"
          />
        </Group>
        <Group title="Tô màu bản đồ theo">
          <ChipGroup items={MODE_CHIPS} value={filter.mode} onPick={(v) => onFilter({ mode: v as GioHangFilter["mode"] })} />
          <div className="mt-2.5 grid gap-1.5">
            <div
              className={`border-l-2 pl-[9px] text-[10.5px] leading-[1.5] transition ${
                filter.mode === "lo" ? "border-[#9BDC4C] text-[#43524A]" : "border-[#E4EAE6] text-[#8B9C93]"
              }`}
            >
              <b className="font-bold text-[#0D2620]">Loại sản phẩm:</b> lọc theo sản phẩm liền kề · song lập · đơn lập.
            </div>
            <div
              className={`border-l-2 pl-[9px] text-[10.5px] leading-[1.5] transition ${
                filter.mode === "st" ? "border-[#9BDC4C] text-[#43524A]" : "border-[#E4EAE6] text-[#8B9C93]"
              }`}
            >
              <b className="font-bold text-[#0D2620]">Trạng thái:</b> lọc theo tình hình bán: còn hàng · giữ chỗ · đã cọc · đã bán · lock.
            </div>
          </div>
        </Group>
      </Tier>

      {/* TANG 2 - loc chinh */}
      <Tier title="Bộ lọc chính">
        <Group title="Rổ hàng ERA">
          <ChipGroup items={chips.era} value={filter.era} onPick={(v) => onFilter({ era: v as GioHangFilter["era"] })} />
        </Group>
        <Group title="Trạng thái">
          <ChipGroup items={chips.st} value={filter.st} onPick={(v) => onFilter({ st: v })} />
        </Group>
      </Tier>

      {/* TANG 3 - loc chi tiet */}
      <Tier title="Lọc chi tiết">
        <Group title="Loại căn">
          <ChipGroup items={chips.lo} value={filter.lo} onPick={(v) => onFilter({ lo: v })} />
        </Group>
        <Group title="Hướng">
          <ChipGroup items={chips.hu} value={filter.hu} onPick={(v) => onFilter({ hu: v })} />
        </Group>
        <Group title="Phân khu / Block">
          <ChipGroup items={chips.zo} value={filter.zo} onPick={(v) => onFilter({ zo: v })} grid />
        </Group>
        <Group
          title={
            <>
              Diện tích: <span className="normal-case tracking-normal">{filter.rmin} - {filter.rmax}</span> m²
            </>
          }
        >
          <div className="mt-[3px] flex items-center gap-2 text-[11px] text-[#666]">
            <span className="w-[26px]">Từ</span>
            <input
              type="range"
              min={areaRange.min}
              max={areaRange.max}
              value={filter.rmin}
              onChange={(event) => onFilter({ rmin: Math.min(Number(event.target.value), filter.rmax) })}
              className="w-full accent-[#0D2620]"
            />
          </div>
          <div className="mt-[3px] flex items-center gap-2 text-[11px] text-[#666]">
            <span className="w-[26px]">Đến</span>
            <input
              type="range"
              min={areaRange.min}
              max={areaRange.max}
              value={filter.rmax}
              onChange={(event) => onFilter({ rmax: Math.max(filter.rmin, Number(event.target.value)) })}
              className="w-full accent-[#0D2620]"
            />
          </div>
        </Group>
      </Tier>

      <div className="mt-auto pt-0.5">
        <button
          type="button"
          onClick={onClear}
          className="w-full cursor-pointer rounded-md border border-[#ccc] bg-white p-2 text-[11px] font-bold uppercase tracking-[.06em] text-[#666] transition hover:border-[#0D2620] hover:text-[#0D2620]"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    </aside>
  );
}
