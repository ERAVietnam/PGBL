"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* Vo iframe dung chung: nhung thang trang HTML goc trong public/pgbl.
   Forward nguyen query string (startscene, tool, ...) xuong iframe de cac
   trang krpano nhan dung tham so nhu ban static tren Vercel. */
function Frame({ src, title }: { src: string; title: string }) {
  const query = useSearchParams().toString();
  return (
    <iframe
      src={query ? `${src}?${query}` : src}
      title={title}
      className="block h-screen w-screen border-0"
      allow="fullscreen; clipboard-read; clipboard-write"
      allowFullScreen
    />
  );
}

export function PgblFrame(props: { src: string; title: string }) {
  return (
    <Suspense fallback={null}>
      <Frame {...props} />
    </Suspense>
  );
}
