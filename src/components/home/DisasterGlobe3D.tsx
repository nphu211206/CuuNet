"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { recentDisasters } from "@/data/disaster-data";
import { worldDisasters } from "@/data/world-disaster-data";

// === DISASTER DATA ===
const VN_POINTS = recentDisasters.map((d) => ({
    lat: d.location.lat,
    lng: d.location.lng,
    type: d.type,
    severity: d.severity,
    label: `${d.location.province} — ${d.title}`,
    people: d.affectedPeople >= 1000000
        ? `${(d.affectedPeople / 1000000).toFixed(1)}M`
        : d.affectedPeople >= 1000
            ? `${(d.affectedPeople / 1000).toFixed(0)}K`
            : `${d.affectedPeople}`,
}));

const WORLD_POINTS = worldDisasters.slice(0, 15).map((d) => ({
    lat: d.location.lat,
    lng: d.location.lng,
    type: d.type,
    severity: d.severity,
    label: `${d.location.province} — ${d.title}`,
    people: d.affectedPeople >= 1000000
        ? `${(d.affectedPeople / 1000000).toFixed(1)}M`
        : d.affectedPeople >= 1000
            ? `${(d.affectedPeople / 1000).toFixed(0)}K`
            : `${d.affectedPeople}`,
}));

const ALL_POINTS = [...VN_POINTS, ...WORLD_POINTS];

const SEVERITY_COLORS: Record<string, string> = {
    critical: "#FF4757",
    high: "#FF6B6B",
    medium: "#FFB800",
    low: "#00D68F",
};

// Convert lat/lng to 3D position
function latLngToVector3(lat: number, lng: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}

// === EARTH GLOBE WITH NASA TEXTURES ===
function Earth() {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);

    const dayTexture = useMemo(() => {
        const loader = new THREE.TextureLoader();
        const tex = loader.load("/images/earth-day.jpg");
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, []);

    const nightTexture = useMemo(() => {
        const loader = new THREE.TextureLoader();
        const tex = loader.load("/images/earth-night.jpg");
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, []);

    const topoTexture = useMemo(() => {
        const loader = new THREE.TextureLoader();
        return loader.load("/images/earth-topology.png");
    }, []);

    // Custom shader for day/night blending
    const earthMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                dayMap: { value: dayTexture },
                nightMap: { value: nightTexture },
                sunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D dayMap;
                uniform sampler2D nightMap;
                uniform vec3 sunDirection;
                varying vec2 vUv;
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    vec3 dayColor = texture2D(dayMap, vUv).rgb;
                    vec3 nightColor = texture2D(nightMap, vUv).rgb;
                    float sunDot = dot(vNormal, sunDirection);
                    float mixFactor = smoothstep(-0.1, 0.3, sunDot);
                    vec3 color = mix(nightColor * 1.2, dayColor, mixFactor);
                    // Add subtle rim light
                    vec3 viewDir = normalize(-vPosition);
                    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
                    color += vec3(0.1, 0.2, 0.4) * pow(rim, 3.0) * 0.3;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
        });
    }, [dayTexture, nightTexture]);

    useFrame((state) => {
        if (earthRef.current) {
            earthRef.current.rotation.y += 0.001;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += 0.0008;
        }
    });

    return (
        <group>
            {/* Earth with day/night shader */}
            <mesh ref={earthRef} material={earthMaterial}>
                <sphereGeometry args={[2, 64, 64]} />
            </mesh>

            {/* Cloud layer */}
            <mesh ref={cloudsRef} scale={1.005}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshPhongMaterial
                    map={topoTexture}
                    transparent
                    opacity={0.15}
                    depthWrite={false}
                />
            </mesh>

            {/* Atmosphere inner glow */}
            <mesh scale={1.02}>
                <sphereGeometry args={[2, 64, 64]} />
                <meshBasicMaterial
                    color="#4A90D9"
                    transparent
                    opacity={0.08}
                    side={THREE.BackSide}
                />
            </mesh>

            {/* Atmosphere outer glow */}
            <mesh scale={1.08}>
                <sphereGeometry args={[2, 32, 32]} />
                <meshBasicMaterial
                    color="#88C0F0"
                    transparent
                    opacity={0.04}
                    side={THREE.BackSide}
                />
            </mesh>
        </group>
    );
}

