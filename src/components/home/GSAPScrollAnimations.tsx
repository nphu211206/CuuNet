"use client";

import { useEffect, useRef } from "react";

/**
 * GSAP Scroll Animations
 * Adds scroll-triggered animations to elements with data attributes
 * 
 * Usage:
 *   data-gsap="fade-up" — Fade up from bottom
 *   data-gsap="fade-in" — Fade in
 *   data-gsap="scale-in" — Scale in from 0.9
 *   data-gsap="slide-left" — Slide from left
 *   data-gsap="slide-right" — Slide from right
 *   data-gsap-delay="0.2" — Custom delay
 */

export default function GSAPScrollAnimations() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Dynamic import GSAP
        const loadGSAP = async () => {
            try {
                const gsapModule = await import("gsap");
                const gsap = gsapModule.default || gsapModule.gsap;

                // Check if ScrollTrigger is available
                let ScrollTrigger: any;
                try {
                    const scrollTriggerModule = await import("gsap/ScrollTrigger");
                    ScrollTrigger = scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
                    gsap.registerPlugin(ScrollTrigger);
                } catch {
                    console.warn("[GSAP] ScrollTrigger not available, using IntersectionObserver fallback");
                    // Fallback to IntersectionObserver
                    setupIntersectionObserver();
                    return;
                }

                // Animate elements with data-gsap attribute
                const elements = document.querySelectorAll("[data-gsap]");

                elements.forEach((el) => {
                    const type = el.getAttribute("data-gsap");
                    const delay = parseFloat(el.getAttribute("data-gsap-delay") || "0");

                    const fromVars: any = { opacity: 0, duration: 0.8, delay };
                    const scrollVars: any = {
                        scrollTrigger: {
                            trigger: el,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    };

                    switch (type) {
                        case "fade-up":
                            fromVars.y = 40;
                            gsap.from(el, { ...fromVars, ...scrollVars, ease: "power3.out" });
                            break;
                        case "fade-in":
                            gsap.from(el, { ...fromVars, ...scrollVars, ease: "power2.out" });
                            break;
                        case "scale-in":
                            fromVars.scale = 0.9;
                            gsap.from(el, { ...fromVars, ...scrollVars, ease: "back.out(1.7)" });
                            break;
                        case "slide-left":
                            fromVars.x = -60;
                            gsap.from(el, { ...fromVars, ...scrollVars, ease: "power3.out" });
                            break;
                        case "slide-right":
                            fromVars.x = 60;
                            gsap.from(el, { ...fromVars, ...scrollVars, ease: "power3.out" });
                            break;
                        default:
                            gsap.from(el, { ...fromVars, ...scrollVars, ease: "power2.out" });
                    }
                });

                // Parallax effect for hero section
                const heroSection = document.querySelector("[data-gsap-parallax]");
                if (heroSection) {
                    gsap.to(heroSection, {
                        y: -50,
                        ease: "none",
                        scrollTrigger: {
                            trigger: heroSection,
                            start: "top top",
                            end: "bottom top",
                            scrub: 1,
                        },
                    });
                }

                // Stagger animation for cards
                const cardGroups = document.querySelectorAll("[data-gsap-stagger]");
                cardGroups.forEach((group) => {
                    const children = group.children;
                    gsap.from(children, {
                        opacity: 0,
                        y: 30,
                        stagger: 0.1,
                        duration: 0.6,
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: group,
                            start: "top 85%",
                            toggleActions: "play none none reverse",
                        },
                    });
                });

            } catch (err) {
                console.warn("[GSAP] Failed to load:", err);
                setupIntersectionObserver();
            }
        };

        // Fallback: IntersectionObserver for scroll animations
        function setupIntersectionObserver() {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("visible");
                        }
                    });
                },
                { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
            );

            document.querySelectorAll(".scroll-fade-up, .scroll-fade-in, .scroll-scale-in").forEach((el) => {
                observer.observe(el);
            });
        }

        loadGSAP();

        // Cleanup
        return () => {
            // GSAP cleanup is handled internally
        };
    }, []);

    return null;
}