"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { recentDisasters } from "@/data/disaster-data";
import { worldDisasters } from "@/data/world-disaster-data";

// === DISASTER DATA FOR GLOBE (VN + WORLD) ===
const VN_POINTS = recentDisasters.map((d) => ({
    lat: d.location.lat,
    lng: d.location.lng,
    type: d.type,
    severity: d.severity,
    label: `${d.location.province} — ${d.title}`,
    people: d.affectedPeople >= 1000000 ? `${(d.affectedPeople / 1000000).toFixed(1)}M` : d.affectedPeople >= 1000 ? `${(d.affectedPeople / 1000).toFixed(0)}K` : `${d.affectedPeople}`,
}));

const WORLD_POINTS = worldDisasters.slice(0, 20).map((d) => ({
    lat: d.location.lat,
    lng: d.location.lng,
    type: d.type,
    severity: d.severity,
    label: `${d.location.province} — ${d.title}`,
    people: d.affectedPeople >= 1000000 ? `${(d.affectedPeople / 1000000).toFixed(1)}M` : d.affectedPeople >= 1000 ? `${(d.affectedPeople / 1000).toFixed(0)}K` : `${d.affectedPeople}`,
}));

const DISASTER_POINTS = [...VN_POINTS, ...WORLD_POINTS];

const SEVERITY_COLORS: Record<string, string> = {
    critical: "#FF4757",
    high: "#FF6B6B",
    medium: "#FFB800",
    low: "#00D68F",
};

