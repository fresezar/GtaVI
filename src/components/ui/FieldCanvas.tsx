"use client";

import { useEffect, useRef } from "react";

/**
 * The live backdrop of the dark theme: slowly drifting topographic contours over a survey dot grid that
 * warms up around the pointer. Low contrast on purpose; it should feel alive, never compete with content.
 *
 * Cheap by design: contours are recomputed ~12 times a second on a coarse grid (marching squares over a
 * two-octave value noise), pixel density is capped, it stops while the tab is hidden, and with
 * prefers-reduced-motion it draws one still frame and never animates.
 */
const CELL = 26; // px between noise samples
const LEVELS = [0.28, 0.38, 0.48, 0.58, 0.68];
const DOT_GAP = 28;
const FPS = 12;

function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function valueNoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const field = (x: number, y: number, t: number) => 0.65 * valueNoise(x * 0.11 + t, y * 0.11 - t * 0.6) + 0.35 * valueNoise(x * 0.27 - t * 0.8, y * 0.27 + 11);

export default function FieldCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1;
    let pointer = { x: -9999, y: -9999 };
    let target = { x: -9999, y: -9999 };
    let raf = 0, last = 0, t = Math.random() * 100;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Survey grid: faint dots, warmer within reach of the pointer.
      for (let y = DOT_GAP / 2; y < h; y += DOT_GAP)
        for (let x = DOT_GAP / 2; x < w; x += DOT_GAP) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          const near = Math.max(0, 1 - d / 220);
          ctx.fillStyle = near > 0 ? `rgba(240,164,58,${0.07 + near * 0.45})` : "rgba(232,226,214,0.05)";
          ctx.fillRect(x - 0.6, y - 0.6, 1.2 + near * 1.2, 1.2 + near * 1.2);
        }
      // Contours (marching squares).
      const cols = Math.ceil(w / CELL) + 1, rows = Math.ceil(h / CELL) + 1;
      const v = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i, j, t);
      LEVELS.forEach((lv, k) => {
        ctx.beginPath();
        for (let j = 0; j < rows - 1; j++)
          for (let i = 0; i < cols - 1; i++) {
            const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
            const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            const x = i * CELL, y = j * CELL;
            const top = [x + ((lv - a) / (b - a)) * CELL, y];
            const right = [x + CELL, y + ((lv - b) / (c - b)) * CELL];
            const bottom = [x + ((lv - d) / (c - d)) * CELL, y + CELL];
            const left = [x, y + ((lv - a) / (d - a)) * CELL];
            const seg = (p: number[], q: number[]) => {
              ctx.moveTo(p[0], p[1]);
              ctx.lineTo(q[0], q[1]);
            };
            switch (idx) {
              case 1: case 14: seg(left, bottom); break;
              case 2: case 13: seg(bottom, right); break;
              case 3: case 12: seg(left, right); break;
              case 4: case 11: seg(top, right); break;
              case 6: case 9: seg(top, bottom); break;
              case 7: case 8: seg(left, top); break;
              case 5: seg(left, top); seg(bottom, right); break;
              case 10: seg(top, right); seg(left, bottom); break;
            }
          }
        // The middle contour is the "index line", a touch brighter, as on a survey map.
        ctx.strokeStyle = k === 2 ? "rgba(232,226,214,0.085)" : "rgba(232,226,214,0.045)";
        ctx.lineWidth = k === 2 ? 1.1 : 0.8;
        ctx.stroke();
      });
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // Ease the glow towards the pointer every frame; recompute contours at FPS.
      pointer.x += (target.x - pointer.x) * 0.12;
      pointer.y += (target.y - pointer.y) * 0.12;
      if (now - last < 1000 / FPS) return;
      if (!canvas.offsetParent) return; // hidden (Vice theme): no work at all
      t += (now - last) / 1000 / 38;
      last = now;
      draw();
    };

    resize();
    draw();
    const onMove = (e: PointerEvent) => {
      target = { x: e.clientX, y: e.clientY };
      if (pointer.x < -999) pointer = { ...target };
      if (still) draw();
    };
    const onLeave = () => (target = { x: -9999, y: -9999 });
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    if (!still) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0" />;
}
