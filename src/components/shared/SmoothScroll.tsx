"use client";

import { useEffect, useRef, ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// ================================================================
// PARALLAX SECTION — Scroll-driven parallax effect
// ================================================================

export function ParallaxSection({ children, speed = 0.5, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);
  const springY = useSpring(y, { stiffness: 100, damping: 30, mass: 0.5 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y: springY }}>
        {children}
      </motion.div>
    </div>
  );
}

// ================================================================
// SCROLL REVEAL — Staggered reveal on scroll
// ================================================================

export function ScrollRevealEnhanced({
  children,
  direction = "up",
  delay = 0,
  duration = 0.7,
  distance = 40,
  className = "",
  once = true,
}: {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
}) {
  const directionMap = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  };

  const offset = directionMap[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ================================================================
// STAGGER CHILDREN — Container that staggers child animations
// ================================================================

export function StaggerContainer({ children, staggerDelay = 0.08, className = "" }: { children: ReactNode; staggerDelay?: number; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: staggerDelay, delayChildren: 0.1 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ================================================================
// STAGGER ITEM — Child item for StaggerContainer
// ================================================================

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ================================================================
// COUNTER ANIMATION — Animated number counter
// ================================================================

export function AnimatedNumber({ value, duration = 2, prefix = "", suffix = "", className = "" }: { value: number; duration?: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isInView.current) {
          isInView.current = true;
          animateCounter();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  function animateCounter() {
    if (!ref.current) return;
    const start = 0;
    const end = value;
    const startTime = performance.now();

    function update(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);

      if (ref.current) {
        ref.current.textContent = `${prefix}${current.toLocaleString("vi-VN")}${suffix}`;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}

// ================================================================
// FLOATING ELEMENT — Subtle floating animation
// ================================================================

export function FloatingElement({ children, duration = 6, distance = 10, className = "" }: { children: ReactNode; duration?: number; distance?: number; className?: string }) {
  return (
    <motion.div
      animate={{ y: [-distance, distance, -distance] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ================================================================
// SCALE ON SCROLL — Element scales based on scroll position
// ================================================================

export function ScaleOnScroll({ children, from = 0.8, to = 1, className = "" }: { children: ReactNode; from?: number; to?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [from, to]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);

  return (
    <motion.div ref={ref} style={{ scale, opacity }} className={className}>
      {children}
    </motion.div>
  );
}

// ================================================================
// TEXT REVEAL — Word-by-word text reveal
// ================================================================

export function TextReveal({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");

  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`inline-block ${className}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { delay: delay + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            },
          }}
          className="inline-block mr-[0.3em]"
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ================================================================
// GRADIENT FLOW — Animated gradient background
// ================================================================

export function GradientFlow({
  colors = ["#0066FF", "#00C9A7", "#0066FF"],
  duration = 8,
  className = "",
}: { colors?: string[]; duration?: number; className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${colors.join(", ")})`,
        backgroundSize: "400% 400%",
      }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    />
  );
}

// ================================================================
// MOUSE GLOW — Glow effect following mouse
// ================================================================

export function MouseGlow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-30 ${className}`}
      style={{
        background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,102,255,0.04), transparent 40%)",
      }}
    />
  );
}