const TYPE_ICONS: Record<string, string> = {
    flood: "🌊",
    storm: "🌪️",
    landslide: "⛰️",
    drought: "☀️",
};

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// === EARTH GLOBE COMPONENT ===
function EarthGlobe() {
    const globeRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);

    // Create Earth texture procedurally
    const earthMaterial = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext("2d")!;

        // Ocean - deep blue
        const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
        oceanGrad.addColorStop(0, "#1a365d");
        oceanGrad.addColorStop(0.3, "#1e3a5f");
        oceanGrad.addColorStop(0.5, "#1a365d");
        oceanGrad.addColorStop(0.7, "#1e3a5f");
        oceanGrad.addColorStop(1, "#1a365d");
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, 1024, 512);

        // Grid lines (latitude/longitude) - subtle
        ctx.strokeStyle = "rgba(100, 180, 255, 0.08)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 18; i++) {
            ctx.beginPath();
            ctx.moveTo(0, (i * 512) / 18);
            ctx.lineTo(1024, (i * 512) / 18);
            ctx.stroke();
        }
        for (let i = 0; i < 36; i++) {
            ctx.beginPath();
            ctx.moveTo((i * 1024) / 36, 0);
            ctx.lineTo((i * 1024) / 36, 512);
            ctx.stroke();
        }

        // Landmasses - green/earth tone
        ctx.fillStyle = "rgba(34, 139, 34, 0.2)";
        ctx.strokeStyle = "rgba(34, 139, 34, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const continent1 = [[450, 100], [550, 90], [580, 130], [560, 200], [500, 220], [440, 180], [430, 130]];
        ctx.moveTo(continent1[0][0], continent1[0][1]);
        for (const [x, y] of continent1.slice(1)) ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(34, 139, 34, 0.15)";
        ctx.beginPath();
        const continent2 = [[700, 120], [800, 100], [850, 150], [830, 220], [760, 250], [710, 200], [690, 150]];
        ctx.moveTo(continent2[0][0], continent2[0][1]);
        for (const [x, y] of continent2.slice(1)) ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(34, 139, 34, 0.12)";
        ctx.beginPath();
        const continent3 = [[300, 200], [380, 180], [420, 230], [400, 300], [340, 320], [280, 280], [290, 230]];
        ctx.moveTo(continent3[0][0], continent3[0][1]);
        for (const [x, y] of continent3.slice(1)) ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(34, 139, 34, 0.12)";
        ctx.beginPath();
        const continent4 = [[150, 250], [220, 230], [260, 280], [240, 340], [180, 350], [140, 310], [145, 270]];
        ctx.moveTo(continent4[0][0], continent4[0][1]);
        for (const [x, y] of continent4.slice(1)) ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(34, 139, 34, 0.12)";
        ctx.beginPath();
        const continent5 = [[800, 280], [870, 260], [900, 310], [880, 370], [830, 380], [790, 340], [795, 300]];
        ctx.moveTo(continent5[0][0], continent5[0][1]);
        for (const [x, y] of continent5.slice(1)) ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Vietnam landmass — bright highlight
        ctx.fillStyle = "rgba(0, 180, 100, 0.45)";
        ctx.strokeStyle = "rgba(0, 255, 136, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // Vietnam coordinates mapped to texture
        const vnPoints = [
            [620, 120], [625, 130], [630, 140], [628, 155], [625, 170],
            [620, 185], [618, 200], [615, 215], [620, 230], [625, 245],
            [630, 260], [628, 275], [622, 290], [618, 305], [615, 320],
            [620, 335], [625, 350], [618, 365], [610, 370], [605, 360],
            [612, 345], [615, 330], [610, 315], [608, 300], [612, 285],
            [615, 270], [610, 255], [605, 240], [610, 225], [612, 210],
            [615, 195], [618, 180], [620, 165], [618, 150], [615, 135],
            [618, 125],
        ];
        ctx.moveTo(vnPoints[0][0], vnPoints[0][1]);
        for (const [x, y] of vnPoints.slice(1)) {
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Other landmasses (simplified)
        const otherLands = [
            { points: [[450, 100], [550, 90], [580, 130], [560, 200], [500, 220], [440, 180], [430, 130]], color: "rgba(0, 102, 255, 0.15)" },
            { points: [[700, 120], [800, 100], [850, 150], [830, 220], [760, 250], [710, 200], [690, 150]], color: "rgba(0, 102, 255, 0.15)" },
            { points: [[300, 200], [380, 180], [420, 230], [400, 300], [340, 320], [280, 280], [290, 230]], color: "rgba(0, 102, 255, 0.12)" },
            { points: [[150, 250], [220, 230], [260, 280], [240, 340], [180, 350], [140, 310], [145, 270]], color: "rgba(0, 102, 255, 0.12)" },
            { points: [[800, 280], [870, 260], [900, 310], [880, 370], [830, 380], [790, 340], [795, 300]], color: "rgba(0, 102, 255, 0.12)" },
        ];

        for (const land of otherLands) {
            ctx.fillStyle = land.color;
            ctx.strokeStyle = "rgba(0, 102, 255, 0.2)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(land.points[0][0], land.points[0][1]);
            for (const [x, y] of land.points.slice(1)) {
                ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        return new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            shininess: 25,
        });
    }, []);

    useFrame((state) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.001;
        }
        if (atmosphereRef.current) {
            atmosphereRef.current.rotation.y += 0.0008;
        }
    });

    return (
        <group>
            {/* Earth sphere */}
            <mesh ref={globeRef} material={earthMaterial}>
                <sphereGeometry args={[2, 64, 64]} />
            </mesh>

            {/* Atmosphere glow */}
            <mesh ref={atmosphereRef} scale={1.02}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshPhongMaterial
                    color="#0066FF"
                    transparent
                    opacity={0.05}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Outer glow */}
            <mesh scale={1.08}>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial
                    color="#0066FF"
                    transparent
                    opacity={0.02}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

