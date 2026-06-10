/**
 * Motor de cristales 3D paramétrico para MineralVault.
 * Genera geometrías Three.js basadas en el sistema cristalográfico y hábito del mineral.
 * No requiere assets externos — todo es procedural.
 */

import * as THREE from 'three'

export type CrystalSystemKey =
  | 'Cubic' | 'Hexagonal' | 'Tetragonal' | 'Orthorhombic'
  | 'Monoclinic' | 'Triclinic' | 'Trigonal' | 'Amorphous' | string

export interface CrystalGeometryOptions {
  system: CrystalSystemKey
  habit?: string
  /** Parámetros normalizados de los ejes, 0..1 */
  axisRatio?: { a?: number; b?: number; c?: number }
}

/**
 * Crea la geometría 3D apropiada para un sistema cristalográfico dado.
 * Devuelve un array de meshes (algunos cristales tienen múltiples formas).
 */
export function buildCrystalGeometry(options: CrystalGeometryOptions): THREE.BufferGeometry[] {
  const { system, habit = '', axisRatio = {} } = options
  const a = axisRatio.a ?? 1.0
  const b = axisRatio.b ?? 1.0
  const c = axisRatio.c ?? 1.0
  const habitLower = habit.toLowerCase()

  switch (system) {
    case 'Cubic':
      return buildCubic(habitLower)
    case 'Hexagonal':
      return buildHexagonal(habitLower, c)
    case 'Tetragonal':
      return buildTetragonal(habitLower, c)
    case 'Orthorhombic':
      return buildOrthorhombic(habitLower, a, b, c)
    case 'Monoclinic':
      return buildMonoclinic(habitLower, b, c)
    case 'Triclinic':
      return buildTriclinic(a, b, c)
    case 'Trigonal':
      return buildTrigonal(habitLower, c)
    case 'Icosahedral':
      return [new THREE.IcosahedronGeometry(0.85)]
    default:
      return [buildAmorphous()]
  }
}

// ── CUBIC ─────────────────────────────────────────────────────────────────────
function buildCubic(habit: string): THREE.BufferGeometry[] {
  if (habit.includes('octahedr') || habit.includes('octa')) {
    return [new THREE.OctahedronGeometry(0.9)]
  }
  if (habit.includes('dodecahedr')) {
    return [new THREE.DodecahedronGeometry(0.85)]
  }
  if (habit.includes('tetrahedr')) {
    return [new THREE.TetrahedronGeometry(0.95)]
  }
  // Default cubic: cube with slight bevel feel
  return [new THREE.BoxGeometry(1.4, 1.4, 1.4, 1, 1, 1)]
}

// ── HEXAGONAL ─────────────────────────────────────────────────────────────────
function buildHexagonal(habit: string, c: number): THREE.BufferGeometry[] {
  const height = 1.2 + c * 0.8

  if (habit.includes('tabular') || habit.includes('plat')) {
    // Tabular: short hexagonal prism
    return [new THREE.CylinderGeometry(0.9, 0.9, 0.5, 6)]
  }
  if (habit.includes('pyramid') || habit.includes('bipyramid')) {
    // Bipyramidal: base-to-base alignment
    const top = new THREE.ConeGeometry(0.7, height / 2, 6)
    const bot = createFlipped(new THREE.ConeGeometry(0.7, height / 2, 6))
    translateGeometry(top, 0, height / 4, 0)
    translateGeometry(bot, 0, -height / 4, 0)
    return [top, bot]
  }
  // Prismatic: tall hexagonal prism with pyramidal terminations
  const prism = new THREE.CylinderGeometry(0.75, 0.75, height, 6)
  const capTop = new THREE.ConeGeometry(0.75, 0.35, 6)
  const capBot = createFlipped(new THREE.ConeGeometry(0.75, 0.35, 6))
  translateGeometry(capTop, 0, height / 2, 0)
  translateGeometry(capBot, 0, -height / 2, 0)
  return [prism, capTop, capBot]
}

