"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only on desktop
    if (window.matchMedia("(max-width: 768px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const glow = glowRef.current;
    if (!glow) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      // Spring physics - smooth follow
      const damping = 0.12;
      currentX += (mouseX - currentX) * damping;
      currentY += (mouseY - currentY) * damping;

      glow.style.transform = `translate(${currentX - 150}px, ${currentY - 150}px)`;
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none z-[9999] opacity-0 transition-opacity duration-300"
      style={{
        background: "radial-gradient(circle, rgba(3,105,161,0.06) 0%, transparent 70%)",
        mixBlendMode: "screen",
        willChange: "transform",
      }}
      onMouseEnter={() => {
        if (glowRef.current) glowRef.current.style.opacity = "1";
      }}
    />
  );
}