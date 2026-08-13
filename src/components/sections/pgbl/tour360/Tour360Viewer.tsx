"use client";

export function Tour360Viewer() {
  return (
    <iframe
      src="/pgbl/tour360/tour.html"
      title="Phú Gia Bảo Lộc Flycam 360"
      className="block h-screen w-screen border-0 bg-black"
      allow="fullscreen; clipboard-read; clipboard-write"
    />
  );
}