// ── TETRAGONAL ────────────────────────────────────────────────────────────────
function buildTetragonal(habit: string, c: number): THREE.BufferGeometry[] {
  const height = 1.0 + c * 0.6

  if (habit.includes('tabular')) {
    return [new THREE.BoxGeometry(1.3, 0.5, 1.3)]
  }
  if (habit.includes('pyramid') || habit.includes('bipyramid')) {
    // Bipyramidal: base-to-base alignment
    const top = new THREE.ConeGeometry(0.7, height / 2, 4)
    const bot = createFlipped(new THREE.ConeGeometry(0.7, height / 2, 4))
    translateGeometry(top, 0, height / 4, 0)
    translateGeometry(bot, 0, -height / 4, 0)
    return [top, bot]
  }
  // Prismatic
  const prism = new THREE.CylinderGeometry(0.7, 0.7, height, 4)
  const capTop = new THREE.ConeGeometry(0.7, 0.4, 4)
  const capBot = createFlipped(new THREE.ConeGeometry(0.7, 0.4, 4))
  translateGeometry(capTop, 0, height / 2, 0)
  translateGeometry(capBot, 0, -height / 2, 0)
  return [prism, capTop, capBot]
}

// ── ORTHORHOMBIC ──────────────────────────────────────────────────────────────
function buildOrthorhombic(habit: string, a: number, b: number, c: number): THREE.BufferGeometry[] {
  const w = 0.8 + a * 0.4
  const d = 0.6 + b * 0.4
  const h = 1.0 + c * 0.6

  if (habit.includes('tabular') || habit.includes('plat')) {
    return [new THREE.BoxGeometry(w * 1.4, 0.5, d * 1.4)]
  }
  if (habit.includes('acicular') || habit.includes('needle')) {
    // Acicular: thin long 4-sided needle with pyramidal terminations
    const prism = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 4)
    const capTop = new THREE.ConeGeometry(0.08, 0.15, 4)
    const capBot = createFlipped(new THREE.ConeGeometry(0.08, 0.15, 4))
    translateGeometry(capTop, 0, 1.1, 0)
    translateGeometry(capBot, 0, -1.1, 0)
    return [prism, capTop, capBot]
  }
  // Prismatic: rectangular prism
  return [new THREE.BoxGeometry(w, h, d)]
}

// ── MONOCLINIC ────────────────────────────────────────────────────────────────
function buildMonoclinic(habit: string, b: number, c: number): THREE.BufferGeometry[] {
  const h = 1.0 + c * 0.5
  const w = 0.7 + b * 0.3

  if (habit.includes('tabular') || habit.includes('plat')) {
    return [createSheared(new THREE.BoxGeometry(w * 1.4, 0.45, 1.1), 0.2)]
  }
  if (habit.includes('prismatic')) {
    return [createSheared(new THREE.BoxGeometry(w, h, 0.9), 0.15)]
  }
  return [createSheared(new THREE.BoxGeometry(w, h, 1.0), 0.18)]
}

// ── TRICLINIC ─────────────────────────────────────────────────────────────────
function buildTriclinic(a: number, b: number, c: number): THREE.BufferGeometry[] {
  const geom = new THREE.BoxGeometry(0.7 + a * 0.3, 1.0 + c * 0.4, 0.6 + b * 0.3)
  const sheared = createSheared(geom, 0.15)
  const positions = sheared.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    positions.setZ(i, positions.getZ(i) + y * 0.12)
  }
  positions.needsUpdate = true
  sheared.computeVertexNormals()
  return [sheared]
}

