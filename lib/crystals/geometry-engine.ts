/**
 * Motor de cristales 3D paramétrico para MineralVault.
 * Genera geometrías Three.js basadas en el sistema cristalográfico y hábito del mineral.
 * Todas las geometrías devueltas son watertight (estancas) y usan sombreado plano (flat shading)
 * para evitar solapamientos visibles de caras internas con transparencias y asegurar aristas vivas.
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
 * Devuelve un array de meshes (algunos cristales tienen múltiples formas, pero ahora
 * están unificados en geometrías estancas para evitar caras internas visibles).
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
      return [makeFlatGeom(new THREE.IcosahedronGeometry(0.85))]
    default:
      return [makeFlatGeom(buildAmorphous())]
  }
}

// ── AUXILIARES DE CONVERSIÓN PLANA (FLAT SHADING) ─────────────────────────────

/**
 * Convierte una geometría indexada en no indexada para duplicar vértices
 * y fuerza el cálculo de normales por cara para obtener un sombreado plano (flat) impecable.
 */
function makeFlatGeom(geom: THREE.BufferGeometry): THREE.BufferGeometry {
  const flat = geom.toNonIndexed()
  flat.computeVertexNormals()
  return flat
}

// ── GENERADORES DE POLIEDROS ESTANCOS (WATERTIGHT) ──────────────────────────

/**
 * Genera un prisma regular de N lados con tapas piramidales en ambos extremos.
 * Retorna una única geometría cerrada sin caras de división interna.
 */
