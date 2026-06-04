import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";
import { useMemo } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * DNA helix — cinema loop for the portfolio "work" section.
 *
 * Two intertwining strands (cyan + purple) built as TubeGeometry from
 * CatmullRomCurve3 paths. Ladder rungs connect the strands; 5 glowing
 * node spheres mark the 5 featured projects.
 *
 * Loop is seamless: the whole group rotates exactly 2π over the
 * duration, so frame 0 === frame N. All motion is driven by
 * useCurrentFrame() — no useFrame(), no self-animating material.
 * ------------------------------------------------------------------ */

const CYAN = "#00d4ff";
const PURPLE = "#8b5cf6";
const PINK = "#f0abfc";

const TURNS = 3; // full rotations along the strand
const HEIGHT = 8.4; // vertical span of the helix
const RADIUS = 1.65; // radius of each strand from the central axis
const STRAND_TUBE = 0.07; // strand thickness
const SEGMENTS = 200; // path resolution per strand
const RUNG_COUNT = 22; // ladder rungs between strands
const NODE_COUNT = 5; // glowing project nodes

/** Point on a strand at parameter u ∈ [0,1] with a phase offset. */
function strandPoint(u: number, phase: number): THREE.Vector3 {
  const theta = u * TURNS * Math.PI * 2 + phase;
  const y = (u - 0.5) * HEIGHT;
  return new THREE.Vector3(Math.cos(theta) * RADIUS, y, Math.sin(theta) * RADIUS);
}

function useStrandGeometry(phase: number) {
  return useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      pts.push(strandPoint(i / SEGMENTS, phase));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, SEGMENTS, STRAND_TUBE, 12, false);
  }, [phase]);
}

const Strand: React.FC<{ phase: number; color: string }> = ({ phase, color }) => {
  const geometry = useStrandGeometry(phase);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.4}
        roughness={0.3}
        metalness={0.1}
        toneMapped={false}
      />
    </mesh>
  );
};

/** A single ladder rung connecting the two strands at parameter u. */
const Rung: React.FC<{ u: number }> = ({ u }) => {
  const { position, quaternion, length } = useMemo(() => {
    const p1 = strandPoint(u, 0);
    const p2 = strandPoint(u, Math.PI);
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { position: mid, quaternion: quat, length: len };
  }, [u]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.018, 0.018, length, 8]} />
      <meshStandardMaterial
        color={PINK}
        emissive={PINK}
        emissiveIntensity={0.5}
        transparent
        opacity={0.55}
        toneMapped={false}
      />
    </mesh>
  );
};

/** Glowing project node: bright core + additive halo, gentle periodic pulse. */
const Node: React.FC<{ u: number; pulse: number }> = ({ u, pulse }) => {
  const position = useMemo(() => {
    const p1 = strandPoint(u, 0);
    const p2 = strandPoint(u, Math.PI);
    return new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  }, [u]);

  const coreScale = 1 + pulse * 0.12;
  const haloScale = 1 + pulse * 0.25;

  return (
    <group position={position}>
      {/* bright core */}
      <mesh scale={coreScale}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={CYAN}
          emissiveIntensity={2.2 + pulse * 0.8}
          toneMapped={false}
        />
      </mesh>
      {/* inner halo */}
      <mesh scale={haloScale}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial
          color={CYAN}
          transparent
          opacity={0.28 + pulse * 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* outer halo */}
      <mesh scale={haloScale}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial
          color={PURPLE}
          transparent
          opacity={0.12 + pulse * 0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};

export const HelixComposition: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Seamless: one full turn across the whole clip.
  const loopT = frame / durationInFrames; // 0 → 1
  const rotationY = loopT * Math.PI * 2;

  // Static cinematic tilt of the whole double-helix.
  const tilt = 0.18;

  const rungUs = useMemo(
    () => Array.from({ length: RUNG_COUNT }, (_, i) => (i + 0.5) / RUNG_COUNT),
    [],
  );
  const nodeUs = useMemo(
    () => Array.from({ length: NODE_COUNT }, (_, i) => (i + 0.5) / NODE_COUNT),
    [],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 11], fov: 42 }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[4, 2, 6]} intensity={120} color={CYAN} />
        <pointLight position={[-4, -2, 6]} intensity={90} color={PURPLE} />
        <pointLight position={[0, 0, -6]} intensity={60} color={PINK} />

        <group rotation={[0, rotationY, tilt]}>
          <Strand phase={0} color={CYAN} />
          <Strand phase={Math.PI} color={PURPLE} />

          {rungUs.map((u) => (
            <Rung key={`r${u}`} u={u} />
          ))}

          {nodeUs.map((u, i) => {
            // 2 full pulse cycles over the loop → seamless; phase-spread per node.
            const pulse =
              (Math.sin(loopT * Math.PI * 2 * 2 + (i / NODE_COUNT) * Math.PI * 2) +
                1) /
              2;
            return <Node key={`n${u}`} u={u} pulse={pulse} />;
          })}
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
