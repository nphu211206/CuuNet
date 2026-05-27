"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/**
 * TerrainMap3D — 3D Terrain visualization of Vietnam
 * Uses procedural heightmap data (no external API needed)
 * Features: rotate, zoom, hover provinces, disaster markers
 */

// Vietnam provinces with approximate coordinates and elevation data
const VIETNAM_PROVINCES = [
    { name: "Hà Nội", lat: 21.03, lng: 105.85, elevation: 12, population: 8.1, risk: 0.8 },
    { name: "TP.HCM", lat: 10.82, lng: 106.63, elevation: 5, population: 9.3, risk: 0.7 },
    { name: "Đà Nẵng", lat: 16.05, lng: 108.2, elevation: 15, population: 1.1, risk: 0.6 },
    { name: "Hải Phòng", lat: 20.84, lng: 106.69, elevation: 8, population: 2.0, risk: 0.7 },
    { name: "Cần Thơ", lat: 10.03, lng: 105.77, elevation: 3, population: 1.2, risk: 0.8 },
    { name: "Quảng Bình", lat: 17.47, lng: 106.62, elevation: 25, population: 0.9, risk: 0.9 },
    { name: "Thừa Thiên Huế", lat: 16.46, lng: 107.6, elevation: 20, population: 1.1, risk: 0.8 },
    { name: "Quảng Nam", lat: 15.57, lng: 108.47, elevation: 30, population: 1.5, risk: 0.7 },
    { name: "Nghệ An", lat: 18.67, lng: 105.68, elevation: 35, population: 3.3, risk: 0.7 },
    { name: "Thanh Hóa", lat: 19.81, lng: 105.78, elevation: 28, population: 3.5, risk: 0.6 },
    { name: "Sơn La", lat: 21.33, lng: 103.91, elevation: 600, population: 1.2, risk: 0.9 },
    { name: "Lào Cai", lat: 22.34, lng: 103.84, elevation: 800, population: 0.7, risk: 0.9 },
    { name: "Đắk Lắk", lat: 12.71, lng: 108.23, elevation: 500, population: 1.9, risk: 0.6 },
    { name: "Lâm Đồng", lat: 11.94, lng: 108.44, elevation: 1500, population: 1.3, risk: 0.5 },
    { name: "Kon Tum", lat: 14.35, lng: 108.0, elevation: 550, population: 0.5, risk: 0.6 },
];

const RISK_COLORS: Record<string, string> = {
    critical: "#FF4757",
    high: "#FF6B6B",
    medium: "#FFB800",
    low: "#00D68F",
};

function getRiskColor(risk: number): string {
    if (risk >= 0.8) return "#FF4757";
    if (risk >= 0.6) return "#FFB800";
    return "#00D68F";
}

// Convert lat/lng to 3D position
function latLngToPosition(lat: number, lng: number, scale: number): [number, number, number] {
    const x = (lng - 106) * scale;
    const z = (lat - 16) * scale;
    return [x, 0, z];
}

// === TERRAIN MESH ===
function TerrainMesh() {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const width = 80;
        const depth = 120;
        const segments = 64;
        const geo = new THREE.PlaneGeometry(width, depth, segments, segments);
        const positions = geo.attributes.position;

        // Generate heightmap
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getY(i);

            // Mountain ranges (simplified)
            let height = 0;

            // Northern mountains
            if (z > 30) {
                height += Math.max(0, (z - 30) * 0.15) * (1 + Math.sin(x * 0.3) * 0.3);
            }

            // Central highlands
            if (z > -10 && z < 20 && x > -5 && x < 5) {
                height += Math.max(0, 8 - Math.abs(z - 5) * 0.4) * (1 + Math.cos(x * 0.5) * 0.2);
            }

            // Coastline depression
            if (x > 10) {
                height *= 0.5;
            }

            // River valleys
            const riverDist = Math.abs(z - 5 + Math.sin(x * 0.2) * 3);
            if (riverDist < 3) {
                height *= 0.7;
            }

            // Add noise
            height += Math.sin(x * 0.8 + z * 0.6) * 0.5;
            height += Math.cos(x * 1.2 - z * 0.9) * 0.3;

            positions.setZ(i, Math.max(height, 0));
        }

        geo.computeVertexNormals();
        return geo;
    }, []);

    const material = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        const grad = ctx.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, "#4ade80");
        grad.addColorStop(0.3, "#22c55e");
        grad.addColorStop(0.6, "#15803d");
        grad.addColorStop(0.8, "#854d0e");
        grad.addColorStop(1, "#a16207");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        return new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.05,
            roughness: 0.7,
            flatShading: true,
        });
    }, []);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -2, 0]}
        >
        </mesh>
    );
}