function buildPrismWithPyramidalCaps(
  N: number,
  radius: number,
  hPrism: number,
  hCap: number
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  const halfHP = hPrism / 2
  const totalVertices = 2 * N + 2
  const vertices = new Float32Array(totalVertices * 3)

  // Vértice 0: Ápice superior
  vertices[0] = 0
  vertices[1] = halfHP + hCap
  vertices[2] = 0

  // Vértices 1 a N: Base superior del prisma
  for (let i = 0; i < N; i++) {
    const angle = (i * 2 * Math.PI) / N
    const idx = (1 + i) * 3
    vertices[idx] = radius * Math.cos(angle)
    vertices[idx + 1] = halfHP
    vertices[idx + 2] = radius * Math.sin(angle)
  }

  // Vértices N+1 a 2N: Base inferior del prisma
  for (let i = 0; i < N; i++) {
    const angle = (i * 2 * Math.PI) / N
    const idx = (1 + N + i) * 3
    vertices[idx] = radius * Math.cos(angle)
    vertices[idx + 1] = -halfHP
    vertices[idx + 2] = radius * Math.sin(angle)
  }

  // Vértice 2N+1: Ápice inferior
  const botApexIdx = 2 * N + 1
  vertices[botApexIdx * 3] = 0
  vertices[botApexIdx * 3 + 1] = -halfHP - hCap
  vertices[botApexIdx * 3 + 2] = 0

  const indices: number[] = []

  // Helpers para índices
  const topBaseIdx = (i: number) => 1 + (i % N)
  const botBaseIdx = (i: number) => 1 + N + (i % N)

  // Caras piramidales superiores: conecta ápice superior (0) con los vértices superiores
  for (let i = 0; i < N; i++) {
    indices.push(topBaseIdx(i), 0, topBaseIdx(i + 1))
  }

  // Caras del prisma (laterales): 2 triángulos por cara lateral
  for (let i = 0; i < N; i++) {
    const tL = topBaseIdx(i)
    const tR = topBaseIdx(i + 1)
    const bL = botBaseIdx(i)
    const bR = botBaseIdx(i + 1)

    // Triángulo lateral 1
    indices.push(tL, bR, bL)
    // Triángulo lateral 2
    indices.push(tL, tR, bR)
  }

  // Caras piramidales inferiores: conecta ápice inferior (2N+1) con los vértices inferiores
  for (let i = 0; i < N; i++) {
    indices.push(botApexIdx, botBaseIdx(i), botBaseIdx(i + 1))
  }

  geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

/**
 * Genera una bipirámide regular de N lados (ej: bipirámide hexagonal o tetragonal/octaedro).
 * Retorna una única geometría cerrada sin planos de división ecuatorial.
 */
function buildBipyramid(N: number, radius: number, height: number): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry()
  const halfH = height / 2
  const totalVertices = N + 2
  const vertices = new Float32Array(totalVertices * 3)

  // Vértice 0: Ápice superior
  vertices[0] = 0
  vertices[1] = halfH
  vertices[2] = 0

  // Vértice 1: Ápice inferior
  vertices[3] = 0
  vertices[4] = -halfH
  vertices[5] = 0

  // Vértices 2 a N+1: Cinturón ecuatorial
  for (let i = 0; i < N; i++) {
    const angle = (i * 2 * Math.PI) / N
    const idx = (2 + i) * 3
    vertices[idx] = radius * Math.cos(angle)
    vertices[idx + 1] = 0
    vertices[idx + 2] = radius * Math.sin(angle)
  }

  const indices: number[] = []
  const eqIdx = (i: number) => 2 + (i % N)

  // Pirámide superior
  for (let i = 0; i < N; i++) {
    indices.push(eqIdx(i), 0, eqIdx(i + 1))
  }

  // Pirámide inferior
  for (let i = 0; i < N; i++) {
    indices.push(1, eqIdx(i), eqIdx(i + 1))
  }

  geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

// ── CUBIC ─────────────────────────────────────────────────────────────────────
function buildCubic(habit: string): THREE.BufferGeometry[] {
  if (
    habit.includes('octahedr') ||
    habit.includes('octaédr') ||
    habit.includes('octa')
  ) {
    return [makeFlatGeom(new THREE.OctahedronGeometry(0.9))]
  }
  if (
    habit.includes('dodecahedr') ||
    habit.includes('dodecaédr') ||
    habit.includes('dodeca')
  ) {
    // Dodecaedro regular de 12 caras pentagonales iguales
    return [makeFlatGeom(new THREE.DodecahedronGeometry(0.85))]
  }
  if (
    habit.includes('tetrahedr') ||
    habit.includes('tetraédr') ||
    habit.includes('tetra')
  ) {
    return [makeFlatGeom(new THREE.TetrahedronGeometry(0.95))]
  }
  // Default cubic: cubo limpio de aristas vivas
  return [makeFlatGeom(new THREE.BoxGeometry(1.3, 1.3, 1.3))]
}

// ── HEXAGONAL ─────────────────────────────────────────────────────────────────
function buildHexagonal(habit: string, c: number): THREE.BufferGeometry[] {
  const height = 1.2 + c * 0.8

  if (
    habit.includes('tabular') ||
    habit.includes('plat') ||
    habit.includes('laminar') ||
    habit.includes('hoja')
  ) {
    // Tabular: prisma hexagonal corto
    return [makeFlatGeom(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 6))]
  }
  if (
    habit.includes('pyramid') ||
    habit.includes('bipyramid') ||
    habit.includes('piramid') ||
    habit.includes('bipiramid')
  ) {
    // Bipiramidal hexagonal estanco
    return [makeFlatGeom(buildBipyramid(6, 0.8, height))]
  }
  // Prismático: prisma hexagonal con terminaciones piramidales altas y estilizadas
  const prismH = height * 0.62
  const capH = height * 0.35
  return [makeFlatGeom(buildPrismWithPyramidalCaps(6, 0.75, prismH, capH))]
}

// ── TETRAGONAL ────────────────────────────────────────────────────────────────
function buildTetragonal(habit: string, c: number): THREE.BufferGeometry[] {
  const height = 1.0 + c * 0.6

  if (
    habit.includes('tabular') ||
    habit.includes('plat') ||
    habit.includes('laminar') ||
    habit.includes('hoja')
  ) {
    // Tabular tetragonal
    return [makeFlatGeom(new THREE.BoxGeometry(1.3, 0.3, 1.3))]
  }
  if (
    habit.includes('pyramid') ||
    habit.includes('bipyramid') ||
    habit.includes('piramid') ||
    habit.includes('bipiramid')
  ) {
    // Bipiramidal tetragonal estanco (octaedro estirado)
    return [makeFlatGeom(buildBipyramid(4, 0.8, height))]
  }
  // Prismático tetragonal con tapas piramidales altas y estilizadas
  const prismH = height * 0.62
  const capH = height * 0.35
  return [makeFlatGeom(buildPrismWithPyramidalCaps(4, 0.75, prismH, capH))]
}

