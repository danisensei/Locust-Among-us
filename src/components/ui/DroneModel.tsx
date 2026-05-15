import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Mesh } from 'three'

interface DroneModelProps {
  status: string
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Available': return '#10b981' // emerald-500
    case 'On Mission': return '#3b82f6' // blue-500
    case 'Maintenance': return '#ef4444' // red-500
    case 'Charging': return '#f59e0b' // orange-500
    default: return '#6b7280' // gray-500
  }
}

export default function DroneModel({ status }: DroneModelProps) {
  const groupRef = useRef<Group>(null)
  
  // Propeller refs
  const prop1 = useRef<Mesh>(null)
  const prop2 = useRef<Mesh>(null)
  const prop3 = useRef<Mesh>(null)
  const prop4 = useRef<Mesh>(null)

  const color = getStatusColor(status)

  // Determine if it should spin fast or slow based on status
  // Available/Charging = resting/slow idle, On Mission = fast, Maintenance = stopped/broken
  const speed = status === 'On Mission' ? 0.8 : status === 'Available' ? 0.2 : status === 'Charging' ? 0.1 : 0
  const hoverAmp = status === 'On Mission' ? 0.3 : status === 'Available' ? 0.1 : 0

  useFrame((state) => {
    // Spin propellers
    if (prop1.current) prop1.current.rotation.y += speed
    if (prop2.current) prop2.current.rotation.y -= speed
    if (prop3.current) prop3.current.rotation.y -= speed
    if (prop4.current) prop4.current.rotation.y += speed

    // Hover effect
    if (groupRef.current && hoverAmp > 0) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * hoverAmp
      // Slight tilt if moving
      if (status === 'On Mission') {
        groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1 + 0.1
        groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.8) * 0.05
      } else {
        groupRef.current.rotation.x = 0
        groupRef.current.rotation.z = 0
      }
    } else if (groupRef.current) {
      // Grounded
      groupRef.current.position.y = -0.5
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = 0
    }
  })

  // Basic styling
  const bodyMaterial = { color: '#1e293b', roughness: 0.5, metalness: 0.8 } // slate-800
  const armMaterial = { color: '#0f172a', roughness: 0.7, metalness: 0.6 } // slate-900
  const glowMaterial = { color: color, emissive: color, emissiveIntensity: 2, toneMapped: false }
  
  const armLength = 1.2
  const propY = 0.2

  return (
    <group ref={groupRef} dispose={null}>
      {/* Central Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
        <meshStandardMaterial {...bodyMaterial} />
      </mesh>
      
      {/* Top Dome */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#000000" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Status Ring / Core light */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.52, 0.03, 8, 32]} />
        <meshStandardMaterial {...glowMaterial} />
      </mesh>

      {/* Arm 1: Front Right */}
      <group position={[armLength/2, 0, armLength/2]} rotation={[0, -Math.PI/4, 0]}>
        <mesh position={[-armLength/2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.08, 0.08, armLength, 8]} />
          <meshStandardMaterial {...armMaterial} />
        </mesh>
        {/* Motor */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>
        {/* Propeller */}
        <mesh ref={prop1} position={[0, propY, 0]}>
          <boxGeometry args={[1, 0.02, 0.1]} />
          <meshStandardMaterial color="#cbd5e1" opacity={0.6} transparent />
        </mesh>
      </group>

      {/* Arm 2: Front Left */}
      <group position={[-armLength/2, 0, armLength/2]} rotation={[0, Math.PI/4, 0]}>
        <mesh position={[armLength/2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.08, 0.08, armLength, 8]} />
          <meshStandardMaterial {...armMaterial} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>
        <mesh ref={prop2} position={[0, propY, 0]}>
          <boxGeometry args={[1, 0.02, 0.1]} />
          <meshStandardMaterial color="#cbd5e1" opacity={0.6} transparent />
        </mesh>
      </group>

      {/* Arm 3: Back Right */}
      <group position={[armLength/2, 0, -armLength/2]} rotation={[0, Math.PI/4, 0]}>
        <mesh position={[-armLength/2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.08, 0.08, armLength, 8]} />
          <meshStandardMaterial {...armMaterial} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>
        <mesh ref={prop3} position={[0, propY, 0]}>
          <boxGeometry args={[1, 0.02, 0.1]} />
          <meshStandardMaterial color="#cbd5e1" opacity={0.6} transparent />
        </mesh>
      </group>

      {/* Arm 4: Back Left */}
      <group position={[-armLength/2, 0, -armLength/2]} rotation={[0, -Math.PI/4, 0]}>
        <mesh position={[armLength/2, 0, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.08, 0.08, armLength, 8]} />
          <meshStandardMaterial {...armMaterial} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial {...bodyMaterial} />
        </mesh>
        <mesh ref={prop4} position={[0, propY, 0]}>
          <boxGeometry args={[1, 0.02, 0.1]} />
          <meshStandardMaterial color="#cbd5e1" opacity={0.6} transparent />
        </mesh>
      </group>
      
      {/* Front LEDs (Headlights) */}
      <mesh position={[0.3, 0, 0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[-0.3, 0, 0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} toneMapped={false} />
      </mesh>

    </group>
  )
}
