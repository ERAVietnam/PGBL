// ==================================================================
// PGBL - BANG CHI TIET LO (port tu #detbox trong giohang/index.html)
// The noi giua-tren ban do, hien khi chon 1 lo.
// ==================================================================
"use client";

import { khuCuaLot, MAU_TRANG_THAI, THONG_TIN_LO, type PgblLot } from "@/lib/pgblLots";
import { stOf, type SalesRecord } from "@/hooks/useSalesStatus";

type GioHangDetailProps = {
  lot: PgblLot;
  store: Record<string, SalesRecord>;
  onClose: () => void;
  onZoom: () => void;
};

export function GioHangDetail({ lot, store, onClose, onZoom }: GioHangDetailProps) {
  const status = stOf(store, lot.c);
  const record = store[lot.c];

  return (
    <div className="absolute left-1/2 top-3.5 z-[8] max-h-[calc(100%-28px)] w-[336px] max-w-[calc(100vw-24px)] -translate-x-1/2 overflow-y-auto rounded-xl border border-[#E4EAE6] border-t-[3px] border-t-[#0D2620] bg-white/97 px-[17px] pb-4 pt-[15px] shadow-[0_8px_28px_rgba(0,0,0,.17)]">
      <button
        type="button"
        onClick={onClose}
        title="Đóng"
        className="absolute right-2.5 top-[9px] h-[23px] w-[23px] cursor-pointer rounded-full border-0 bg-[#0D2620] p-0 text-center text-[15px] leading-[21px] text-white hover:bg-[#BF9642]"
      >
        &times;
      </button>

      <div className="text-[23px] font-extrabold leading-[1.1] text-[#0D2620]">{lot.c}</div>
      <div className="mt-[1px] text-[11px] text-[#666]">{lot.l || "-"}</div>
      {lot.e ? (
        <div className="mt-1.5 inline-block rounded-[5px] border-[1.5px] border-dashed border-[#BF9642] bg-[#FFFBF0] px-[7px] py-0.5 text-[9px] font-bold uppercase tracking-[.09em] text-[#8A6A25]">
          ERA phân phối
        </div>
      ) : null}

      <div className="mt-[11px] grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 text-xs">
        {THONG_TIN_LO.map(([ten, ma, donVi]) => {
          const value = ma === "khu" ? khuCuaLot(lot.c) : lot[ma];
          if (value === undefined || value === "" || value === 0) return null;
          return (
            <div key={ten} className="contents">
              <div className="text-[#888]">{ten}</div>
              <div className="text-right font-bold">
                {value}
                {donVi ? ` ${donVi}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mb-0.5 mt-2.5 inline-block rounded-full px-[13px] py-[5px] text-xs font-bold tracking-[.03em] text-white"
        style={{ background: MAU_TRANG_THAI[status] || "#888" }}
      >
        {status}
      </div>

      {record?.gia ? (
        <div className="mt-[11px] grid grid-cols-[auto_1fr] gap-x-2.5 text-xs">
          <div className="text-[#888]">Giá</div>
          <div className="text-right font-bold">{record.gia}</div>
        </div>
      ) : null}

      {record?.note ? (
        <div className="mt-2 rounded-lg bg-[#F6F7F9] px-2.5 py-2 text-xs leading-[1.5] text-[#4B5563]">
          {record.note}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onZoom}
        className="mt-2.5 w-full cursor-pointer rounded-[7px] border-0 bg-[#0D2620] p-2.5 text-xs font-bold text-white hover:bg-[#16342B]"
      >
        Phóng tới lô này
      </button>
    </div>
  );
}
