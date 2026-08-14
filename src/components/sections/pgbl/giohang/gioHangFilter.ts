// ==================================================================
// PGBL - LOGIC LOC LO (port tu giohang/index.html)
// Thuần function, khong phu thuoc React/krpano de de test va tai dung.
// ==================================================================

import { PGBL_LOTS, type PgblLot } from "@/lib/pgblLots";
import { stOf, type SalesRecord } from "@/hooks/useSalesStatus";

export type GioHangFilter = {
  /** Rổ hàng ERA: all = tất cả, era = ERA phân phối, out = ngoài rổ */
  era: "all" | "era" | "out";
  /** Trạng thái bán hàng ('' = tất cả) */
  st: string;
  /** Loại căn ('' = tất cả) */
  lo: string;
  /** Hướng ('' = tất cả) */
  hu: string;
  /** Phân khu / block ('' = tất cả) */
  zo: string;
  rmin: number;
  rmax: number;
  /** Tra cứu mã lô */
  q: string;
  /** Tô màu bản đồ theo: lo = loại sản phẩm, st = trạng thái */
  mode: "lo" | "st";
};

export type ChipItem = { v: string; t: string; n?: number };

/** Pool lo theo bo loc ERA hien tai */
export function poolOf(filter: GioHangFilter): PgblLot[] {
  if (filter.era === "era") return PGBL_LOTS.filter((l) => l.e);
  if (filter.era === "out") return PGBL_LOTS.filter((l) => !l.e);
  return PGBL_LOTS;
}

/**
 * Kiem tra 1 lo co khop bo loc khong.
 * boQuaBlock = true thi bo qua dieu kien phan khu (dung de to mo lo ngoai block).
 */
export function matchLot(
  lot: PgblLot,
  filter: GioHangFilter,
  store: Record<string, SalesRecord>,
  boQuaBlock = false,
): boolean {
  if (filter.era === "era" && !lot.e) return false;
  if (filter.era === "out" && lot.e) return false;
  if (filter.st && stOf(store, lot.c) !== filter.st) return false;
  if (filter.lo && lot.l !== filter.lo) return false;
  if (filter.hu && lot.h !== filter.hu) return false;
  if (!boQuaBlock && filter.zo && lot.z !== filter.zo) return false;
  if (lot.a < filter.rmin || lot.a > filter.rmax) return false;
  const q = filter.q.trim().toUpperCase();
  if (q && lot.c.toUpperCase().indexOf(q) < 0) return false;
  return true;
}

/** Danh sach gia tri duy nhat cua 1 truong trong pool, da sap xep */
export function uniqueSorted(pool: PgblLot[], pick: (lot: PgblLot) => string): string[] {
  return [...new Set(pool.map(pick).filter(Boolean))].sort();
}

/** Sap xep ten block: ngan truoc, sau do theo alphabet (A1, A2, ... A10, B1, ...) */
export function sortZones(zones: string[]): string[] {
  return zones.sort((a, b) => a.length - b.length || a.localeCompare(b));
}
