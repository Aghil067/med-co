import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { Activity, HeartPulse, RotateCw, Wind, Zap } from 'lucide-react'
import { DoubleSide, MathUtils, SRGBColorSpace, TextureLoader } from 'three'
import { makeAnatomyRelief } from '../lib/twinAnatomyGeometry'

const vertexShader = `
  attribute float artFront;
  uniform float gait;
  varying vec2 artUv;
  varying float frontMix;
  varying vec3 surfaceNormal;
  void main() {
    vec3 posed = position;
    float legs = smoothstep(.28, 2.5, -position.y);
    float arms = smoothstep(.68, 1.29, abs(position.x)) * (1.0 - smoothstep(.3, 1.47, position.y));
    posed.z += sign(position.x) * gait * (legs - arms * .8);
    artUv = uv;
    frontMix = artFront;
    surfaceNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(posed, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D artwork;
  uniform float beat;
  uniform float lowPulse;
  uniform float oxygen;
  uniform float lowOxygen;
  uniform float oxygenFocus;
  varying vec2 artUv;
  varying float frontMix;
  varying vec3 surfaceNormal;

  void main() {
    vec2 uv = artUv;
    vec2 heartDelta = uv - vec2(.507, .692);
    float heartArea = 1.0 - smoothstep(.02, .10, length(heartDelta * vec2(1.12, .91)));
    vec2 beatingUv = uv - heartDelta * beat * heartArea * .075;
    vec3 art = texture2D(artwork, beatingUv).rgb;
    float redDetail = smoothstep(.006, .28, art.r - art.b * .60) * heartArea;
    vec3 heartAccent = mix(vec3(.15, .008, .019), vec3(.32, .12, .012), lowPulse);
    art += heartAccent * redDetail * (.17 + beat * .53);
    art = mix(art, art * vec3(1.10, .84, .54), lowPulse * redDetail * .46);

    vec2 chest = (uv - vec2(.501, .691)) / vec2(.12, .15);
    float lungs = exp(-dot(chest, chest) * 3.0) * (1.0 - redDetail);
    art += vec3(.004, .044, .065) * lungs * oxygen * oxygenFocus;
    art = mix(art, art * vec3(1.50, .67, .39) + vec3(.17, .045, .004), lungs * lowOxygen * .72);

    float energy = max(max(art.r, art.g), art.b);
    float central = exp(-pow((uv.x - .5) * 95.0, 2.0));
    float spine = central * smoothstep(.42, .49, uv.y) * (1.0 - smoothstep(.79, .84, uv.y));
    float head = smoothstep(.835, .89, uv.y);
    float rearChest = smoothstep(.18, .75, lungs);
    vec3 rearArt = vec3(.015, .28, .53) * (max(art.b, art.g) * (1.19 - .44 * head - .35 * rearChest) + .11);
    rearArt += vec3(.017, .21, .37) * spine * (.64 + .36 * sin(uv.y * 420.0));
    float rim = pow(1.0 - abs(normalize(surfaceNormal).z), 2.5);
    vec3 rimColor = vec3(.017, .17, .31) * rim * (.40 + energy * .5);

    gl_FragColor = vec4(mix(rearArt, art, frontMix) + rimColor, 1.0);
    #include <colorspace_fragment>
  }
`

const hotspots = [
  { id: 'pulse', label: 'Heartbeat', Icon: HeartPulse, color: '#fda4af', position: [.072, 1.05, .59] },
  { id: 'oxygen', label: 'Blood oxygen', Icon: Wind, color: '#67e8f9', position: [-.58, .97, .47], left: true },
  { id: 'activity', label: 'Movement', Icon: Activity, color: '#6ee7b7', position: [.41, -1.75, .30] },
]
const stressSpot = { id: 'stress', label: 'Stress signal', Icon: Zap, color: '#c4b5fd', position: [-1.05, -2.31, 0], left: true }

function Hotspot({ spot, selected, onSelect }) {
  const { id, Icon, label, color, position, left } = spot
  const active = selected === id

  return (
    <Html position={position} center zIndexRange={[12, 2]}>
      <button type="button" aria-label={`Inspect ${label.toLowerCase()}`} aria-pressed={active}
        className="twin-hotspot" style={{ '--hotspot-color': color }}
        onPointerDown={event => event.stopPropagation()}
        onClick={() => onSelect(id)}>
        <Icon size={13} aria-hidden="true" />
        <span aria-hidden="true" className={`twin-hotspot-label ${left ? 'twin-hotspot-label-left' : ''}`}>{label}</span>
      </button>
    </Html>
  )
}

