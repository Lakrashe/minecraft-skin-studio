import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';

/** Spinning 8×8×8 cube — verifies the Three.js / R3F pipeline works end to end. */
export function SmokeTestScene({ color }: { color: string }) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += delta * 0.6;
    mesh.current.rotation.x += delta * 0.2;
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 25]} intensity={1.8} />
      <mesh ref={mesh} position={[0, 16, 0]}>
        <boxGeometry args={[8, 8, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}
