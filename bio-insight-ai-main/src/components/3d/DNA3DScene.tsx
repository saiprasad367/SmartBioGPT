import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface HelixStrandProps {
  offset: number;
  color: string;
}

function HelixStrand({ offset, color }: HelixStrandProps) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 3;
    const height = 8;
    const radius = 1.2;

    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const angle = t * turns * Math.PI * 2 + offset;
      const y = (t - 0.5) * height;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [offset]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 100, 0.08, 8, false]} />
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

function BasePairs() {
  const pairs = useMemo(() => {
    const result: { y: number; angle: number }[] = [];
    const turns = 3;
    const height = 8;

    for (let i = 0; i < 20; i++) {
      const t = i / 19;
      const y = (t - 0.5) * height;
      const angle = t * turns * Math.PI * 2;
      result.push({ y, angle });
    }
    return result;
  }, []);

  return (
    <group>
      {pairs.map((pair, index) => {
        const radius = 1.2;
        const x1 = Math.cos(pair.angle) * radius;
        const z1 = Math.sin(pair.angle) * radius;
        const x2 = Math.cos(pair.angle + Math.PI) * radius;
        const z2 = Math.sin(pair.angle + Math.PI) * radius;

        return (
          <group key={index}>
            {/* Connection bar */}
            <mesh position={[0, pair.y, 0]} rotation={[0, -pair.angle, 0]}>
              <cylinderGeometry args={[0.04, 0.04, radius * 2, 8]} />
              <meshStandardMaterial color="#e5e5e5" metalness={0.2} roughness={0.5} />
            </mesh>

            {/* Base pair spheres */}
            <mesh position={[x1 * 0.5, pair.y, z1 * 0.5]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#333333" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh position={[x2 * 0.5, pair.y, z2 * 0.5]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color="#666666" metalness={0.4} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function DNAHelix() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={0.6}>
        <HelixStrand offset={0} color="#000000" />
        <HelixStrand offset={Math.PI} color="#333333" />
        <BasePairs />
      </group>
    </Float>
  );
}

const DNA3DScene = () => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-secondary via-background to-secondary">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />

        <DNAHelix />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
};

export default DNA3DScene;