function Avatar({ signal, selected, reduced, onSelect }) {
  const [art, depth] = useLoader(TextureLoader, ['/human_digital_twin.png', '/human_digital_twin_depth.png'])
  const geometry = useMemo(() => makeAnatomyRelief(depth.image), [depth])
  const texture = useMemo(() => {
    const copy = art.clone()
    copy.colorSpace = SRGBColorSpace
    copy.anisotropy = 4
    copy.needsUpdate = true
    return copy
  }, [art])
  const uniforms = useMemo(() => {
    return { artwork: { value: texture }, gait: { value: 0 }, beat: { value: 0 }, lowPulse: { value: 0 },
      oxygen: { value: 0 }, lowOxygen: { value: 0 }, oxygenFocus: { value: 0 } }
  }, [texture])
  const body = useRef()
  const shader = useRef()
  const beat = useRef(0)
  const movement = useRef(0)
  const phase = useRef(0)

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    const liveUniforms = shader.current.uniforms
    const step = Math.min(delta, .06)
    if (!reduced && signal.pulseSeconds) beat.current = (beat.current + delta / signal.pulseSeconds) % 1
    liveUniforms.beat.value = reduced || !signal.pulseSeconds ? 0 : Math.exp(-((beat.current - .16) ** 2) / .012)
    liveUniforms.lowPulse.value = Number(signal.lowPulse)
    liveUniforms.oxygen.value = signal.oxygenStrength
    liveUniforms.oxygenFocus.value = selected === 'oxygen' ? 1 : .28
    liveUniforms.lowOxygen.value = Number(signal.lowOxygen)
    const activity = signal.fall || reduced ? 0 : signal.motionStrength
    movement.current = MathUtils.damp(movement.current, activity, 8, step)
    phase.current += step * (2.7 + activity * 3.0)
    const stride = Math.sin(phase.current) * movement.current
    liveUniforms.gait.value = stride * .27
    const rotation = signal.fall ? -Math.PI * .42 : stride * .027
    const height = signal.fall ? -1.38 : Math.abs(stride) * .07
    body.current.rotation.z = reduced ? rotation : MathUtils.damp(body.current.rotation.z, rotation, 8, step)
    body.current.position.y = reduced ? height : MathUtils.damp(body.current.position.y, height, 8, step)
  })

  return (
    <>
      <group ref={body}>
        <mesh geometry={geometry}>
          <shaderMaterial ref={shader} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} toneMapped={false} />
        </mesh>
        {hotspots.map(spot => <Hotspot key={spot.id} spot={spot} selected={selected} onSelect={onSelect} />)}
      </group>
      <Hotspot spot={stressSpot} selected={selected} onSelect={onSelect} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.68, 0]}>
        <ringGeometry args={[1.43, 1.445, 96]} />
        <meshBasicMaterial color={signal.fall ? '#fb923c' : '#22d3ee'} transparent opacity={.34} side={DoubleSide} />
      </mesh>
      {signal.stress != null && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.67, 0]}>
        <ringGeometry args={[1.64, 1.662, 96]} />
        <meshBasicMaterial color="#bd7cff" transparent opacity={.17 + signal.stressStrength * .49 + (selected === 'stress' ? .20 : 0)} side={DoubleSide} />
      </mesh>}
    </>
  )
}

const viewpoints = { Front: [0, .15, 9], Side: [9, .15, 0], Back: [0, .15, -9] }

function CameraRig({ request, autoRotate }) {
  const orbit = useRef()
  const height = useThree(state => state.size.height)
  const width = useThree(state => state.size.width)

  useEffect(() => {
    if (!height || !width) return
    const camera = orbit.current.object
    camera.zoom = Math.min(height / 5.87, width / 4.50)
    camera.updateProjectionMatrix()
  }, [height, width])

  useEffect(() => {
    orbit.current.object.position.set(...viewpoints[request.view])
    orbit.current.update()
  }, [request])

  return <OrbitControls ref={orbit} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={.95} minZoom={height / 10} maxZoom={height / 2}
    minPolarAngle={Math.PI * .24} maxPolarAngle={Math.PI * .71} />
}

class RenderBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function DigitalTwin3D({ signal, selected, onSelect, fallback }) {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [request, setRequest] = useState({ view: 'Front' })
  const [autoRotate, setAutoRotate] = useState(false)

  function selectHotspot(id) {
    setAutoRotate(false)
    onSelect(id)
  }

  return (
    <div className="relative w-full">
      <RenderBoundary fallback={fallback}>
        <div role="group" aria-label="Camera controls" className="relative z-20 mx-3 mt-3 flex w-fit flex-wrap gap-1 rounded-lg border border-border bg-bg-dark/90 p-1 sm:absolute sm:right-3 sm:top-3 sm:m-0">
          {Object.keys(viewpoints).map(view => <button key={view} type="button" className="workspace-button" onClick={() => {
            setAutoRotate(false)
            setRequest({ view })
          }}>{view}</button>)}
          <button type="button" className={`workspace-button ${autoRotate ? 'workspace-primary' : ''}`} aria-label="Auto-rotate" title="Auto-rotate"
            aria-pressed={autoRotate} onClick={() => setAutoRotate(current => !current)}>
            <RotateCw size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="h-[clamp(360px,65dvh,620px)] w-full cursor-grab active:cursor-grabbing">
          <Canvas orthographic camera={{ position: viewpoints.Front, near: .1, far: 45 }} dpr={[1, 1.5]} fallback={fallback}>
            <Avatar signal={signal} selected={selected} reduced={reduced} onSelect={selectHotspot} />
            <CameraRig request={request} autoRotate={autoRotate} />
          </Canvas>
        </div>
      </RenderBoundary>
    </div>
  )
}