// ── TRIGONAL ──────────────────────────────────────────────────────────────────
function buildTrigonal(habit: string, c: number): THREE.BufferGeometry[] {
  const height = 0.9 + c * 0.7

  if (habit.includes('rhombohedr')) {
    // Rhombohedron: sheared cube
    return [buildRhombohedron()]
  }
  if (habit.includes('scalenohedr')) {
    // Scalenohedron: ditrigonal scalenohedron with alternating equatorial heights
    return [buildScalenohedron(height)]
  }
  if (habit.includes('tabular') || habit.includes('plat')) {
    return [new THREE.CylinderGeometry(0.9, 0.9, 0.45, 3)] // short trigonal prism
  }
  if (habit.includes('pyramid') || habit.includes('bipyramid')) {
    // Bipyramidal: base-to-base alignment
    const top = new THREE.ConeGeometry(0.75, height / 2, 3)
    const bot = createFlipped(new THREE.ConeGeometry(0.75, height / 2, 3))
    translateGeometry(top, 0, height / 4, 0)
    translateGeometry(bot, 0, -height / 4, 0)
    return [top, bot]
  }
  // Trigonal prism
  return [new THREE.CylinderGeometry(0.8, 0.8, height, 3)]
}

// ── AUXILIARY SHAPES ──────────────────────────────────────────────────────────
function buildRhombohedron(): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(1.1, 1.1, 1.1)
  const positions = geom.attributes.position
  const shear = 0.35
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)
    positions.setX(i, x + y * shear)
    positions.setZ(i, z + y * shear)
  }
  positions.needsUpdate = true
  geom.computeVertexNormals()
  return geom
}

function buildScalenohedron(height: number): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  const r = 0.65
  const shift = height * 0.15
  const halfH = height / 2

  // 8 vertices
  const vertices = new Float32Array(8 * 3)
  // 0: Top tip
  vertices[0] = 0; vertices[1] = halfH; vertices[2] = 0
  // 1: Bottom tip
  vertices[3] = 0; vertices[4] = -halfH; vertices[5] = 0

  // 2..7: Equatorial hexagon with alternating heights
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const idx = (2 + i) * 3
    vertices[idx] = r * Math.cos(angle)
    vertices[idx + 1] = (i % 2 === 0 ? 1 : -1) * shift
    vertices[idx + 2] = r * Math.sin(angle)
  }

  const indices: number[] = []
  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6
    // Top triangles
    indices.push(0, 2 + i, 2 + next)
    // Bottom triangles
    indices.push(1, 2 + next, 2 + i)
  }

  geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

// ── AMORPHOUS ─────────────────────────────────────────────────────────────────
function buildAmorphous(): THREE.BufferGeometry {
  return new THREE.SphereGeometry(0.8, 12, 8)
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function createFlipped(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  const flipped = geom.clone()
  const positions = flipped.attributes.position
  for (let i = 0; i < positions.count; i++) {
    positions.setY(i, -positions.getY(i))
  }
  positions.needsUpdate = true
  flipped.computeVertexNormals()
  return flipped
}

function translateGeometry(geom: THREE.BufferGeometry, x: number, y: number, z: number): void {
  geom.translate(x, y, z)
}

function createSheared(geom: THREE.BufferGeometry, shearFactor: number): THREE.BufferGeometry {
  const clone = geom.clone()
  const positions = clone.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i)
    positions.setX(i, positions.getX(i) + y * shearFactor)
  }
  positions.needsUpdate = true
  clone.computeVertexNormals()
  return clone
}

/**
 * Crea el material estándar para el cristal con apariencia mineral.
 * Color y transparencia configurables por mineral.
 */
export function createCrystalMaterial(options: {
  color?: string | number
  transparent?: boolean
  opacity?: number
  roughness?: number
  metalness?: number
  emissive?: string | number
}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: options.color ?? 0x9955ff,
    roughness: options.roughness ?? 0.15,
    metalness: options.metalness ?? 0.1,
    transparent: options.transparent ?? true,
    opacity: options.opacity ?? 0.88,
    emissive: options.emissive ?? 0x220033,
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide,
  })
}

/** Mapa de colores sugeridos por sistema cristalográfico */
export const SYSTEM_COLORS: Record<string, number> = {
  Cubic:         0x9b59b6,
  Hexagonal:     0x1abc9c,
  Tetragonal:    0x3498db,
  Orthorhombic:  0xe67e22,
  Monoclinic:    0xe91e63,
  Triclinic:     0xf39c12,
  Trigonal:      0x00bcd4,
  Icosahedral:   0x9c27b0,
  Amorphous:     0x78909c,
}
