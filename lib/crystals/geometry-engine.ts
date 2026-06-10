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
    // Bipyramidal
    return [new THREE.ConeGeometry(0.7, height, 6), createFlipped(new THREE.ConeGeometry(0.7, height * 0.7, 6))]
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
    const top = new THREE.ConeGeometry(0.7, height, 4)
    const bot = createFlipped(new THREE.ConeGeometry(0.7, height, 4))
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
    return [new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8)]
  }
  // Prismatic: rectangular prism
  return [new THREE.BoxGeometry(w, h, d)]
}

// ── MONOCLINIC ────────────────────────────────────────────────────────────────
function buildMonoclinic(habit: string, b: number, c: number): THREE.BufferGeometry[] {
  const h = 1.0 + c * 0.5
  const w = 0.7 + b * 0.3

  if (habit.includes('tabular') || habit.includes('plat')) {
    // Sheared flat prism
    return [createSheared(new THREE.BoxGeometry(w * 1.4, 0.45, 1.1), 0.2)]
  }
  if (habit.includes('prismatic')) {
    return [createSheared(new THREE.BoxGeometry(w, h, 0.9), 0.15)]
  }
  return [createSheared(new THREE.BoxGeometry(w, h, 1.0), 0.18)]
}

// ── TRICLINIC ─────────────────────────────────────────────────────────────────
function buildTriclinic(a: number, b: number, c: number): THREE.BufferGeometry[] {
  // Triclinic: fully distorted box with shear in two axes
  const geom = new THREE.BoxGeometry(0.7 + a * 0.3, 1.0 + c * 0.4, 0.6 + b * 0.3)
  const sheared = createSheared(geom, 0.15)
  // Apply a second shear on another axis
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
    return [new THREE.OctahedronGeometry(0.85, 0)] // simplified rhombohedron
  }
  if (habit.includes('scalenohedr')) {
    const geom = new THREE.ConeGeometry(0.7, height, 6)
    return [geom, createFlipped(new THREE.ConeGeometry(0.6, height * 0.75, 6))]
  }
  if (habit.includes('tabular') || habit.includes('plat')) {
    return [new THREE.CylinderGeometry(0.9, 0.9, 0.45, 3)] // short trigonal prism
  }
  if (habit.includes('pyramid') || habit.includes('bipyramid')) {
    return [new THREE.ConeGeometry(0.75, height * 0.8, 3), createFlipped(new THREE.ConeGeometry(0.75, height * 0.8, 3))]
  }
  // Trigonal prism
  return [new THREE.CylinderGeometry(0.8, 0.8, height, 3)]
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
