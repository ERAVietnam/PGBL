import type { PgblRoute } from "@/types/navigation";

export const pgblRoutes: PgblRoute[] = [
  { id: "tour360", href: "/tour360", label: "Flycam 360" },
  { id: "giohang", href: "/giohang", label: "San pham" },
  { id: "tienich", href: "/tienich", label: "Tien ich" },
  { id: "nhamau", href: "#", label: "Nha mau", soon: true },
  { id: "gallery", href: "#", label: "Gallery", soon: true },
  { id: "ebro", href: "/ebro", label: "E-Brochure" },
];
