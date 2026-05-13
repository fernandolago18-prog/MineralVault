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
  Amorphous: 'Amorfo',
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
