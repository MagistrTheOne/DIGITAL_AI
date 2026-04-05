"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { landingPointerRef } from "@/components/landing/landingPointer";

const BG = "#000000";

function buildNeuralGraph(pointCount: number, linkRadius: number, seed = 1) {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const positions = new Float32Array(pointCount * 3);
  for (let i = 0; i < pointCount; i++) {
    positions[i * 3] = (rnd() - 0.5) * 12;
    positions[i * 3 + 1] = (rnd() - 0.5) * 12;
    positions[i * 3 + 2] = (rnd() - 0.5) * 10;
  }

  const lineVerts: number[] = [];
  const r2 = linkRadius * linkRadius;
  for (let i = 0; i < pointCount; i++) {
    const ix = i * 3;
    const x0 = positions[ix];
    const y0 = positions[ix + 1];
    const z0 = positions[ix + 2];
    for (let j = i + 1; j < pointCount; j++) {
      const jx = j * 3;
      const dx = x0 - positions[jx];
      const dy = y0 - positions[jx + 1];
      const dz = z0 - positions[jx + 2];
      if (dx * dx + dy * dy + dz * dz <= r2) {
        lineVerts.push(
          x0,
          y0,
          z0,
          positions[jx],
          positions[jx + 1],
          positions[jx + 2],
        );
      }
    }
  }

  return {
    points: positions,
    lines: new Float32Array(lineVerts),
  };
}

function buildMicroField(count: number, spread: number, seed = 99) {
  let s = seed;
  const rnd = () => {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rnd() - 0.5) * spread;
    positions[i * 3 + 1] = (rnd() - 0.5) * spread;
    positions[i * 3 + 2] = (rnd() - 0.5) * spread * 0.6;
  }
  return positions;
}

function NeuralScene() {
  const groupRef = useRef<THREE.Group>(null);
  const microRef = useRef<THREE.Points>(null);
  const fiberRef = useRef<THREE.LineSegments>(null);
  const { pointer } = useThree();

  const { pointGeo, lineGeo, microGeo, fiberGeo } = useMemo(() => {
    const { points, lines } = buildNeuralGraph(128, 1.25, 7);
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(points, 3));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(lines, 3));

    const micro = buildMicroField(420, 18, 101);
    const mg = new THREE.BufferGeometry();
    mg.setAttribute("position", new THREE.BufferAttribute(micro, 3));

    const fiberVerts: number[] = [];
    const fc = 180;
    for (let i = 0; i < fc; i++) {
      const x1 = (Math.sin(i * 1.7) * 8 + Math.cos(i * 0.31) * 3) * 0.45;
      const y1 = (Math.cos(i * 1.1) * 7 + Math.sin(i * 0.47) * 4) * 0.45;
      const z1 = (Math.sin(i * 0.73) * 5) * 0.35;
      const len = 0.35 + (i % 7) * 0.06;
      const x2 = x1 + (Math.cos(i) * len) / 3;
      const y2 = y1 + (Math.sin(i * 0.9) * len) / 3;
      const z2 = z1 + (Math.cos(i * 0.4) * len) / 4;
      fiberVerts.push(x1, y1, z1, x2, y2, z2);
    }
    const fg = new THREE.BufferGeometry();
    fg.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(fiberVerts), 3),
    );

    return {
      pointGeo: pg,
      lineGeo: lg,
      microGeo: mg,
      fiberGeo: fg,
    };
  }, []);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (g) {
      const wx = landingPointerRef.current.x;
      const wy = landingPointerRef.current.y;
      const tx = pointer.x * 0.14 + wx * 0.2;
      const ty = pointer.y * 0.1 + wy * 0.16;
      g.rotation.y += (tx - g.rotation.y) * 0.05;
      g.rotation.x += (ty - g.rotation.x) * 0.05;
      g.rotation.y += dt * 0.012;
    }

    const micro = microRef.current;
    if (micro) {
      const mx = landingPointerRef.current.x * 0.55;
      const my = landingPointerRef.current.y * 0.42;
      micro.rotation.z = THREE.MathUtils.lerp(micro.rotation.z, mx * 0.25, 0.06);
      micro.rotation.x = THREE.MathUtils.lerp(micro.rotation.x, my * -0.2, 0.06);
      micro.position.x = THREE.MathUtils.lerp(micro.position.x, mx * 0.35, 0.04);
      micro.position.y = THREE.MathUtils.lerp(micro.position.y, my * 0.28, 0.04);
    }

    const fib = fiberRef.current;
    if (fib) {
      fib.rotation.z += dt * 0.04 + landingPointerRef.current.x * 0.02 * dt;
      fib.rotation.y -= dt * 0.018;
    }
  });

  return (
    <group ref={groupRef}>
      <points ref={microRef} geometry={microGeo}>
        <pointsMaterial
          color="#737373"
          size={0.018}
          sizeAttenuation
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={fiberRef} geometry={fiberGeo}>
        <lineBasicMaterial
          color="#525252"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </lineSegments>
      <points geometry={pointGeo}>
        <pointsMaterial
          color="#a3a3a3"
          size={0.038}
          sizeAttenuation
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </points>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color="#525252"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

export function NeuralFieldBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      landingPointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      landingPointerRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ backgroundColor: BG }}
      aria-hidden
    >
      {mounted ? (
        <Canvas
          camera={{ position: [0, 0, 14], fov: 50 }}
          gl={{ alpha: false, antialias: true }}
          dpr={[1, 2]}
          style={{ background: BG }}
        >
          <color attach="background" args={[BG]} />
          <NeuralScene />
        </Canvas>
      ) : null}
    </div>
  );
}
