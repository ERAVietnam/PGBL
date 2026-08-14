import { redirect } from "next/navigation";
import { PGBL_ROUTES } from "@/lib/routes";

/* Moi route khong ton tai (404) tu dong quay ve trang chu.
   force-dynamic de redirect() chay luc request (mac dinh _not-found bi
   prerender tinh luc build nen redirect khong kich hoat). */
export const dynamic = "force-dynamic";

export default function NotFound() {
  redirect(PGBL_ROUTES.home);
}
