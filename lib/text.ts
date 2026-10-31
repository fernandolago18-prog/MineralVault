/**
 * lib/text.ts
 * Utilidades para normalización de texto y búsquedas insensibles a mayúsculas,
 * minúsculas, tildes, diacríticos (á, é, í, ó, ú, ü, ñ) y subíndices de fórmulas químicas.
 */

/**
 * Normaliza un texto para búsquedas:
 * - Elimina etiquetas HTML (ej. <sub>2</sub> en fórmulas)
 * - Convierte a minúsculas
 * - Descompone compatibilidad Unicode (NFKD) para normalizar subíndices químicos (₂ -> 2, ₃ -> 3)
 * - Elimina marcas diacríticas / tildes ([\u0300-\u036f])
 * - Limpia espacios en blanco en los extremos
 */
export function normalizeText(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Comprueba si una cadena de búsqueda (`query`) coincide con uno o varios campos objetivo (`fields`),
 * ignorando diferencias de mayúsculas, tildes y diacríticos.
 * Soporta búsqueda de términos múltiples: cada palabra introducida debe encontrarse
 * en alguno de los campos especificados.
 */
export function matchesSearch(
  query: string | null | undefined,
  ...fields: (string | null | undefined)[]
): boolean {
  if (!query) return true
  const cleanQuery = normalizeText(query)
  if (!cleanQuery) return true

  const fullHaystack = fields
    .map(f => normalizeText(f))
    .filter(Boolean)
    .join(' ')

  const words = cleanQuery.split(/\s+/).filter(Boolean)
  return words.every(word => fullHaystack.includes(word))
}
