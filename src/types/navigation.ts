export type PgblRouteId = "tour360" | "giohang" | "tienich" | "nhamau" | "gallery" | "ebro";

export type PgblRoute = {
  id: PgblRouteId;
  href: string;
  label: string;
  soon?: boolean;
};