// === PROVINCE MARKER ===
function ProvinceMarker({
    province,
    scale,
}: {
    province: typeof VIETNAM_PROVINCES[0];
    scale: number;
}) {
    const [hovered, setHovered] = useState(false);
    const markerRef = useRef<THREE.Group>(null);
    const position = useMemo(
        () => latLngToPosition(province.lat, province.lng, scale),
        [province, scale]
    );
    const color = getRiskColor(province.risk);
    const markerHeight = Math.min(province.elevation * 0.01 + 0.5, 4);

    useFrame((state) => {
        if (markerRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + province.lat) * 0.15;
            markerRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <group position={position}>
            {/* Column */}
            <mesh position={[0, markerHeight / 2, 0]}>
                <cylinderGeometry args={[0.08, 0.15, markerHeight, 8]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={hovered ? 0.9 : 0.6}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.3 : 0.1}
                />
            </mesh>

            {/* Top sphere */}
            <group ref={markerRef} position={[0, markerHeight, 0]}>
                <mesh
                    onPointerEnter={() => setHovered(true)}
                    onPointerLeave={() => setHovered(false)}
                >
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={hovered ? 0.5 : 0.2}
                    />
                </mesh>

                {/* Pulse ring */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
                    <ringGeometry args={[0.25, 0.35, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
                </mesh>
            </group>

            {/* Hover tooltip */}
            {hovered && (
                <Html position={[0, markerHeight + 0.8, 0]} center distanceFactor={8}>
                    <div className="pointer-events-none px-3 py-2 rounded-xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl min-w-[180px]"
                        style={{ transform: "scale(0.85)" }}>
                        <p className="text-[12px] font-bold text-slate-900 mb-1">{province.name}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                            <span className="text-[9px] text-slate-500">Dân số:</span>
                            <span className="text-[9px] font-semibold text-slate-700">{province.population}M</span>
                            <span className="text-[9px] text-slate-500">Cao độ:</span>
                            <span className="text-[9px] font-semibold text-slate-700">{province.elevation}m</span>
                            <span className="text-[9px] text-slate-500">Rủi ro:</span>
                            <span className="text-[9px] font-bold" style={{ color }}>{(province.risk * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

// === GRID ===
function GridFloor() {
    return (
        <gridHelper
            args={[100, 50, "#CBD5E1", "#E2E8F0"]}
            position={[0, -2.01, 0]}
        />
    );
}

// === WATER PLANE ===
function WaterPlane() {
    const waterRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (waterRef.current) {
            waterRef.current.position.y = -2.1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    return (
        <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial
                color="#60a5fa"
                transparent
                opacity={0.5}
                metalness={0.4}
                roughness={0.1}
            />
        </mesh>
    );
}

// === SCENE ===
function TerrainScene() {
    const scale = 2;

    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 15, 10]} intensity={1} color="#ffffff" castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#93C5FD" />
            <pointLight position={[0, 10, 0]} intensity={0.2} color="#0066FF" />

            <TerrainMesh />
            <WaterPlane />
            <GridFloor />

            {VIETNAM_PROVINCES.map((province) => (
                <ProvinceMarker
                    key={province.name}
                    province={province}
                    scale={scale}
                />
            ))}

            <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={15}
                maxDistance={60}
                autoRotate
                autoRotateSpeed={0.2}
                enableDamping
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2.5}
                minPolarAngle={Math.PI / 6}
            />
        </>
    );
}

// === MAIN COMPONENT ===
export default function TerrainMap3D() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            <div className="absolute inset-0 bg-aurora" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-600 uppercase tracking-widest mb-4">
                        🗺️ Địa hình 3D
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
                        Bản đồ <span className="text-gradient-flow">Địa hình</span> Việt Nam
                    </h2>
                    <p className="text-base text-slate-600 max-w-xl mx-auto">
                        Kéo để xoay • Hover marker để xem chi tiết • Cuộn để zoom
                    </p>
                </motion.div>

                {/* 3D Terrain */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative mx-auto"
                    style={{ height: "55vh", maxHeight: "600px", maxWidth: "1000px" }}
                >
                    <Canvas
                        camera={{ position: [15, 20, 25], fov: 45 }}
                        style={{ borderRadius: "24px" }}
                        dpr={[1, 2]}
                    >
                        <TerrainScene />
                    </Canvas>

                    {/* Overlay */}
                    <div className="absolute inset-0 pointer-events-none rounded-3xl"
                        style={{ boxShadow: "inset 0 0 60px rgba(0, 102, 255, 0.05)" }}
                    />
                </motion.div>

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-4 mt-6"
                >
                    {[
                        { color: "#FF4757", label: "Rủi ro cao (≥80%)" },
                        { color: "#FFB800", label: "Rủi ro trung bình (60-80%)" },
                        { color: "#00D68F", label: "Rủi ro thấp (<60%)" },
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