"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildLogoMark } from "@/lib/logoMark";

const MARK_H = 1.2;
const PX = MARK_H / 675;
const WM_W = 1454 * PX;
const WM_H = 591 * PX;
const MARK_W = 616 * PX;
const LOCK_W = WM_W + 132 * PX + MARK_W;
const MARK_X = LOCK_W / 2 - MARK_W / 2;
const WM_X = -LOCK_W / 2 + WM_W / 2;
const WM_Y = -0.038;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outQuint = (t: number) => 1 - Math.pow(1 - t, 5);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type PivotName = "leaf_main" | "leaf_bud" | "leaf_fold";

export function HomeIntro() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wordmarkRef = useRef<HTMLImageElement | null>(null);
  const ruleRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wordmark = wordmarkRef.current;
    const rule = ruleRef.current;
    if (!canvas || !wordmark || !rule) return;
    const wordmarkEl = wordmark;
    const ruleEl = rule;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    /* Warning X4122 (double precision) do ANGLE/D3D tren Windows sinh ra khi
       compile shader noi bo cua three.js - vo hai va khong sua duoc tu code
       minh. Tat kiem tra shader log de console sach (scene chi dung vat lieu
       co san cua three, khong co shader tu viet nen khong mat gi). */
    renderer.debug.checkShaderErrors = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    const envCanvas = document.createElement("canvas");
    envCanvas.width = 512;
    envCanvas.height = 256;
    const context = envCanvas.getContext("2d");
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, "#fff6e3");
      gradient.addColorStop(0.32, "#d8c184");
      gradient.addColorStop(0.56, "#3f6a5c");
      gradient.addColorStop(1, "#0a1e19");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 256);

      const spot = context.createRadialGradient(150, 60, 4, 150, 60, 110);
      spot.addColorStop(0, "rgba(255,255,255,1)");
      spot.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = spot;
      context.fillRect(0, 0, 512, 256);
    }

    const texture = new THREE.CanvasTexture(envCanvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
    texture.dispose();

    const key = new THREE.DirectionalLight(0xfff2d8, 2.1);
    key.position.set(2.4, 3, 4);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x5fe5be, 1.25);
    rim.position.set(-3.5, 1.2, -2.6);
    scene.add(rim);

    const rim2 = new THREE.DirectionalLight(0x9bdc4c, 0.55);
    rim2.position.set(-1.2, -2.4, 1.8);
    scene.add(rim2);
    scene.add(new THREE.AmbientLight(0x1d3529, 0.7));

    const mark = buildLogoMark({ height: MARK_H, depth: 0.17, metalness: 0.92, roughness: 0.36 });
    const holder = new THREE.Group();
    holder.add(mark);
    scene.add(holder);

    const pivots = {
      leaf_main: mark.getObjectByName("pivot_leaf_main") as THREE.Group,
      leaf_bud: mark.getObjectByName("pivot_leaf_bud") as THREE.Group,
      leaf_fold: mark.getObjectByName("pivot_leaf_fold") as THREE.Group,
    };
    const home = Object.fromEntries(
      Object.entries(pivots).map(([keyName, pivot]) => [keyName, pivot.position.clone()]),
    ) as Record<PivotName, THREE.Vector3>;

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const fill = width / height > 1 ? 0.6 : 0.88;
      const dW = LOCK_W / fill / (2 * Math.tan(fov / 2) * camera.aspect);
      const dH = (MARK_H * 2.6) / (2 * Math.tan(fov / 2));
      camera.position.set(0, 0, Math.max(dW, dH));
      camera.updateProjectionMatrix();

      const ppw = height / (2 * camera.position.z * Math.tan(fov / 2));
      const wPx = WM_W * ppw;
      wordmarkEl.style.width = `${wPx}px`;
      wordmarkEl.style.left = `${width / 2 + WM_X * ppw - wPx / 2}px`;
      wordmarkEl.style.top = `${height / 2 - WM_Y * ppw - (WM_H * ppw) / 2}px`;
      ruleEl.style.width = `${LOCK_W * ppw}px`;
      ruleEl.style.top = `${height / 2 + MARK_H * 0.86 * ppw}px`;
    }

    function place(
      keyName: PivotName,
      from: { x: number; y: number; z: number; rx: number; ry: number; rz: number },
      progress: number,
    ) {
      const pivot = pivots[keyName];
      const target = home[keyName];
      pivot.position.set(
        lerp(target.x + from.x, target.x, progress),
        lerp(target.y + from.y, target.y, progress),
        lerp(from.z, 0, progress),
      );
      pivot.rotation.set(
        lerp(from.rx, 0, progress),
        lerp(from.ry, 0, progress),
        lerp(from.rz, 0, progress),
      );
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let finished = false;
    let running = true;

    const finish = () => {
      if (finished) return;
      finished = true;
      setDone(true);
      window.setTimeout(() => {
        running = false;
      }, 900);
    };

    function frame(now: number) {
      const t = reduced ? 3050 : now - start;
      place("leaf_main", { x: -4.2, y: 0.5, z: -1.6, rx: 0.2, ry: -1.5, rz: -0.55 }, outQuint(seg(t, 180, 1320)));
      place("leaf_fold", { x: 4.2, y: -0.5, z: -1.6, rx: -0.2, ry: 1.5, rz: 0.55 }, outQuint(seg(t, 300, 1440)));
      const bud = seg(t, 620, 1520);
      place("leaf_bud", { x: 0.1, y: 2.6, z: -0.4, rx: 1.3, ry: 0.5, rz: 0.4 }, bud > 0 ? outBack(bud) : 0);

      const spin = outCubic(seg(t, 180, 1700));
      mark.rotation.y = lerp(-0.62, 0, spin);
      mark.rotation.x = lerp(0.22, 0, spin);
      mark.scale.setScalar(lerp(0.86, 1, spin));
      key.position.x = lerp(-3.6, 3.2, inOut(seg(t, 1200, 2400)));

      holder.position.x = MARK_X * inOut(seg(t, 1500, 2320));
      const wordmarkProgress = outCubic(seg(t, 1680, 2500));
      wordmarkEl.style.opacity = String(wordmarkProgress);
      wordmarkEl.style.transform = `translateX(${lerp(-26, 0, wordmarkProgress)}px)`;

      if (t > 2200) ruleEl.style.transform = "translateX(-50%) scaleX(1)";
      if (t > 2320) {
        const d = (t - 2320) / 1000;
        mark.rotation.y = Math.sin(d * 0.8) * 0.05;
        mark.rotation.x = Math.sin(d * 0.6) * 0.02;
      }

      if (!finished && t >= 3200) finish();
      renderer.render(scene, camera);
      if (running) rafRef.current = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      scene.environment?.dispose();
    };
  }, []);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[radial-gradient(120%_90%_at_50%_24%,#16342B_0%,#103029_34%,#0B1F1A_72%,#07140F_100%)] transition-opacity duration-700">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <Image
        ref={wordmarkRef}
        src="/pgbl/assets/wordmark.png"
        alt="Phú Gia Bảo Lộc"
        width={1454}
        height={591}
        priority
        className="absolute left-0 top-0 opacity-0 drop-shadow-[0_6px_24px_rgba(0,0,0,.45)]"
      />
      <div
        ref={ruleRef}
        className="absolute left-1/2 h-px origin-center -translate-x-1/2 scale-x-0 bg-[linear-gradient(90deg,transparent,#9BDC4C,#5FE5BE,transparent)] transition-transform duration-1000"
      />
      <button
        type="button"
        onClick={() => setDone(true)}
        className="absolute bottom-6 right-7 z-10 cursor-pointer border-0 bg-transparent px-0 py-3 text-xs font-medium uppercase tracking-[0.22em] text-[#83A08D] transition-colors hover:text-[var(--pgbl-accent)] max-md:bottom-4 max-md:right-5"
      >
        Vào trang
      </button>
    </div>
  );
}