// === DISASTER MARKER ===
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
    const pulseRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (pulseRef.current) {
            const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
            pulseRef.current.scale.set(s, s, s);
            (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
                0.5 - Math.sin(state.clock.elapsedTime * 3) * 0.3;
        }
    });

    const icon = type === "flood" ? "🌊" : type === "storm" ? "🌪️" : type === "landslide" ? "⛰️" : type === "drought" ? "☀️" : "🏔️";

    return (
        <group position={position}>
            {/* Dot */}
            <mesh>
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* Pulse ring */}
            <mesh ref={pulseRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.04, 0.07, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            {/* Vertical beam */}
            <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.24, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.35} />
            </mesh>

            {/* Hover area */}
            <mesh
                visible={false}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Tooltip */}
            {hovered && (
                <Html position={[0, 0.35, 0]} center distanceFactor={5}>
                    <div className="pointer-events-none px-3 py-2 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl min-w-[170px]"
                        style={{ transform: "scale(0.8)" }}>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{icon}</span>
                            <span className="text-[11px] font-bold text-slate-900 leading-tight">{label}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
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

// === CONNECTION ARCS ===
function ConnectionArc({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
    const lineObj = useMemo(() => {
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(2.4);
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const pts = curve.getPoints(50);
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.12 });
        return new THREE.Line(geom, mat);
    }, [start, end, color]);

    return <primitive object={lineObj} />;
}

// === ATMOSPHERE PARTICLES ===
function Particles() {
    const ref = useRef<THREE.Points>(null);
    const geom = useMemo(() => {
        const count = 1500;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = 2.15 + Math.random() * 0.25;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi);
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        return g;
    }, []);

    useFrame(() => {
        if (ref.current) ref.current.rotation.y += 0.0003;
    });

    return (
        <points ref={ref} geometry={geom}>
            <pointsMaterial color="#88C0F0" size={0.006} transparent opacity={0.35} sizeAttenuation />
        </points>
    );
}

// === SCENE ===
function GlobeScene() {
    const markerPositions = useMemo(
        () => ALL_POINTS.map((p) => latLngToVector3(p.lat, p.lng, 2.02)),
        []
    );

    return (
        <>
            <ambientLight intensity={0.15} />
            <directionalLight position={[5, 3, 5]} intensity={1.2} color="#ffffff" />
            <pointLight position={[-5, -3, -5]} intensity={0.15} color="#4A90D9" />

            <Earth />
            <Particles />

            {ALL_POINTS.map((point, i) => (
                <DisasterMarker
                    key={i}
                    position={markerPositions[i]}
                    color={SEVERITY_COLORS[point.severity]}
                    severity={point.severity}
                    label={point.label}
                    people={point.people}
                    type={point.type}
                />
            ))}

            {/* Connection arcs */}
            {markerPositions.length > 6 && (
                <>
                    <ConnectionArc start={markerPositions[0]} end={markerPositions[1]} color="#3B82F6" />
                    <ConnectionArc start={markerPositions[2]} end={markerPositions[4]} color="#FF6B6B" />
                    <ConnectionArc start={markerPositions[5]} end={markerPositions[6]} color="#FFB800" />
                </>
            )}

            <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={3.5}
                maxDistance={8}
                autoRotate
                autoRotateSpeed={0.25}
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
            <div className="absolute inset-0 bg-aurora" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[200px]" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
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
                        Kéo để xoay • Hover marker để xem chi tiết • Cuộn để zoom
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

                    <div className="absolute inset-0 pointer-events-none rounded-3xl"
                        style={{ boxShadow: "inset 0 0 60px rgba(0, 102, 255, 0.05)" }}
                    />

                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-700">{ALL_POINTS.length} sự kiện đang theo dõi</span>
                    </div>

                    <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-sm border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500">Dữ liệu: USGS • ReliefWeb • GDACS</span>
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