// ── ORTHORHOMBIC ──────────────────────────────────────────────────────────────
function buildOrthorhombic(habit: string, a: number, b: number, c: number): THREE.BufferGeometry[] {
  const w = 0.8 + a * 0.4
  const d = 0.6 + b * 0.4
  const h = 1.0 + c * 0.6

  if (
    habit.includes('tabular') ||
    habit.includes('plat') ||
    habit.includes('laminar') ||
    habit.includes('hoja')
  ) {
    return [makeFlatGeom(new THREE.BoxGeometry(w * 1.4, 0.3, d * 1.4))]
  }
  if (
    habit.includes('acicular') ||
    habit.includes('needle') ||
    habit.includes('aguja')
  ) {
    // Acicular: aguja tetragonal muy delgada y estirada con puntas piramidales
    const needleGeom = buildPrismWithPyramidalCaps(4, 0.08, 1.8, 0.15)
    return [makeFlatGeom(needleGeom)]
  }
  // Prismático ortorrómbico: caja rectangular de aristas vivas
  return [makeFlatGeom(new THREE.BoxGeometry(w, h, d))]
}

// ── MONOCLINIC ────────────────────────────────────────────────────────────────
function buildMonoclinic(habit: string, b: number, c: number): THREE.BufferGeometry[] {
  const h = 1.0 + c * 0.5
  const w = 0.7 + b * 0.3

  if (
    habit.includes('tabular') ||
    habit.includes('plat') ||
    habit.includes('laminar') ||
    habit.includes('hoja')
  ) {
    return [makeFlatGeom(createSheared(new THREE.BoxGeometry(w * 1.4, 0.3, 1.1), 0.2))]
  }
  if (
    habit.includes('prismatic') ||
    habit.includes('prismátic')
  ) {
    return [makeFlatGeom(createSheared(new THREE.BoxGeometry(w, h, 0.9), 0.15))]
  }
  return [makeFlatGeom(createSheared(new THREE.BoxGeometry(w, h, 1.0), 0.18))]
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
  return [makeFlatGeom(sheared)]
}

// ── TRIGONAL ──────────────────────────────────────────────────────────────────
function buildTrigonal(habit: string, c: number): THREE.BufferGeometry[] {
  const height = 0.9 + c * 0.7

  if (
    habit.includes('rhombohedr') ||
    habit.includes('romboédr')
  ) {
    // Romboedro estanco (cubo cizallado)
    return [makeFlatGeom(buildRhombohedron())]
  }
  if (
    habit.includes('scalenohedr') ||
    habit.includes('escalenoédr')
  ) {
    // Escalenoedro ditrigonal estanco y altamente definido
    return [makeFlatGeom(buildScalenohedron(height))]
  }
  if (
    habit.includes('tabular') ||
    habit.includes('plat') ||
    habit.includes('laminar') ||
    habit.includes('hoja')
  ) {
    return [makeFlatGeom(new THREE.CylinderGeometry(0.9, 0.9, 0.3, 3))] // Prisma trigonal corto
  }
  if (
    habit.includes('pyramid') ||
    habit.includes('bipyramid') ||
    habit.includes('piramid') ||
    habit.includes('bipiramid')
  ) {
    // Bipirámide trigonal estanca
    return [makeFlatGeom(buildBipyramid(3, 0.8, height))]
  }
  // Prisma trigonal
  return [makeFlatGeom(new THREE.CylinderGeometry(0.8, 0.8, height, 3))]
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
  const r = 0.8  // Mayor radio para resaltar volumen
  const shift = height * 0.22  // Zigzag vertical más pronunciado
  const halfH = height / 2

  // 8 vértices
  const vertices = new Float32Array(8 * 3)
  // 0: Ápice superior
  vertices[0] = 0; vertices[1] = halfH; vertices[2] = 0
  // 1: Ápice inferior
  vertices[3] = 0; vertices[4] = -halfH; vertices[5] = 0

  // 2..7: Hexágono ecuatorial con radios y alturas alternadas para dar forma ditrigonal pronunciada (corona en zigzag)
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const idx = (2 + i) * 3
    const currentR = (i % 2 === 0) ? r : r * 0.55 // Alternancia de radio para acentuar las aristas del escalenoedro
    vertices[idx] = currentR * Math.cos(angle)
    vertices[idx + 1] = (i % 2 === 0 ? 1 : -1) * shift
    vertices[idx + 2] = currentR * Math.sin(angle)
  }

  const indices: number[] = []
  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6
    // Triángulos superiores
    indices.push(0, 2 + i, 2 + next)
    // Triángulos inferiores
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
 * Habilita sombreado plano (flatShading) para aristas vivas cristalinas.
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
    flatShading: true, // Requerido para aristas vivas y aspecto mineralógico
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
