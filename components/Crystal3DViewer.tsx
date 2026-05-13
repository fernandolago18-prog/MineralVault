'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  buildCrystalGeometry,
  createCrystalMaterial,
  SYSTEM_COLORS,
  type CrystalGeometryOptions,
} from '@/lib/crystals/geometry-engine'

interface Crystal3DViewerProps {
  crystalOptions: CrystalGeometryOptions
  /** Color hex del mineral (e.g. '#9b59b6') — si no, se usa el color por sistema */
  mineralColor?: string
  /** Opacidad 0–1 según la transparencia del mineral */
  transparency?: number
  /** Altura del visor (default: '100%') */
  height?: string
  className?: string
}

/**
 * Componente visor 3D de cristales usando Three.js con OrbitControls.
 * Renderiza la forma paramétrica del cristal con iluminación PBR y
 * fondo transparente para integrarse con el diseño de la app.
 */
export default function Crystal3DViewer({
  crystalOptions,
  mineralColor,
  transparency = 0.88,
  height = '100%',
  className,
}: Crystal3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    meshes: THREE.Mesh[]
    animationId: number
  } | null>(null)

  const getColor = useCallback((): number => {
    if (mineralColor) {
      return parseInt(mineralColor.replace('#', ''), 16)
    }
    return SYSTEM_COLORS[crystalOptions.system] ?? 0x9955ff
  }, [mineralColor, crystalOptions.system])

  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth
    const height_px = container.clientHeight

    // ── Scene ──────────────────────────────────────────────
    const scene = new THREE.Scene()

    // ── Camera ─────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, width / height_px, 0.1, 100)
    camera.position.set(2.5, 1.8, 2.5)
    camera.lookAt(0, 0, 0)

    // ── Renderer ───────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,  // Fondo transparente
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height_px)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // ── Lights ─────────────────────────────────────────────
    // Ambient
    const ambientLight = new THREE.AmbientLight(0x6644aa, 0.8)
    scene.add(ambientLight)

    // Key light (violet-ish)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(3, 5, 3)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.setScalar(1024)
    scene.add(keyLight)

    // Fill light (cyan tint)
    const fillLight = new THREE.DirectionalLight(0x00ddff, 0.8)
    fillLight.position.set(-3, 2, -2)
    scene.add(fillLight)

    // Rim light (gem sparkle)
    const rimLight = new THREE.PointLight(0x9944ff, 1.5, 8)
    rimLight.position.set(0, -2, 2)
    scene.add(rimLight)

    // ── Crystal geometries ─────────────────────────────────
    const geometries = buildCrystalGeometry(crystalOptions)
    const color = getColor()
    const meshes: THREE.Mesh[] = []
    const group = new THREE.Group()

    geometries.forEach(geom => {
      const material = createCrystalMaterial({
        color,
        opacity: transparency,
        transparent: transparency < 1.0,
      })
      const mesh = new THREE.Mesh(geom, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
      meshes.push(mesh)
    })

    // ── Wireframe overlay ──────────────────────────────────
    const wireGeo = geometries[0]?.clone()
    if (wireGeo) {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06,
      })
      group.add(new THREE.Mesh(wireGeo, wireMat))
    }

    scene.add(group)

    // ── Orbit Controls ─────────────────────────────────────
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.minDistance = 1.5
    controls.maxDistance = 8
    controls.autoRotate = true
    controls.autoRotateSpeed = 1.5

    // ── Animation loop ─────────────────────────────────────
    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      // Subtle pulsing glow
      const t = Date.now() * 0.001
      rimLight.intensity = 1.2 + Math.sin(t * 1.5) * 0.4
      renderer.render(scene, camera)
    }
    animate()

    // ── Resize handler ─────────────────────────────────────
    const handleResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    sceneRef.current = { renderer, scene, camera, controls, meshes, animationId }

    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      controls.dispose()
      renderer.dispose()
      geometries.forEach(g => g.dispose())
      meshes.forEach(m => {
        if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose())
        else m.material.dispose()
      })
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [crystalOptions, getColor, transparency])

  return (
    <div
      ref={mountRef}
      className={`viewer-3d ${className ?? ''}`}
      style={{ height }}
      role="img"
      aria-label={`Modelo 3D del cristal ${crystalOptions.system}`}
    >
      {/* Overlay hint */}
      <div style={{
        position: 'absolute', bottom: '12px', left: '12px',
        fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)',
        pointerEvents: 'none', fontFamily: 'Outfit, sans-serif',
      }}>
        Arrastra para rotar · Rueda para zoom
      </div>
    </div>
  )
}
