// ============================================================
// Tipos TypeScript que reflejan el schema de Supabase
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      minerals: {
        Row: Mineral
        Insert: Omit<Mineral, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Mineral, 'id' | 'created_at'>>
      }
      user_collection: {
        Row: CollectionItem
        Insert: Omit<CollectionItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CollectionItem, 'id' | 'created_at' | 'user_id'>>
      }
      specimen_photos: {
        Row: SpecimenPhoto
        Insert: Omit<SpecimenPhoto, 'id' | 'created_at'>
        Update: Partial<Omit<SpecimenPhoto, 'id' | 'created_at' | 'user_id'>>
      }
      user_profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
    }
    Functions: {
      search_minerals: {
        Args: {
          search_query?: string | null
          filter_class?: string | null
          filter_system?: string | null
          hardness_min_v?: number | null
          hardness_max_v?: number | null
          page_size?: number
          page_offset?: number
        }
        Returns: MineralSearchResult[]
      }
    }
  }
}

// ============================================================
// Entidades
// ============================================================

export interface Mineral {
  id: string
  mindat_id: number | null
  name: string
  name_es: string | null
  chemical_formula: string | null
  hardness_min: number | null
  hardness_max: number | null
  density_min: number | null
  density_max: number | null
  streak: string | null
  luster: string[] | null
  transparency: string | null
  color: string[] | null
  crystal_system: CrystalSystem | null
  crystal_habits: string[] | null
  cleavage: string | null
  fracture: string | null
  tenacity: string | null
  magnetism: string | null
  radioactivity: string | null
  fluorescence: string | null
  mineral_class: string | null
  strunz_number: string | null
  dana_number: string | null
  associated_minerals: string[] | null
  localities: string[] | null
  description: string | null
  mindat_url: string | null
  thumbnail_url: string | null
  model_3d_config: Crystal3DConfig | null
  parent_mindat_id: number | null
  created_at: string
  updated_at: string
}

export interface MineralSearchResult extends Omit<Mineral, 'luster' | 'transparency' | 'cleavage' | 'fracture' | 'tenacity' | 'magnetism' | 'radioactivity' | 'fluorescence' | 'strunz_number' | 'dana_number' | 'associated_minerals' | 'localities' | 'description' | 'mindat_url' | 'created_at' | 'updated_at'> {
  total_count: number
}

export interface CollectionItem {
  id: string
  user_id: string
  mineral_id: string
  status: CollectionStatus
  acquired_at: string | null
  origin: string | null
  notes: string | null
  quality: number | null
  dimensions: string | null
  weight_g: number | null
  price_eur: number | null
  drive_folder_id: string | null
  primary_photo_url: string | null
  created_at: string
  updated_at: string
}

export interface CollectionItemWithMineral extends CollectionItem {
  mineral: Mineral
}

