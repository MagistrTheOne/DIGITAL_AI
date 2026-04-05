"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Node = { x: number; y: number; vx: number; vy: number; r: number };

/** Drifting gray neurons (left → right); pointer deflects them without capturing clicks. */
export function LandingHeroNeuronLayer({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointerRef = React.useRef({ x: -99999, y: -99999 });
  const nodesRef = React.useRef<Node[] | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);
      const { clientWidth, clientHeight } = canvas;
      if (clientWidth < 2 || clientHeight < 2) return;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    const initNodes = (cw: number, ch: number) => {
      const count = Math.min(56, Math.floor((cw * ch) / 18000) + 28);
      nodesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * cw,
        y: Math.random() * ch,
        vx: 0.35 + Math.random() * 0.85,
        vy: (Math.random() - 0.5) * 0.2,
        r: 1.1 + Math.random() * 2.4,
      }));
    };

    let raf = 0;
    const tick = () => {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw < 2 || ch < 2) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!nodesRef.current || nodesRef.current.length === 0) initNodes(cw, ch);

      const rect = canvas.getBoundingClientRect();
      const ptr = pointerRef.current;
      const lx = ptr.x - rect.left;
      const ly = ptr.y - rect.top;

      ctx.clearRect(0, 0, cw, ch);
      const nodes = nodesRef.current!;

      for (const p of nodes) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > cw + 24) p.x = -24;
        if (p.y < -24) p.y = ch + 24;
        if (p.y > ch + 24) p.y = -24;

        const dx = p.x - lx;
        const dy = p.y - ly;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 100) {
          const f = ((100 - dist) / 100) ** 1.4;
          p.x += (dx / dist) * f * 3.2;
          p.y += (dy / dist) * f * 3.2;
        }
      }

      ctx.strokeStyle = "rgba(115,115,115,0.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!;
          const b = nodes[j]!;
          const ddx = a.x - b.x;
          const ddy = a.y - b.y;
          if (ddx * ddx + ddy * ddy < 48 * 48) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const p of nodes) {
        ctx.fillStyle = "rgba(163,163,163,0.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] h-full w-full",
        className,
      )}
      aria-hidden
    />
  );
}