// === DISASTER MARKERS ===
function DisasterMarker({
    position,
    color,
    severity,
    label,
    people,
    type,
}: {
    position: THREE.Vector3;
    color: string;
    severity: string;
    label: string;
    people: string;
    type: string;
}) {
    const markerRef = useRef<THREE.Group>(null);
    const pulseRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (pulseRef.current) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
            pulseRef.current.scale.set(scale, scale, scale);
            (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
                0.6 - Math.sin(state.clock.elapsedTime * 3) * 0.4;
        }
    });

    return (
        <group
            ref={markerRef}
            position={position}
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
        >
            {/* Marker dot */}
            <mesh>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Pulse ring */}
            <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.05, 0.08, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            {/* Beam */}
            <mesh position={[0, 0.15, 0]}>
                <cylinderGeometry args={[0.003, 0.003, 0.3, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} />
            </mesh>

            {/* Hover info */}
            {hovered && (
                <Html position={[0, 0.35, 0]} center distanceFactor={5}>
                    <div className="pointer-events-none px-3 py-2 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl min-w-[160px]"
                        style={{ transform: "scale(0.8)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span>{type === "flood" ? "🌊" : type === "storm" ? "🌪️" : type === "landslide" ? "⛰️" : "☀️"}</span>
                            <span className="text-[11px] font-bold text-[#0F172A]">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                style={{ background: `${color}15`, color }}>
                                {severity === "critical" ? "KHẨN CẤP" : severity === "high" ? "NGUY HIỂM" : "CẢNH BÁO"}
                            </span>
                            <span className="text-[9px] text-slate-500">{people} người</span>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

// === ATMOSPHERE PARTICLES ===
function AtmosphereParticles() {
    const particlesRef = useRef<THREE.Points>(null);
    const count = 2000;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.1 + Math.random() * 0.3;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return pos;
    }, []);

    useFrame((state) => {
        if (particlesRef.current) {
            particlesRef.current.rotation.y += 0.0005;
        }
    });

    const geom = useMemo(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        return g;
    }, [positions]);

    return (
        <points ref={particlesRef} geometry={geom}>
            <pointsMaterial
                color="#0066FF"
                size={0.008}
                transparent
                opacity={0.4}
                sizeAttenuation
            />
        </points>
    );
}

// === CONNECTION ARCS (Data Flow) ===
function ConnectionArc({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
    const lineObj = useMemo(() => {
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(2.5);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const pts = curve.getPoints(50);
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 });
        return new THREE.Line(geom, mat);
    }, [start, end, color]);

    return <primitive object={lineObj} />;
}

// === SCENE ===
function GlobeScene() {
    const positions = useMemo(() =>
        DISASTER_POINTS.map((p) => latLngToVector3(p.lat, p.lng, 2.01)),
        []
    );

    return (
        <>
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
            <pointLight position={[-5, -3, -5]} intensity={0.2} color="#0066FF" />

            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

            <EarthGlobe />
            <AtmosphereParticles />

            {DISASTER_POINTS.map((point, i) => (
                <DisasterMarker
                    key={i}
                    position={positions[i]}
                    color={SEVERITY_COLORS[point.severity]}
                    severity={point.severity}
                    label={point.label}
                    people={point.people}
                    type={point.type}
                />
            ))}

            {/* Connection arcs between disasters */}
            {positions.length > 1 && (
                <>
                    <ConnectionArc start={positions[0]} end={positions[1]} color="#0066FF" />
                    <ConnectionArc start={positions[2]} end={positions[4]} color="#FF6B6B" />
                    <ConnectionArc start={positions[5]} end={positions[6]} color="#FFB800" />
                </>
            )}

            <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={3}
                maxDistance={8}
                autoRotate
                autoRotateSpeed={0.3}
                enableDamping
                dampingFactor={0.05}
            />
        </>
    );
}

// === MAIN COMPONENT ===
export default function DisasterGlobe3D() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            {/* Background aurora */}
            <div className="absolute inset-0 bg-aurora" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[200px]" />

            <div className="max-w-7xl mx-auto relative">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">
                        🌍 Giám sát Toàn cầu
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        Bản đồ Thiên tai <span className="text-gradient-flow">Thời gian Thực</span>
                    </h2>
                    <p className="text-base text-slate-600 max-w-xl mx-auto">
                        Kéo để xoay • Click marker để xem chi tiết • Cuộn để zoom
                    </p>
                </motion.div>

                {/* 3D Globe */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mx-auto"
                    style={{ height: "65vh", maxHeight: "700px", maxWidth: "1000px" }}
                >
                    <Canvas
                        camera={{ position: [0, 0, 5], fov: 45 }}
                        style={{ borderRadius: "24px" }}
                        dpr={[1, 2]}
                    >
                        <GlobeScene />
                    </Canvas>

                    {/* Overlay gradient edges */}
                    <div className="absolute inset-0 pointer-events-none rounded-3xl"
                        style={{
                            boxShadow: "inset 0 0 60px rgba(0, 102, 255, 0.05)",
                        }}
                    />

                    {/* Corner stats */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-700">8 sự kiện đang hoạt động</span>
                    </div>

                    <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500">Dữ liệu: Open-Meteo • USGS • ReliefWeb</span>
                    </div>
                </motion.div>

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-4 mt-8"
                >
                    {[
                        { color: "#FF4757", label: "Khẩn cấp" },
                        { color: "#FF6B6B", label: "Nguy hiểm" },
                        { color: "#FFB800", label: "Cảnh báo" },
                        { color: "#00D68F", label: "Theo dõi" },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[11px] text-slate-600 font-medium">{item.label}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}