export interface SpecimenPhoto {
  id: string
  collection_id: string
  user_id: string
  drive_file_id: string
  drive_view_url: string
  drive_thumb_url: string | null
  filename: string | null
  caption: string | null
  is_primary: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  display_name: string | null
  bio: string | null
  location: string | null
  google_drive_connected: boolean
  google_refresh_token: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Enums y tipos auxiliares
// ============================================================

export type CollectionStatus = 'owned' | 'wanted' | 'traded' | 'sold'

export type CrystalSystem =
  | 'Cubic'
  | 'Hexagonal'
  | 'Tetragonal'
  | 'Orthorhombic'
  | 'Monoclinic'
  | 'Triclinic'
  | 'Trigonal'
  | 'Amorphous'
  | string

export interface Crystal3DConfig {
  system: CrystalSystem
  habit: string
  /** Parámetros paramétricos para Three.js */
  params?: {
    a?: number  // Eje a (normalizado)
    b?: number  // Eje b (normalizado)
    c?: number  // Eje c (normalizado)
    alpha?: number  // Ángulo alpha (grados)
    beta?: number   // Ángulo beta (grados)
    gamma?: number  // Ángulo gamma (grados)
    dominantFaces?: string[]  // e.g. ['cube', 'octahedron']
  }
}

// ============================================================
// UI helpers
// ============================================================

export const CRYSTAL_SYSTEM_LABELS: Record<string, string> = {
  Cubic: 'Cúbico',
  Hexagonal: 'Hexagonal',
  Tetragonal: 'Tetragonal',
  Orthorhombic: 'Ortorrómbico',
  Monoclinic: 'Monoclínico',
  Triclinic: 'Triclínico',
  Trigonal: 'Trigonal',
  Icosahedral: 'Icosaédrico',
  Amorphous: 'Amorfo',
}

export const CRYSTAL_SYSTEM_DEFINITIONS: Record<string, string> = {
  Cubic: 'Cúbico (Isométrico): Tres ejes iguales que se cortan en ángulos de 90°.',
  Tetragonal: 'Tetragonal: Tres ejes, dos iguales y uno diferente, todos a 90°.',
  Hexagonal: 'Hexagonal: Tres ejes iguales en un plano a 120° y un cuarto eje perpendicular diferente.',
  Trigonal: 'Trigonal (Romboédrico): Similar al hexagonal, pero sin un eje de simetría séxtuple (a veces agrupado como una subdivisión de este último).',
  Orthorhombic: 'Ortorrómbico: Tres ejes desiguales que se cortan a 90°.',
  Monoclinic: 'Monoclínico: Tres ejes desiguales, dos de ellos inclinados entre sí y el tercero perpendicular.',
  Triclinic: 'Triclínico: Tres ejes desiguales y ninguno forma ángulos de 90°.',
  Amorphous: 'Amorfo: Estructura no cristalina sin ordenamiento atómico de largo alcance.',
}

export const MINERAL_CLASS_LABELS: Record<string, string> = {
  'Native Elements': 'Elementos Nativos',
  'Sulfides': 'Sulfuros',
  'Oxides': 'Óxidos',
  'Halides': 'Haluros',
  'Carbonates': 'Carbonatos',
  'Phosphates': 'Fosfatos',
  'Silicates': 'Silicatos',
  'Sulfates': 'Sulfatos',
  'Borates': 'Boratos',
  'Arsenates': 'Arseniatos',
  'Vanadates': 'Vanadatos',
  'Tungstates': 'Tungstatos',
  'Molybdates': 'Molibdatos',
  'Nitrates': 'Nitratos',
}

export const LUSTER_LABELS: Record<string, string> = {
  vitreous: 'Vítreo',
  adamantine: 'Adamantino',
  pearly: 'Nacarado (Perlado)',
  greasy: 'Graso',
  silky: 'Sedoso',
  resinous: 'Resinoso',
  waxy: 'Ceroso',
  dull: 'Mate',
  metallic: 'Metálico',
  submetallic: 'Submetálico',
  earthy: 'Terroso',
}

export const TRANSPARENCY_LABELS: Record<string, string> = {
  transparent: 'Transparente',
  translucent: 'Translúcido',
  opaque: 'Opaco',
}

export const CLEAVAGE_LABELS: Record<string, string> = {
  perfect: 'Perfecta',
  good: 'Buena',
  fair: 'Regular',
  poor: 'Pobre',
  indistinct: 'Indistinta',
  none: 'Ninguna',
}

export const FRACTURE_LABELS: Record<string, string> = {
  conchoidal: 'Concoidea',
  subconchoidal: 'Subconcoidea',
  uneven: 'Irregular',
  splintery: 'Astillosa',
  hackly: 'Ganchosa',
  fibrous: 'Fibrosa',
  even: 'Regular',
}

export const TENACITY_LABELS: Record<string, string> = {
  brittle: 'Frágil',
  sectile: 'Séctil',
  malleable: 'Maleable',
  ductile: 'Dúctil',
  flexible: 'Flexible',
  elastic: 'Elástica',
}

export const COLOR_LABELS: Record<string, string> = {
  white: 'Blanco',
  black: 'Negro',
  blue: 'Azul',
  red: 'Rojo',
  green: 'Verde',
  brown: 'Marrón',
  yellow: 'Amarillo',
  gray: 'Gris',
  grey: 'Gris',
  pink: 'Rosa',
  orange: 'Naranja',
  violet: 'Violeta',
  purple: 'Púrpura',
  colorless: 'Incoloro',
}

/** Hábitos de cristalización por defecto (fallback) para minerales comunes */
export const FALLBACK_CRYSTAL_HABITS: Record<number, string[]> = {
  3337: ['Prismatic', 'Rhombohedral', 'Tabular'],       // Quartz (Cuarzo)
  1576: ['Cubic', 'Octahedral', 'Dodecahedral'],         // Fluorite (Fluorita)
  859:  ['Rhombohedral', 'Scalenohedral', 'Prismatic'],  // Calcite (Calcita)
  1136: ['Pyramidal', 'Prismatic', 'Tabular'],          // Corundum (Corindón)
}

/**
 * Fusiona las propiedades de una variedad de mineral con las de su especie mineral principal (padre),
 * heredando cualquier propiedad que esté vacía o nula en la variedad.
 * También aplica hábitos cristalinos predeterminados si la especie principal no los tiene especificados.
 */
export function mergeMineralWithParent<T extends Partial<Mineral>>(mineral: T, parent: Partial<Mineral> | null | undefined): T {
  const merged = { ...mineral };
  
  if (parent && mineral.parent_mindat_id) {
    const fieldsToMerge: (keyof Mineral)[] = [
      'chemical_formula',
      'hardness_min',
      'hardness_max',
      'density_min',
      'density_max',
      'streak',
      'luster',
      'transparency',
      'color',
      'crystal_system',
      'crystal_habits',
      'cleavage',
      'fracture',
      'tenacity',
      'magnetism',
      'radioactivity',
      'fluorescence',
      'mineral_class',
      'strunz_number',
      'dana_number',
      'associated_minerals',
      'localities',
      'description',
      'model_3d_config',
    ];

    for (const field of fieldsToMerge) {
      const val = mineral[field];
      const parentVal = parent[field];
      
      const isEmpty = 
        val === null || 
        val === undefined || 
        val === '' || 
        (Array.isArray(val) && val.length === 0) ||
        (field === 'strunz_number' && val === '0.0.0') ||
        (field === 'dana_number' && val === '0.0.0.0') ||
        (field === 'model_3d_config' && val && typeof val === 'object' && (val as any).system === 'Amorphous' && (!(val as any).params || (val as any).params.a === 1 && (val as any).params.b === 1 && (val as any).params.c === 1));

      if (isEmpty && parentVal !== null && parentVal !== undefined && parentVal !== '') {
        if (field === 'model_3d_config') {
          const parentConfig = parentVal as any;
          const parentIsEmpty = parentConfig && parentConfig.system === 'Amorphous' && (!parentConfig.params || parentConfig.params.a === 1 && parentConfig.params.b === 1 && parentConfig.params.c === 1);
          if (!parentIsEmpty) {
            (merged as any)[field] = parentVal;
          }
        } else {
          (merged as any)[field] = parentVal;
        }
      }
    }

    // Fallback description if it's null but specify it's a variety of the parent
    if (!mineral.description && parent.description) {
      merged.description = `Variedad de ${parent.name_es || parent.name}. ${parent.description}`;
    }
  }

  // Enriquecer con hábitos cristalinos de fallback si están vacíos (priorizando ID del padre si es variedad)
  const lookupId = merged.parent_mindat_id ?? merged.mindat_id ?? (parent ? (parent.parent_mindat_id ?? parent.mindat_id) : null);
  if (lookupId && (!merged.crystal_habits || merged.crystal_habits.length === 0)) {
    const fallback = FALLBACK_CRYSTAL_HABITS[lookupId];
    if (fallback) {
      merged.crystal_habits = fallback;
    }
  }

  return merged;
}


