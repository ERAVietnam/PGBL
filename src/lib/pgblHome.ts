import { BookOpen, Grid3X3, House, Images, Map, Plane, type LucideIcon } from "lucide-react";
import { PGBL_ROUTES } from "@/lib/routes";

export type PgblHomeCard = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
  soon?: boolean;
  dimmed?: boolean;
};

export const pgblHomeCards: PgblHomeCard[] = [
  {
    title: "Flycam 360°",
    description: "Ba cảnh bay: tổng thể, toàn cảnh và view núi. Xoay 360°, xem trên điện thoại.",
    href: PGBL_ROUTES.tour360,
    action: "Bay vào tour",
    icon: Plane,
  },
  {
    title: "Mặt bằng sản phẩm",
    description: "Giỏ hàng phân lô tương tác: mã lô, diện tích, hướng, trạng thái, giá - kèm bộ lọc.",
    href: PGBL_ROUTES.giohang,
    action: "Mở mặt bằng",
    icon: Grid3X3,
  },
  {
    title: "Mặt bằng tiện ích",
    description: "Sơ đồ tiện ích nội khu: bấm marker hoặc chọn danh sách để xem chi tiết từng điểm.",
    href: PGBL_ROUTES.tienich,
    action: "Xem tiện ích",
    icon: Map,
  },
  {
    title: "360 Nhà mẫu",
    description: "Bước vào nhà mẫu bằng panorama 360°. Đang hoàn thiện dữ liệu - sẽ mở sớm.",
    href: "#",
    action: "Sắp ra mắt",
    icon: House,
    soon: true,
    dimmed: true,
  },
  {
    title: "Gallery",
    description: "Bộ ảnh phối cảnh, tiện ích và vị trí dự án. Đang cập nhật bộ ảnh mới - sẽ mở lại sớm.",
    href: "#",
    action: "Sắp ra mắt",
    icon: Images,
    soon: true,
    dimmed: true,
  },
  {
    title: "E-Brochure",
    description: "Ấn phẩm giới thiệu dự án dạng flipbook lật trang, đọc mượt trên mọi thiết bị.",
    href: PGBL_ROUTES.ebro,
    action: "Lật brochure",
    icon: BookOpen,
  },
];
