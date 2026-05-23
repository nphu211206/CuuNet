"use client";

import { useEffect, useRef, useState } from "react";

interface HeroVideoProps {
  posterSrc: string;
  videoSrc?: string;
  children: React.ReactNode;
}

export default function HeroVideo({ posterSrc, videoSrc, children }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
  }, []);

  return (
    <section className="relative overflow-hidden min-h-[100vh] flex items-center">
      {/* Background layers */}
      <div className="absolute inset-0">
        {/* Video or fallback image */}
        {videoSrc && !prefersReducedMotion ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
            autoPlay
            muted
            loop
            playsInline
            poster={posterSrc}
            onLoadedData={() => setLoaded(true)}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : null}

        {/* Fallback image (always rendered, video overlays when loaded) */}
        <img
          src={posterSrc}
          alt="Vietnam disaster response"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${loaded && videoSrc && !prefersReducedMotion ? "opacity-0" : "opacity-100"}`}
          loading="eager"
          fetchPriority="high"
        />

        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-slate-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-slate-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />

        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-[100px] animate-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-cyan-600/5 blur-[80px] animate-pulse" style={{ animationDelay: "3s" }} />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')" }}
      />

      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </section>
  );
}
